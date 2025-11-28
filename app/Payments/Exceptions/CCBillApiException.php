<?php

namespace App\Payments\Exceptions;

use RuntimeException;

class CCBillApiException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?string $errorCode = null,
        public readonly ?array $responseData = null,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, 0, $previous);
    }

    /**
     * @param  array<string, mixed>  $responseData
     */
    public static function fromResponse(string $message, ?string $errorCode = null, ?array $responseData = null): self
    {
        return new self($message, $errorCode, $responseData);
    }
}
