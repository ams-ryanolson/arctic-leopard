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
        'ccbill' => [
            'driver' => \App\Payments\Gateways\CCBill\CCBillGateway::class,
            'options' => [
                'frontend_app_id' => env('CCBILL_FRONTEND_APP_ID'),
                'frontend_secret' => env('CCBILL_FRONTEND_SECRET'),
                'backend_app_id' => env('CCBILL_BACKEND_APP_ID'),
                'backend_secret' => env('CCBILL_BACKEND_SECRET'),
                'api_base_url' => env('CCBILL_API_BASE_URL', 'https://api.ccbill.com'),
                'low_risk_non_recurring' => [
                    'client_accnum' => (int) env('CCBILL_LOW_RISK_NON_RECURRING_ACCNUM', 0),
                    'client_subacc' => (int) env('CCBILL_LOW_RISK_NON_RECURRING_SUBACC', 0),
                ],
                'high_risk_non_recurring' => [
                    'client_accnum' => (int) env('CCBILL_HIGH_RISK_NON_RECURRING_ACCNUM', 0),
                    'client_subacc' => (int) env('CCBILL_HIGH_RISK_NON_RECURRING_SUBACC', 0),
                ],
                'oauth_cache_ttl' => env('CCBILL_OAUTH_CACHE_TTL', 3600),
                'http_timeout' => env('CCBILL_HTTP_TIMEOUT', 10),
                'retry_attempts' => env('CCBILL_RETRY_ATTEMPTS', 3),
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
            'ccbill' => [
                'secret' => env('CCBILL_WEBHOOK_SECRET'),
                'verify_signature' => env('CCBILL_VERIFY_WEBHOOK_SIGNATURE', true),
            ],
        ],
        'replay_window' => (int) env('PAYMENTS_WEBHOOK_REPLAY_WINDOW', 300),
    ],
];
