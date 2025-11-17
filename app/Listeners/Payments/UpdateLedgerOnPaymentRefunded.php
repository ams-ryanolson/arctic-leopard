<?php

namespace App\Listeners\Payments;

use App\Enums\Payments\LedgerDirection;
use App\Events\Payments\PaymentRefunded;
use App\Models\Payments\LedgerEntry;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Queue\InteractsWithQueue;

class UpdateLedgerOnPaymentRefunded implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentRefunded $event): void
    {
        $payment = $event->payment->loadMissing(['payer', 'payee']);
        $refund = $event->refund;

        // Skip ledger update if refund is null
        if ($refund === null) {
            return;
        }

        $occurredAt = $refund->processed_at ?? now();

        $this->createEntry(
            model: $payment->payee,
            paymentId: $payment->id,
            paymentCurrency: $refund->currency,
            direction: LedgerDirection::Debit,
            amount: $refund->amount,
            occurredAt: $occurredAt,
            metadata: [
                'payment_uuid' => $payment->uuid,
                'refund_uuid' => $refund->uuid,
            ],
        );

        $this->createEntry(
            model: $payment->payer,
            paymentId: $payment->id,
            paymentCurrency: $refund->currency,
            direction: LedgerDirection::Credit,
            amount: $refund->amount,
            occurredAt: $occurredAt,
            metadata: [
                'payment_uuid' => $payment->uuid,
                'refund_uuid' => $refund->uuid,
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    protected function createEntry(
        ?Model $model,
        int $paymentId,
        string $paymentCurrency,
        LedgerDirection $direction,
        int $amount,
        \DateTimeInterface $occurredAt,
        array $metadata
    ): void {
        if ($model === null) {
            return;
        }

        LedgerEntry::create([
            'ledger' => 'payments',
            'ledgerable_type' => $model->getMorphClass(),
            'ledgerable_id' => $model->getKey(),
            'payment_id' => $paymentId,
            'direction' => $direction,
            'amount' => $amount,
            'currency' => $paymentCurrency,
            'balance_after' => null,
            'occurred_at' => $occurredAt,
            'metadata' => $metadata,
        ]);
    }
}
