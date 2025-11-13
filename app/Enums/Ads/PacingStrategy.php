<?php

namespace App\Enums\Ads;

use App\Enums\Concerns\HasValues;

enum PacingStrategy: string
{
    use HasValues;

    case Standard = 'standard';
    case Accelerated = 'accelerated';
    case Even = 'even';
}
