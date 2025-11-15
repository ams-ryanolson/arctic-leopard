<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum VerificationStatus: string
{
    use HasValues;

    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Expired = 'expired';
    case RenewalRequired = 'renewal_required';
    case Cancelled = 'cancelled';
}
