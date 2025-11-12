import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Coins, CornerUpRight, Loader2, MessageSquarePlus, Search, SmilePlus, Users } from 'lucide-react';

import MessageComposer from '@/components/messaging/message-composer';
import MessageReactions from '@/components/messaging/message-reactions';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import messagesRoutes from '@/routes/messages';
import { getPresenceChannel, leaveEchoChannel } from '@/lib/echo';
import http from '@/lib/http';

type Participant = {
    id: number;
    display_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    is_viewer: boolean;
};

type ReactionSummary = {
    emoji: string;
    variant?: string | null;
    count: number;
    reacted: boolean;
};

type Attachment = {
    id: number;
    type: string;
    url: string | null;
    filename: string;
    thumbnail_url?: string | null;
    disk?: string | null;
    mime_type?: string | null;
    size?: number | null;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
    ordering?: number | null;
    is_inline?: boolean;
    is_primary?: boolean;
    meta?: Record<string, unknown> | null;
};

type Message = {
    id: number;
    conversation_id: number;
    sequence: number;
    reply_to_id?: number | null;
    author: {
        id: number | null;
        username?: string | null;
        display_name?: string | null;
        avatar_url?: string | null;
    } | null;
    type: string;
    body: string | null;
    fragments?: unknown;
    metadata?: Record<string, unknown> | null;
    attachments?: Attachment[];
    reaction_summary?: ReactionSummary[];
    viewer_reactions?: { emoji: string; variant?: string | null }[];
    created_at?: string | null;
    updated_at?: string | null;
    deleted_at?: string | null;
};

type TipMessageMetadata = {
    amount?: number;
    currency?: string;
    status?: 'pending' | 'completed' | 'accepted' | 'declined';
    mode?: 'send' | 'request';
    payment_method?: string;
    requester_id?: number;
    responder_id?: number;
    responded_at?: string;
    mock?: boolean;
    originating_request_id?: number;
};

function normalizeNumeric(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10);

        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    const fallback = Number(value);

    return Number.isFinite(fallback) ? fallback : 0;
}

function normalizeMessage(raw: Message | (Message & { id: number | string; conversation_id: number | string; sequence: number | string })): Message {
    return {
        ...raw,
        id: normalizeNumeric(raw.id),
        conversation_id: normalizeNumeric(raw.conversation_id),
        sequence: normalizeNumeric(raw.sequence),
    };
}

type Thread = {
    id: number;
    title: string;
    subject?: string | null;
    is_group: boolean;
    last_message: Message | null;
    last_message_at?: string | null;
    unread_count: number;
    participants: Participant[];
};

type ActiveConversation = {
    id: number;
    title: string;
    subject?: string | null;
    is_group: boolean;
    participants: Participant[];
};

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

type PresenceMember = {
    id: number;
    name: string;
    avatar?: string | null;
    role?: string | null;
};

type MessageEvent = {
    message: Message;
};

type MessageDeletedEvent = {
    message_id: number;
    conversation_id: number;
    deleted_at: string | null;
};

function formatRelativeTime(iso?: string | null): string {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) {
        return 'just now';
    }

    if (diff < hour) {
        const value = Math.round(diff / minute);

        return value === 1 ? '1 min ago' : `${value} min ago`;
    }

    if (diff < day) {
        const value = Math.round(diff / hour);

        return value === 1 ? '1 hr ago' : `${value} hr ago`;
    }

    return date.toLocaleDateString();
}

export default function MessagesIndex() {
    const { threads: threadsProp, activeConversation: activeProp, messages: messagesProp, messagesMeta, viewer } =
        usePage<PageProps>().props;

    const [threadsState, setThreadsState] = useState<Thread[]>(threadsProp);
    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(activeProp?.id ?? null);
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
    const formatCurrency = useCallback((amount: number, currency: string) => {
        try {
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency,
                maximumFractionDigits: 2,
            }).format(amount);
        } catch {
            return `${currency} ${amount.toFixed(2)}`;
        }
    }, []);

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
            name: viewer.display_name ?? viewer.name ?? viewer.username ?? 'You',
        });
    }, [viewer.display_name, viewer.id, viewer.name, viewer.username]);
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

        channel.here((members: PresenceMember[]) => {
            setPresenceMembers(members.map(mapMember));
        });

        channel.joining((member: PresenceMember) => {
            setPresenceMembers((previous) => {
                const exists = previous.some((item) => item.id === Number(member.id));

                if (exists) {
                    return previous;
                }

                return [...previous, mapMember(member)];
            });
        });

        channel.leaving((member: PresenceMember) => {
            setPresenceMembers((previous) => previous.filter((item) => item.id !== Number(member.id)));
        });

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

            if (!Number.isFinite(userId) || userId === viewer.id) {
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
        [selectedConversationId],
    );

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

    return (
        <AppLayout
            hideHeader
            contentClassName="flex h-full min-h-0 overflow-hidden !max-w-none !px-0 !pb-0 !pt-0 md:!px-0"
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Messages', href: messagesRoutes.index.url() },
            ]}
        >
            <Head title="Messages · Real Kink Men" />

            <div className="flex h-full flex-1 min-h-0 flex-col overflow-hidden">
                <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden p-4 lg:flex-row">
                    <Card className="flex h-full min-h-0 max-h-full flex-col overflow-hidden rounded-3xl border-white/10 bg-white/5 text-white !gap-0 !py-0 lg:w-[320px] lg:flex-none">
                        <div className="border-b border-white/10 px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold tracking-wide text-white">Inbox</p>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="rounded-full border border-white/20 bg-white/10 text-xs text-white/70 hover:border-white/40 hover:bg-white/20"
                                >
                                    <MessageSquarePlus className="mr-1 h-3.5 w-3.5" />
                                    New
                                </Button>
                            </div>
                            <button
                                type="button"
                                disabled
                                className="mt-4 flex w-full items-center justify-between rounded-full border border-white/12 bg-black/25 px-4 py-2 text-left text-xs text-white/60 transition hover:border-white/20 hover:bg-black/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 disabled:cursor-not-allowed disabled:opacity-80"
                                aria-label="Thread search coming soon"
                            >
                                <span className="flex items-center gap-2">
                                    <Search className="h-4 w-4 text-white/70" />
                                    <span className="text-[0.65rem] uppercase tracking-[0.2em] text-white/65">Search threads</span>
                                </span>
                                <span className="text-[0.6rem] uppercase tracking-[0.2em] text-white/35">Coming soon</span>
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            {filteredThreads.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-white/40">
                                    <Users className="h-10 w-10" />
                                    <p className="text-sm font-medium">No conversations yet</p>
                                    <p className="text-xs text-white/50">Start a new message to connect with the community.</p>
                                </div>
                            ) : (
                                <ul className="flex flex-col gap-3 px-4 py-4">
                                    {filteredThreads.map((thread) => {
                                        const isActive = thread.id === selectedConversationId;
                                    const snippetMetadata = (thread.last_message?.metadata ?? {}) as TipMessageMetadata;
                                    const lastType = thread.last_message?.type ?? 'text';
                                    const snippet =
                                        thread.last_message?.deleted_at !== null
                                            ? 'Message removed'
                                            : lastType === 'tip'
                                                ? `Tip · ${new Intl.NumberFormat(undefined, {
                                                      style: 'currency',
                                                      currency: snippetMetadata.currency ?? 'USD',
                                                  }).format(snippetMetadata.amount ?? 0)}`
                                                : lastType === 'tip_request'
                                                    ? 'Tip request'
                                                    : thread.last_message?.body ??
                                                      (thread.last_message?.attachments?.length ? 'Shared media' : 'No messages yet');
                                        const counterparts = thread.participants.filter((participant) => !participant.is_viewer);
                                        const primaryParticipant = counterparts[0];
                                        const participantSummary = thread.is_group
                                            ? `${thread.participants.length} participants`
                                            : counterparts
                                                  .map((participant) => participant.display_name ?? participant.username)
                                                  .filter(Boolean)
                                                  .join(' • ');
                                        const threadButtonClasses = cn(
                                            'w-full rounded-2xl border border-transparent px-4 py-3 text-left transition focus:outline-none',
                                            isActive
                                                ? 'border-amber-400/40 bg-white/10 shadow-[0_25px_60px_-40px_rgba(250,204,21,0.65)]'
                                                : 'hover:border-white/10 hover:bg-white/5',
                                        );
                                        const initialsSource =
                                            primaryParticipant?.display_name ??
                                            primaryParticipant?.username ??
                                            thread.title ??
                                            'RK';
                                        const initials = initialsSource.slice(0, 2).toUpperCase();

                                        return (
                                            <li key={thread.id} className="min-w-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenConversation(thread.id)}
                                                    className={threadButtonClasses}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <Avatar className="size-11 border border-white/15 bg-white/10 text-sm font-semibold text-white">
                                                            {primaryParticipant?.avatar_url ? (
                                                                <AvatarImage
                                                                    src={primaryParticipant.avatar_url}
                                                                    alt={primaryParticipant.display_name ?? primaryParticipant.username ?? thread.title}
                                                                />
                                                            ) : (
                                                                <AvatarFallback>{initials}</AvatarFallback>
                                                            )}
                                                        </Avatar>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-semibold text-white">{thread.title}</p>
                                                                    <p className="mt-1 text-xs text-white/60">{participantSummary || 'Conversation'}</p>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1">
                                                                    {thread.unread_count > 0 && (
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.3em] text-amber-200"
                                                                        >
                                                                            {thread.unread_count} new
                                                                        </Badge>
                                                                    )}
                                                                    <span className="text-[0.6rem] uppercase tracking-[0.3em] text-white/40">
                                                                        {formatRelativeTime(thread.last_message_at)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <p className="mt-2 line-clamp-2 text-xs text-white/55">{snippet}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                    </div>
                </Card>

                <Card className="flex h-full min-h-0 max-h-full flex-col overflow-hidden rounded-3xl border-white/10 bg-white/5 text-white !gap-0 !py-0 lg:flex-1">
                    {currentConversation ? (
                        <>
                            <div className="border-b border-white/10 px-6 py-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">{currentConversation.title}</h2>
                                        <p className="text-xs text-white/60">
                                            {currentConversation.participants
                                                .filter((participant) => !participant.is_viewer)
                                                .map((participant) => participant.display_name ?? participant.username)
                                                .join(' • ')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {presenceMembers.slice(0, 5).map((member) => {
                                            const initials = (member.name ?? '??').slice(0, 2).toUpperCase();

                                            return (
                                                <Avatar key={member.id} className="-ml-2 first:ml-0 ring-2 ring-black/40">
                                                    <AvatarImage src={member.avatar ?? undefined} alt={member.name ?? 'Active participant'} />
                                                    <AvatarFallback>{initials}</AvatarFallback>
                                                </Avatar>
                                            );
                                        })}
                                        {presenceMembers.length === 0 && (
                                            <span className="text-xs uppercase tracking-[0.3em] text-white/40">No one online</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex min-h-0 flex-1 flex-col">
                                <div
                                    className="flex-1 min-h-0 overflow-y-auto px-6 py-5"
                                    ref={scrollContainerRef}
                                    onScroll={handleMessagesScroll}
                                >
                                    {hasMoreMessages && (
                                        <div className="mb-4 flex justify-center">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="border border-white/10 bg-black/30 text-xs uppercase tracking-[0.3em] text-white/60 hover:border-white/30 hover:bg-black/40"
                                                onClick={handleLoadOlder}
                                                disabled={isLoadingOlder}
                                            >
                                                {isLoadingOlder ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Loading
                                                    </>
                                                ) : (
                                                    'Load previous messages'
                                                )}
                                            </Button>
                                        </div>
                                    )}

                                    {messages.length === 0 ? (
                                        <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-white/40">
                                            <p className="text-sm font-medium">No messages yet</p>
                                            <p className="text-xs text-white/50">Be the first to send a message and start the conversation.</p>
                                        </div>
                                    ) : (
                                        <div className="flex min-h-0 flex-col gap-4">
                                            {messages.map((message) => {
                                                const isOwnMessage = message.author?.id === viewer.id || message.author === null;
                                                const messageType = message.type ?? 'text';
                                                const tipMetadata = (message.metadata ?? {}) as TipMessageMetadata;
                                                const createdAt = formatRelativeTime(message.created_at ?? message.updated_at);
                                                const referencedMessage =
                                                    message.reply_to_id !== undefined && message.reply_to_id !== null
                                                        ? messages.find((candidate) => candidate.id === message.reply_to_id)
                                                        : undefined;
                                                const reactionCount =
                                                    message.reaction_summary?.reduce((total, summary) => total + summary.count, 0) ?? 0;
                                                const showAuthor = currentConversation?.is_group && !isOwnMessage;
                                                const amountLabel = formatCurrency(
                                                    tipMetadata.amount ?? 0,
                                                    tipMetadata.currency ?? 'USD',
                                                );

                                                if (messageType === 'tip') {
                                                    return (
                                                        <div
                                                            key={message.id}
                                                            className={cn('flex flex-col gap-2', isOwnMessage ? 'items-end' : 'items-start')}
                                                        >
                                                            {showAuthor ? (
                                                                <div className="text-[0.65rem] uppercase tracking-[0.3em] text-white/45">
                                                                    {message.author?.display_name ?? message.author?.username ?? 'Member'}
                                                                </div>
                                                            ) : null}
                                                            <div
                                                                className={cn(
                                                                    'w-full max-w-sm rounded-xl border px-5 py-5 text-sm shadow-lg sm:max-w-md',
                                                                    isOwnMessage
                                                                        ? 'border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent text-emerald-50'
                                                                        : 'border-amber-400/30 bg-gradient-to-br from-amber-400/25 via-amber-400/10 to-transparent text-amber-50',
                                                                )}
                                                            >
                                                                <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.3em]">
                                                                    <span className="flex items-center gap-2 text-white/80">
                                                                        <Coins className="h-4 w-4" />
                                                                        {isOwnMessage ? 'You sent a tip' : 'Tip received'}
                                                                    </span>
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="rounded-full border border-white/20 bg-white/15 px-3 py-0.5 text-[0.6rem] uppercase tracking-[0.3em] text-white"
                                                                    >
                                                                        {(tipMetadata.status ?? 'completed').toUpperCase()}
                                                                    </Badge>
                                                                </div>
                                                                <div className="mt-4 text-3xl font-semibold tracking-tight text-white">{amountLabel}</div>
                                                                <p className="mt-3 text-xs text-white/75">
                                                                    {isOwnMessage
                                                                        ? 'Thanks for taking care of your favorite creator.'
                                                                        : 'Show some appreciation and keep the energy going.'}
                                                                </p>
                                                                <p className="mt-4 text-[0.65rem] uppercase tracking-[0.25em] text-white/50">
                                                                    {createdAt}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                if (messageType === 'tip_request') {
                                                    const status = tipMetadata.status ?? 'pending';
                                                    const isPending = status === 'pending';
                                                    const canRespond = isPending && !isOwnMessage;
                                                    const statusBadgeClasses =
                                                        status === 'accepted'
                                                            ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/40'
                                                            : status === 'declined'
                                                                ? 'bg-rose-500/20 text-rose-100 border border-rose-400/40'
                                                                : 'bg-white/10 text-white/80 border border-white/15';

                                                    return (
                                                        <div
                                                            key={message.id}
                                                            className={cn('flex flex-col gap-2', isOwnMessage ? 'items-end' : 'items-start')}
                                                        >
                                                            {showAuthor ? (
                                                                <div className="text-[0.65rem] uppercase tracking-[0.3em] text-white/45">
                                                                    {message.author?.display_name ?? message.author?.username ?? 'Member'}
                                                                </div>
                                                            ) : null}
                                                            <div className="w-full max-w-sm rounded-xl border border-white/15 bg-white/5 px-5 py-5 text-sm text-white shadow-lg sm:max-w-md">
                                                                <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
                                                                    <span className="flex items-center gap-2 text-white">
                                                                        <Coins className="h-4 w-4" />
                                                                        {isOwnMessage ? 'Tip request sent' : 'Tip request'}
                                                                    </span>
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className={cn('rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.3em]', statusBadgeClasses)}
                                                                    >
                                                                        {status.toUpperCase()}
                                                                    </Badge>
                                                                </div>
                                                                <div className="mt-4 text-3xl font-semibold tracking-tight text-white">{amountLabel}</div>
                                                                <p className="mt-3 text-xs text-white/70">
                                                                    {isOwnMessage
                                                                        ? 'Awaiting their response.'
                                                                        : 'Send a tip to keep the good vibes going.'}
                                                                </p>
                                                                {canRespond ? (
                                                                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="rounded-full border border-transparent px-4 text-xs uppercase tracking-[0.3em] text-white/70 hover:border-white/15 hover:bg-white/5 disabled:opacity-50"
                                                                            onClick={() => handleTipRequestAction(message.id, 'decline')}
                                                                            disabled={tipRequestActionMessageId === message.id}
                                                                        >
                                                                            Decline
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-4 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_30px_-16px_rgba(249,115,22,0.65)] hover:from-amber-400/90 hover:via-rose-500/90 hover:to-violet-600/90 disabled:opacity-50"
                                                                            onClick={() => handleTipRequestAction(message.id, 'accept')}
                                                                            disabled={tipRequestActionMessageId === message.id}
                                                                        >
                                                                            Pay now · {amountLabel}
                                                                        </Button>
                                                                    </div>
                                                                ) : null}
                                                                {status === 'accepted' ? (
                                                                    <p className="mt-3 text-xs text-emerald-200">
                                                                        Tip sent {tipMetadata.responded_at ? formatRelativeTime(tipMetadata.responded_at) : ''}
                                                                    </p>
                                                                ) : null}
                                                                {status === 'declined' ? (
                                                                    <p className="mt-3 text-xs text-rose-200">Tip request declined</p>
                                                                ) : null}
                                                                <p className="mt-3 text-[0.65rem] uppercase tracking-[0.25em] text-white/35">
                                                                    {createdAt}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div
                                                        key={message.id}
                                                        className={cn('flex flex-col gap-2', isOwnMessage ? 'items-end' : 'items-start')}
                                                    >
                                                        {showAuthor ? (
                                                            <div className="text-[0.65rem] uppercase tracking-[0.3em] text-white/45">
                                                                {message.author?.display_name ?? message.author?.username ?? 'Member'}
                                                            </div>
                                                        ) : null}
                                                        <div
                                                            className={cn(
                                                                'max-w-full rounded-3xl border px-5 py-4 text-sm leading-relaxed shadow-lg lg:max-w-2xl',
                                                                isOwnMessage
                                                                    ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-50'
                                                                    : 'border-white/15 bg-black/55 text-white',
                                                            )}
                                                        >
                                                            {message.deleted_at ? (
                                                                <span className="text-xs uppercase tracking-[0.3em] text-white/50">Message removed</span>
                                                            ) : (
                                                                <>
                                                                    {referencedMessage ? (
                                                                        <div className="mb-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs text-white/75 backdrop-blur-sm">
                                                                            <p className="mb-1 font-semibold uppercase tracking-[0.3em] text-white/50">
                                                                                Replying to{' '}
                                                                                {referencedMessage.author?.display_name ??
                                                                                    referencedMessage.author?.username ??
                                                                                    'a message'}
                                                                            </p>
                                                                            <p className="text-sm text-white/80">
                                                                                {(referencedMessage.body ?? '').slice(0, 140)}
                                                                                {(referencedMessage.body ?? '').length > 140 ? '…' : ''}
                                                                            </p>
                                                                        </div>
                                                                    ) : null}

                                                                    {message.body && (
                                                                        <p className="whitespace-pre-wrap break-words text-white">{message.body}</p>
                                                                    )}

                                                                    {message.attachments && message.attachments.length > 0 ? (
                                                                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                                            {message.attachments.map((attachment) => (
                                                                                <figure
                                                                                    key={attachment.id}
                                                                                    className="max-h-56 overflow-hidden rounded-2xl border border-white/15 bg-black/40"
                                                                                >
                                                                                    {attachment.type === 'image' && attachment.url ? (
                                                                                        <img
                                                                                            src={attachment.url}
                                                                                            alt={attachment.filename}
                                                                                            className="h-full w-full object-cover"
                                                                                        />
                                                                                    ) : (
                                                                                        <div className="p-4 text-xs uppercase tracking-[0.3em] text-white/50">
                                                                                            {attachment.filename}
                                                                                        </div>
                                                                                    )}
                                                                                </figure>
                                                                            ))}
                                                                        </div>
                                                                    ) : null}
                                                                </>
                                                            )}
                                                        </div>

                                                        {!message.deleted_at && (
                                                            <>
                                                                <div
                                                                    className={cn(
                                                                        'flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.2em] text-white/45',
                                                                        isOwnMessage ? 'justify-end text-right' : 'justify-start',
                                                                    )}
                                                                >
                                                                    <span>{createdAt}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        {reactionCount > 0 ? (
                                                                            <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[0.6rem] text-white/70">
                                                                                {reactionCount}
                                                                            </span>
                                                                        ) : null}
                                                                        <button
                                                                            type="button"
                                                                            aria-label="React"
                                                                            onClick={() =>
                                                                                setExpandedReactionsMessageId((current) =>
                                                                                    current === message.id ? null : message.id,
                                                                                )
                                                                            }
                                                                            className={cn(
                                                                                'rounded-full border border-transparent p-2 text-white/70 transition hover:border-white/30 hover:bg-white/10 hover:text-white',
                                                                                expandedReactionsMessageId === message.id
                                                                                    ? 'border-amber-400/40 bg-white/10 text-white'
                                                                                    : null,
                                                                            )}
                                                                        >
                                                                            <SmilePlus className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            aria-label="Reply"
                                                                            onClick={() => setReplyTo(message)}
                                                                            className="rounded-full border border-transparent p-2 text-white/70 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                                                                        >
                                                                            <CornerUpRight className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {expandedReactionsMessageId === message.id ? (
                                                                    <MessageReactions
                                                                        messageId={message.id}
                                                                        reactions={message.reaction_summary ?? []}
                                                                        onChange={(summary) => handleReactionChange(message.id, summary)}
                                                                    />
                                                                ) : null}
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {typingUsers.length > 0 ? (
                                    <div className="px-6 pb-2 text-[0.65rem] uppercase tracking-[0.3em] text-amber-200">
                                        {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing…
                                    </div>
                                ) : null}

                                <div className="border-t border-white/10 px-6 py-4">
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
                </Card>
            </div>
        </div>
        </AppLayout>
    );
}
