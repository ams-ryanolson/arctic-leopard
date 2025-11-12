import Echo, { type Channel } from 'laravel-echo';
import Pusher from 'pusher-js';

import http from '@/lib/http';
import { getCsrfToken } from '@/lib/csrf';

declare global {
    interface Window {
        Echo?: Echo;
        Pusher?: typeof Pusher;
    }
}

let echoInstance: Echo | null = null;

type EchoChannel = Channel & {
    notification?(callback: (notification: unknown) => void): EchoChannel;
    listenForWhisper?(event: string, callback: (data: unknown) => void): EchoChannel;
    whisper?(event: string, data: unknown): EchoChannel;
    stopListening?(event: string): EchoChannel;
};

type EchoPresenceChannel = EchoChannel & {
    here?(callback: (members: unknown[]) => void): EchoPresenceChannel;
    joining?(callback: (member: unknown) => void): EchoPresenceChannel;
    leaving?(callback: (member: unknown) => void): EchoPresenceChannel;
};

function parsePort(value: string | undefined): number | undefined {
    if (!value) {
        return undefined;
    }

    const port = Number.parseInt(value, 10);

    return Number.isFinite(port) ? port : undefined;
}

export function ensureEcho(): Echo {
    if (typeof window === 'undefined') {
        throw new Error('Laravel Echo is only available in a browser environment.');
    }

    if (echoInstance) {
        return echoInstance;
    }

    const key = import.meta.env.VITE_PUSHER_APP_KEY;

    if (!key) {
        throw new Error('Missing VITE_PUSHER_APP_KEY. Set it in your environment to enable broadcasting.');
    }

    const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'us2';
    const host = import.meta.env.VITE_PUSHER_HOST;
    const scheme = import.meta.env.VITE_PUSHER_SCHEME ?? 'https';
    const port = parsePort(import.meta.env.VITE_PUSHER_PORT);
    const forceTLS = scheme !== 'http';

    window.Pusher = window.Pusher ?? Pusher;

    const csrfToken = getCsrfToken();
    const appUrl = import.meta.env.VITE_APP_URL ?? window.location.origin;
    const authUrl = new URL('/broadcasting/auth', appUrl).toString();

    echoInstance = new Echo({
        broadcaster: 'pusher',
        key,
        cluster,
        forceTLS,
        wsHost: host || undefined,
        httpHost: host || undefined,
        wsPort: port,
        wssPort: port,
        authorizer: (channel) => ({
            authorize: (socketId, callback) => {
                if (import.meta.env.DEV && typeof document !== 'undefined') {
                    // eslint-disable-next-line no-console
                    console.debug('[broadcasting] authorizing channel', {
                        channel: channel.name,
                        socketId,
                        cookies: document.cookie,
                    });
                }

                http.post(
                    authUrl,
                    {
                        socket_id: socketId,
                        channel_name: channel.name,
                    },
                    {
                        withCredentials: true,
                        headers: csrfToken
                            ? {
                                  'X-XSRF-TOKEN': csrfToken,
                                  'X-CSRF-TOKEN': csrfToken,
                              }
                            : undefined,
                    },
                )
                    .then((response) => callback(false, response.data))
                    .catch((error: unknown) => {
                        console.error('[broadcasting] Authorization failed', error);
                        callback(true, error instanceof Error ? error : new Error('Broadcast auth failed'));
                    });
            },
        }),
        enableLogging: false,
        disableStats: true,
    });

    return echoInstance;
}

export function leaveEchoChannel(channel: string): void {
    if (!echoInstance) {
        return;
    }

    echoInstance.leaveChannel(channel);
}

export function getPrivateChannel(name: string): EchoChannel | null {
    try {
        return ensureEcho().private(name) as EchoChannel;
    } catch (error) {
        console.error('[broadcasting] Unable to create private channel', error);

        return null;
    }
}

export function getPresenceChannel(name: string): EchoPresenceChannel | null {
    try {
        return ensureEcho().join(name) as EchoPresenceChannel;
    } catch (error) {
        console.error('[broadcasting] Unable to create presence channel', error);

        return null;
    }
}


