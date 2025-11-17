<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum WishlistItemStatus: string
{
    use HasValues;

    case Active = 'active';
    case Funded = 'funded';
    case Fulfilled = 'fulfilled';
    case Cancelled = 'cancelled';
}
