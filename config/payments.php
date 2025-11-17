<?php

use App\Payments\Gateways\FakeGateway;

return [
    /*
    |--------------------------------------------------------------------------
    | Default Payment Gateway
    |--------------------------------------------------------------------------
    |
    | This option controls the default gateway the application will use when
    | initiating payments or subscriptions. You may override the gateway per
    | request or resolvable entity as needed.
    |
    */

    'default' => env('PAYMENTS_DEFAULT_GATEWAY', 'fake'),

    /*
    |--------------------------------------------------------------------------
    | Currency Configuration
    |--------------------------------------------------------------------------
    */

    'currency' => [
        'default' => env('PAYMENTS_DEFAULT_CURRENCY', 'USD'),
        'supported' => explode(',', env('PAYMENTS_SUPPORTED_CURRENCIES', 'USD')),
    ],

    /*
    |--------------------------------------------------------------------------
    | Platform Fees
    |--------------------------------------------------------------------------
    |
    | Configure optional platform fee percentages / fixed amounts (expressed
    | in the smallest currency unit) applied to charges the platform handles.
    |
    */

    'fees' => [
        'platform_percent' => (float) env('PAYMENTS_PLATFORM_PERCENT', 0.0),
        'platform_fixed' => (int) env('PAYMENTS_PLATFORM_FIXED', 0),
    ],

    /*
    |--------------------------------------------------------------------------
    | Gateway Definitions
    |--------------------------------------------------------------------------
    |
    | Each gateway may specify a driver class along with arbitrarily nested
    | options. The PaymentGatewayManager resolves the driver based on this
    | configuration and shares it across the application lifecycle.
    |
    */

    'gateways' => [
        'fake' => [
            'driver' => FakeGateway::class,
            'options' => [
                'intent_status' => env('PAYMENTS_FAKE_INTENT_STATUS', 'requires_confirmation'),
                'capture_status' => env('PAYMENTS_FAKE_CAPTURE_STATUS', 'captured'),
                'refund_status' => env('PAYMENTS_FAKE_REFUND_STATUS', 'succeeded'),
                'subscription_status' => env('PAYMENTS_FAKE_SUBSCRIPTION_STATUS', 'active'),
                'client_secret' => env('PAYMENTS_FAKE_CLIENT_SECRET'),
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Webhook Verification
    |--------------------------------------------------------------------------
    |
    | You may configure per-provider webhook secrets or shared secrets. These
    | values are used by webhook controllers and jobs to ensure incoming
    | requests originate from trusted payment providers.
    |
    */

    'webhooks' => [
        'providers' => [
            'fake' => [
                'secret' => env('PAYMENTS_FAKE_WEBHOOK_SECRET'),
            ],
        ],
        'replay_window' => (int) env('PAYMENTS_WEBHOOK_REPLAY_WINDOW', 300),
    ],
];
