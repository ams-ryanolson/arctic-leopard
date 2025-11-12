<?php

namespace App\Enums\Payments;

use App\Enums\Concerns\HasValues;

enum WalletTransactionType: string
{
    use HasValues;

    case Credit = 'credit';
    case Debit = 'debit';
    case Adjustment = 'adjustment';
}

