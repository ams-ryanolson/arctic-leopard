<?php

namespace App\Payments\Data;

use InvalidArgumentException;

final class PaymentIntentResponse
{
    /**
     * @param  array<string, mixed>  $raw
     */
    public function __construct(
        public readonly string $provider,
        public readonly string $providerIntentId,
        public readonly string $status,
        public readonly ?string $clientSecret = null,
        public readonly array $raw = []
    ) {
        if ($provider === '' || $providerIntentId === '') {
            throw new InvalidArgumentException('Provider and provider intent id must be provided.');
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public static function fromArray(array $attributes): self
    {
        return new self(
            provider: (string) ($attributes['provider'] ?? ''),
            providerIntentId: (string) ($attributes['provider_intent_id'] ?? $attributes['id'] ?? ''),
            status: (string) ($attributes['status'] ?? ''),
            clientSecret: $attributes['client_secret'] ?? null,
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
            'provider_intent_id' => $this->providerIntentId,
            'status' => $this->status,
            'client_secret' => $this->clientSecret,
            'raw' => $this->raw,
        ];
    }
}
