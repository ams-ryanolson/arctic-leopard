<?php

namespace App\Enums\Payments;

use App\Enums\Concerns\HasValues;

enum PaymentType: string
{
    use HasValues;

    case OneTime = 'one_time';
    case Recurring = 'recurring';
    case Adjustment = 'adjustment';
}
