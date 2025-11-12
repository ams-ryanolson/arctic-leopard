<?php

namespace App\Payments\Data;

use App\ValueObjects\Money;
use InvalidArgumentException;

final class SubscriptionSwapData
{
    /**
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        public readonly string $providerSubscriptionId,
        public readonly Money $amount,
        public readonly string $interval,
        public readonly int $intervalCount,
        public readonly bool $prorate = true,
        public readonly array $metadata = []
    ) {
        if ($providerSubscriptionId === '') {
            throw new InvalidArgumentException('Provider subscription id must be provided.');
        }

        if ($interval === '') {
            throw new InvalidArgumentException('Interval is required.');
        }

        if ($intervalCount <= 0) {
            throw new InvalidArgumentException('Interval count must be positive.');
        }
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public static function fromArray(array $attributes): self
    {
        if (! isset($attributes['amount'], $attributes['currency'])) {
            throw new InvalidArgumentException('Amount and currency are required.');
        }

        return new self(
            providerSubscriptionId: (string) ($attributes['provider_subscription_id'] ?? $attributes['id'] ?? ''),
            amount: Money::from((int) $attributes['amount'], (string) $attributes['currency']),
            interval: (string) ($attributes['interval'] ?? ''),
            intervalCount: (int) ($attributes['interval_count'] ?? $attributes['intervalCount'] ?? 1),
            prorate: (bool) ($attributes['prorate'] ?? true),
            metadata: $attributes['metadata'] ?? [],
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'provider_subscription_id' => $this->providerSubscriptionId,
            'amount' => $this->amount->amount(),
            'currency' => $this->amount->currency(),
            'interval' => $this->interval,
            'interval_count' => $this->intervalCount,
            'prorate' => $this->prorate,
            'metadata' => $this->metadata,
        ];
    }
}

