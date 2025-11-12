<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'geoip' => [
        'driver' => env('GEOIP_DRIVER'),
        'endpoint' => env('GEOIP_HTTP_ENDPOINT'),
        'method' => env('GEOIP_HTTP_METHOD', 'GET'),
        'headers' => [],
        'query' => [],
        'ip_parameter' => env('GEOIP_HTTP_IP_PARAMETER', 'ip'),
        'response_key' => env('GEOIP_HTTP_RESPONSE_KEY', 'country_code'),
        'timeout' => env('GEOIP_HTTP_TIMEOUT', 2),
        'mapping' => [],
        'fallback_country_code' => env('GEOIP_FALLBACK_COUNTRY_CODE'),
    ],
];
