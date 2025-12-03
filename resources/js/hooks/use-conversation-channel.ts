import { useCallback, useEffect, useRef, useState } from 'react';

import type { PresenceMember } from '@/components/messaging/types';
import { getPresenceChannel } from '@/lib/echo';

type UseConversationChannelOptions = {
    selectedConversationUlid: string | null;
    viewerId: number;
    viewerName: string;
    onMessageReceived?: (message: Record<string, unknown>) => void;
    onMessageDeleted?: (messageId: number) => void;
    onReactionUpdated?: (
        messageId: number,
        reactionSummary: Array<{
            emoji: string;
            variant?: string | null;
            count: number;
            reacted: boolean;
        }>,
    ) => void;
    onMarkRead?: (userId: number, messageId?: number) => void;
    onThreadUpdate?: (
        conversationId: number,
        lastMessage: Record<string, unknown>,
    ) => void;
    setTypingUsers?: (users: Array<{ id: number; name: string }>) => void;
};

export function useConversationChannel({
    selectedConversationUlid,
    viewerId,
    viewerName,
    onMessageReceived,
    onMessageDeleted,
    onReactionUpdated,
    onMarkRead,
    onThreadUpdate,
    setTypingUsers,
}: UseConversationChannelOptions) {
    const [presenceMembers, setPresenceMembers] = useState<PresenceMember[]>(
        [],
    );
    const typingTimeoutsRef = useRef<Map<number, number>>(new Map());
    const channelRef = useRef<ReturnType<typeof getPresenceChannel> | null>(
        null,
    );

    // Store callbacks in refs to avoid dependency issues
    const callbacksRef = useRef({
        onMessageReceived,
        onMessageDeleted,
        onReactionUpdated,
        onMarkRead,
        onThreadUpdate,
        setTypingUsers,
    });

    // Update callbacks ref when they change
    useEffect(() => {
        callbacksRef.current = {
            onMessageReceived,
            onMessageDeleted,
            onReactionUpdated,
            onMarkRead,
            onThreadUpdate,
            setTypingUsers,
        };
    }, [
        onMessageReceived,
        onMessageDeleted,
        onReactionUpdated,
        onMarkRead,
        onThreadUpdate,
        setTypingUsers,
    ]);

    // Typing indicator cleanup
    useEffect(() => {
        return () => {
            typingTimeoutsRef.current.forEach((timeout) => {
                window.clearTimeout(timeout);
            });
            typingTimeoutsRef.current.clear();
        };
    }, []);

    // Subscribe to conversation channel
    useEffect(() => {
        if (!selectedConversationUlid) {
            setPresenceMembers([]);
            channelRef.current = null;
            return undefined;
        }

        // Debug: ensure we have a string ULID, not an object
        if (typeof selectedConversationUlid !== 'string') {
            console.error(
                '[broadcasting] selectedConversationUlid is not a string!',
                {
                    type: typeof selectedConversationUlid,
                    value: selectedConversationUlid,
                },
            );
            return undefined;
        }

        console.debug('[broadcasting] Subscribing to conversation channel', {
            ulid: selectedConversationUlid,
            ulidType: typeof selectedConversationUlid,
        });

        const channelName = `conversations.${selectedConversationUlid}`;
        const channel = getPresenceChannel(channelName);

        if (!channel) {
            console.error(
                '[broadcasting] Unable to subscribe to conversation channel',
                channelName,
            );
            return undefined;
        }

        channelRef.current = channel;

        // Handle presence updates
        channel.here?.((members: PresenceMember[]) => {
            setPresenceMembers(members);
        });

        channel.joining?.((member: PresenceMember) => {
            setPresenceMembers((previous) => {
                const exists = previous.some((m) => m.id === member.id);
                if (exists) {
                    return previous;
                }
                return [...previous, member];
            });
        });

        channel.leaving?.((member: PresenceMember) => {
            setPresenceMembers((previous) =>
                previous.filter((m) => m.id !== member.id),
            );
        });

        // Listen for typing indicators (whispers)
        channel.listenForWhisper?.(
            'typing',
            (data: { user_id: number; name: string }) => {
                if (data.user_id === viewerId) {
                    return; // Ignore own typing
                }

                callbacksRef.current.setTypingUsers?.((previous) => {
                    const exists = previous.some((u) => u.id === data.user_id);
                    if (exists) {
                        return previous;
                    }
                    return [...previous, { id: data.user_id, name: data.name }];
                });

                // Clear typing indicator after 3 seconds
                const existingTimeout = typingTimeoutsRef.current.get(
                    data.user_id,
                );
                if (existingTimeout) {
                    window.clearTimeout(existingTimeout);
                }

                const timeout = window.setTimeout(() => {
                    callbacksRef.current.setTypingUsers?.((previous) =>
                        previous.filter((u) => u.id !== data.user_id),
                    );
                    typingTimeoutsRef.current.delete(data.user_id);
                }, 3000);

                typingTimeoutsRef.current.set(data.user_id, timeout);
            },
        );

        // Listen for message events
        channel.listen(
            '.MessageSent',
            (data: { message: Record<string, unknown> }) => {
                console.debug('[broadcasting] MessageSent received', data);
                if (data.message) {
                    callbacksRef.current.onMessageReceived?.(data.message);
                }
            },
        );

        channel.listen('.MessageDeleted', (data: { message_id: number }) => {
            if (data.message_id) {
                callbacksRef.current.onMessageDeleted?.(data.message_id);
            }
        });

        channel.listen(
            '.MessageReactionUpdated',
            (data: {
                message_id: number;
                reaction_summary: Array<{
                    emoji: string;
                    variant?: string | null;
                    count: number;
                    reacted: boolean;
                }>;
            }) => {
                if (data.message_id && data.reaction_summary) {
                    callbacksRef.current.onReactionUpdated?.(
                        data.message_id,
                        data.reaction_summary,
                    );
                }
            },
        );

        channel.listen(
            '.MessageRead',
            (data: { user_id: number; message_id?: number }) => {
                if (data.user_id) {
                    callbacksRef.current.onMarkRead?.(
                        data.user_id,
                        data.message_id,
                    );
                }
            },
        );

        // Error handling
        const errorHandler = (error: unknown) => {
            console.error('[broadcasting] Conversation channel error', error);
        };

        // Return cleanup function
        return () => {
            if (channelRef.current) {
                channelRef.current.stopListening?.('.MessageSent');
                channelRef.current.stopListening?.('.MessageDeleted');
                channelRef.current.stopListening?.('.MessageReactionUpdated');
                channelRef.current.stopListening?.('.MessageRead');
                channelRef.current.stopListeningForWhisper?.('typing');
            }
            channelRef.current = null;
            setPresenceMembers([]);
        };
    }, [selectedConversationUlid, viewerId, viewerName]);

    // Send typing signal
    const sendTypingSignal = useCallback(() => {
        if (!channelRef.current || !selectedConversationUlid) {
            return;
        }

        channelRef.current.whisper?.('typing', {
            user_id: viewerId,
            name: viewerName,
        });
    }, [selectedConversationUlid, viewerId, viewerName]);

    return {
        presenceMembers,
        sendTypingSignal,
    };
}
