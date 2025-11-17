<?php

namespace App\Console\Commands\Payments;

use App\Enums\Payments\PaymentSubscriptionStatus;
use App\Models\Payments\PaymentSubscription;
use App\Services\Payments\SubscriptionService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ExpireSubscriptionsCommand extends Command
{
    protected $signature = 'subscriptions:expire {--dry-run : Output the subscriptions that would be expired}';

    protected $description = 'Expire subscriptions whose billing period or grace period has ended.';

    public function __construct(
        protected readonly SubscriptionService $subscriptions
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $now = Carbon::now();

        $activeQuery = PaymentSubscription::query()
            ->whereIn('status', [
                PaymentSubscriptionStatus::Active,
                PaymentSubscriptionStatus::Trialing,
            ])
            ->whereNotNull('ends_at')
            ->where('ends_at', '<=', $now);

        $graceQuery = PaymentSubscription::query()
            ->where('status', PaymentSubscriptionStatus::Grace)
            ->whereNotNull('grace_ends_at')
            ->where('grace_ends_at', '<=', $now);

        if ($this->option('dry-run')) {
            $activeRows = $activeQuery->get(['id', 'subscriber_id', 'creator_id', 'ends_at', 'status'])
                ->map(fn (PaymentSubscription $subscription): array => [
                    'id' => $subscription->id,
                    'subscriber' => $subscription->subscriber_id,
                    'creator' => $subscription->creator_id,
                    'ends_at' => optional($subscription->ends_at)->toDateTimeString(),
                    'status' => $subscription->status->value,
                ])->all();

            $graceRows = $graceQuery->get(['id', 'subscriber_id', 'creator_id', 'grace_ends_at', 'status'])
                ->map(fn (PaymentSubscription $subscription): array => [
                    'id' => $subscription->id,
                    'subscriber' => $subscription->subscriber_id,
                    'creator' => $subscription->creator_id,
                    'grace_ends_at' => optional($subscription->grace_ends_at)->toDateTimeString(),
                    'status' => $subscription->status->value,
                ])->all();

            $this->table(['ID', 'Subscriber', 'Creator', 'Ends At', 'Status'], $activeRows);
            $this->table(['ID', 'Subscriber', 'Creator', 'Grace Ends At', 'Status'], $graceRows);

            return self::SUCCESS;
        }

        DB::transaction(function () use ($activeQuery, $graceQuery): void {
            $activeQuery->lockForUpdate()->each(function (PaymentSubscription $subscription): void {
                $this->subscriptions->expire($subscription);
            });

            $graceQuery->lockForUpdate()->each(function (PaymentSubscription $subscription): void {
                $this->subscriptions->expire($subscription);
            });
        });

        $this->info('Expired subscriptions successfully.');

        return self::SUCCESS;
    }
}
