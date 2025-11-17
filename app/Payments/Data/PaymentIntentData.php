<?php

namespace App\Payments\Data;

use App\Enums\Payments\PaymentType;
use App\ValueObjects\Money;
use InvalidArgumentException;

final class PaymentIntentData
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function __construct(
        public readonly string $payableType,
        public readonly int|string $payableId,
        public readonly Money $amount,
        public readonly int $payerId,
        public readonly ?int $payeeId = null,
        public readonly ?PaymentType $type = null,
        public readonly ?string $method = null,
        public readonly ?string $description = null,
        public readonly array $metadata = [],
        public readonly ?string $returnUrl = null,
        public readonly ?string $receiptEmail = null
    ) {
        if ($this->payableType === '') {
            throw new InvalidArgumentException('Payable type must be provided.');
        }

        if ($this->payerId <= 0) {
            throw new InvalidArgumentException('Payer id must be a positive integer.');
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
            payableType: (string) ($attributes['payable_type'] ?? $attributes['payableType'] ?? ''),
            payableId: $attributes['payable_id'] ?? $attributes['payableId'] ?? 0,
            amount: Money::from((int) $attributes['amount'], (string) $attributes['currency']),
            payerId: (int) ($attributes['payer_id'] ?? $attributes['payerId'] ?? 0),
            payeeId: isset($attributes['payee_id']) ? (int) $attributes['payee_id'] : (isset($attributes['payeeId']) ? (int) $attributes['payeeId'] : null),
            type: isset($attributes['type']) ? \App\Enums\Payments\PaymentType::from((string) $attributes['type']) : null,
            method: $attributes['method'] ?? null,
            description: $attributes['description'] ?? null,
            metadata: $attributes['metadata'] ?? [],
            returnUrl: $attributes['return_url'] ?? $attributes['returnUrl'] ?? null,
            receiptEmail: $attributes['receipt_email'] ?? $attributes['receiptEmail'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'payable_type' => $this->payableType,
            'payable_id' => $this->payableId,
            'amount' => $this->amount->amount(),
            'currency' => $this->amount->currency(),
            'payer_id' => $this->payerId,
            'payee_id' => $this->payeeId,
            'type' => $this->type?->value,
            'method' => $this->method,
            'description' => $this->description,
            'metadata' => $this->metadata,
            'return_url' => $this->returnUrl,
            'receipt_email' => $this->receiptEmail,
        ];
    }
}
