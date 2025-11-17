<?php

namespace App\Payments\Data;

use InvalidArgumentException;

final class SubscriptionResponse
{
    /**
     * @param  array<string, mixed>  $raw
     */
    public function __construct(
        public readonly string $provider,
        public readonly string $providerSubscriptionId,
        public readonly string $status,
        public readonly array $raw = []
    ) {
        if ($provider === '' || $providerSubscriptionId === '') {
            throw new InvalidArgumentException('Provider and provider subscription id must be provided.');
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public static function fromArray(array $attributes): self
    {
        return new self(
            provider: (string) ($attributes['provider'] ?? ''),
            providerSubscriptionId: (string) ($attributes['provider_subscription_id'] ?? $attributes['id'] ?? ''),
            status: (string) ($attributes['status'] ?? ''),
            raw: $attributes['raw'] ?? $attributes,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'provider' => $this->provider,
            'provider_subscription_id' => $this->providerSubscriptionId,
            'status' => $this->status,
            'raw' => $this->raw,
        ];
    }
}
