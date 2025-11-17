<?php

namespace App\Events\Payments;

use App\Models\Payments\PaymentRefund;

class PaymentRefunded extends PaymentEvent
{
    public function __construct(
        \App\Models\Payments\Payment $payment,
        public ?PaymentRefund $refund = null
    ) {
        parent::__construct($payment);
    }

    /**
     * @return array{
     *     id:int|null,
     *     uuid:string|null,
     *     amount:int|null,
     *     currency:string|null,
     *     status:string|null
     * }|null
     */
    public function refundPayload(): ?array
    {
        if ($this->refund === null) {
            return null;
        }

        return [
            'id' => $this->refund->id,
            'uuid' => $this->refund->uuid,
            'amount' => $this->refund->amount,
            'currency' => $this->refund->currency,
            'status' => $this->refund->status->value,
        ];
    }
}
