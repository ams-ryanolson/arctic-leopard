<?php

namespace App\Events\Payments;

use App\Models\Payments\Payment;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

abstract class PaymentEvent
{
    use Dispatchable;
    use SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public Payment $payment)
    {
    }

    /**
     * Get the payment payload for listeners.
     *
     * @return array{
     *     id:int,
     *     uuid:string,
     *     status:string,
     *     amount:int,
     *     currency:string,
     *     type:string
     * }
     */
    public function payload(): array
    {
        return [
            'id' => $this->payment->id,
            'uuid' => $this->payment->uuid,
            'status' => $this->payment->status->value,
            'amount' => $this->payment->amount,
            'currency' => $this->payment->currency,
            'type' => $this->payment->type->value,
        ];
    }
}

