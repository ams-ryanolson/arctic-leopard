import { useCallback, useEffect, useRef, useState } from 'react';

export function useScrollManagement(
    selectedConversationId: number | null,
    messagesLength: number,
) {
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const [shouldStickToBottom, setShouldStickToBottom] = useState(true);

    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current;

        if (!container) {
            return;
        }

        const remaining =
            container.scrollHeight -
            container.scrollTop -
            container.clientHeight;
        setShouldStickToBottom(remaining < 48);
    }, []);

    // Auto-scroll to bottom when needed
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
    }, [selectedConversationId, messagesLength, shouldStickToBottom]);

    const scrollToBottom = useCallback(() => {
        const container = scrollContainerRef.current;
        if (container) {
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }
    }, []);

    const preserveScrollPosition = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) {
            return 0;
        }
        return container.scrollHeight - container.scrollTop;
    }, []);

    const restoreScrollPosition = useCallback((previousOffsetFromBottom: number) => {
        requestAnimationFrame(() => {
            const target = scrollContainerRef.current;

            if (!target) {
                return;
            }

            target.scrollTop = target.scrollHeight - previousOffsetFromBottom;
        });
    }, []);

    return {
        scrollContainerRef,
        shouldStickToBottom,
        setShouldStickToBottom,
        handleScroll,
        scrollToBottom,
        preserveScrollPosition,
        restoreScrollPosition,
    };
}



