<?php

namespace App\Payments\Exceptions;

use RuntimeException;

class PaymentGatewayException extends RuntimeException
{
    /**
     * @param  array<string, mixed>  $context
     */
    public static function withContext(string $message, array $context = []): self
    {
        $exception = new self($message);

        return $exception;
    }
}
