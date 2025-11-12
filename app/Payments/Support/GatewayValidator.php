<?php

namespace App\Payments\Support;

use InvalidArgumentException;

class GatewayValidator
{
    public static function assertIsoCurrency(string $currency): void
    {
        if (strlen($currency) !== 3) {
            throw new InvalidArgumentException('Currency must conform to ISO 4217.');
        }
    }

    public static function assertPositiveInt(int $value, string $field): void
    {
        if ($value <= 0) {
            throw new InvalidArgumentException("{$field} must be a positive integer.");
        }
    }
}

