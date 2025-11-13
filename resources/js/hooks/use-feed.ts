import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    FeedRequestError,
    bookmarkPost,
    likePost,
    purchasePost,
    unbookmarkPost,
    unlikePost,
} from '@/lib/feed-client';
import type {
    FeedPost,
    PaginationMeta,
    PostCollectionPayload,
    TimelineEntry,
    TimelinePayload,
} from '@/types/feed';

type NormalizePayload = TimelinePayload;

type FeedPayload = TimelinePayload | PostCollectionPayload;

type TransformPayload = (payload: FeedPayload) => NormalizePayload;

type UseFeedOptions = {
    initialPayload: FeedPayload;
    fetchPage: (page: number) => Promise<FeedPayload>;
    transformPayload: TransformPayload;
    errorMessage?: string;
    autoLoadMore?: boolean;
    sentinelRootMargin?: string;
};

type UseFeedResult = {
    entries: TimelineEntry[];
    meta: PaginationMeta;
    hasMore: boolean;
    isLoadingMore: boolean;
    isRefreshing: boolean;
    error: string | null;
    pendingLikes: number[];
    pendingBookmarks: number[];
    pendingPurchases: number[];
    activeCommentPost: FeedPost | null;
    isCommentSheetOpen: boolean;
    sentinelRef: React.MutableRefObject<HTMLDivElement | null>;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
    toggleLike: (postId: number) => Promise<void>;
    toggleBookmark: (postId: number) => Promise<void>;
    togglePurchase: (postId: number) => Promise<void>;
    openComments: (postId: number) => void;
    closeComments: () => void;
    handleCommentAdded: (postId: number, total: number) => void;
    handleCommentsOpenChange: (openState: boolean) => void;
};

const DEFAULT_ERROR_MESSAGE = 'We could not load the feed. Please try again.';

const sanitizeTimelinePayload = (payload: NormalizePayload): NormalizePayload => {
    // Ensure data is an array
    const data = Array.isArray(payload.data) ? payload.data : [];
    
    // Filter out entries that are neither posts nor ads
    const filtered = data.filter((entry) => {
        // Ad entries have type === 'ad'
        if (entry.type === 'ad') {
            return true;
        }
        // Regular timeline entries have a post
        return entry.post !== null;
    });

    if (filtered.length === data.length) {
        return payload;
    }

    const removed = data.length - filtered.length;
    const total = typeof payload.meta.total === 'number'
        ? Math.max(0, payload.meta.total - removed)
        : payload.meta.total;

    return {
        ...payload,
        data: filtered,
        meta: {
            ...(payload.meta || {}),
            total,
        },
    };
};

const hasMoreFromMeta = (meta: PaginationMeta): boolean => {
    if (typeof meta.current_page !== 'number' || typeof meta.last_page !== 'number') {
        return false;
    }

    return meta.current_page < meta.last_page;
};

export function useFeed(options: UseFeedOptions): UseFeedResult {
    const {
        initialPayload,
        fetchPage,
        transformPayload,
        errorMessage = DEFAULT_ERROR_MESSAGE,
        autoLoadMore = true,
        sentinelRootMargin = '240px',
    } = options;

    const normalize = useCallback(
        (payload: FeedPayload): NormalizePayload => {
            const normalized = sanitizeTimelinePayload(transformPayload(payload));
            
            // Normalize post structure - handle cases where post is wrapped in 'data'
            normalized.data = normalized.data.map((entry) => {
                if (entry.post && typeof entry.post === 'object' && 'data' in entry.post) {
                    const post = entry.post.data;
                    // Ensure media is always an array
                    if (post && typeof post === 'object') {
                        return {
                            ...entry,
                            post: {
                                ...post,
                                media: Array.isArray(post.media) ? post.media : [],
                            },
                        };
                    }
                    return {
                        ...entry,
                        post,
                    };
                }
                // Ensure media is always an array for non-wrapped posts
                if (entry.post && typeof entry.post === 'object') {
                    return {
                        ...entry,
                        post: {
                            ...entry.post,
                            media: Array.isArray(entry.post.media) ? entry.post.media : [],
                        },
                    };
                }
                return entry;
            });
            
            return normalized;
        },
        [transformPayload],
    );

    const [pages, setPages] = useState<NormalizePayload[]>(() => [normalize(initialPayload)]);
    const [hasMore, setHasMore] = useState<boolean>(() => hasMoreFromMeta(normalize(initialPayload).meta));
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingLikes, setPendingLikes] = useState<number[]>([]);
    const [pendingBookmarks, setPendingBookmarks] = useState<number[]>([]);
    const [pendingPurchases, setPendingPurchases] = useState<number[]>([]);
    const [activeCommentPost, setActiveCommentPost] = useState<FeedPost | null>(null);
    const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const normalized = normalize(initialPayload);
        setPages([normalized]);
        setHasMore(hasMoreFromMeta(normalized.meta));
        setError(null);
        setPendingLikes([]);
        setPendingBookmarks([]);
        setPendingPurchases([]);
    }, [initialPayload, normalize]);

    const entries = useMemo(
        () =>
            pages.flatMap((page) =>
                page.data.filter((entry) => {
                    // Include ad entries
                    if (entry.type === 'ad') {
                        return true;
                    }
                    // Include regular timeline entries with posts
                    return entry.post !== null;
                }),
            ),
        [pages],
    );

    const meta = useMemo<PaginationMeta>(() => pages[pages.length - 1]?.meta ?? normalize(initialPayload).meta, [
        pages,
        initialPayload,
        normalize,
    ]);

    const handleFeedError = useCallback(
        (problem: unknown) => {
            if (problem instanceof DOMException && problem.name === 'AbortError') {
                return;
            }

            console.error(problem);

            const message =
                problem instanceof FeedRequestError
                    ? problem.message
                    : errorMessage;

            setError(message);
        },
        [errorMessage],
    );

    const updatePostInPages = useCallback((nextPost: FeedPost) => {
        setPages((previous) =>
            previous.map((page) => ({
                ...page,
                data: page.data.map((entry) =>
                    entry.post && entry.post.id === nextPost.id
                        ? {
                              ...entry,
                              post: {
                                  ...entry.post,
                                  ...nextPost,
                                  media: Array.isArray(nextPost.media) ? nextPost.media : (Array.isArray(entry.post.media) ? entry.post.media : []),
                              },
                          }
                        : entry,
                ),
            })),
        );
    }, []);

    const markPending = useCallback((setState: React.Dispatch<React.SetStateAction<number[]>>) => {
        return (postId: number, pending: boolean) => {
            setState((previous) => {
                if (pending) {
                    return previous.includes(postId) ? previous : [...previous, postId];
                }

                return previous.filter((id) => id !== postId);
            });
        };
    }, []);

    const markLikePending = useMemo(() => markPending(setPendingLikes), [markPending]);
    const markBookmarkPending = useMemo(() => markPending(setPendingBookmarks), [markPending]);
    const markPurchasePending = useMemo(() => markPending(setPendingPurchases), [markPending]);

    const findPostById = useCallback(
        (postId: number): FeedPost | null =>
            entries.find((entry) => entry.post?.id === postId)?.post ?? null,
        [entries],
    );

    const toggleLike = useCallback(
        async (postId: number) => {
            const targetPost = findPostById(postId);

            if (!targetPost) {
                return;
            }

            markLikePending(postId, true);

            const currentlyLiked = targetPost.has_liked;
            const optimisticPost: FeedPost = {
                ...targetPost,
                has_liked: !currentlyLiked,
                likes_count: Math.max(0, targetPost.likes_count + (currentlyLiked ? -1 : 1)),
            };

            updatePostInPages(optimisticPost);

            try {
                const updatedPost = currentlyLiked ? await unlikePost(postId) : await likePost(postId);
                updatePostInPages({ ...targetPost, ...updatedPost });
                setError(null);
            } catch (problem) {
                handleFeedError(problem);
                updatePostInPages(targetPost);
            } finally {
                markLikePending(postId, false);
            }
        },
        [findPostById, handleFeedError, markLikePending, updatePostInPages],
    );

    const toggleBookmark = useCallback(
        async (postId: number) => {
            const targetPost = findPostById(postId);

            if (!targetPost || !targetPost.can?.bookmark) {
                return;
            }

            markBookmarkPending(postId, true);

            const currentlyBookmarked = Boolean(targetPost.is_bookmarked);
            const optimisticPost: FeedPost = {
                ...targetPost,
                is_bookmarked: !currentlyBookmarked,
                bookmark_count: Math.max(
                    0,
                    targetPost.bookmark_count + (currentlyBookmarked ? -1 : 1),
                ),
                bookmark_id: currentlyBookmarked ? null : targetPost.bookmark_id,
            };

            updatePostInPages(optimisticPost);

            try {
                const updatedPost = currentlyBookmarked
                    ? await unbookmarkPost(postId)
                    : await bookmarkPost(postId);

                updatePostInPages({ ...targetPost, ...updatedPost });
                setError(null);
            } catch (problem) {
                handleFeedError(problem);
                updatePostInPages(targetPost);
            } finally {
                markBookmarkPending(postId, false);
            }
        },
        [findPostById, handleFeedError, markBookmarkPending, updatePostInPages],
    );

    const togglePurchase = useCallback(
        async (postId: number) => {
            const targetPost = findPostById(postId);

            if (!targetPost || !targetPost.locked) {
                return;
            }

            if (targetPost.paywall_price === null || !targetPost.paywall_currency) {
                handleFeedError(
                    new FeedRequestError(
                        'This post is not available for purchase right now.',
                        422,
                        null,
                    ),
                );

                return;
            }

            markPurchasePending(postId, true);

            const optimisticPost: FeedPost = {
                ...targetPost,
                locked: false,
            };

            updatePostInPages(optimisticPost);

            try {
                const purchasedPost = await purchasePost(postId, {
                    amount: targetPost.paywall_price,
                    currency: targetPost.paywall_currency,
                    provider: 'instant-unlock',
                });

                updatePostInPages({
                    ...targetPost,
                    ...purchasedPost,
                    locked: false,
                });
                setError(null);
            } catch (problem) {
                handleFeedError(problem);
                updatePostInPages(targetPost);
            } finally {
                markPurchasePending(postId, false);
            }
        },
        [findPostById, handleFeedError, markPurchasePending, updatePostInPages],
    );

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) {
            return;
        }

        setIsLoadingMore(true);

        try {
            const currentPage = pages[pages.length - 1]?.meta.current_page ?? 1;
            const nextPage = currentPage + 1;

            const payload = await fetchPage(nextPage);
            const normalized = normalize(payload);

            setPages((previous) => [...previous, normalized]);
            setHasMore(hasMoreFromMeta(normalized.meta));
            setError(null);
        } catch (problem) {
            handleFeedError(problem);
            setHasMore(false);
        } finally {
            setIsLoadingMore(false);
        }
    }, [fetchPage, handleFeedError, hasMore, isLoadingMore, normalize, pages]);

    const refresh = useCallback(async () => {
        if (isRefreshing) {
            return;
        }

        setIsRefreshing(true);
        try {
            const payload = await fetchPage(1);
            const normalized = normalize(payload);
            setPages([normalized]);
            setHasMore(hasMoreFromMeta(normalized.meta));
            setError(null);
        } catch (problem) {
            handleFeedError(problem);
        } finally {
            setIsRefreshing(false);
        }
    }, [fetchPage, handleFeedError, isRefreshing, normalize]);

    useEffect(() => {
        if (!autoLoadMore || !hasMore || !sentinelRef.current) {
            return;
        }

        const observer = new IntersectionObserver(
            (entriesList) => {
                if (entriesList[0]?.isIntersecting) {
                    void loadMore();
                }
            },
            { rootMargin: sentinelRootMargin },
        );

        const element = sentinelRef.current;
        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [autoLoadMore, hasMore, loadMore, sentinelRootMargin]);

    useEffect(() => {
        if (!activeCommentPost) {
            return;
        }

        const latestPost = findPostById(activeCommentPost.id);

        if (latestPost && latestPost !== activeCommentPost) {
            setActiveCommentPost(latestPost);
        }
    }, [activeCommentPost, entries, findPostById]);

    const openComments = useCallback(
        (postId: number) => {
            const post = findPostById(postId);

            if (!post) {
                return;
            }

            setActiveCommentPost(post);
            setIsCommentSheetOpen(true);
        },
        [findPostById],
    );

    const closeComments = useCallback(() => {
        setIsCommentSheetOpen(false);
        setActiveCommentPost(null);
    }, []);

    const handleCommentAdded = useCallback(
        (postId: number, totalComments: number) => {
            const post = findPostById(postId);

            if (!post) {
                return;
            }

            const nextPost: FeedPost = {
                ...post,
                comments_count: totalComments,
            };

            updatePostInPages(nextPost);
            setActiveCommentPost(nextPost);
        },
        [findPostById, updatePostInPages],
    );

    const handleCommentsOpenChange = useCallback(
        (openState: boolean) => {
            setIsCommentSheetOpen(openState);

            if (!openState) {
                setActiveCommentPost(null);
            }
        },
        [],
    );

    return {
        entries,
        meta,
        hasMore,
        isLoadingMore,
        isRefreshing,
        error,
        pendingLikes,
        pendingBookmarks,
        pendingPurchases,
        activeCommentPost,
        isCommentSheetOpen,
        sentinelRef,
        loadMore,
        refresh,
        toggleLike,
        toggleBookmark,
        togglePurchase,
        openComments,
        closeComments,
        handleCommentAdded,
        handleCommentsOpenChange,
    };
}

