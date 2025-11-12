import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import TimelineEntryCard from '@/components/feed/timeline-entry-card';
import CommentThreadSheet from '@/components/feed/comment-thread-sheet';
import FeedLoadingPlaceholder from '@/components/feed/feed-loading-placeholder';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    FeedRequestError,
    fetchBookmarksPage,
    likePost,
    unlikePost,
    bookmarkPost,
    unbookmarkPost,
    purchasePost,
} from '@/lib/feed-client';
import type { SharedData } from '@/types';
import type { FeedPost, TimelineEntry, TimelinePayload } from '@/types/feed';
import { Head, usePage } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';
import { index as bookmarksIndex } from '@/routes/bookmarks';

type BookmarksPageProps = SharedData & {
    bookmarks: TimelinePayload;
    bookmarksPageName: string;
    bookmarksPerPage: number;
};

export default function BookmarksIndex() {
    const {
        bookmarks,
        bookmarksPageName,
    } = usePage<BookmarksPageProps>().props;

    const [pages, setPages] = useState<TimelinePayload[]>([bookmarks]);
    const [hasMore, setHasMore] = useState(
        bookmarks.meta.current_page < bookmarks.meta.last_page,
    );
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [pendingLikes, setPendingLikes] = useState<number[]>([]);
    const [pendingPurchases, setPendingPurchases] = useState<number[]>([]);
    const [pendingBookmarks, setPendingBookmarks] = useState<number[]>([]);
    const [activeCommentPost, setActiveCommentPost] = useState<FeedPost | null>(null);
    const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const entries = useMemo(
        () =>
            pages.flatMap((page) =>
                page.data.filter((entry) => entry.post !== null),
            ) as TimelineEntry[],
        [pages],
    );

    const sanitizeTimelinePayload = useCallback((payload: TimelinePayload): TimelinePayload => {
        const filtered = payload.data.filter((entry) => entry.post !== null);
        const removed = payload.data.length - filtered.length;

        return {
            ...payload,
            data: filtered,
            meta: {
                ...payload.meta,
                total: Math.max(0, payload.meta.total - removed),
            },
        };
    }, []);

    useEffect(() => {
        const normalized = sanitizeTimelinePayload(bookmarks);
        setPages([normalized]);
        setHasMore(normalized.meta.current_page < normalized.meta.last_page);
        setErrorMessage(null);
        setPendingLikes([]);
        setPendingPurchases([]);
        setPendingBookmarks([]);
    }, [bookmarks, sanitizeTimelinePayload]);

    const handleFeedError = useCallback((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
            return;
        }

        console.error(error);

        const message =
            error instanceof FeedRequestError
                ? error.message
                : 'We could not load your bookmarks. Please try again.';

        setErrorMessage(message);
    }, []);

    const markLikePending = useCallback((postId: number, pending: boolean) => {
        setPendingLikes((previous) => {
            if (pending) {
                return previous.includes(postId) ? previous : [...previous, postId];
            }

            return previous.filter((id) => id !== postId);
        });
    }, []);

    const markPurchasePending = useCallback((postId: number, pending: boolean) => {
        setPendingPurchases((previous) => {
            if (pending) {
                return previous.includes(postId) ? previous : [...previous, postId];
            }

            return previous.filter((id) => id !== postId);
        });
    }, []);

    const markBookmarkPending = useCallback((postId: number, pending: boolean) => {
        setPendingBookmarks((previous) => {
            if (pending) {
                return previous.includes(postId) ? previous : [...previous, postId];
            }

            return previous.filter((id) => id !== postId);
        });
    }, []);

    const updatePostInPages = useCallback((nextPost: FeedPost) => {
        setPages((previous) =>
            previous.map((page) => ({
                ...page,
                data: page.data.map((entry) =>
                    entry.post && entry.post.id === nextPost.id
                        ? { ...entry, post: { ...entry.post, ...nextPost } }
                        : entry,
                ),
            })),
        );
    }, []);

    const findPostById = useCallback(
        (postId: number): FeedPost | null =>
            pages
                .flatMap((page) => page.data)
                .map((entry) => entry.post)
                .find((post): post is FeedPost => Boolean(post && post.id === postId)) ?? null,
        [pages],
    );

    const handleToggleLike = useCallback(
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
                likes_count: Math.max(
                    0,
                    targetPost.likes_count + (currentlyLiked ? -1 : 1),
                ),
            };

            updatePostInPages(optimisticPost);

            try {
                const updatedPost = currentlyLiked
                    ? await unlikePost(postId)
                    : await likePost(postId);

                updatePostInPages({ ...targetPost, ...updatedPost });
                setErrorMessage(null);
            } catch (error) {
                handleFeedError(error);
                updatePostInPages(targetPost);
            } finally {
                markLikePending(postId, false);
            }
        },
        [findPostById, handleFeedError, markLikePending, updatePostInPages],
    );

    const handleToggleBookmark = useCallback(
        async (postId: number) => {
            const targetPost = findPostById(postId);

            if (!targetPost) {
                return;
            }

            if (!targetPost.can?.bookmark) {
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
                setErrorMessage(null);
            } catch (error) {
                handleFeedError(error);
                updatePostInPages(targetPost);
            } finally {
                markBookmarkPending(postId, false);
            }
        },
        [findPostById, handleFeedError, markBookmarkPending, updatePostInPages],
    );

    const handlePurchase = useCallback(
        async (postId: number) => {
            const targetPost = findPostById(postId);

            if (!targetPost || !targetPost.locked) {
                return;
            }

            if (
                targetPost.paywall_price === null ||
                !targetPost.paywall_currency
            ) {
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
                setErrorMessage(null);
            } catch (error) {
                handleFeedError(error);
                updatePostInPages(targetPost);
            } finally {
                markPurchasePending(postId, false);
            }
        },
        [findPostById, handleFeedError, markPurchasePending, updatePostInPages],
    );

    const openCommentsForPost = useCallback(
        (postId: number) => {
            const targetPost = findPostById(postId);

            if (!targetPost) {
                return;
            }

            setActiveCommentPost(targetPost);
            setIsCommentSheetOpen(true);
        },
        [findPostById],
    );

    const handleCommentsOpenChange = useCallback((open: boolean) => {
        setIsCommentSheetOpen(open);

        if (!open) {
            setActiveCommentPost(null);
        }
    }, []);

    const handleCommentAdded = useCallback(
        (postId: number, totalComments: number) => {
            const targetPost = findPostById(postId);

            if (!targetPost) {
                return;
            }

            const nextPost: FeedPost = {
                ...targetPost,
                comments_count: totalComments,
            };

            updatePostInPages(nextPost);
            setActiveCommentPost(nextPost);
        },
        [findPostById, updatePostInPages],
    );

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) {
            return;
        }

        setIsLoadingMore(true);
        try {
            const currentPage =
                pages[pages.length - 1]?.meta.current_page ?? 1;
            const nextPage = currentPage + 1;

            const payload = await fetchBookmarksPage({
                page: nextPage,
                mergeQuery: true,
                pageName: bookmarksPageName,
            });

            const sanitized = sanitizeTimelinePayload(payload);

            setPages((previous) => [...previous, sanitized]);
            setHasMore(sanitized.meta.current_page < sanitized.meta.last_page);
            setErrorMessage(null);
        } catch (error) {
            handleFeedError(error);
            setHasMore(false);
        } finally {
            setIsLoadingMore(false);
        }
    }, [
        bookmarksPageName,
        handleFeedError,
        hasMore,
        isLoadingMore,
        pages,
        sanitizeTimelinePayload,
    ]);

    useEffect(() => {
        if (!hasMore || !sentinelRef.current) {
            return;
        }

        const observer = new IntersectionObserver(
            (entriesList) => {
                if (entriesList[0]?.isIntersecting) {
                    void loadMore();
                }
            },
            { rootMargin: '240px' },
        );

        const element = sentinelRef.current;
        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [hasMore, loadMore]);

    const refreshBookmarks = useCallback(async () => {
        if (isRefreshing) {
            return;
        }

        setIsRefreshing(true);

        try {
            const payload = await fetchBookmarksPage({
                page: 1,
                mergeQuery: true,
                pageName: bookmarksPageName,
            });

            const sanitized = sanitizeTimelinePayload(payload);

            setPages([sanitized]);
            setHasMore(sanitized.meta.current_page < sanitized.meta.last_page);
            setErrorMessage(null);
        } catch (error) {
            handleFeedError(error);
        } finally {
            setIsRefreshing(false);
        }
    }, [
        bookmarksPageName,
        handleFeedError,
        isRefreshing,
        sanitizeTimelinePayload,
    ]);

    const isPendingForPost = useCallback(
        (postId: number | null) =>
            postId !== null &&
            (pendingLikes.includes(postId) ||
                pendingPurchases.includes(postId) ||
                pendingBookmarks.includes(postId)),
        [pendingBookmarks, pendingLikes, pendingPurchases],
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Bookmarks', href: bookmarksIndex() },
            ]}
        >
            <Head title="Bookmarks" />

            <div className="space-y-8 text-white">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Saved scenes</h1>
                        <p className="text-sm text-white/60">
                            Your bookmarked posts stay protected here for quick access.
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        className="rounded-full border border-white/10 bg-white/10 px-4 text-xs text-white/70 hover:border-white/30 hover:bg-white/20 disabled:cursor-wait disabled:border-white/10 disabled:bg-white/10 disabled:text-white/50"
                        onClick={() => void refreshBookmarks()}
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? 'Refreshing…' : 'Refresh'}
                    </Button>
                </div>

                <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Bookmarked feed</CardTitle>
                        <CardDescription className="text-white/60">
                            Revisit the scenes, tutorials, and drops you saved for later.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {errorMessage && (
                            <Alert
                                variant="destructive"
                                className="border border-rose-400/40 bg-rose-500/10 text-white backdrop-blur"
                            >
                                <AlertCircle className="col-start-1 text-rose-100" />
                                <div className="col-start-2 space-y-1">
                                    <AlertTitle className="text-sm font-semibold">
                                        Bookmark feed unavailable
                                    </AlertTitle>
                                    <AlertDescription className="text-xs text-rose-100/80">
                                        {errorMessage}
                                    </AlertDescription>
                                </div>
                            </Alert>
                        )}

                        {entries.length === 0 ? (
                            <Card className="border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-white/70">
                                You have not saved any posts yet. Tap the bookmark icon on a post to keep it here.
                            </Card>
                        ) : (
                            entries.map((entry) => {
                                const postId = entry.post?.id ?? null;
                                const disabled =
                                    isPendingForPost(postId) || isRefreshing;

                                return (
                                    <TimelineEntryCard
                                        key={`${entry.id}-${entry.created_at}`}
                                        entry={entry}
                                        onLike={handleToggleLike}
                                        onBookmark={handleToggleBookmark}
                                        onComment={openCommentsForPost}
                                        onPurchase={handlePurchase}
                                        disabled={disabled}
                                    />
                                );
                            })
                        )}

                        {isLoadingMore && <FeedLoadingPlaceholder />}

                        {hasMore && entries.length > 0 && (
                            <div ref={sentinelRef} className="h-8 w-full" />
                        )}
                    </CardContent>
                </Card>
            </div>

            <CommentThreadSheet
                post={activeCommentPost}
                open={isCommentSheetOpen}
                onOpenChange={handleCommentsOpenChange}
                onCommentAdded={handleCommentAdded}
            />
        </AppLayout>
    );
}

