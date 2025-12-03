import { useCallback } from 'react';
import { router } from '@inertiajs/react';

import messagesRoutes from '@/routes/messages';

export function useHistoryNavigation() {
    const openConversation = useCallback(
        (ulid: string) => {
            // Navigate to conversation using ULID path parameter
            router.visit(
                messagesRoutes.show({ conversation: ulid }),
                {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['threads', 'activeConversation', 'messages', 'messagesMeta'],
                },
            );
        },
        [],
    );

    const backToList = useCallback(() => {
        // Use browser's native back navigation for instant, smooth transition
        // This avoids the flash/reload caused by router.visit
        // Inertia will handle the popstate event automatically
        if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back();
        } else {
            // Fallback: if no history, navigate to list
            router.visit(
                messagesRoutes.index.url(),
                {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['threads'],
                },
            );
        }
    }, []);

    return {
        openConversation,
        backToList,
    };
}
