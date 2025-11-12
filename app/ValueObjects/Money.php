<?php

namespace App\ValueObjects;

use InvalidArgumentException;
use JsonSerializable;

/**
 * Simple immutable money value object that stores amounts as minor units.
 */
class Money implements JsonSerializable
{
    public function __construct(
        protected readonly int $amount,
        protected readonly string $currency
    ) {
        if ($amount < 0) {
            throw new InvalidArgumentException('Money amount must be greater than or equal to zero.');
        }

        if (strlen($currency) !== 3) {
            throw new InvalidArgumentException('Currency must be a 3 character ISO code.');
        }
    }

    public static function zero(string $currency = 'USD'): self
    {
        return new self(0, strtoupper($currency));
    }

    public static function from(int $amount, string $currency): self
    {
        return new self($amount, strtoupper($currency));
    }

    public function amount(): int
    {
        return $this->amount;
    }

    public function currency(): string
    {
        return $this->currency;
    }

    public function add(self $money): self
    {
        $this->assertSameCurrency($money);

        return new self($this->amount + $money->amount, $this->currency);
    }

    public function subtract(self $money): self
    {
        $this->assertSameCurrency($money);

        if ($money->amount > $this->amount) {
            throw new InvalidArgumentException('Cannot subtract more money than is available.');
        }

        return new self($this->amount - $money->amount, $this->currency);
    }

    public function multiply(int|float $multiplier): self
    {
        $calculated = (int) round($this->amount * $multiplier);

        return new self($calculated, $this->currency);
    }

    public function equals(self $money): bool
    {
        return $this->currency === $money->currency && $this->amount === $money->amount;
    }

    public function toDecimal(int $precision = 2): string
    {
        $decimals = $this->amount / (10 ** $precision);

        return number_format($decimals, $precision, '.', '');
    }

    public function format(string $locale = 'en_US'): string
    {
        $fmt = numfmt_create($locale, \NumberFormatter::CURRENCY);

        if ($fmt === false) {
            return sprintf('%s %s', $this->toDecimal(), $this->currency);
        }

        return numfmt_format_currency($fmt, $this->amount / 100, $this->currency);
    }

    public function jsonSerialize(): array
    {
        return [
            'amount' => $this->amount,
            'currency' => $this->currency,
            'decimal' => $this->toDecimal(),
        ];
    }

    protected function assertSameCurrency(self $money): void
    {
        if ($this->currency !== $money->currency) {
            throw new InvalidArgumentException('Money values must share the same currency.');
        }
    }
}

