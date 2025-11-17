<?php

namespace App\Payments\Data;

use App\ValueObjects\Money;
use InvalidArgumentException;

final class PaymentResponse
{
    /**
     * @param  array<string, mixed>  $raw
     */
    public function __construct(
        public readonly string $provider,
        public readonly string $providerPaymentId,
        public readonly string $status,
        public readonly Money $amount,
        public readonly array $raw = []
    ) {
        if ($provider === '' || $providerPaymentId === '') {
            throw new InvalidArgumentException('Provider and provider payment id must be provided.');
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public static function fromArray(array $attributes): self
    {
        if (! isset($attributes['provider'], $attributes['provider_payment_id'], $attributes['amount'], $attributes['currency'])) {
            throw new InvalidArgumentException('Provider, provider payment id, amount, and currency are required.');
        }

        return new self(
            provider: (string) $attributes['provider'],
            providerPaymentId: (string) $attributes['provider_payment_id'],
            status: (string) ($attributes['status'] ?? ''),
            amount: Money::from((int) $attributes['amount'], (string) $attributes['currency']),
            raw: $attributes['raw'] ?? $attributes
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'provider' => $this->provider,
            'provider_payment_id' => $this->providerPaymentId,
            'status' => $this->status,
            'amount' => $this->amount->amount(),
            'currency' => $this->amount->currency(),
            'raw' => $this->raw,
        ];
    }
}
