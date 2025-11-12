<?php

namespace App\Enums\Payments;

use App\Enums\Concerns\HasValues;

enum PaymentIntentStatus: string
{
    use HasValues;

    case Pending = 'pending';
    case RequiresMethod = 'requires_method';
    case RequiresConfirmation = 'requires_confirmation';
    case Processing = 'processing';
    case Succeeded = 'succeeded';
    case Cancelled = 'cancelled';
    case Failed = 'failed';
}

