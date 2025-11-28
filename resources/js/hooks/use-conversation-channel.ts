import { useEffect, useRef, useState } from 'react';

import { normalizeMessage, normalizeNumeric } from '@/components/messaging/message-utils';
import type {
    Message,
    PresenceMember,
    ReactionSummary,
    Thread,
} from '@/components/messaging/types';
import { getPresenceChannel, leaveEchoChannel } from '@/lib/echo';
import http from '@/lib/http';

type MessageEvent = {
    message: Message;
};

type MessageDeletedEvent = {
    message_id: number;
    conversation_id: number;
    deleted_at: string | null;
};

type UseConversationChannelOptions = {
    selectedConversationId: number | null;
    viewerId: number;
    viewerName: string;
    onMessageReceived: (message: Message) => void;
    onMessageDeleted: (messageId: number, deletedAt: string | null) => void;
    onThreadUpdate: (
        updater: Thread[] | ((previous: Thread[]) => Thread[]),
    ) => void;
    onMarkRead: (messageId?: number) => Promise<void>;
    setTypingUsers: (users: string[]) => void;
    typingTimeoutsRef: React.MutableRefObject<Record<number, number>>;
    typingUsersRef: React.MutableRefObject<Map<number, string>>;
};

export function useConversationChannel({
    selectedConversationId,
    viewerId,
    viewerName,
    onMessageReceived,
    onMessageDeleted,
    onThreadUpdate,
    onMarkRead,
    setTypingUsers,
    typingTimeoutsRef,
    typingUsersRef,
}: UseConversationChannelOptions) {
    const [presenceMembers, setPresenceMembers] = useState<PresenceMember[]>(
        [],
    );
    const conversationChannelRef = useRef<ReturnType<
        typeof getPresenceChannel
    > | null>(null);

    // Presence heartbeat
    useEffect(() => {
        if (!selectedConversationId) {
            return undefined;
        }

        let retryCount = 0;
        const maxRetries = 3;
        let heartbeatInterval: number | null = null;

        const sendHeartbeat = async () => {
            try {
                await http.post(
                    `/api/conversations/${selectedConversationId}/presence/heartbeat`,
                );
                retryCount = 0;
            } catch (error) {
                console.error('Presence heartbeat failed', error);
                retryCount++;

                if (retryCount < maxRetries) {
                    setTimeout(() => {
                        void sendHeartbeat();
                    }, 5000 * retryCount);
                } else {
                    console.error(
                        'Presence heartbeat failed after max retries, stopping heartbeat',
                    );
                    if (heartbeatInterval) {
                        window.clearInterval(heartbeatInterval);
                        heartbeatInterval = null;
                    }
                }
            }
        };

        void sendHeartbeat();
        heartbeatInterval = window.setInterval(() => {
            void sendHeartbeat();
        }, 25_000);

        return () => {
            if (heartbeatInterval) {
                window.clearInterval(heartbeatInterval);
            }
        };
    }, [selectedConversationId]);

    // Echo channel subscription
    useEffect(() => {
        if (!selectedConversationId) {
            setPresenceMembers([]);
            return undefined;
        }

        const channelName = `conversations.${selectedConversationId}`;
        const channel = getPresenceChannel(channelName);

        if (!channel) {
            return undefined;
        }

        conversationChannelRef.current = channel;

        const mapMember = (member: PresenceMember) => ({
            id: Number(member.id),
            name: member.name,
            avatar: member.avatar ?? null,
            role: member.role ?? null,
        });

        if (channel.here) {
            channel.here((members: unknown[]) => {
                setPresenceMembers(
                    (members as PresenceMember[]).map(mapMember),
                );
            });
        }

        if (channel.joining) {
            channel.joining((member: unknown) => {
                const typedMember = member as PresenceMember;
                setPresenceMembers((previous) => {
                    const exists = previous.some(
                        (item) => item.id === Number(typedMember.id),
                    );

                    if (exists) {
                        return previous;
                    }

                    return [...previous, mapMember(typedMember)];
                });
            });
        }

        if (channel.leaving) {
            channel.leaving((member: unknown) => {
                const typedMember = member as PresenceMember;
                setPresenceMembers((previous) =>
                    previous.filter(
                        (item) => item.id !== Number(typedMember.id),
                    ),
                );
            });
        }

        channel.listen('MessageSent', (event: MessageEvent) => {
            const normalisedMessage = normalizeMessage(event.message);
            const conversationId = normalisedMessage.conversation_id;
            const messageId = normalisedMessage.id;

            if (
                !Number.isFinite(conversationId) ||
                !Number.isFinite(messageId)
            ) {
                return;
            }

            onThreadUpdate((previous) => {
                let found = false;

                const next = previous.map((thread) => {
                    if (Number(thread.id) !== conversationId) {
                        return thread;
                    }

                    found = true;

                    const isCurrentConversation =
                        conversationId === selectedConversationId;
                    const isOwnMessage =
                        normalisedMessage.author?.id === viewerId;
                    const unreadCount =
                        isCurrentConversation || isOwnMessage
                            ? 0
                            : (thread.unread_count ?? 0) + 1;

                    return {
                        ...thread,
                        last_message: normalisedMessage,
                        last_message_at:
                            normalisedMessage.created_at ??
                            normalisedMessage.updated_at ??
                            new Date().toISOString(),
                        unread_count: unreadCount,
                    };
                });

                return found ? next : previous;
            });

            if (conversationId !== selectedConversationId) {
                return;
            }

            onMessageReceived(normalisedMessage);

            if (normalisedMessage.author?.id !== viewerId) {
                void onMarkRead(messageId);
            }
        });

        channel.listen('MessageDeleted', (event: MessageDeletedEvent) => {
            const conversationId = normalizeNumeric(event.conversation_id);
            const messageId = normalizeNumeric(event.message_id);

            if (
                !Number.isFinite(conversationId) ||
                conversationId !== selectedConversationId
            ) {
                return;
            }

            onMessageDeleted(messageId, event.deleted_at);
        });

        const timeoutStore = typingTimeoutsRef.current;
        const typingStore = typingUsersRef.current;

        const refreshTypingUsers = () => {
            setTypingUsers(Array.from(typingStore.values()));
        };

        const handleTypingWhisper = (payload: {
            user_id?: number | string;
            name?: string;
        }) => {
            const rawUserId = payload.user_id;
            const userId =
                typeof rawUserId === 'number'
                    ? rawUserId
                    : typeof rawUserId === 'string'
                      ? Number.parseInt(rawUserId, 10)
                      : null;

            if (
                userId === null ||
                !Number.isFinite(userId) ||
                userId === viewerId
            ) {
                return;
            }

            const name = payload.name ?? 'Someone';
            typingStore.set(userId, name);
            refreshTypingUsers();

            if (timeoutStore[userId]) {
                window.clearTimeout(timeoutStore[userId]);
            }

            timeoutStore[userId] = window.setTimeout(() => {
                typingStore.delete(userId);
                refreshTypingUsers();
                delete timeoutStore[userId];
            }, 2800);
        };

        channel.listenForWhisper?.('typing', handleTypingWhisper);

        return () => {
            channel.stopListening('MessageSent');
            channel.stopListening('MessageDeleted');
            channel.stopListening?.('typing');
            leaveEchoChannel(channelName);
            if (conversationChannelRef.current === channel) {
                conversationChannelRef.current = null;
            }
            // Clear all typing timeouts
            Object.values(timeoutStore).forEach((timeout) => {
                if (timeout) {
                    window.clearTimeout(timeout);
                }
            });
            Object.keys(timeoutStore).forEach((key) => {
                delete timeoutStore[Number(key)];
            });
            typingStore.clear();
            setTypingUsers([]);
        };
    }, [
        selectedConversationId,
        viewerId,
        viewerName,
        onMessageReceived,
        onMessageDeleted,
        onThreadUpdate,
        onMarkRead,
        setTypingUsers,
        typingTimeoutsRef,
        typingUsersRef,
    ]);

    const sendTypingSignal = () => {
        const channel = conversationChannelRef.current;

        if (!channel?.whisper) {
            return;
        }

        channel.whisper('typing', {
            user_id: viewerId,
            name: viewerName,
        });
    };

    return {
        presenceMembers,
        conversationChannelRef,
        sendTypingSignal,
    };
}

