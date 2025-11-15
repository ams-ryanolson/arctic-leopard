<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum VerificationProvider: string
{
    use HasValues;

    case Sumsub = 'sumsub';
}
