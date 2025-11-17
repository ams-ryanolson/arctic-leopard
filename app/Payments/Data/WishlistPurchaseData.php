<?php

namespace App\Payments\Data;

use App\ValueObjects\Money;
use InvalidArgumentException;

final class WishlistPurchaseData
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function __construct(
        public readonly int $wishlistItemId,
        public readonly int $buyerId,
        public readonly int $creatorId,
        public readonly Money $amount,
        public readonly ?string $message = null,
        public readonly array $metadata = [],
        public readonly ?string $method = null,
        public readonly bool $coversFee = false
    ) {
        if ($wishlistItemId <= 0 || $buyerId <= 0 || $creatorId <= 0) {
            throw new InvalidArgumentException('Wishlist purchase requires valid identifiers.');
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public static function fromArray(array $attributes): self
    {
        if (! isset($attributes['amount'], $attributes['currency'])) {
            throw new InvalidArgumentException('Amount and currency are required for a wishlist purchase.');
        }

        return new self(
            wishlistItemId: (int) ($attributes['wishlist_item_id'] ?? $attributes['wishlistItemId'] ?? 0),
            buyerId: (int) ($attributes['buyer_id'] ?? $attributes['buyerId'] ?? 0),
            creatorId: (int) ($attributes['creator_id'] ?? $attributes['creatorId'] ?? 0),
            amount: Money::from((int) $attributes['amount'], (string) $attributes['currency']),
            message: $attributes['message'] ?? null,
            metadata: $attributes['metadata'] ?? [],
            method: $attributes['method'] ?? null,
            coversFee: (bool) ($attributes['covers_fee'] ?? $attributes['coversFee'] ?? false),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'wishlist_item_id' => $this->wishlistItemId,
            'buyer_id' => $this->buyerId,
            'creator_id' => $this->creatorId,
            'amount' => $this->amount->amount(),
            'currency' => $this->amount->currency(),
            'message' => $this->message,
            'metadata' => $this->metadata,
            'method' => $this->method,
            'covers_fee' => $this->coversFee,
        ];
    }
}
