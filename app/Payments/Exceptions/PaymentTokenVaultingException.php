<?php

namespace App\Payments\Exceptions;

use RuntimeException;

class PaymentTokenVaultingException extends RuntimeException
{
    public function __construct(
        string $message = 'Failed to vault payment token.',
        public readonly ?string $errorCode = null,
        public readonly ?array $context = null,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, 0, $previous);
    }
}
