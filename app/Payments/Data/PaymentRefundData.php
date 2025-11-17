<?php

namespace App\Payments\Data;

use App\ValueObjects\Money;
use InvalidArgumentException;

final class PaymentRefundData
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function __construct(
        public readonly string $providerPaymentId,
        public readonly Money $amount,
        public readonly ?string $reason = null,
        public readonly array $metadata = []
    ) {
        if ($providerPaymentId === '') {
            throw new InvalidArgumentException('Provider payment id must be provided.');
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public static function fromArray(array $attributes): self
    {
        if (! isset($attributes['provider_payment_id'], $attributes['amount'], $attributes['currency'])) {
            throw new InvalidArgumentException('Provider payment id, amount, and currency are required.');
        }

        return new self(
            providerPaymentId: (string) $attributes['provider_payment_id'],
            amount: Money::from((int) $attributes['amount'], (string) $attributes['currency']),
            reason: $attributes['reason'] ?? null,
            metadata: $attributes['metadata'] ?? [],
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'provider_payment_id' => $this->providerPaymentId,
            'amount' => $this->amount->amount(),
            'currency' => $this->amount->currency(),
            'reason' => $this->reason,
            'metadata' => $this->metadata,
        ];
    }
}
