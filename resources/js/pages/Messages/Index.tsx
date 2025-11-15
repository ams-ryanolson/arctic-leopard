import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import MessageComposer from '@/components/messaging/message-composer';
import ConversationList from '@/components/messaging/conversation-list';
import ConversationHeader from '@/components/messaging/conversation-header';
import MessageList from '@/components/messaging/message-list';
import TypingIndicator from '@/components/messaging/typing-indicator';
import AppLayout from '@/layouts/app-layout';
import messagesRoutes from '@/routes/messages';
import { getPresenceChannel, leaveEchoChannel } from '@/lib/echo';
import http from '@/lib/http';
import { normalizeNumeric, normalizeMessage } from '@/components/messaging/message-utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type {
    Message,
    Thread,
    ActiveConversation,
    PresenceMember,
    ReactionSummary,
} from '@/components/messaging/types';


type PageProps = {
    threads: Thread[];
    activeConversation?: ActiveConversation | null;
    messages: Message[];
    messagesMeta: {
        has_more: boolean;
        oldest_id?: number | null;
    };
    viewer: {
        id: number;
        display_name?: string | null;
        avatar_url?: string | null;
        username?: string | null;
    };
};

type MessageEvent = {
    message: Message;
};

type MessageDeletedEvent = {
    message_id: number;
    conversation_id: number;
    deleted_at: string | null;
};

export default function MessagesIndex() {
    const { threads: threadsProp, activeConversation: activeProp, messages: messagesProp, messagesMeta, viewer } =
        usePage<PageProps>().props;

    const isMobile = useIsMobile();
    const [threadsState, setThreadsState] = useState<Thread[]>(threadsProp);
    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(activeProp?.id ?? null);
    const [showConversationView, setShowConversationView] = useState<boolean>(false);
    const [messages, setMessages] = useState<Message[]>(messagesProp ?? []);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [expandedReactionsMessageId, setExpandedReactionsMessageId] = useState<number | null>(null);
    const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(messagesMeta?.has_more ?? false);
    const [oldestMessageId, setOldestMessageId] = useState<number | null>(
        messagesMeta?.oldest_id !== undefined && messagesMeta?.oldest_id !== null
            ? normalizeNumeric(messagesMeta.oldest_id)
            : null,
    );
    const [presenceMembers, setPresenceMembers] = useState<PresenceMember[]>([]);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [shouldStickToBottom, setShouldStickToBottom] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const conversationChannelRef = useRef<ReturnType<typeof getPresenceChannel> | null>(null);
    const typingTimeoutsRef = useRef<Record<number, number>>({});
    const typingUsersRef = useRef<Map<number, string>>(new Map());
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [tipRequestActionMessageId, setTipRequestActionMessageId] = useState<number | null>(null);
    const threads = threadsState;

    const updateUnreadBadge = useCallback((list: Thread[]) => {
        if (typeof window === 'undefined') {
            return;
        }

        const total = list.reduce((sum, thread) => sum + (thread.unread_count ?? 0), 0);
        window.dispatchEvent(
            new CustomEvent('messaging:unread-count', {
                detail: { count: total, source: 'page' },
            }),
        );
    }, []);

    const updateThreads = useCallback(
        (updater: Thread[] | ((previous: Thread[]) => Thread[])) => {
            setThreadsState((previous) => {
                const next =
                    typeof updater === 'function'
                        ? (updater as (prev: Thread[]) => Thread[])(previous)
                        : updater;

                updateUnreadBadge(next);

                return next;
            });
        },
        [updateUnreadBadge],
    );
    const handleMessagesScroll = useCallback(() => {
        const container = scrollContainerRef.current;

        if (!container) {
            return;
        }

        const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
        setShouldStickToBottom(remaining < 48);
    }, []);
    const sendTypingSignal = useCallback(() => {
        const channel = conversationChannelRef.current;

        if (!channel?.whisper) {
            return;
        }

        channel.whisper('typing', {
            user_id: viewer.id,
            name: viewer.display_name ?? viewer.username ?? 'You',
        });
    }, [viewer.display_name, viewer.id, viewer.username]);
    const currentConversation = useMemo<ActiveConversation | null>(() => activeProp ?? null, [activeProp]);

    useEffect(() => {
        setSelectedConversationId(activeProp?.id ?? null);
    }, [activeProp?.id]);

    useEffect(() => {
        const initialThreads = threadsProp.map((thread) => ({
            ...thread,
            id: normalizeNumeric(thread.id),
            unread_count: thread.unread_count ?? 0,
            last_message: thread.last_message ? normalizeMessage(thread.last_message) : null,
        }));
        updateThreads(initialThreads as Thread[]);
    }, [threadsProp, updateThreads]);

    useEffect(() => {
        const initialMessages = (messagesProp ?? []).map((message) => normalizeMessage(message));
        setMessages(initialMessages);
        setHasMoreMessages(messagesMeta?.has_more ?? false);
        setOldestMessageId(
            (messagesMeta?.oldest_id !== undefined && messagesMeta?.oldest_id !== null
                ? normalizeNumeric(messagesMeta.oldest_id)
                : null) as number | null,
        );
    }, [messagesMeta?.has_more, messagesMeta?.oldest_id, messagesProp]);

    useEffect(() => {
        const typingStore = typingUsersRef.current;
        const timeoutStore = typingTimeoutsRef.current;

        setReplyTo(null);
        setExpandedReactionsMessageId(null);
        typingStore.clear();
        Object.values(timeoutStore).forEach((timeout) => window.clearTimeout(timeout));
        Object.keys(timeoutStore).forEach((key) => {
            delete timeoutStore[Number(key)];
        });
        setTypingUsers([]);
        setShouldStickToBottom(true);
    }, [selectedConversationId]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const detail = { id: selectedConversationId ?? null };
        window.dispatchEvent(new CustomEvent('messaging:active-conversation', { detail }));

        return () => {
            window.dispatchEvent(new CustomEvent('messaging:active-conversation', { detail: { id: null } }));
        };
    }, [selectedConversationId]);

    useEffect(() => {
        const container = scrollContainerRef.current;

        if (!container) {
            return;
        }

        if (!shouldStickToBottom) {
            return;
        }

        requestAnimationFrame(() => {
            const element = scrollContainerRef.current;

            if (!element) {
                return;
            }

            element.scrollTop = element.scrollHeight;
        });
    }, [selectedConversationId, messages.length, shouldStickToBottom]);

    const markConversationRead = useCallback(
        async (messageId?: number) => {
            if (!selectedConversationId) {
                return;
            }

            try {
                await http.post(`/api/conversations/${selectedConversationId}/read`, {
                    message_id: messageId ?? null,
                });

                updateThreads((previous) =>
                    previous.map((thread) =>
                        thread.id === selectedConversationId
                            ? {
                                  ...thread,
                                  unread_count: 0,
                              }
                            : thread,
                    ),
                );
            } catch (error) {
                console.error('Unable to mark conversation read', error);
            }
        },
        [selectedConversationId, updateThreads],
    );

    useEffect(() => {
        if (!selectedConversationId) {
            return undefined;
        }

        const sendHeartbeat = () => {
            void http.post(`/api/conversations/${selectedConversationId}/presence/heartbeat`).catch(() => {});
        };

        sendHeartbeat();
        const interval = window.setInterval(sendHeartbeat, 25_000);

        return () => window.clearInterval(interval);
    }, [selectedConversationId]);

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
                setPresenceMembers((members as PresenceMember[]).map(mapMember));
            });
        }

        if (channel.joining) {
            channel.joining((member: unknown) => {
                const typedMember = member as PresenceMember;
                setPresenceMembers((previous) => {
                    const exists = previous.some((item) => item.id === Number(typedMember.id));

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
                setPresenceMembers((previous) => previous.filter((item) => item.id !== Number(typedMember.id)));
            });
        }

        channel.listen('MessageSent', (event: MessageEvent) => {
            const normalisedMessage = normalizeMessage(event.message);
            const conversationId = normalisedMessage.conversation_id;
            const messageId = normalisedMessage.id;

            if (!Number.isFinite(conversationId) || !Number.isFinite(messageId)) {
                return;
            }

            updateThreads((previous) => {
                let found = false;

                const next = previous.map((thread) => {
                    if (Number(thread.id) !== conversationId) {
                        return thread;
                    }

                    found = true;

                    const isCurrentConversation = conversationId === selectedConversationId;
                    const isOwnMessage = normalisedMessage.author?.id === viewer.id;
                    const unreadCount = isCurrentConversation || isOwnMessage
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

            setMessages((previous) => {
                const exists = previous.some((item) => Number(item.id) === messageId);

                if (exists) {
                    return previous;
                }

                return [...previous, normalisedMessage].sort(
                    (a, b) => Number(a.sequence) - Number(b.sequence),
                );
            });

            if (normalisedMessage.author?.id !== viewer.id) {
                void markConversationRead(messageId);
            }
        });

        channel.listen('MessageDeleted', (event: MessageDeletedEvent) => {
            const conversationId = normalizeNumeric(event.conversation_id);
            const messageId = normalizeNumeric(event.message_id);

            if (!Number.isFinite(conversationId) || conversationId !== selectedConversationId) {
                return;
            }

            setMessages((previous) =>
                previous.map((message) =>
                    Number(message.id) === messageId
                        ? {
                              ...message,
                              deleted_at: event.deleted_at,
                          }
                        : message,
                ),
            );
        });

        const timeoutStore = typingTimeoutsRef.current;
        const typingStore = typingUsersRef.current;

        const refreshTypingUsers = () => {
            setTypingUsers(Array.from(typingStore.values()));
        };

        const handleTypingWhisper = (payload: { user_id?: number | string; name?: string }) => {
            const rawUserId = payload.user_id;
            const userId =
                typeof rawUserId === 'number'
                    ? rawUserId
                    : typeof rawUserId === 'string'
                      ? Number.parseInt(rawUserId, 10)
                      : null;

            if (userId === null || !Number.isFinite(userId) || userId === viewer.id) {
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
            Object.values(timeoutStore).forEach((timeout) => window.clearTimeout(timeout));
            Object.keys(timeoutStore).forEach((key) => {
                delete timeoutStore[Number(key)];
            });
            typingStore.clear();
            setTypingUsers([]);
        };
    }, [markConversationRead, selectedConversationId, updateThreads, viewer.id]);

    useEffect(() => {
        if (!selectedConversationId || messages.length === 0) {
            return;
        }

        const lastMessage = messages[messages.length - 1];
        const lastMessageId = Number(lastMessage.id);
        void markConversationRead(Number.isFinite(lastMessageId) ? lastMessageId : undefined);
    }, [markConversationRead, messages, selectedConversationId]);

    const handleOpenConversation = useCallback(
        (threadId: number) => {
            if (threadId === selectedConversationId) {
                return;
            }

            setReplyTo(null);
            setExpandedReactionsMessageId(null);

            // On mobile, switch to conversation view when user clicks
            if (isMobile) {
                setShowConversationView(true);
            }

            router.get(
                messagesRoutes.index.url({
                    query: {
                        conversation: threadId,
                    },
                }),
                {},
                {
                    preserveScroll: true,
                },
            );
        },
        [selectedConversationId, isMobile],
    );

    const handleBackToList = useCallback(() => {
        if (!isMobile) {
            return;
        }
        setShowConversationView(false);
        setSelectedConversationId(null);
        router.get(
            messagesRoutes.index.url(),
            {},
            {
                preserveScroll: true,
            },
        );
    }, [isMobile]);

    const handleMessageSent = useCallback(
        (message: Record<string, unknown>) => {
            const normalisedMessage = normalizeMessage(message as Message);
            const conversationId = normalisedMessage.conversation_id;
            const messageId = normalisedMessage.id;

            if (!Number.isFinite(conversationId) || !Number.isFinite(messageId)) {
                return;
            }

            setMessages((previous) => {
                const exists = previous.some((item) => Number(item.id) === messageId);

                if (exists) {
                    return previous;
                }

                return [...previous, normalisedMessage].sort(
                    (a, b) => Number(a.sequence) - Number(b.sequence),
                );
            });

            updateThreads((previous) => {
                const filtered = previous.filter((thread) => Number(thread.id) !== conversationId);
                const currentThread = previous.find(
                    (thread) => Number(thread.id) === conversationId,
                );

                if (!currentThread) {
                    return previous;
                }

                const updatedThread: Thread = {
                    ...currentThread,
                    last_message: normalisedMessage,
                    last_message_at:
                        normalisedMessage.created_at ??
                        normalisedMessage.updated_at ??
                        new Date().toISOString(),
                    unread_count: 0,
                };

                return [updatedThread, ...filtered];
            });

            setReplyTo(null);
            setExpandedReactionsMessageId(null);
            setShouldStickToBottom(true);
            void markConversationRead(messageId);
        },
        [updateThreads, markConversationRead],
    );

    const handleReactionChange = useCallback((messageId: number, summary: ReactionSummary[]) => {
        const targetId = normalizeNumeric(messageId);

        setMessages((previous) =>
            previous.map((message) =>
                Number(message.id) === targetId
                    ? {
                          ...message,
                          reaction_summary: summary,
                      }
                    : message,
            ),
        );
    }, []);

    const handleLoadOlder = useCallback(async () => {
        if (!selectedConversationId || !hasMoreMessages || isLoadingOlder || !oldestMessageId) {
            return;
        }

        setIsLoadingOlder(true);
        const container = scrollContainerRef.current;
        const previousOffsetFromBottom = container ? container.scrollHeight - container.scrollTop : 0;

        try {
            const response = await http.get(`/api/conversations/${selectedConversationId}/messages`, {
                params: {
                    before: oldestMessageId,
                },
            });

            const payload = response.data;
            const data = (payload?.data as Message[]) ?? [];

            setMessages((previous) => {
                const existingIds = new Set(previous.map((message) => String(message.id)));
                const incoming = data
                    .map((message) => normalizeMessage(message))
                    .filter((message) => !existingIds.has(String(message.id)));
                const merged = [...incoming, ...previous];

                return merged.sort((a, b) => Number(a.sequence) - Number(b.sequence));
            });

            setHasMoreMessages(Boolean(payload?.meta?.has_more));
            setOldestMessageId(
                payload?.meta?.oldest_id !== undefined && payload?.meta?.oldest_id !== null
                    ? normalizeNumeric(payload.meta.oldest_id)
                    : null,
            );

            requestAnimationFrame(() => {
                const target = scrollContainerRef.current;

                if (!target) {
                    return;
                }

                target.scrollTop = target.scrollHeight - previousOffsetFromBottom;
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingOlder(false);
        }
    }, [hasMoreMessages, isLoadingOlder, oldestMessageId, selectedConversationId]);

    const filteredThreads = useMemo(() => threads, [threads]);
    
    const handleTipRequestAction = useCallback(
        async (messageId: number, action: 'accept' | 'decline') => {
            if (!viewer?.id) {
                return;
            }

            const endpoint =
                action === 'accept'
                    ? `/api/messages/${messageId}/tip-request/accept`
                    : `/api/messages/${messageId}/tip-request/decline`;

            setTipRequestActionMessageId(messageId);

            try {
                const response = await http.post(endpoint);
                const payload = response.data ?? {};
                const requestPayload = payload.request ?? null;
                const tipPayload = payload.tip ?? null;

                if (requestPayload) {
                    const updated = normalizeMessage(requestPayload);

                    setMessages((previous) =>
                        previous.map((message) =>
                            Number(message.id) === Number(updated.id)
                                ? {
                                      ...message,
                                      ...updated,
                                  }
                                : message,
                        ),
                    );

                    updateThreads((previous) =>
                        previous.map((thread) =>
                            Number(thread.id) === Number(updated.conversation_id)
                                ? {
                                      ...thread,
                                      last_message:
                                          thread.last_message && Number(thread.last_message.id) === Number(updated.id)
                                              ? { ...thread.last_message, ...updated }
                                              : thread.last_message,
                                  }
                                : thread,
                        ),
                    );
                }

                if (tipPayload) {
                    handleMessageSent(tipPayload);
                }
            } catch (error) {
                console.error('Unable to update tip request', error);
            } finally {
                setTipRequestActionMessageId(null);
            }
        },
        [handleMessageSent, updateThreads, viewer?.id],
    );

    const handleTipRequestAccept = useCallback(
        (messageId: number) => {
            void handleTipRequestAction(messageId, 'accept');
        },
        [handleTipRequestAction],
    );

    const handleTipRequestDecline = useCallback(
        (messageId: number) => {
            void handleTipRequestAction(messageId, 'decline');
        },
        [handleTipRequestAction],
    );

    return (
        <AppLayout
            hideHeader
            contentClassName="flex h-full min-h-0 overflow-hidden !max-w-none !mx-0 !px-0 !pb-24 !pt-0 md:!px-0 sm:!pb-16"
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Messages', href: messagesRoutes.index.url() },
            ]}
        >
            <Head title="Messages · Real Kink Men" />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-4 lg:flex-row lg:gap-6">
                    {/* Mobile: Show list or conversation view */}
                    {isMobile ? (
                        <>
                            {!showConversationView ? (
                                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                                    <ConversationList
                                        threads={filteredThreads}
                                        selectedConversationId={selectedConversationId}
                                        onSelectConversation={handleOpenConversation}
                                    />
                                </div>
                            ) : currentConversation ? (
                                <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-white/10 bg-white/5 text-white lg:rounded-3xl">
                                    <ConversationHeader
                                        conversation={currentConversation}
                                        presenceMembers={presenceMembers}
                                        onBack={handleBackToList}
                                        showBackButton={true}
                                    />

                                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                                        <MessageList
                                            messages={messages}
                                            viewerId={viewer.id}
                                            conversation={currentConversation}
                                            hasMoreMessages={hasMoreMessages}
                                            isLoadingOlder={isLoadingOlder}
                                            expandedReactionsMessageId={expandedReactionsMessageId}
                                            tipRequestActionMessageId={tipRequestActionMessageId}
                                            onLoadOlder={handleLoadOlder}
                                            onToggleReactions={(messageId) =>
                                                setExpandedReactionsMessageId((current) =>
                                                    current === messageId ? null : messageId,
                                                )
                                            }
                                            onReply={setReplyTo}
                                            onReactionChange={handleReactionChange}
                                            onTipRequestAccept={handleTipRequestAccept}
                                            onTipRequestDecline={handleTipRequestDecline}
                                            scrollContainerRef={scrollContainerRef}
                                            onScroll={handleMessagesScroll}
                                        />

                                        <TypingIndicator users={typingUsers} />

                                        <div className="border-t border-white/10 px-4 py-3">
                                            <MessageComposer
                                                conversationId={currentConversation.id}
                                                onMessageSent={handleMessageSent}
                                                replyTo={
                                                    replyTo
                                                        ? {
                                                              id: replyTo.id,
                                                              body: replyTo.body,
                                                              author: replyTo.author,
                                                          }
                                                        : null
                                                }
                                                onCancelReply={() => setReplyTo(null)}
                                                onTyping={sendTypingSignal}
                                                viewer={viewer}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </>
                    ) : (
                        /* Desktop: Show both side-by-side */
                        <>
                            <ConversationList
                                threads={filteredThreads}
                                selectedConversationId={selectedConversationId}
                                onSelectConversation={handleOpenConversation}
                            />

                            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-white">
                                {currentConversation ? (
                                    <>
                                        <ConversationHeader
                                            conversation={currentConversation}
                                            presenceMembers={presenceMembers}
                                            onBack={handleBackToList}
                                            showBackButton={false}
                                        />

                                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                                            <MessageList
                                                messages={messages}
                                                viewerId={viewer.id}
                                                conversation={currentConversation}
                                                hasMoreMessages={hasMoreMessages}
                                                isLoadingOlder={isLoadingOlder}
                                                expandedReactionsMessageId={expandedReactionsMessageId}
                                                tipRequestActionMessageId={tipRequestActionMessageId}
                                                onLoadOlder={handleLoadOlder}
                                                onToggleReactions={(messageId) =>
                                                    setExpandedReactionsMessageId((current) =>
                                                        current === messageId ? null : messageId,
                                                    )
                                                }
                                                onReply={setReplyTo}
                                                onReactionChange={handleReactionChange}
                                                onTipRequestAccept={handleTipRequestAccept}
                                                onTipRequestDecline={handleTipRequestDecline}
                                                scrollContainerRef={scrollContainerRef}
                                                onScroll={handleMessagesScroll}
                                            />

                                            <TypingIndicator users={typingUsers} />

                                            <div className="border-t border-white/10 px-4 py-3 sm:px-6 sm:py-4">
                                                <MessageComposer
                                                    conversationId={currentConversation.id}
                                                    onMessageSent={handleMessageSent}
                                                    replyTo={
                                                        replyTo
                                                            ? {
                                                                  id: replyTo.id,
                                                                  body: replyTo.body,
                                                                  author: replyTo.author,
                                                              }
                                                            : null
                                                    }
                                                    onCancelReply={() => setReplyTo(null)}
                                                    onTyping={sendTypingSignal}
                                                    viewer={viewer}
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-white/40">
                                        <p className="text-sm font-medium">Select a thread to begin messaging.</p>
                                        <p className="text-xs text-white/50">Your conversations will appear on the left once you start chatting.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                </div>
            </div>
        </AppLayout>
    );
}
