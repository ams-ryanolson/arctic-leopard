import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';

import type { FeedMedia, FeedPost } from '@/types/feed';

import LightboxViewer from './lightbox-viewer';

type LightboxOpenOptions = {
    startIndex?: number;
    post?: FeedPost | null;
    onCommentCountChange?: (total: number) => void;
};

type LightboxState = {
    open: boolean;
    media: FeedMedia[];
    startIndex: number;
    post: FeedPost | null;
    onCommentCountChange?: (total: number) => void;
};

type LightboxContextValue = {
    openLightbox: (media: FeedMedia[], options?: LightboxOpenOptions) => void;
    closeLightbox: () => void;
    isOpen: boolean;
};

const LightboxContext = createContext<LightboxContextValue | null>(null);

const initialState: LightboxState = {
    open: false,
    media: [],
    startIndex: 0,
    post: null,
};

export function LightboxProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<LightboxState>(initialState);

    const openLightbox = useCallback(
        (media: FeedMedia[], options?: LightboxOpenOptions) => {
            if (!media || media.length === 0) {
                return;
            }

            setState({
                open: true,
                media,
                startIndex:
                    options?.startIndex !== undefined &&
                    options.startIndex < media.length
                        ? options.startIndex
                        : 0,
                post: options?.post ?? null,
                onCommentCountChange: options?.onCommentCountChange,
            });
        },
        [],
    );

    const closeLightbox = useCallback(() => {
        setState((previous) => ({
            ...previous,
            open: false,
        }));
    }, []);

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen) {
                closeLightbox();
            } else {
                setState((previous) => ({
                    ...previous,
                    open: true,
                }));
            }
        },
        [closeLightbox],
    );

    const handleCommentCountChange = useCallback(
        (postId: number, total: number) => {
            setState((previous) => {
                if (previous.post && previous.post.id === postId) {
                    const nextPost: FeedPost = {
                        ...previous.post,
                        comments_count: total,
                    };

                    previous.onCommentCountChange?.(total);

                    return {
                        ...previous,
                        post: nextPost,
                    };
                }

                previous.onCommentCountChange?.(total);

                return previous;
            });
        },
        [],
    );

    const contextValue = useMemo<LightboxContextValue>(
        () => ({
            openLightbox,
            closeLightbox,
            isOpen: state.open,
        }),
        [closeLightbox, openLightbox, state.open],
    );

    return (
        <LightboxContext.Provider value={contextValue}>
            {children}
            <LightboxViewer
                media={state.media}
                open={state.open}
                onOpenChange={handleOpenChange}
                startIndex={state.startIndex}
                post={state.post}
                onCommentCountChange={handleCommentCountChange}
            />
        </LightboxContext.Provider>
    );
}

export function useLightbox(): LightboxContextValue {
    const context = useContext(LightboxContext);

    if (!context) {
        if (import.meta.env?.DEV) {
            console.warn(
                'useLightbox called outside LightboxProvider. Returning no-op handlers.',
            );
        }

        return {
            openLightbox: () => {},
            closeLightbox: () => {},
            isOpen: false,
        };
    }

    return context;
}
