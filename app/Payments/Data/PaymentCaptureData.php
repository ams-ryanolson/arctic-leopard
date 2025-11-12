<?php

namespace App\Payments\Data;

use App\ValueObjects\Money;
use InvalidArgumentException;

final class PaymentCaptureData
{
    /**
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        public readonly string $providerIntentId,
        public readonly Money $amount,
        public readonly array $metadata = [],
        public readonly ?string $statementDescriptor = null
    ) {
        if ($providerIntentId === '') {
            throw new InvalidArgumentException('Provider intent id must be provided.');
        }
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public static function fromArray(array $attributes): self
    {
        if (! isset($attributes['provider_intent_id'], $attributes['amount'], $attributes['currency'])) {
            throw new InvalidArgumentException('Provider intent id, amount, and currency are required.');
        }

        return new self(
            providerIntentId: (string) $attributes['provider_intent_id'],
            amount: Money::from((int) $attributes['amount'], (string) $attributes['currency']),
            metadata: $attributes['metadata'] ?? [],
            statementDescriptor: $attributes['statement_descriptor'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'provider_intent_id' => $this->providerIntentId,
            'amount' => $this->amount->amount(),
            'currency' => $this->amount->currency(),
            'metadata' => $this->metadata,
            'statement_descriptor' => $this->statementDescriptor,
        ];
    }
}

