<?php

namespace App\Payments\Data;

use App\ValueObjects\Money;
use InvalidArgumentException;

final class PaymentRefundResponse
{
    /**
     * @param array<string, mixed> $raw
     */
    public function __construct(
        public readonly string $provider,
        public readonly string $providerRefundId,
        public readonly string $status,
        public readonly Money $amount,
        public readonly array $raw = []
    ) {
        if ($provider === '' || $providerRefundId === '') {
            throw new InvalidArgumentException('Provider and provider refund id must be provided.');
        }
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public static function fromArray(array $attributes): self
    {
        if (! isset($attributes['provider'], $attributes['provider_refund_id'], $attributes['amount'], $attributes['currency'])) {
            throw new InvalidArgumentException('Provider, provider refund id, amount, and currency are required.');
        }

        return new self(
            provider: (string) $attributes['provider'],
            providerRefundId: (string) $attributes['provider_refund_id'],
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
            'provider_refund_id' => $this->providerRefundId,
            'status' => $this->status,
            'amount' => $this->amount->amount(),
            'currency' => $this->amount->currency(),
            'raw' => $this->raw,
        ];
    }
}

