<?php

namespace App\Payments\Data;

use InvalidArgumentException;

final class SubscriptionResumeData
{
    public function __construct(
        public readonly string $providerSubscriptionId,
        public readonly ?string $paymentMethodToken = null
    ) {
        if ($providerSubscriptionId === '') {
            throw new InvalidArgumentException('Provider subscription id must be provided.');
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public static function fromArray(array $attributes): self
    {
        return new self(
            providerSubscriptionId: (string) ($attributes['provider_subscription_id'] ?? $attributes['id'] ?? ''),
            paymentMethodToken: $attributes['payment_method_token'] ?? $attributes['paymentMethodToken'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'provider_subscription_id' => $this->providerSubscriptionId,
            'payment_method_token' => $this->paymentMethodToken,
        ];
    }
}
