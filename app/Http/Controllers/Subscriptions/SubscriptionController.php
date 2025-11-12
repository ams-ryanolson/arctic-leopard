<?php

namespace App\Http\Controllers\Subscriptions;

use App\Enums\Payments\PaymentType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Subscriptions\CancelSubscriptionRequest;
use App\Http\Requests\Subscriptions\ResumeSubscriptionRequest;
use App\Http\Requests\Subscriptions\StoreSubscriptionRequest;
use App\Models\Payments\PaymentSubscription;
use App\Models\Payments\SubscriptionPlan;
use App\Payments\Data\PaymentIntentData;
use App\Payments\Data\SubscriptionCancelData;
use App\Payments\Data\SubscriptionCreateData;
use App\Payments\Data\SubscriptionResumeData;
use App\Services\Payments\PaymentService;
use App\Services\Payments\SubscriptionService;
use App\ValueObjects\Money;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct(
        protected readonly SubscriptionService $subscriptions,
        protected readonly PaymentService $payments
    ) {
    }

    public function store(StoreSubscriptionRequest $request): JsonResponse
    {
        $plan = SubscriptionPlan::query()->where('is_active', true)->findOrFail($request->integer('plan_id'));

        $currency = $plan->currency;
        $amount = Money::from($plan->amount, $currency);

        $data = new SubscriptionCreateData(
            subscriberId: $request->user()->id,
            creatorId: $plan->creator_id,
            amount: $amount,
            interval: $plan->interval,
            intervalCount: $plan->interval_count,
            autoRenews: $request->boolean('auto_renews'),
            trialDays: $plan->trial_days,
            paymentMethodToken: $request->input('payment_method_token'),
            providerCustomerId: $request->input('provider_customer_id'),
            metadata: $request->input('metadata', []),
        );

        $subscription = $this->subscriptions->create($data, $plan, $request->input('gateway'));

        $intent = $this->payments->createIntent(
            new PaymentIntentData(
                payableType: PaymentSubscription::class,
                payableId: $subscription->getKey(),
                amount: $amount,
                payerId: $request->user()->id,
                payeeId: $subscription->creator_id,
                type: PaymentType::Recurring,
                method: $request->input('method'),
                metadata: $request->input('metadata', []),
                description: "Subscription to {$plan->name}"
            ),
            $request->input('gateway')
        );

        return response()->json([
            'subscription' => $subscription,
            'payment_intent' => $intent,
        ], JsonResponse::HTTP_CREATED);
    }

    public function destroy(CancelSubscriptionRequest $request, PaymentSubscription $subscription): JsonResponse
    {
        $this->authorizeSubscription($request, $subscription);

        $this->subscriptions->cancel(
            $subscription,
            new SubscriptionCancelData(
                providerSubscriptionId: $subscription->provider_subscription_id,
                immediate: $request->boolean('immediate'),
                reason: $request->input('reason')
            ),
            $request->input('gateway')
        );

        return response()->json(status: JsonResponse::HTTP_NO_CONTENT);
    }

    public function resume(ResumeSubscriptionRequest $request, PaymentSubscription $subscription): JsonResponse
    {
        $this->authorizeSubscription($request, $subscription);

        $resumed = $this->subscriptions->resume(
            $subscription,
            new SubscriptionResumeData(
                providerSubscriptionId: $subscription->provider_subscription_id,
                paymentMethodToken: $request->input('payment_method_token')
            ),
            $request->input('gateway')
        );

        return response()->json($resumed);
    }

    protected function authorizeSubscription(Request $request, PaymentSubscription $subscription): void
    {
        abort_unless($subscription->subscriber_id === $request->user()->id, JsonResponse::HTTP_FORBIDDEN);
    }
}

