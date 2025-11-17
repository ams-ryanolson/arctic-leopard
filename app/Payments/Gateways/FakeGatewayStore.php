<?php

namespace App\Payments\Gateways;

class FakeGatewayStore
{
    /**
     * @var array<string, array<string, mixed>>
     */
    public static array $intents = [];

    /**
     * @var array<string, array<string, mixed>>
     */
    public static array $payments = [];

    /**
     * @var array<string, array<string, mixed>>
     */
    public static array $refunds = [];

    /**
     * @var array<string, array<string, mixed>>
     */
    public static array $subscriptions = [];

    public static function reset(): void
    {
        self::$intents = [];
        self::$payments = [];
        self::$refunds = [];
        self::$subscriptions = [];
    }
}
