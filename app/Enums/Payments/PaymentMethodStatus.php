<?php

namespace App\Enums\Payments;

use App\Enums\Concerns\HasValues;

enum PaymentMethodStatus: string
{
    use HasValues;

    case Active = 'active';
    case Inactive = 'inactive';
    case Expired = 'expired';
    case Suspended = 'suspended';
}
