<?php

namespace App\Enums\Payments;

use App\Enums\Concerns\HasValues;

enum PaymentRefundStatus: string
{
    use HasValues;

    case Pending = 'pending';
    case Processing = 'processing';
    case Succeeded = 'succeeded';
    case Failed = 'failed';
}
