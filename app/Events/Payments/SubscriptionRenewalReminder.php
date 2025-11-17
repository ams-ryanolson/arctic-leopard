<?php

namespace App\Events\Payments;

use App\Models\Payments\PaymentSubscription;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SubscriptionRenewalReminder
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly PaymentSubscription $subscription,
        public readonly bool $gracePeriod = false
    ) {}
}
