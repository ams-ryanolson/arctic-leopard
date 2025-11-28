<?php

namespace App\Payments\Data;

use InvalidArgumentException;

final class SubaccountConfig
{
    public function __construct(
        public readonly int $clientAccnum,
        public readonly int $clientSubacc
    ) {
        if ($this->clientAccnum <= 0) {
            throw new InvalidArgumentException('Client account number must be a positive integer.');
        }

        if ($this->clientSubacc <= 0) {
            throw new InvalidArgumentException('Client subaccount must be a positive integer.');
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public static function fromArray(array $attributes): self
    {
        return new self(
            clientAccnum: (int) ($attributes['client_accnum'] ?? $attributes['clientAccnum'] ?? 0),
            clientSubacc: (int) ($attributes['client_subacc'] ?? $attributes['clientSubacc'] ?? 0),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'client_accnum' => $this->clientAccnum,
            'client_subacc' => $this->clientSubacc,
        ];
    }
}
