<?php

namespace App\Enums\Payments;

use App\Enums\Concerns\HasValues;

enum PaymentSubscriptionStatus: string
{
    use HasValues;

    case Pending = 'pending';
    case Trialing = 'trialing';
    case Active = 'active';
    case PastDue = 'past_due';
    case Grace = 'grace';
    case Cancelled = 'cancelled';
    case Expired = 'expired';
}

