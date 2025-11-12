<?php

namespace App\Enums\Payments;

use App\Enums\Concerns\HasValues;

enum LedgerDirection: string
{
    use HasValues;

    case Debit = 'debit';
    case Credit = 'credit';
}

