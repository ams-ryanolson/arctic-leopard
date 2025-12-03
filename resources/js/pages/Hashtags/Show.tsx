import CommentThreadSheet from '@/components/feed/comment-thread-sheet';
import FeedLoadingPlaceholder from '@/components/feed/feed-loading-placeholder';
import TimelineEntryCard from '@/components/feed/timeline-entry-card';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useFeed } from '@/hooks/use-feed';
import AppLayout from '@/layouts/app-layout';
import { fetchHashtagPostsPage } from '@/lib/feed-client';
import { show as hashtagShow } from '@/routes/hashtags';
import type {
    PostCollectionPayload,
    TimelineEntry,
    TimelinePayload,
} from '@/types/feed';
import { Head, Link } from '@inertiajs/react';
import { Hash, TrendingUp } from 'lucide-react';
import { useCallback } from 'react';

type Hashtag = {
    id: number;
    name: string;
    slug: string;
    usage_count: number;
    recent_usage_count: number;
};

type TrendingHashtag = {
    id: number;
    name: string;
    slug: string;
    usage_count: number;
};

interface HashtagsShowProps {
    hashtag: Hashtag;
    posts: PostCollectionPayload;
    trendingHashtags?: TrendingHashtag[];
}

const numberFormatter = new Intl.NumberFormat();

export default function HashtagsShow({
    hashtag,
    posts: initialPosts,
    trendingHashtags = [],
}: HashtagsShowProps) {
    const transformHashtagPayload = useCallback(
        (payload: TimelinePayload | PostCollectionPayload): TimelinePayload => {
            // Add safety check for payload.data
            if (
                payload.data &&
                Array.isArray(payload.data) &&
                payload.data.length > 0 &&
                typeof payload.data[0] === 'object' &&
                payload.data[0] !== null &&
                'post' in (payload.data[0] as Record<string, unknown>)
            ) {
                return payload as TimelinePayload;
            }

            const collection = payload as PostCollectionPayload;

            // Add safety check for collection.data
            if (!collection.data || !Array.isArray(collection.data)) {
                return {
                    data: [],
                    links: collection.links || {},
                    meta: collection.meta || {},
                };
            }

            return {
                data: collection.data.map((post) => ({
                    id: post.id,
                    visibility_source: 'hashtag',
                    context: {
                        hashtag: hashtag.slug,
                    },
                    visible_at: post.published_at ?? post.created_at,
                    created_at: post.created_at,
                    post,
                })),
                links: collection.links ?? {},
                meta: collection.meta || {},
            };
        },
        [hashtag.slug],
    );

    const {
        entries,
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
        refresh,
        toggleLike,
        toggleBookmark,
        togglePurchase,
        openComments,
        handleCommentAdded,
        handleCommentsOpenChange,
    } = useFeed({
        initialPayload: initialPosts,
        fetchPage: (page) =>
            fetchHashtagPostsPage(hashtag.slug, {
                page,
                mergeQuery: true,
            }),
        transformPayload: transformHashtagPayload,
        errorMessage:
            'We could not load posts for this hashtag. Please try again.',
    });

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Hashtags', href: '/hashtags' },
                {
                    title: `#${hashtag.name}`,
                    href: `/hashtags/${hashtag.slug}`,
                },
            ]}
        >
            <Head title={`#${hashtag.name} · Hashtags`} />

            <div className="space-y-12 text-white">
                {/* Hashtag Header */}
                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_60px_120px_-70px_rgba(139,92,246,0.6)]">
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-violet-400/25 via-violet-400/10 to-transparent blur-3xl" />
                        <div className="absolute top-1/2 -left-32 size-[520px] -translate-y-1/2 rounded-full bg-violet-500/20 blur-3xl" />
                        <div className="absolute top-16 -right-36 size-[460px] rounded-full bg-purple-600/20 blur-3xl" />
                    </div>

                    <div className="relative grid gap-12 p-10 sm:p-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="flex size-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                                    <Hash className="size-8 text-white/80" />
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-4xl leading-tight font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                                        #{hashtag.name}
                                    </h1>
                                    {hashtag.recent_usage_count > 0 && (
                                        <Badge className="mt-2 rounded-full border-emerald-400/30 bg-emerald-500/20 text-xs text-emerald-300">
                                            <TrendingUp className="mr-1 size-3" />
                                            Trending
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {hashtag.recent_usage_count > 0 && (
                                    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black/50 via-black/40 to-black/50 px-5 py-4 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-all hover:border-white/20">
                                        <div className="relative flex items-center gap-4">
                                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/20 via-emerald-300/15 to-emerald-400/10 text-emerald-300">
                                                <TrendingUp className="size-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="mb-1 text-xs font-medium tracking-[0.3em] text-white/55 uppercase">
                                                    Last 24 Hours
                                                </p>
                                                <p className="text-2xl font-semibold text-white">
                                                    {numberFormatter.format(
                                                        hashtag.recent_usage_count,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black/50 via-black/40 to-black/50 px-5 py-4 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-all hover:border-white/20">
                                    <div className="relative flex items-center gap-4">
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-400/20 via-violet-300/15 to-violet-400/10 text-violet-300">
                                            <Hash className="size-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="mb-1 text-xs font-medium tracking-[0.3em] text-white/55 uppercase">
                                                Total Posts
                                            </p>
                                            <p className="text-2xl font-semibold text-white">
                                                {numberFormatter.format(
                                                    hashtag.usage_count,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Content with Sidebar */}
                <div className="flex flex-col gap-6 xl:flex-row">
                    {/* Posts Feed */}
                    <section className="min-w-0 flex-1 space-y-6">
                        {error && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
                                {error}
                            </div>
                        )}

                        {isRefreshing && <FeedLoadingPlaceholder count={3} />}

                        {!isRefreshing && entries.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Hash className="mb-4 size-12 text-white/40" />
                                <p className="text-lg font-semibold text-white">
                                    No posts found
                                </p>
                                <p className="mt-2 text-white/60">
                                    Be the first to use #{hashtag.name}
                                </p>
                                <p className="mt-4 text-sm text-white/50">
                                    Note: Only posts visible to you are shown.
                                    The total count includes all posts with this
                                    hashtag, including private posts from users
                                    you don't follow.
                                </p>
                            </div>
                        )}

                        {!isRefreshing &&
                            entries.map((entry: TimelineEntry) => {
                                if (entry.type === 'ad') {
                                    return null; // Handle ads if needed
                                }

                                if (!entry.post) {
                                    return null;
                                }

                                return (
                                    <TimelineEntryCard
                                        key={entry.id}
                                        entry={entry}
                                        onLike={() => toggleLike(entry.post!)}
                                        onBookmark={() =>
                                            toggleBookmark(entry.post!)
                                        }
                                        onComment={() =>
                                            openComments(entry.post!)
                                        }
                                        onPurchase={() =>
                                            togglePurchase(entry.post!)
                                        }
                                        onPollVote={async () => {
                                            await refresh();
                                        }}
                                        disabled={
                                            pendingLikes.includes(
                                                entry.post.id,
                                            ) ||
                                            pendingBookmarks.includes(
                                                entry.post.id,
                                            ) ||
                                            pendingPurchases.includes(
                                                entry.post.id,
                                            )
                                        }
                                    />
                                );
                            })}

                        {isLoadingMore && <FeedLoadingPlaceholder count={2} />}

                        {hasMore && !isLoadingMore && (
                            <div ref={sentinelRef} className="h-4" />
                        )}
                    </section>

                    {/* Right Sidebar - Desktop Only */}
                    <aside className="hidden w-full max-w-[320px] flex-col gap-4 lg:flex">
                        {trendingHashtags.length > 0 && (
                            <Card className="border-white/10 bg-white/5 text-white shadow-[0_24px_65px_-35px_rgba(139,92,246,0.45)]">
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">
                                        Trending hashtags
                                    </CardTitle>
                                    <CardDescription className="text-white/60">
                                        Other popular tags on the scene.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {trendingHashtags.map((tag) => (
                                        <Link
                                            key={tag.id}
                                            href={hashtagShow.url({
                                                hashtag: tag.slug,
                                            })}
                                            className="block rounded-2xl border border-white/10 bg-black/40 px-4 py-3 transition-all hover:border-white/20 hover:bg-black/50"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-semibold text-white">
                                                    #{tag.name}
                                                </p>
                                                <Badge className="rounded-full border-white/15 bg-white/10 px-2 py-0.5 text-[0.65rem] tracking-[0.3em] text-white/70 uppercase">
                                                    {numberFormatter.format(
                                                        tag.usage_count,
                                                    )}
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </aside>
                </div>

                <CommentThreadSheet
                    post={activeCommentPost}
                    isOpen={isCommentSheetOpen}
                    onOpenChange={handleCommentsOpenChange}
                    onCommentAdded={handleCommentAdded}
                />
            </div>
        </AppLayout>
    );
}
