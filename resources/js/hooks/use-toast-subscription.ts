import { useEffect, useRef } from 'react';

import { getPrivateChannel, leaveEchoChannel } from '@/lib/echo';
import type { ToastPayload } from '@/types/toasts';

type ToastSubscriptionOptions = {
    enabled?: boolean;
};

export function useToastSubscription(
    userId: number | string | null | undefined,
    handler: (toast: ToastPayload) => void,
    options: ToastSubscriptionOptions = {},
): void {
    const { enabled = true } = options;
    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') {
            return undefined;
        }

        if (!userId) {
            return undefined;
        }

        const channelName = `users.${userId}.toasts`;
        const channel = getPrivateChannel(channelName);

        if (!channel) {
            return undefined;
        }

        const eventName = 'ToastPushed';

        const listener = (payload: ToastPayload) => {
            handlerRef.current(payload);
        };

        channel.listen(eventName, listener);

        return () => {
            channel.stopListening(eventName);
            leaveEchoChannel(channelName);
        };
    }, [enabled, userId]);
}

