<?php

namespace App\Enums\Payments;

use App\Enums\Concerns\HasValues;

enum PaymentWebhookStatus: string
{
    use HasValues;

    case Pending = 'pending';
    case Processing = 'processing';
    case Processed = 'processed';
    case Failed = 'failed';
}

