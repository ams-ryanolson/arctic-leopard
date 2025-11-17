<?php

namespace App\Enums\Payments;

use App\Enums\Concerns\HasValues;

enum PaymentGatewayStatus: string
{
    use HasValues;

    case Active = 'active';
    case Inactive = 'inactive';
    case Pending = 'pending';
}
