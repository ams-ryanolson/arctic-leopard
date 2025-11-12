<?php

namespace App\Console\Commands\Payments;

use App\Enums\Payments\PaymentIntentStatus;
use App\Enums\Payments\PaymentStatus;
use App\Events\Payments\PaymentCancelled;
use App\Events\Payments\PaymentIntentCancelled;
use App\Models\Payments\Payment;
use App\Models\Payments\PaymentIntent;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

class ExpirePendingPaymentsCommand extends Command
{
    protected $signature = 'payments:expire-pending {--dry-run : Output the affected records without modifying them}';

    protected $description = 'Expire payment intents and payments that have passed their expiry timestamp.';

    public function handle(): int
    {
        $now = Carbon::now();

        $intentsQuery = PaymentIntent::query()
            ->whereIn('status', [
                PaymentIntentStatus::Pending,
                PaymentIntentStatus::RequiresMethod,
                PaymentIntentStatus::RequiresConfirmation,
                PaymentIntentStatus::Processing,
            ])
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $now);

        $paymentsQuery = Payment::query()
            ->where('status', PaymentStatus::Pending)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $now);

        if ($this->option('dry-run')) {
            $this->table(
                ['Intent ID', 'Provider', 'Expires At'],
                $intentsQuery->get(['id', 'provider', 'expires_at'])->map->toArray()->all()
            );

            $this->table(
                ['Payment ID', 'Provider', 'Expires At'],
                $paymentsQuery->get(['id', 'provider', 'expires_at'])->map->toArray()->all()
            );

            return self::SUCCESS;
        }

        DB::transaction(function () use ($intentsQuery, $paymentsQuery, $now): void {
            $intentsQuery->lockForUpdate()->each(function (PaymentIntent $intent) use ($now): void {
                $intent->status = PaymentIntentStatus::Cancelled;
                $intent->cancelled_at = $now;
                $intent->metadata = array_merge($intent->metadata ?? [], [
                    'expired_by_command' => true,
                    'expired_at' => $now->toIso8601String(),
                ]);
                $intent->save();

                Event::dispatch(new PaymentIntentCancelled($intent));

                if ($intent->payment !== null) {
                    $payment = $intent->payment;
                    $payment->status = PaymentStatus::Cancelled;
                    $payment->metadata = array_merge($payment->metadata ?? [], [
                        'expired_by_command' => true,
                        'expired_at' => $now->toIso8601String(),
                    ]);
                    $payment->cancelled_at = $now;
                    $payment->save();

                    Event::dispatch(new PaymentCancelled($payment));
                }
            });

            $paymentsQuery->lockForUpdate()->each(function (Payment $payment) use ($now): void {
                if ($payment->status !== PaymentStatus::Pending) {
                    return;
                }

                $payment->status = PaymentStatus::Cancelled;
                $payment->metadata = array_merge($payment->metadata ?? [], [
                    'expired_by_command' => true,
                    'expired_at' => $now->toIso8601String(),
                ]);
                $payment->cancelled_at = $now;
                $payment->save();

                Event::dispatch(new PaymentCancelled($payment));
            });
        });

        $this->info('Expired pending payments and intents successfully.');

        return self::SUCCESS;
    }
}
