<?php

namespace App\Models\Payments\Concerns;

use App\ValueObjects\Money;

trait InteractsWithMoney
{
    /**
     * Create a Money value object for the given amount and currency.
     */
    protected function money(int $amount = 0, ?string $currency = null): Money
    {
        return Money::from($amount, $currency ?? $this->getAttribute('currency') ?? 'USD');
    }
}
