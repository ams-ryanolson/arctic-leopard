<?php

return [
    'provider' => env('VERIFICATION_PROVIDER', 'sumsub'),

    'sumsub' => [
        'app_token' => env('SUMSUB_APP_TOKEN'),
        'secret_key' => env('SUMSUB_SECRET_KEY'),
        'webhook_secret' => env('SUMSUB_WEBHOOK_SECRET'),
        'environment' => env('SUMSUB_ENVIRONMENT', 'sandbox'),
        'base_url' => env('SUMSUB_BASE_URL', 'https://api.sumsub.com'),
        'level_name' => env('SUMSUB_LEVEL_NAME', 'id-and-liveness'),
    ],

    'default_expires_years' => 1,
    'default_grace_period_days' => 30,
];
