<?php

namespace App\Enums\Ads;

use App\Enums\Concerns\HasValues;

enum AdSize: string
{
    use HasValues;

    case Small = 'small';
    case Medium = 'medium';
    case Large = 'large';
    case Banner = 'banner';
    case Square = 'square';
}
