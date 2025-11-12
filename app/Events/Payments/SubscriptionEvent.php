<?php

namespace App\Events\Payments;

use App\Models\Payments\PaymentSubscription;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

abstract class SubscriptionEvent
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public PaymentSubscription $subscription)
    {
    }

    /**
     * @return array{
     *     id:int,
     *     uuid:string,
     *     status:string,
     *     amount:int,
     *     currency:string,
     *     subscriber_id:int,
     *     creator_id:int
     * }
     */
    public function payload(): array
    {
        return [
            'id' => $this->subscription->id,
            'uuid' => $this->subscription->uuid,
            'status' => $this->subscription->status->value,
            'amount' => $this->subscription->amount,
            'currency' => $this->subscription->currency,
            'subscriber_id' => $this->subscription->subscriber_id,
            'creator_id' => $this->subscription->creator_id,
        ];
    }
}

