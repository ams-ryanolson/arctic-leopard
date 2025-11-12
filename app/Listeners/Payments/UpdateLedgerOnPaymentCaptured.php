<?php

namespace App\Listeners\Payments;

use App\Enums\Payments\LedgerDirection;
use App\Events\Payments\PaymentCaptured;
use App\Models\Payments\LedgerEntry;
use App\Models\Payments\Payment;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Queue\InteractsWithQueue;

class UpdateLedgerOnPaymentCaptured implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentCaptured $event): void
    {
        $payment = $event->payment->loadMissing(['payer', 'payee']);

        if (! $payment->ledgerEntries()
            ->where('direction', LedgerDirection::Credit)
            ->exists()) {
            $this->createEntry(
                model: $payment->payee,
                payment: $payment,
                direction: LedgerDirection::Credit,
                amount: $payment->net_amount
            );
        }

        if (! $payment->ledgerEntries()
            ->where('direction', LedgerDirection::Debit)
            ->exists()) {
            $this->createEntry(
                model: $payment->payer,
                payment: $payment,
                direction: LedgerDirection::Debit,
                amount: $payment->amount
            );
        }
    }

    protected function createEntry(?Model $model, Payment $payment, LedgerDirection $direction, int $amount): void
    {
        if ($model === null) {
            return;
        }

        LedgerEntry::create([
            'ledger' => 'payments',
            'ledgerable_type' => $model->getMorphClass(),
            'ledgerable_id' => $model->getKey(),
            'payment_id' => $payment->id,
            'direction' => $direction,
            'amount' => $amount,
            'currency' => $payment->currency,
            'balance_after' => null,
            'occurred_at' => $payment->captured_at ?? now(),
            'metadata' => [
                'payment_uuid' => $payment->uuid,
            ],
        ]);
    }
}

