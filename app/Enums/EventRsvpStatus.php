<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum EventRsvpStatus: string
{
    use HasValues;

    case Going = 'going';
    case Tentative = 'tentative';
    case Cancelled = 'cancelled';
}
