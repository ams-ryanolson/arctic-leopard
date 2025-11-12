<?php

namespace App\Console\Commands\Payments;

use App\Enums\Payments\PaymentIntentStatus;
use App\Enums\Payments\PaymentStatus;
use App\Models\Payments\PaymentIntent;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class CleanupPaymentIntentsCommand extends Command
{
    protected $signature = 'payments:intents:cleanup
        {--days=30 : Remove intents older than this many days}
        {--dry-run : Output targets without deleting}';

    protected $description = 'Delete stale payment intents and orphaned pending payments.';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $cutoff = Carbon::now()->subDays($days);

        $intents = PaymentIntent::query()
            ->with('payment')
            ->where('updated_at', '<=', $cutoff)
            ->whereIn('status', [
                PaymentIntentStatus::Cancelled,
                PaymentIntentStatus::Failed,
                PaymentIntentStatus::Pending,
            ])
            ->get();

        if ($intents->isEmpty()) {
            $this->info('No payment intents matched the cleanup criteria.');

            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->table(
                ['Intent ID', 'Status', 'Updated At', 'Payment ID', 'Payment Status'],
                $intents->map(fn (PaymentIntent $intent): array => [
                    'intent_id' => $intent->id,
                    'status' => $intent->status->value,
                    'updated_at' => $intent->updated_at?->toDateTimeString(),
                    'payment_id' => $intent->payment?->id,
                    'payment_status' => $intent->payment?->status?->value,
                ])->all()
            );

            return self::SUCCESS;
        }

        $deletedIntents = 0;
        $deletedPayments = 0;

        $intents->each(function (PaymentIntent $intent) use (&$deletedIntents, &$deletedPayments): void {
            $payment = $intent->payment;

            if ($payment !== null
                && $payment->status === PaymentStatus::Pending
                && $payment->provider_payment_id === null) {
                $payment->delete();
                $deletedPayments++;
            }

            $intent->delete();
            $deletedIntents++;
        });

        $this->info("Deleted {$deletedIntents} payment intents and {$deletedPayments} orphaned payments.");

        return self::SUCCESS;
    }
}
