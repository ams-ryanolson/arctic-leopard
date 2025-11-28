import { useCallback, useEffect } from 'react';
import { router } from '@inertiajs/react';

import { useIsMobile } from '@/hooks/use-mobile';
import http from '@/lib/http';
import messagesRoutes from '@/routes/messages';
import { normalizeMessage } from '@/components/messaging/message-utils';
import type { Message } from '@/components/messaging/types';

type UseHistoryNavigationOptions = {
    selectedConversationId: number | null;
    onConversationChange: (id: number | null) => void;
    onViewChange?: (showConversation: boolean) => void;
    onMessagesLoaded?: (messages: Message[], meta: { has_more: boolean; oldest_id?: number | null }) => void;
};

export function useHistoryNavigation({
    selectedConversationId,
    onConversationChange,
    onViewChange,
    onMessagesLoaded,
}: UseHistoryNavigationOptions) {
    const isMobile = useIsMobile();

    const openConversation = useCallback(
        async (threadId: number) => {
            if (threadId === selectedConversationId) {
                return;
            }

            if (isMobile) {
                // On mobile, update browser history without changing URL
                if (typeof window !== 'undefined') {
                    window.history.pushState({ conversationId: threadId }, '', '/messages');
                }
                
                // Fetch messages via API instead of router reload
                try {
                    const response = await http.get(`/api/conversations/${threadId}/messages`);
                    const payload = response.data;
                    const data = (payload?.data as Message[]) ?? [];
                    const normalizedMessages = data.map((msg) => normalizeMessage(msg));
                    
                    onMessagesLoaded?.(normalizedMessages, {
                        has_more: Boolean(payload?.meta?.has_more),
                        oldest_id: payload?.meta?.oldest_id ?? null,
                    });
                } catch (error) {
                    console.error('Failed to load messages', error);
                    // Fallback to router.visit if API fails
                    router.visit(
                        messagesRoutes.index.url({
                            query: { conversation: threadId },
                        }),
                        {
                            preserveScroll: true,
                            preserveState: true,
                            only: ['threads', 'activeConversation', 'messages', 'messagesMeta'],
                        },
                    );
                }
            } else {
                // Desktop: use router.visit with query string
                router.visit(
                    messagesRoutes.index.url({
                        query: { conversation: threadId },
                    }),
                    {
                        preserveScroll: true,
                        preserveState: true,
                        only: ['threads', 'activeConversation', 'messages', 'messagesMeta'],
                    },
                );
            }
        },
        [selectedConversationId, isMobile, onMessagesLoaded],
    );

    const backToList = useCallback(() => {
        if (!isMobile) {
            return;
        }

        // On mobile, go back in history or explicitly visit list
        if (typeof window !== 'undefined' && window.history.state?.conversationId) {
            // We have history state, use browser back
            window.history.back();
        } else {
            // No history state, explicitly visit list
            router.visit(messagesRoutes.index.url(), {
                preserveScroll: true,
                preserveState: false,
                only: ['threads'],
            });
            onConversationChange(null);
            onViewChange?.(false);
        }
    }, [isMobile, onConversationChange, onViewChange]);

    // Handle browser back button
    useEffect(() => {
        if (!isMobile) {
            return;
        }

        const handlePopState = (event: PopStateEvent) => {
            const conversationId = event.state?.conversationId ?? null;

            if (conversationId === null) {
                // Going back to list
                router.visit(messagesRoutes.index.url(), {
                    preserveScroll: true,
                    preserveState: false,
                    only: ['threads'],
                });
                onConversationChange(null);
                onViewChange?.(false);
            } else {
                // Going forward to a conversation - fetch via API
                onConversationChange(conversationId);
                onViewChange?.(true);
                
                // Fetch messages via API
                http.get(`/api/conversations/${conversationId}/messages`)
                    .then((response) => {
                        const payload = response.data;
                        const data = (payload?.data as Message[]) ?? [];
                        const normalizedMessages = data.map((msg) => normalizeMessage(msg));
                        
                        onMessagesLoaded?.(normalizedMessages, {
                            has_more: Boolean(payload?.meta?.has_more),
                            oldest_id: payload?.meta?.oldest_id ?? null,
                        });
                    })
                    .catch((error) => {
                        console.error('Failed to load messages', error);
                        // Fallback to router.visit if API fails
                        router.visit(
                            messagesRoutes.index.url({
                                query: { conversation: conversationId },
                            }),
                            {
                                preserveScroll: true,
                                preserveState: true,
                                only: ['threads', 'activeConversation', 'messages', 'messagesMeta'],
                            },
                        );
                    });
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isMobile, onConversationChange, onViewChange]);

    return {
        openConversation,
        backToList,
    };
}

