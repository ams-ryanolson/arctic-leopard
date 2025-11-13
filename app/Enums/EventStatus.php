<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum EventStatus: string
{
    use HasValues;

    case Draft = 'draft';
    case Pending = 'pending';
    case Published = 'published';
    case Cancelled = 'cancelled';
    case Archived = 'archived';
}
