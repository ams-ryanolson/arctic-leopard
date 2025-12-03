<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum LiveStreamCategory: string
{
    use HasValues;

    case Entertainment = 'entertainment';
    case Gaming = 'gaming';
    case Adult = 'adult';
    case Music = 'music';
    case Talk = 'talk';
    case Education = 'education';
    case Other = 'other';
}
