<?php

namespace App\Payments\Data;

use InvalidArgumentException;

final class PaymentTokenData
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function __construct(
        public readonly int $userId,
        public readonly ?array $billingAddress = null,
        public readonly array $metadata = []
    ) {
        if ($this->userId <= 0) {
            throw new InvalidArgumentException('User id must be a positive integer.');
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public static function fromArray(array $attributes): self
    {
        return new self(
            userId: (int) ($attributes['user_id'] ?? $attributes['userId'] ?? 0),
            billingAddress: $attributes['billing_address'] ?? $attributes['billingAddress'] ?? null,
            metadata: $attributes['metadata'] ?? [],
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'user_id' => $this->userId,
            'billing_address' => $this->billingAddress,
            'metadata' => $this->metadata,
        ];
    }
}
