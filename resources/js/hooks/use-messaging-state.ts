import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    normalizeMessage,
    normalizeNumeric,
} from '@/components/messaging/message-utils';
import type {
    ActiveConversation,
    Message,
    Thread,
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

export function useMessagingState(initialProps: PageProps, isMobile: boolean) {
    const {
        threads: threadsProp,
        activeConversation: activeProp,
        messages: messagesProp,
        messagesMeta,
    } = initialProps;

    // State
    const [threadsState, setThreadsState] = useState<Thread[]>(threadsProp);
    const [selectedConversationId, setSelectedConversationId] = useState<
        number | null
    >(activeProp?.id ?? null);
    const [showConversationView, setShowConversationView] = useState<boolean>(
        false, // Always start with list view on mobile
    );
    const [messages, setMessages] = useState<Message[]>(messagesProp ?? []);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [expandedReactionsMessageId, setExpandedReactionsMessageId] =
        useState<number | null>(null);
    const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(
        messagesMeta?.has_more ?? false,
    );
    const [oldestMessageId, setOldestMessageId] = useState<number | null>(
        messagesMeta?.oldest_id !== undefined &&
            messagesMeta?.oldest_id !== null
            ? normalizeNumeric(messagesMeta.oldest_id)
            : null,
    );
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [shouldStickToBottom, setShouldStickToBottom] = useState(true);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [tipRequestActionMessageId, setTipRequestActionMessageId] = useState<
        number | null
    >(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Refs
    const typingTimeoutsRef = useRef<Record<number, number>>({});
    const typingUsersRef = useRef<Map<number, string>>(new Map());

    const threads = threadsState;

    const updateUnreadBadge = useCallback((list: Thread[]) => {
        if (typeof window === 'undefined') {
            return;
        }

        const total = list.reduce(
            (sum, thread) => sum + (thread.unread_count ?? 0),
            0,
        );
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

                return next;
            });
        },
        [],
    );

    // Update unread badge when threads change
    useEffect(() => {
        updateUnreadBadge(threads);
    }, [threads, updateUnreadBadge]);

    const currentConversation = useMemo<ActiveConversation | null>(() => {
        if (activeProp) {
            return activeProp;
        }

        // If activeProp is not set yet but we have a selectedConversationId,
        // try to find it in the threads list
        if (selectedConversationId) {
            const thread = threads.find(
                (t) => Number(t.id) === Number(selectedConversationId),
            );
            if (thread) {
                return {
                    id: thread.id,
                    ulid: thread.ulid,
                    title: thread.title,
                    subject: thread.subject,
                    is_group: thread.is_group,
                    participants: thread.participants,
                } as ActiveConversation;
            }
        }

        return null;
    }, [activeProp, selectedConversationId, threads]);

    // Sync threads from props
    useEffect(() => {
        const initialThreads = threadsProp.map((thread) => ({
            ...thread,
            id: normalizeNumeric(thread.id),
            unread_count: thread.unread_count ?? 0,
            last_message: thread.last_message
                ? normalizeMessage(thread.last_message)
                : null,
        }));
        updateThreads(initialThreads as Thread[]);
    }, [threadsProp, updateThreads]);

    // Sync messages from props
    useEffect(() => {
        const initialMessages = (messagesProp ?? []).map((message) =>
            normalizeMessage(message),
        );
        setMessages(initialMessages);
        setHasMoreMessages(messagesMeta?.has_more ?? false);
        setOldestMessageId(
            (messagesMeta?.oldest_id !== undefined &&
            messagesMeta?.oldest_id !== null
                ? normalizeNumeric(messagesMeta.oldest_id)
                : null) as number | null,
        );
    }, [messagesMeta?.has_more, messagesMeta?.oldest_id, messagesProp]);

    // Reset conversation-specific state when conversation changes
    useEffect(() => {
        const typingStore = typingUsersRef.current;
        const timeoutStore = typingTimeoutsRef.current;

        setReplyTo(null);
        setExpandedReactionsMessageId(null);
        typingStore.clear();
        // Clear all typing timeouts when conversation changes
        Object.values(timeoutStore).forEach((timeout) => {
            if (timeout) {
                window.clearTimeout(timeout);
            }
        });
        Object.keys(timeoutStore).forEach((key) => {
            delete timeoutStore[Number(key)];
        });
        setTypingUsers([]);
        setShouldStickToBottom(true);
    }, [selectedConversationId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            const timeoutStore = typingTimeoutsRef.current;
            const typingStore = typingUsersRef.current;

            Object.values(timeoutStore).forEach((timeout) => {
                if (timeout) {
                    window.clearTimeout(timeout);
                }
            });
            typingStore.clear();
        };
    }, []);

    // Dispatch active conversation event
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const detail = { id: selectedConversationId ?? null };
        window.dispatchEvent(
            new CustomEvent('messaging:active-conversation', { detail }),
        );

        return () => {
            window.dispatchEvent(
                new CustomEvent('messaging:active-conversation', {
                    detail: { id: null },
                }),
            );
        };
    }, [selectedConversationId]);

    // Keyboard height tracking for mobile
    useEffect(() => {
        if (!isMobile || typeof window === 'undefined') {
            return;
        }

        const visualViewport = window.visualViewport;
        if (!visualViewport) {
            return;
        }

        const handleResize = () => {
            const height = window.innerHeight - visualViewport.height;
            setKeyboardHeight(Math.max(0, height));
        };

        visualViewport.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            visualViewport.removeEventListener('resize', handleResize);
        };
    }, [isMobile]);

    return {
        // State
        threads,
        selectedConversationId,
        showConversationView,
        messages,
        replyTo,
        expandedReactionsMessageId,
        hasMoreMessages,
        oldestMessageId,
        isLoadingOlder,
        shouldStickToBottom,
        typingUsers,
        tipRequestActionMessageId,
        keyboardHeight,
        currentConversation,

        // Setters
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

        // Refs
        typingTimeoutsRef,
        typingUsersRef,

        // Helpers
        updateThreads,
    };
}
