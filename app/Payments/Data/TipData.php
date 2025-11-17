<?php

namespace App\Payments\Data;

use App\ValueObjects\Money;
use InvalidArgumentException;

final class TipData
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function __construct(
        public readonly int $senderId,
        public readonly int $recipientId,
        public readonly Money $amount,
        public readonly ?string $message = null,
        public readonly array $metadata = [],
        public readonly ?string $method = null
    ) {
        if ($senderId <= 0 || $recipientId <= 0) {
            throw new InvalidArgumentException('Sender and recipient must be valid identifiers.');
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public static function fromArray(array $attributes): self
    {
        if (! isset($attributes['amount'], $attributes['currency'])) {
            throw new InvalidArgumentException('Amount and currency are required for a tip.');
        }

        return new self(
            senderId: (int) ($attributes['sender_id'] ?? $attributes['senderId'] ?? 0),
            recipientId: (int) ($attributes['recipient_id'] ?? $attributes['recipientId'] ?? 0),
            amount: Money::from((int) $attributes['amount'], (string) $attributes['currency']),
            message: $attributes['message'] ?? null,
            metadata: $attributes['metadata'] ?? [],
            method: $attributes['method'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'sender_id' => $this->senderId,
            'recipient_id' => $this->recipientId,
            'amount' => $this->amount->amount(),
            'currency' => $this->amount->currency(),
            'message' => $this->message,
            'metadata' => $this->metadata,
            'method' => $this->method,
        ];
    }
}
