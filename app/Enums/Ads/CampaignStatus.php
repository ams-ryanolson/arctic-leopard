<?php

namespace App\Enums\Ads;

use App\Enums\Concerns\HasValues;

enum CampaignStatus: string
{
    use HasValues;

    case Draft = 'draft';
    case Active = 'active';
    case Paused = 'paused';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
