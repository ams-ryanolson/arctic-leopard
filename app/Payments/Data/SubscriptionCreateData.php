<?php

namespace App\Payments\Data;

use App\ValueObjects\Money;
use InvalidArgumentException;

final class SubscriptionCreateData
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function __construct(
        public readonly int $subscriberId,
        public readonly int $creatorId,
        public readonly Money $amount,
        public readonly string $interval,
        public readonly int $intervalCount,
        public readonly bool $autoRenews,
        public readonly ?int $trialDays = null,
        public readonly ?string $paymentMethodToken = null,
        public readonly ?string $providerCustomerId = null,
        public readonly array $metadata = []
    ) {
        if ($subscriberId <= 0 || $creatorId <= 0) {
            throw new InvalidArgumentException('Subscriber and creator must be valid identifiers.');
        }

        if ($interval === '') {
            throw new InvalidArgumentException('Interval is required.');
        }

        if ($intervalCount <= 0) {
            throw new InvalidArgumentException('Interval count must be positive.');
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public static function fromArray(array $attributes): self
    {
        if (! isset($attributes['amount'], $attributes['currency'])) {
            throw new InvalidArgumentException('Amount and currency are required.');
        }

        return new self(
            subscriberId: (int) ($attributes['subscriber_id'] ?? $attributes['subscriberId'] ?? 0),
            creatorId: (int) ($attributes['creator_id'] ?? $attributes['creatorId'] ?? 0),
            amount: Money::from((int) $attributes['amount'], (string) $attributes['currency']),
            interval: (string) ($attributes['interval'] ?? ''),
            intervalCount: (int) ($attributes['interval_count'] ?? $attributes['intervalCount'] ?? 1),
            autoRenews: (bool) ($attributes['auto_renews'] ?? $attributes['autoRenews'] ?? true),
            trialDays: isset($attributes['trial_days']) ? (int) $attributes['trial_days'] : ($attributes['trialDays'] ?? null),
            paymentMethodToken: $attributes['payment_method_token'] ?? $attributes['paymentMethodToken'] ?? null,
            providerCustomerId: $attributes['provider_customer_id'] ?? $attributes['providerCustomerId'] ?? null,
            metadata: $attributes['metadata'] ?? [],
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'subscriber_id' => $this->subscriberId,
            'creator_id' => $this->creatorId,
            'amount' => $this->amount->amount(),
            'currency' => $this->amount->currency(),
            'interval' => $this->interval,
            'interval_count' => $this->intervalCount,
            'auto_renews' => $this->autoRenews,
            'trial_days' => $this->trialDays,
            'payment_method_token' => $this->paymentMethodToken,
            'provider_customer_id' => $this->providerCustomerId,
            'metadata' => $this->metadata,
        ];
    }
}
