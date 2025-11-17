<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        @if (app()->environment('testing'))
            <script>
                (function () {
                    const channels = {};

                    function createChannel() {
                        const listeners = {};

                        return {
                            listen(event, callback) {
                                listeners[event] ??= new Set();
                                listeners[event].add(callback);

                                return this;
                            },
                            stopListening(event, callback) {
                                if (!listeners[event]) {
                                    return this;
                                }

                                if (callback) {
                                    listeners[event].delete(callback);
                                } else {
                                    delete listeners[event];
                                }

                                return this;
                            },
                            emit(event, payload) {
                                if (!listeners[event]) {
                                    return;
                                }

                                listeners[event].forEach((callback) => {
                                    try {
                                        callback(payload);
                                    } catch (error) {
                                        console.error('Echo stub listener error', error);
                                    }
                                });
                            }
                        };
                    }

                    window.Echo = {
                        private(name) {
                            channels[name] ??= createChannel();

                            return channels[name];
                        },
                        leave(name) {
                            delete channels[name];
                        }
                    };

                    window.__emitTimelineBroadcast = function (channel, payload) {
                        if (!channels[channel]) {
                            channels[channel] = createChannel();
                        }

                        channels[channel].emit('.TimelineEntryBroadcast', payload);
                    };
                })();
            </script>
        @endif

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
