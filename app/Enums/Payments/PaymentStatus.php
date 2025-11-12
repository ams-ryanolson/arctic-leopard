<?php

namespace App\Enums\Payments;

use App\Enums\Concerns\HasValues;

enum PaymentStatus: string
{
    use HasValues;

    case Pending = 'pending';
    case Authorized = 'authorized';
    case Captured = 'captured';
    case Settled = 'settled';
    case Failed = 'failed';
    case Refunded = 'refunded';
    case Cancelled = 'cancelled';
}

