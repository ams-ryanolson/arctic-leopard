<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum AppealType: string
{
    use HasValues;

    case Suspension = 'suspension';
    case Ban = 'ban';
}
