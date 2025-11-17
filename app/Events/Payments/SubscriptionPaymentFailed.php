<?php

namespace App\Events\Payments;

use App\Models\Payments\Payment;

class SubscriptionPaymentFailed extends SubscriptionEvent
{
    public function __construct(
        \App\Models\Payments\PaymentSubscription $subscription,
        public ?Payment $payment = null
    ) {
        parent::__construct($subscription);
    }
}
