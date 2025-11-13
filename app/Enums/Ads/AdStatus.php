<?php

namespace App\Enums\Ads;

use App\Enums\Concerns\HasValues;

enum AdStatus: string
{
    use HasValues;

    case Draft = 'draft';
    case PendingReview = 'pending_review';
    case Active = 'active';
    case Paused = 'paused';
    case Expired = 'expired';
    case Rejected = 'rejected';
}
