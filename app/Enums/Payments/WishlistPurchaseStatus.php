<?php

namespace App\Enums\Payments;

use App\Enums\Concerns\HasValues;

enum WishlistPurchaseStatus: string
{
    use HasValues;

    case Pending = 'pending';
    case Completed = 'completed';
    case Refunded = 'refunded';
    case Cancelled = 'cancelled';
    case Failed = 'failed';
}

