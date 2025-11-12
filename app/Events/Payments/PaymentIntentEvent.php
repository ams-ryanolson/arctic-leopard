<?php

namespace App\Events\Payments;

use App\Models\Payments\PaymentIntent;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

abstract class PaymentIntentEvent
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public PaymentIntent $intent)
    {
    }

    /**
     * @return array{
     *     id:int,
     *     uuid:string,
     *     status:string,
     *     amount:int,
     *     currency:string
     * }
     */
    public function payload(): array
    {
        return [
            'id' => $this->intent->id,
            'uuid' => $this->intent->uuid,
            'status' => $this->intent->status->value,
            'amount' => $this->intent->amount,
            'currency' => $this->intent->currency,
        ];
    }
}

