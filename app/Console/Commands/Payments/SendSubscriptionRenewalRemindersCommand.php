<?php

namespace App\Console\Commands\Payments;

use App\Enums\Payments\PaymentSubscriptionStatus;
use App\Events\Payments\SubscriptionRenewalReminder;
use App\Models\Payments\PaymentSubscription;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

class SendSubscriptionRenewalRemindersCommand extends Command
{
    protected $signature = 'subscriptions:send-renewal-reminders
        {--window=48 : Number of hours ahead to look for upcoming renewals}
        {--dry-run : Output the reminders that would be sent without dispatching events}';

    protected $description = 'Dispatch renewal reminders for subscriptions nearing renewal or grace expiration.';

    public function handle(): int
    {
        $window = (int) $this->option('window');
        $window = $window > 0 ? $window : 48;

        $now = Carbon::now();
        $cutoff = $now->clone()->addHours($window);

        $upcomingQuery = PaymentSubscription::query()
            ->where('auto_renews', true)
            ->whereIn('status', [
                PaymentSubscriptionStatus::Active,
                PaymentSubscriptionStatus::Trialing,
            ])
            ->whereNotNull('ends_at')
            ->whereBetween('ends_at', [$now, $cutoff]);

        $graceQuery = PaymentSubscription::query()
            ->where('status', PaymentSubscriptionStatus::Grace)
            ->whereNotNull('grace_ends_at')
            ->whereBetween('grace_ends_at', [$now, $cutoff]);

        if ($this->option('dry-run')) {
            $this->displayRows('Upcoming Renewals', $upcomingQuery->get());
            $this->displayRows('Grace Period Expiring', $graceQuery->get(), true);

            return self::SUCCESS;
        }

        DB::transaction(function () use ($upcomingQuery, $graceQuery, $now): void {
            $upcomingQuery->lockForUpdate()->each(function (PaymentSubscription $subscription) use ($now): void {
                if ($this->shouldSkipReminder($subscription, $subscription->ends_at)) {
                    return;
                }

                $this->markReminderSent($subscription, $subscription->ends_at, $now, false);
                Event::dispatch(new SubscriptionRenewalReminder($subscription, false));
            });

            $graceQuery->lockForUpdate()->each(function (PaymentSubscription $subscription) use ($now): void {
                if ($this->shouldSkipReminder($subscription, $subscription->grace_ends_at)) {
                    return;
                }

                $this->markReminderSent($subscription, $subscription->grace_ends_at, $now, true);
                Event::dispatch(new SubscriptionRenewalReminder($subscription, true));
            });
        });

        $this->info('Subscription renewal reminders dispatched.');

        return self::SUCCESS;
    }

    /**
     * @param  iterable<PaymentSubscription>  $subscriptions
     */
    protected function displayRows(string $heading, iterable $subscriptions, bool $grace = false): void
    {
        $rows = collect($subscriptions)->map(fn (PaymentSubscription $subscription): array => [
            'id' => $subscription->id,
            'subscriber' => $subscription->subscriber_id,
            'creator' => $subscription->creator_id,
            'ends_at' => optional($subscription->ends_at)->toDateTimeString(),
            'grace_ends_at' => optional($subscription->grace_ends_at)->toDateTimeString(),
            'status' => $subscription->status->value,
            'type' => $grace ? 'grace' : 'renewal',
        ])->all();

        $this->comment($heading);
        $this->table(['ID', 'Subscriber', 'Creator', 'Ends At', 'Grace Ends', 'Status', 'Type'], $rows);
    }

    protected function shouldSkipReminder(PaymentSubscription $subscription, ?Carbon $periodEndsAt): bool
    {
        if ($periodEndsAt === null) {
            return true;
        }

        $metadata = $subscription->metadata ?? [];
        $lastPeriod = $metadata['last_renewal_reminder_period_end'] ?? null;

        return $lastPeriod !== null && Carbon::parse($lastPeriod)->equalTo($periodEndsAt);
    }

    protected function markReminderSent(PaymentSubscription $subscription, Carbon $periodEndsAt, Carbon $sentAt, bool $grace): void
    {
        $metadata = $subscription->metadata ?? [];
        $metadata['last_renewal_reminder_sent_at'] = $sentAt->toIso8601String();
        $metadata['last_renewal_reminder_period_end'] = $periodEndsAt->toIso8601String();
        $metadata['last_renewal_reminder_grace'] = $grace;

        $subscription->metadata = $metadata;
        $subscription->save();
    }
}
