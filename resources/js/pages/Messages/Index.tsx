import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo } from 'react';

import DesktopMessagingView from '@/components/messaging/desktop-messaging-view';
import MobileMessagingView from '@/components/messaging/mobile-messaging-view';
import {
    normalizeMessage,
    normalizeNumeric,
} from '@/components/messaging/message-utils';
import type {
    ActiveConversation,
    Message,
    ReactionSummary,
    Thread,
} from '@/components/messaging/types';
import { useConversationChannel } from '@/hooks/use-conversation-channel';
import { useHistoryNavigation } from '@/hooks/use-history-navigation';
import { useMessagingState } from '@/hooks/use-messaging-state';
import { useScrollManagement } from '@/hooks/use-scroll-management';
import { useIsMobile } from '@/hooks/use-mobile';
import AppLayout from '@/layouts/app-layout';
import http from '@/lib/http';
import messagesRoutes from '@/routes/messages';

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

export default function MessagesIndex() {
    const {
        threads: threadsProp,
        activeConversation: activeProp,
        messages: messagesProp,
        messagesMeta,
        viewer,
    } = usePage<PageProps>().props;

    const isMobile = useIsMobile();

    // Use messaging state hook
    const messagingState = useMessagingState(
        {
            threads: threadsProp,
            activeConversation: activeProp,
            messages: messagesProp,
            messagesMeta,
            viewer,
        },
        isMobile,
    );

    const {
        threads,
        selectedConversationId,
        showConversationView,
        messages,
        replyTo,
        expandedReactionsMessageId,
        hasMoreMessages,
        oldestMessageId,
        isLoadingOlder,
        typingUsers,
        tipRequestActionMessageId,
        keyboardHeight,
        currentConversation,
        setSelectedConversationId,
        setShowConversationView,
        setMessages,
        setReplyTo,
        setExpandedReactionsMessageId,
        setHasMoreMessages,
        setOldestMessageId,
        setIsLoadingOlder,
        setShouldStickToBottom,
        setTypingUsers,
        setTipRequestActionMessageId,
        typingTimeoutsRef,
        typingUsersRef,
        updateThreads,
    } = messagingState;

    // Use scroll management hook
    const {
        scrollContainerRef,
        handleScroll,
        preserveScrollPosition,
        restoreScrollPosition,
    } = useScrollManagement(selectedConversationId, messages.length);

    // Sync selectedConversationId from props
    useEffect(() => {
        const newId = activeProp?.id ?? null;
        if (newId !== selectedConversationId) {
            setSelectedConversationId(newId);
            // On mobile, NEVER auto-show conversation view - user must click to open
            // On desktop, it doesn't matter since both views are shown side-by-side
        }
    }, [
        activeProp?.id,
        selectedConversationId,
        setSelectedConversationId,
    ]);

    const markConversationRead = useCallback(
        async (messageId?: number) => {
            if (!selectedConversationId) {
                return;
            }

            try {
                await http.post(
                    `/api/conversations/${selectedConversationId}/read`,
                    {
                        message_id: messageId ?? null,
                    },
                );

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

    // Mark conversation as read when messages change
    useEffect(() => {
        if (!selectedConversationId || messages.length === 0) {
            return;
        }

        const lastMessage = messages[messages.length - 1];
        const lastMessageId = Number(lastMessage.id);
        void markConversationRead(
            Number.isFinite(lastMessageId) ? lastMessageId : undefined,
        );
    }, [markConversationRead, messages, selectedConversationId]);

    // Use conversation channel hook
    const { presenceMembers, sendTypingSignal } = useConversationChannel({
        selectedConversationId,
        viewerId: viewer.id,
        viewerName: viewer.display_name ?? viewer.username ?? 'You',
        onMessageReceived: useCallback(
            (normalisedMessage: Message) => {
                setMessages((previous) => {
                    const exists = previous.some(
                        (item) => Number(item.id) === Number(normalisedMessage.id),
                    );

                    if (exists) {
                        return previous;
                    }

                    return [...previous, normalisedMessage].sort(
                        (a, b) => Number(a.sequence) - Number(b.sequence),
                    );
                });
            },
            [setMessages],
        ),
        onMessageDeleted: useCallback(
            (messageId: number, deletedAt: string | null) => {
                setMessages((previous) =>
                    previous.map((message) =>
                        Number(message.id) === messageId
                            ? {
                                  ...message,
                                  deleted_at: deletedAt,
                              }
                            : message,
                    ),
                );
            },
            [setMessages],
        ),
        onThreadUpdate: updateThreads,
        onMarkRead: markConversationRead,
        setTypingUsers,
        typingTimeoutsRef,
        typingUsersRef,
    });

    // Use history navigation hook
    const { openConversation, backToList } = useHistoryNavigation({
        selectedConversationId,
        onConversationChange: useCallback(
            (id: number | null) => {
                setSelectedConversationId(id);
                setReplyTo(null);
                setExpandedReactionsMessageId(null);
            },
            [setSelectedConversationId, setReplyTo, setExpandedReactionsMessageId],
        ),
        onViewChange: setShowConversationView,
        onMessagesLoaded: useCallback(
            (messages: Message[], meta: { has_more: boolean; oldest_id?: number | null }) => {
                setMessages(messages);
                setHasMoreMessages(meta.has_more);
                setOldestMessageId(
                    meta.oldest_id !== undefined && meta.oldest_id !== null
                        ? normalizeNumeric(meta.oldest_id)
                        : null,
                );
            },
            [setMessages, setHasMoreMessages, setOldestMessageId],
        ),
    });

    const handleOpenConversation = useCallback(
        (threadId: number) => {
            if (threadId === selectedConversationId) {
                return;
            }

            setReplyTo(null);
            setExpandedReactionsMessageId(null);

            // Set selected conversation ID immediately for mobile view switching
            setSelectedConversationId(threadId);

            // On mobile, switch to conversation view IMMEDIATELY when user clicks
            if (isMobile) {
                // Set view state FIRST, before any async operations
                setShowConversationView(true);
            }

            // Then trigger the navigation/reload
            openConversation(threadId);
        },
        [
            selectedConversationId,
            isMobile,
            setSelectedConversationId,
            setShowConversationView,
            setReplyTo,
            setExpandedReactionsMessageId,
            openConversation,
        ],
    );

    const handleBackToList = useCallback(() => {
        if (!isMobile) {
            return;
        }
        setSelectedConversationId(null);
        setShowConversationView(false);
        backToList();
    }, [isMobile, setSelectedConversationId, setShowConversationView, backToList]);

    const handleRefreshConversations = useCallback(() => {
        router.reload({
            only: ['threads'],
            preserveUrl: true,
        });
    }, []);

    const handleMessageSent = useCallback(
        (message: Record<string, unknown>) => {
            const normalisedMessage = normalizeMessage(message as Message);
            const conversationId = normalisedMessage.conversation_id;
            const messageId = normalisedMessage.id;

            if (
                !Number.isFinite(conversationId) ||
                !Number.isFinite(messageId)
            ) {
                return;
            }

            setMessages((previous) => {
                const exists = previous.some(
                    (item) => Number(item.id) === messageId,
                );

                if (exists) {
                    return previous;
                }

                return [...previous, normalisedMessage].sort(
                    (a, b) => Number(a.sequence) - Number(b.sequence),
                );
            });

            updateThreads((previous) => {
                const filtered = previous.filter(
                    (thread) => Number(thread.id) !== conversationId,
                );
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
        [
            setMessages,
            updateThreads,
            setReplyTo,
            setExpandedReactionsMessageId,
            setShouldStickToBottom,
            markConversationRead,
        ],
    );

    const handleReactionChange = useCallback(
        (messageId: number, summary: ReactionSummary[]) => {
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
        },
        [setMessages],
    );

    const handleLoadOlder = useCallback(async () => {
        if (
            !selectedConversationId ||
            !hasMoreMessages ||
            isLoadingOlder ||
            !oldestMessageId
        ) {
            return;
        }

        setIsLoadingOlder(true);
        const previousOffsetFromBottom = preserveScrollPosition();

        try {
            const response = await http.get(
                `/api/conversations/${selectedConversationId}/messages`,
                {
                    params: {
                        before: oldestMessageId,
                    },
                },
            );

            const payload = response.data;
            const data = (payload?.data as Message[]) ?? [];

            setMessages((previous) => {
                const existingIds = new Set(
                    previous.map((message) => String(message.id)),
                );
                const incoming = data
                    .map((message) => normalizeMessage(message))
                    .filter((message) => !existingIds.has(String(message.id)));
                const merged = [...incoming, ...previous];

                return merged.sort(
                    (a, b) => Number(a.sequence) - Number(b.sequence),
                );
            });

            setHasMoreMessages(Boolean(payload?.meta?.has_more));
            setOldestMessageId(
                payload?.meta?.oldest_id !== undefined &&
                    payload?.meta?.oldest_id !== null
                    ? normalizeNumeric(payload.meta.oldest_id)
                    : null,
            );

            restoreScrollPosition(previousOffsetFromBottom);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingOlder(false);
        }
    }, [
        selectedConversationId,
        hasMoreMessages,
        isLoadingOlder,
        oldestMessageId,
        preserveScrollPosition,
        restoreScrollPosition,
        setMessages,
        setHasMoreMessages,
        setOldestMessageId,
        setIsLoadingOlder,
    ]);

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
                                          thread.last_message &&
                                          Number(thread.last_message.id) ===
                                              Number(updated.id)
                                              ? {
                                                    ...thread.last_message,
                                                    ...updated,
                                                }
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
        [handleMessageSent, updateThreads, viewer?.id, setMessages, setTipRequestActionMessageId],
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
                    {isMobile ? (
                        <MobileMessagingView
                            threads={filteredThreads}
                            selectedConversationId={selectedConversationId}
                            showConversationView={showConversationView}
                            currentConversation={currentConversation}
                            messages={messages}
                            presenceMembers={presenceMembers}
                            typingUsers={typingUsers}
                            replyTo={replyTo}
                            expandedReactionsMessageId={expandedReactionsMessageId}
                            tipRequestActionMessageId={tipRequestActionMessageId}
                            hasMoreMessages={hasMoreMessages}
                            isLoadingOlder={isLoadingOlder}
                            keyboardHeight={keyboardHeight}
                            scrollContainerRef={scrollContainerRef as React.RefObject<HTMLDivElement | null>}
                            viewer={viewer}
                            onSelectConversation={handleOpenConversation}
                            onRefresh={handleRefreshConversations}
                            onBack={handleBackToList}
                            onLoadOlder={handleLoadOlder}
                            onToggleReactions={(messageId) =>
                                setExpandedReactionsMessageId(
                                    (current) =>
                                        current === messageId ? null : messageId,
                                )
                            }
                            onReply={setReplyTo}
                            onCancelReply={() => setReplyTo(null)}
                            onReactionChange={handleReactionChange}
                            onTipRequestAccept={handleTipRequestAccept}
                            onTipRequestDecline={handleTipRequestDecline}
                            onMessageSent={handleMessageSent}
                            onTyping={sendTypingSignal}
                            onScroll={handleScroll}
                        />
                    ) : (
                        <DesktopMessagingView
                            threads={filteredThreads}
                            selectedConversationId={selectedConversationId}
                            currentConversation={currentConversation}
                            messages={messages}
                            presenceMembers={presenceMembers}
                            typingUsers={typingUsers}
                            replyTo={replyTo}
                            expandedReactionsMessageId={expandedReactionsMessageId}
                            tipRequestActionMessageId={tipRequestActionMessageId}
                            hasMoreMessages={hasMoreMessages}
                            isLoadingOlder={isLoadingOlder}
                            keyboardHeight={keyboardHeight}
                            scrollContainerRef={scrollContainerRef as React.RefObject<HTMLDivElement | null>}
                            viewer={viewer}
                            onSelectConversation={handleOpenConversation}
                            onRefresh={handleRefreshConversations}
                            onLoadOlder={handleLoadOlder}
                            onToggleReactions={(messageId) =>
                                setExpandedReactionsMessageId(
                                    (current) =>
                                        current === messageId ? null : messageId,
                                )
                            }
                            onReply={setReplyTo}
                            onCancelReply={() => setReplyTo(null)}
                            onReactionChange={handleReactionChange}
                            onTipRequestAccept={handleTipRequestAccept}
                            onTipRequestDecline={handleTipRequestDecline}
                            onMessageSent={handleMessageSent}
                            onTyping={sendTypingSignal}
                            onScroll={handleScroll}
                            setReplyTo={setReplyTo}
                            setExpandedReactionsMessageId={
                                setExpandedReactionsMessageId
                            }
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
