<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum AppealStatus: string
{
    use HasValues;

    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Dismissed = 'dismissed';
}
