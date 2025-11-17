<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Broadcaster
    |--------------------------------------------------------------------------
    |
    | This option controls the default broadcaster that will be used by the
    | framework when an event needs to be broadcast. You may set this to
    | any of the connections defined in the "connections" array below.
    |
    */

    'default' => env('BROADCAST_CONNECTION', 'log'),

    /*
    |--------------------------------------------------------------------------
    | Broadcast Connections
    |--------------------------------------------------------------------------
    |
    | Here you may define all of the broadcast connections that will be used
    | to broadcast events to other systems or over websockets. Samples of
    | each available connection type are provided inside this array.
    |
    */

    'connections' => [

        'pusher' => [
            'driver' => 'pusher',
            'key' => env('PUSHER_APP_KEY'),
            'secret' => env('PUSHER_APP_SECRET'),
            'app_id' => env('PUSHER_APP_ID'),
            'options' => (static function (): array {
                $scheme = env('PUSHER_SCHEME', 'https');

                $options = [
                    'cluster' => env('PUSHER_APP_CLUSTER'),
                    'scheme' => $scheme,
                    'useTLS' => $scheme !== 'http',
                    'encrypted' => $scheme !== 'http',
                    'port' => $scheme === 'https' ? 443 : 80,
                ];

                if ($host = env('PUSHER_HOST')) {
                    $options['host'] = $host;
                }

                if ($port = env('PUSHER_PORT')) {
                    $options['port'] = is_numeric($port) ? (int) $port : $port;
                }

                return $options;
            })(),
        ],

        'ably' => [
            'driver' => 'ably',
            'key' => env('ABLY_KEY'),
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => 'default',
        ],

        'log' => [
            'driver' => 'log',
        ],

        'null' => [
            'driver' => 'null',
        ],

    ],

];
