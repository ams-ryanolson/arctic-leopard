<?php

namespace App\Payments\Exceptions;

class CCBill3DSNotSupportedException extends \App\Payments\Exceptions\CCBillApiException
{
    public function __construct(
        string $message = '3DS is not supported by the card issuer.',
        ?string $errorCode = null,
        ?array $responseData = null,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $errorCode, $responseData, $previous);
    }
}
