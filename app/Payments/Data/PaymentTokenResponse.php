<?php

namespace App\Payments\Data;

use InvalidArgumentException;

final class PaymentTokenResponse
{
    /**
     * @param  array<string, mixed>  $raw
     */
    public function __construct(
        public readonly string $provider,
        public readonly string $providerTokenId,
        public readonly string $frontendBearerToken,
        public readonly int $clientAccnum,
        public readonly int $clientSubacc,
        public readonly bool $is3DS,
        public readonly array $raw = []
    ) {
        if ($provider === '' || $providerTokenId === '') {
            throw new InvalidArgumentException('Provider and provider token id must be provided.');
        }

        if ($clientAccnum <= 0 || $clientSubacc <= 0) {
            throw new InvalidArgumentException('Client account number and subaccount must be positive integers.');
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public static function fromArray(array $attributes): self
    {
        return new self(
            provider: (string) ($attributes['provider'] ?? ''),
            providerTokenId: (string) ($attributes['provider_token_id'] ?? $attributes['providerTokenId'] ?? ''),
            frontendBearerToken: (string) ($attributes['frontend_bearer_token'] ?? $attributes['frontendBearerToken'] ?? ''),
            clientAccnum: (int) ($attributes['client_accnum'] ?? $attributes['clientAccnum'] ?? 0),
            clientSubacc: (int) ($attributes['client_subacc'] ?? $attributes['clientSubacc'] ?? 0),
            is3DS: (bool) ($attributes['is_3ds'] ?? $attributes['is3DS'] ?? false),
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
            'provider_token_id' => $this->providerTokenId,
            'frontend_bearer_token' => $this->frontendBearerToken,
            'client_accnum' => $this->clientAccnum,
            'client_subacc' => $this->clientSubacc,
            'is_3ds' => $this->is3DS,
            'raw' => $this->raw,
        ];
    }
}
