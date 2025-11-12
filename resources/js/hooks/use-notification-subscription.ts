import { useEffect, useRef } from 'react';

import { getPrivateChannel, leaveEchoChannel } from '@/lib/echo';

export type NotificationBroadcastPayload = {
    notification?: {
        id: string;
        type: string;
        [key: string]: unknown;
    };
    unread_count?: number;
    [key: string]: unknown;
};

type NotificationSubscriptionOptions = {
    enabled?: boolean;
    onNotification?: (payload: NotificationBroadcastPayload) => void;
};

export function useNotificationSubscription(
    userId: number | string | null | undefined,
    options: NotificationSubscriptionOptions = {},
): void {
    const { enabled = true, onNotification } = options;
    const handlerRef = useRef(onNotification);

    useEffect(() => {
        handlerRef.current = onNotification;
    }, [onNotification]);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') {
            return undefined;
        }

        if (!userId) {
            return undefined;
        }

        const channelName = `users.${userId}.notifications`;
        const channel = getPrivateChannel(channelName);

        if (!channel) {
            return undefined;
        }

        const handleNotification = (payload: NotificationBroadcastPayload) => {
            handlerRef.current?.(payload);
        };

        const notificationEvent = '.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated';

        if (typeof channel.notification === 'function') {
            channel.notification(handleNotification);
        } else {
            channel.listen(notificationEvent, handleNotification);
        }

        return () => {
            channel.stopListening(notificationEvent);
            leaveEchoChannel(channelName);
        };
    }, [enabled, userId]);
}


