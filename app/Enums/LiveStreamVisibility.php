<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum LiveStreamVisibility: string
{
    use HasValues;

    case Public = 'public';
    case Followers = 'followers';
    case Subscribers = 'subscribers';
}
