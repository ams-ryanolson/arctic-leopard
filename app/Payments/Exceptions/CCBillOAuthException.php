<?php

namespace App\Payments\Exceptions;

class CCBillOAuthException extends \App\Payments\Exceptions\CCBillApiException
{
    public function __construct(
        string $message,
        ?string $errorCode = null,
        ?array $responseData = null,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $errorCode, $responseData, $previous);
    }
}
