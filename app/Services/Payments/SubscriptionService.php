<?php

namespace App\Services\Payments;

use App\Enums\Payments\PaymentSubscriptionStatus;
use App\Events\Payments\SubscriptionCancelled;
use App\Events\Payments\SubscriptionEnteredGrace;
use App\Events\Payments\SubscriptionExpired;
use App\Events\Payments\SubscriptionPaymentFailed;
use App\Events\Payments\SubscriptionRenewed;
use App\Events\Payments\SubscriptionStarted;
use App\Models\Payments\Payment;
use App\Models\Payments\PaymentSubscription;
use App\Models\Payments\SubscriptionPlan;
use App\Payments\Data\SubscriptionCancelData;
use App\Payments\Data\SubscriptionCreateData;
use App\Payments\Data\SubscriptionResumeData;
use App\Payments\Data\SubscriptionSwapData;
use App\Payments\PaymentGatewayManager;
use Carbon\CarbonImmutable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

class SubscriptionService
{
    public function __construct(
        protected readonly PaymentGatewayManager $gateways
    ) {
    }

    public function create(SubscriptionCreateData $data, ?SubscriptionPlan $plan = null, ?string $gateway = null): PaymentSubscription
    {
        $gateway = $gateway ?? $this->gateways->getDefaultDriver();

        $response = $this->gateways->subscriptionDriver($gateway)->createSubscription($data);

        return DB::transaction(function () use ($data, $plan, $response) {
            $now = CarbonImmutable::now();

            $trialEnds = $data->trialDays ? $now->addDays($data->trialDays) : null;
            $billingAnchor = $trialEnds ?? $now;
            $nextRenewal = $this->calculateNextRenewal($billingAnchor, $data->interval, $data->intervalCount);

            $subscription = PaymentSubscription::query()->create([
                'subscriber_id' => $data->subscriberId,
                'creator_id' => $data->creatorId,
                'subscription_plan_id' => $plan?->id,
                'payment_method_id' => null,
                'status' => $this->mapSubscriptionStatus($response->status),
                'provider' => $response->provider,
                'provider_subscription_id' => $response->providerSubscriptionId,
                'auto_renews' => $data->autoRenews,
                'amount' => $data->amount->amount(),
                'currency' => $data->amount->currency(),
                'interval' => $data->interval,
                'interval_count' => $data->intervalCount,
                'trial_ends_at' => $trialEnds?->toDateTimeString(),
                'starts_at' => $now->toDateTimeString(),
                'ends_at' => $nextRenewal->toDateTimeString(),
                'metadata' => array_merge($data->metadata, [
                    'provider_payload' => $response->raw,
                ]),
            ]);

            Event::dispatch(new SubscriptionStarted($subscription));

            return $subscription;
        });
    }

    public function renew(PaymentSubscription $subscription, ?Carbon $periodStart = null, ?Carbon $periodEnd = null): PaymentSubscription
    {
        return DB::transaction(function () use ($subscription, $periodStart, $periodEnd) {
            $start = CarbonImmutable::make($periodStart ?? now());
            $end = $periodEnd
                ? CarbonImmutable::make($periodEnd)
                : $this->calculateNextRenewal($start, $subscription->interval, $subscription->interval_count);

            $subscription->status = PaymentSubscriptionStatus::Active;
            $subscription->starts_at = $start->toDateTimeString();
            $subscription->ends_at = $end->toDateTimeString();
            $subscription->grace_ends_at = null;
            $subscription->save();

            Event::dispatch(new SubscriptionRenewed($subscription));

            return $subscription;
        });
    }

    public function markGrace(PaymentSubscription $subscription, Carbon $graceEndsAt): PaymentSubscription
    {
        return DB::transaction(function () use ($subscription, $graceEndsAt) {
            $subscription->status = PaymentSubscriptionStatus::Grace;
            $subscription->grace_ends_at = $graceEndsAt;
            $subscription->save();

            Event::dispatch(new SubscriptionEnteredGrace($subscription));

            return $subscription;
        });
    }

    public function expire(PaymentSubscription $subscription): PaymentSubscription
    {
        return DB::transaction(function () use ($subscription) {
            $subscription->status = PaymentSubscriptionStatus::Expired;
            $subscription->ends_at = now();
            $subscription->auto_renews = false;
            $subscription->save();

            Event::dispatch(new SubscriptionExpired($subscription));

            return $subscription;
        });
    }

    public function cancel(PaymentSubscription $subscription, SubscriptionCancelData $data, ?string $gateway = null): PaymentSubscription
    {
        $gateway = $gateway ?? $subscription->provider ?? $this->gateways->getDefaultDriver();

        $this->gateways->subscriptionDriver($gateway)->cancelSubscription($data);

        return DB::transaction(function () use ($subscription, $data) {
            if ($data->immediate) {
                $subscription->status = PaymentSubscriptionStatus::Cancelled;
                $subscription->ends_at = now();
            }

            $subscription->auto_renews = false;
            $subscription->metadata = array_merge($subscription->metadata ?? [], [
                'cancel_reason' => $data->reason,
                'cancel_immediate' => $data->immediate,
            ]);
            $subscription->cancelled_at = now();
            $subscription->save();

            Event::dispatch(new SubscriptionCancelled($subscription));

            return $subscription;
        });
    }

    public function resume(PaymentSubscription $subscription, SubscriptionResumeData $data, ?string $gateway = null): PaymentSubscription
    {
        $gateway = $gateway ?? $subscription->provider ?? $this->gateways->getDefaultDriver();

        $this->gateways->subscriptionDriver($gateway)->resumeSubscription($data);

        return DB::transaction(function () use ($subscription) {
            $subscription->status = PaymentSubscriptionStatus::Active;
            $subscription->auto_renews = true;
            $subscription->grace_ends_at = null;
            $subscription->save();

            Event::dispatch(new SubscriptionRenewed($subscription));

            return $subscription;
        });
    }

    public function swap(PaymentSubscription $subscription, SubscriptionSwapData $data, ?SubscriptionPlan $plan = null, ?string $gateway = null): PaymentSubscription
    {
        $gateway = $gateway ?? $subscription->provider ?? $this->gateways->getDefaultDriver();

        $this->gateways->subscriptionDriver($gateway)->swapSubscription($data);

        return DB::transaction(function () use ($subscription, $data, $plan) {
            $subscription->amount = $data->amount->amount();
            $subscription->currency = $data->amount->currency();
            $subscription->interval = $data->interval;
            $subscription->interval_count = $data->intervalCount;
            $subscription->subscription_plan_id = $plan?->id ?? $subscription->subscription_plan_id;
            $subscription->metadata = array_merge($subscription->metadata ?? [], $data->metadata);
            $subscription->save();

            Event::dispatch(new SubscriptionRenewed($subscription));

            return $subscription;
        });
    }

    public function recordSuccessfulPayment(PaymentSubscription $subscription, Payment $payment): PaymentSubscription
    {
        return $this->renew($subscription, Carbon::parse($payment->captured_at ?? now()));
    }

    public function recordFailedPayment(PaymentSubscription $subscription, ?Payment $payment = null, ?string $reason = null): PaymentSubscription
    {
        return DB::transaction(function () use ($subscription, $payment, $reason) {
            $subscription->status = PaymentSubscriptionStatus::PastDue;
            $subscription->metadata = array_merge($subscription->metadata ?? [], [
                'last_failed_payment_id' => $payment?->id,
                'failure_reason' => $reason,
            ]);
            $subscription->save();

            Event::dispatch(new SubscriptionPaymentFailed($subscription, $payment));

            return $subscription;
        });
    }

    protected function calculateNextRenewal(CarbonImmutable $anchor, string $interval, int $count): CarbonImmutable
    {
        return match (strtolower($interval)) {
            'daily' => $anchor->addDays($count),
            'weekly' => $anchor->addWeeks($count),
            'monthly' => $anchor->addMonths($count),
            'quarterly' => $anchor->addMonths(3 * $count),
            'yearly', 'annually' => $anchor->addYears($count),
            default => $anchor->addMonths($count),
        };
    }

    protected function mapSubscriptionStatus(string $status): PaymentSubscriptionStatus
    {
        return match (strtolower($status)) {
            'trialing' => PaymentSubscriptionStatus::Trialing,
            'active' => PaymentSubscriptionStatus::Active,
            'past_due' => PaymentSubscriptionStatus::PastDue,
            'grace' => PaymentSubscriptionStatus::Grace,
            'cancelled', 'canceled' => PaymentSubscriptionStatus::Cancelled,
            'expired' => PaymentSubscriptionStatus::Expired,
            default => PaymentSubscriptionStatus::Pending,
        };
    }
}

