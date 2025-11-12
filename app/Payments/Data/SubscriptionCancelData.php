<?php

namespace App\Payments\Data;

use InvalidArgumentException;

final class SubscriptionCancelData
{
    public function __construct(
        public readonly string $providerSubscriptionId,
        public readonly bool $immediate = false,
        public readonly ?string $reason = null
    ) {
        if ($providerSubscriptionId === '') {
            throw new InvalidArgumentException('Provider subscription id must be provided.');
        }
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public static function fromArray(array $attributes): self
    {
        return new self(
            providerSubscriptionId: (string) ($attributes['provider_subscription_id'] ?? $attributes['id'] ?? ''),
            immediate: (bool) ($attributes['immediate'] ?? false),
            reason: $attributes['reason'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'provider_subscription_id' => $this->providerSubscriptionId,
            'immediate' => $this->immediate,
            'reason' => $this->reason,
        ];
    }
}

