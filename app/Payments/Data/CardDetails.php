<?php

namespace App\Payments\Data;

use InvalidArgumentException;

final class CardDetails
{
    public function __construct(
        public readonly string $lastFour,
        public readonly string $brand,
        public readonly string $expMonth,
        public readonly string $expYear,
        public readonly ?string $fingerprint = null
    ) {
        if (strlen($this->lastFour) !== 4 || ! ctype_digit($this->lastFour)) {
            throw new InvalidArgumentException('Last four must be exactly 4 digits.');
        }

        if ($this->brand === '') {
            throw new InvalidArgumentException('Brand must be provided.');
        }

        if (strlen($this->expMonth) !== 2 || ! ctype_digit($this->expMonth)) {
            throw new InvalidArgumentException('Expiration month must be exactly 2 digits.');
        }

        if (strlen($this->expYear) !== 4 || ! ctype_digit($this->expYear)) {
            throw new InvalidArgumentException('Expiration year must be exactly 4 digits.');
        }

        $month = (int) $this->expMonth;
        if ($month < 1 || $month > 12) {
            throw new InvalidArgumentException('Expiration month must be between 01 and 12.');
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public static function fromArray(array $attributes): self
    {
        return new self(
            lastFour: (string) ($attributes['last_four'] ?? $attributes['lastFour'] ?? ''),
            brand: (string) ($attributes['brand'] ?? ''),
            expMonth: (string) ($attributes['exp_month'] ?? $attributes['expMonth'] ?? ''),
            expYear: (string) ($attributes['exp_year'] ?? $attributes['expYear'] ?? ''),
            fingerprint: $attributes['fingerprint'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'last_four' => $this->lastFour,
            'brand' => $this->brand,
            'exp_month' => $this->expMonth,
            'exp_year' => $this->expYear,
            'fingerprint' => $this->fingerprint,
        ];
    }
}
