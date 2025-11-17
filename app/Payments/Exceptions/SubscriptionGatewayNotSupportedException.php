<?php

namespace App\Payments\Exceptions;

class SubscriptionGatewayNotSupportedException extends PaymentGatewayException
{
    public static function forGateway(string $name): self
    {
        return new self("Gateway [{$name}] does not support subscription operations.");
    }
}
