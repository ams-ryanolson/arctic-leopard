<?php

namespace App\Payments\Exceptions;

class PaymentGatewayNotFoundException extends PaymentGatewayException
{
    public static function named(string $name): self
    {
        return new self("Payment gateway [{$name}] is not configured.");
    }
}
