<?php

namespace App\Enums\Ads;

use App\Enums\Concerns\HasValues;

enum PricingModel: string
{
    use HasValues;

    case Cpm = 'cpm';
    case Cpc = 'cpc';
    case Cpa = 'cpa';
    case Flat = 'flat';
}
