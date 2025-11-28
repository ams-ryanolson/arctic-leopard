<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum ModerationStatus: string
{
    use HasValues;

    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
}
