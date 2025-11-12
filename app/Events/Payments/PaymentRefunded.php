<?php

namespace App\Events\Payments;

use App\Models\Payments\PaymentRefund;

class PaymentRefunded extends PaymentEvent
{
    public function __construct(
        \App\Models\Payments\Payment $payment,
        public PaymentRefund $refund
    ) {
        parent::__construct($payment);
    }

    /**
     * @return array{
     *     id:int,
     *     uuid:string,
     *     amount:int,
     *     currency:string,
     *     status:string
     * }
     */
    public function refundPayload(): array
    {
        return [
            'id' => $this->refund->id,
            'uuid' => $this->refund->uuid,
            'amount' => $this->refund->amount,
            'currency' => $this->refund->currency,
            'status' => $this->refund->status->value,
        ];
    }
}

