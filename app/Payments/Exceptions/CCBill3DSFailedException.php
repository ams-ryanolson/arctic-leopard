<?php

namespace App\Payments\Exceptions;

class CCBill3DSFailedException extends \App\Payments\Exceptions\CCBillApiException
{
    public function __construct(
        string $message = '3DS authentication failed.',
        ?string $errorCode = null,
        ?array $responseData = null,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $errorCode, $responseData, $previous);
    }
}
