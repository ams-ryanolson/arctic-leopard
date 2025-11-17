import { useCallback, useEffect, useRef, useState } from 'react';

import postAnalyticsRoutes from '@/actions/App/Http/Controllers/Posts/PostAnalyticsController';
import CommentThreadTrigger from '@/components/feed/comment-thread-trigger';
import { useLightbox } from '@/components/feed/lightbox-context';
import FeedMediaGallery from '@/components/feed/media-gallery';
import PollVotePanel from '@/components/feed/poll-vote-panel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spark } from '@/components/ui/spark';
import { recordPostView } from '@/lib/feed-client';
import { cn } from '@/lib/utils';
import profileRoutes from '@/routes/profile';
import type { TimelineEntry } from '@/types/feed';
import { Link } from '@inertiajs/react';
import {
    BarChart3,
    BookmarkCheck,
    Bookmark as BookmarkIcon,
} from 'lucide-react';

type TimelineEntryCardProps = {
    entry: TimelineEntry;
    onLike?: (postId: number) => void;
    onBookmark?: (postId: number) => void;
    onComment?: (postId: number) => void;
    onPurchase?: (postId: number) => void;
    onPollVote?: (optionId: number) => void;
    disabled?: boolean;
};

const audienceLabel = (audience: string): string => {
    switch (audience) {
        case 'public':
            return 'Public';
        case 'followers':
            return 'Followers';
        case 'subscribers':
            return 'Subscribers';
        case 'pay_to_view':
            return 'Pay to View';
        default:
            return audience;
    }
};

const formatTimestamp = (iso: string | null): string => {
    if (!iso) {
        return 'Just now';
    }

    const date = new Date(iso);

    return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
};

export default function TimelineEntryCard({
    entry,
    onLike,
    onBookmark,
    onComment,
    onPurchase,
    onPollVote,
    disabled,
}: TimelineEntryCardProps) {
    const { openLightbox } = useLightbox();
    const post = entry.post;
    const [pendingCounts, setPendingCounts] = useState<Record<number, number>>(
        {},
    );
    const [optimisticView, setOptimisticView] = useState(false);
    const cardWrapperRef = useRef<HTMLDivElement | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const dwellTimerRef = useRef<number | null>(null);
    const recordedViewRef = useRef(false);

    const postId = post?.id ?? null;
    const commentsCount =
        postId !== null && postId in pendingCounts
            ? pendingCounts[postId]
            : (post?.comments_count ?? 0);

    const ensureViewSessionUuid = useCallback((): string | undefined => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        try {
            const storageKey = 'rk:view-session';
            const store = window.sessionStorage;
            let identifier = store.getItem(storageKey);

            if (!identifier) {
                identifier =
                    typeof window.crypto !== 'undefined' &&
                    typeof window.crypto.randomUUID === 'function'
                        ? window.crypto.randomUUID()
                        : Math.random().toString(36).slice(2);

                store.setItem(storageKey, identifier);
            }

            return identifier;
        } catch {
            return undefined;
        }
    }, []);

    const contextualLocation =
        typeof entry.context?.location === 'string'
            ? entry.context.location
            : undefined;
    const visibilitySource = entry.visibility_source;

    const sendViewEvent = useCallback(() => {
        if (postId === null) {
            return;
        }

        const id = postId;

        if (id === null || recordedViewRef.current) {
            return;
        }

        const cacheKey = `rk:view:${id}`;
        let alreadyTracked = false;

        if (typeof window !== 'undefined') {
            try {
                const store = window.sessionStorage;
                alreadyTracked = store.getItem(cacheKey) !== null;

                if (!alreadyTracked) {
                    store.setItem(cacheKey, String(Date.now()));
                }
            } catch {
                // Ignore storage errors (private mode, etc.)
            }
        }

        if (alreadyTracked) {
            recordedViewRef.current = true;
            return;
        }

        recordedViewRef.current = true;
        setOptimisticView(true);

        const sessionUuid = ensureViewSessionUuid();

        recordPostView(id, {
            sessionUuid,
            context: {
                source: visibilitySource,
                location: contextualLocation ?? 'timeline',
                viewport:
                    typeof window !== 'undefined' &&
                    typeof window.location?.pathname === 'string'
                        ? window.location.pathname
                        : undefined,
            },
        }).catch(() => {
            recordedViewRef.current = false;
            setOptimisticView(false);

            if (typeof window !== 'undefined') {
                try {
                    window.sessionStorage.removeItem(cacheKey);
                } catch {
                    // Ignore storage errors
                }
            }
        });
    }, [contextualLocation, ensureViewSessionUuid, postId, visibilitySource]);

    useEffect(() => {
        recordedViewRef.current = false;

        setOptimisticView(false);
    }, [postId]);

    useEffect(() => {
        const element = cardWrapperRef.current;

        if (!element) {
            return;
        }

        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.target !== element) {
                        continue;
                    }

                    if (
                        entry.isIntersecting &&
                        entry.intersectionRatio >= 0.5
                    ) {
                        if (
                            dwellTimerRef.current !== null &&
                            typeof window !== 'undefined'
                        ) {
                            window.clearTimeout(dwellTimerRef.current);
                        }

                        if (typeof window !== 'undefined') {
                            dwellTimerRef.current = window.setTimeout(() => {
                                sendViewEvent();
                                dwellTimerRef.current = null;
                            }, 400);
                        } else {
                            sendViewEvent();
                        }
                    } else if (
                        dwellTimerRef.current !== null &&
                        typeof window !== 'undefined'
                    ) {
                        window.clearTimeout(dwellTimerRef.current);
                        dwellTimerRef.current = null;
                    }
                }
            },
            {
                threshold: [0.5, 0.75, 0.9],
            },
        );

        observer.observe(element);
        observerRef.current = observer;

        return () => {
            if (
                dwellTimerRef.current !== null &&
                typeof window !== 'undefined'
            ) {
                window.clearTimeout(dwellTimerRef.current);
                dwellTimerRef.current = null;
            }

            observer.disconnect();
            observerRef.current = null;
        };
    }, [sendViewEvent]);

    if (!post) {
        return (
            <Card className="border border-dashed border-white/15 bg-white/5 p-6 text-sm text-white/70">
                This timeline entry has been removed.
            </Card>
        );
    }

    const publishedAt =
        post.published_at ?? post.created_at ?? entry.visible_at;
    const displayName =
        post.author?.display_name ?? post.author?.username ?? 'Unknown creator';
    const authorUsername = post.author?.username ?? null;
    const authorProfileHref = authorUsername
        ? profileRoutes.show.url(authorUsername)
        : null;
    const tipGoal =
        post.extra_attributes &&
        !Array.isArray(post.extra_attributes) &&
        typeof post.extra_attributes === 'object' &&
        'tip_goal' in post.extra_attributes
            ? ((
                  post.extra_attributes as {
                      tip_goal?: {
                          amount?: number;
                          currency?: string;
                          label?: string | null;
                          deadline?: string | null;
                      };
                  }
              ).tip_goal ?? null)
            : null;

    const formatCurrency = (amount: number, currency: string): string =>
        new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
        }).format(amount / 100);

    const hasLiked = Boolean(post.has_liked);
    const isBookmarked = Boolean(post.is_bookmarked);
    const bookmarkCount = post.bookmark_count ?? 0;
    const canBookmark = post.can?.bookmark ?? false;
    const viewsCount = post.views_count + (optimisticView ? 1 : 0);
    const initials = displayName
        .split(' ')
        .map((segment) => segment.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const handleMediaClick = (index: number) => {
        openLightbox(post.media, {
            startIndex: index,
            post,
            onCommentCountChange: (total) => {
                setPendingCounts((previous) => ({
                    ...previous,
                    [post.id]: total,
                }));
            },
        });
    };

    return (
        <div ref={cardWrapperRef}>
            <Card className="border border-white/10 bg-white/5 p-6 text-sm text-white/75">
                <header className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Avatar className="size-12 border border-white/10">
                            <AvatarImage
                                src={post.author?.avatar_url ?? undefined}
                                alt={displayName}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 text-sm font-semibold text-white">
                                {initials || '??'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <p className="font-semibold text-white">
                                {authorProfileHref ? (
                                    <Link
                                        href={authorProfileHref}
                                        prefetch
                                        className="transition hover:text-amber-200 focus:outline-none focus-visible:text-amber-200"
                                    >
                                        {displayName}
                                    </Link>
                                ) : (
                                    displayName
                                )}
                            </p>
                            <p className="flex flex-wrap items-center gap-2 text-xs tracking-[0.3em] text-white/50 uppercase">
                                {authorUsername && authorProfileHref && (
                                    <Link
                                        href={authorProfileHref}
                                        prefetch
                                        className="text-white/60 transition hover:text-white focus:outline-none focus-visible:text-white"
                                    >
                                        @{authorUsername}
                                    </Link>
                                )}
                                <span className="text-white/30">•</span>
                                <span>{formatTimestamp(publishedAt)}</span>
                            </p>
                        </div>
                    </div>

                    <Badge className="rounded-full border-white/20 bg-white/10 text-[0.65rem] tracking-[0.3em] text-white/70 uppercase">
                        {audienceLabel(post.audience)}
                    </Badge>
                </header>

                {post.body && (
                    <p className="mt-4 text-base whitespace-pre-line text-white/80">
                        {post.body}
                    </p>
                )}

                {tipGoal && tipGoal.amount && tipGoal.currency && (
                    <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-xs text-emerald-100">
                        <p className="text-[0.65rem] tracking-[0.35em] text-emerald-200/80 uppercase">
                            Tip train goal
                        </p>
                        <div className="mt-2 flex flex-col gap-1 text-sm text-white">
                            <span className="font-semibold">
                                {formatCurrency(
                                    tipGoal.amount,
                                    tipGoal.currency,
                                )}
                            </span>
                            {tipGoal.label && (
                                <span className="text-white/80">
                                    {tipGoal.label}
                                </span>
                            )}
                            {tipGoal.deadline && (
                                <span className="text-emerald-100/70">
                                    Ends{' '}
                                    {new Date(
                                        tipGoal.deadline,
                                    ).toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <FeedMediaGallery
                    media={Array.isArray(post.media) ? post.media : []}
                    post={post}
                    onMediaClick={handleMediaClick}
                />

                {post.poll && (
                    <PollVotePanel
                        poll={post.poll}
                        onVote={onPollVote}
                        disabled={disabled}
                    />
                )}

                {post.hashtags && post.hashtags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {post.hashtags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                <footer className="mt-6 flex flex-wrap gap-2 text-xs text-white/60">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                            'rounded-full px-4 text-xs text-white/75 hover:bg-white/10 hover:text-white',
                            hasLiked &&
                                'border border-amber-400/40 bg-gradient-to-br from-amber-400/10 via-rose-500/10 to-violet-600/10 text-amber-200',
                        )}
                        onClick={() => onLike?.(post.id)}
                        disabled={disabled}
                    >
                        <span className="flex items-center gap-2">
                            <Spark
                                sparked={hasLiked}
                                className={cn(
                                    'size-3.5',
                                    !hasLiked && 'text-white/60',
                                )}
                            />
                            {hasLiked ? 'Sparked' : 'Spark'} ({post.likes_count}
                            )
                        </span>
                    </Button>

                    {onBookmark && canBookmark && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(
                                'rounded-full px-4 text-xs text-white/75 hover:bg-white/10 hover:text-white',
                                isBookmarked &&
                                    'border border-blue-400/40 bg-blue-400/10 text-blue-200',
                            )}
                            onClick={() => onBookmark?.(post.id)}
                            disabled={disabled}
                            aria-pressed={isBookmarked}
                        >
                            <span className="flex items-center gap-2">
                                {isBookmarked ? (
                                    <BookmarkCheck className="size-3.5" />
                                ) : (
                                    <BookmarkIcon className="size-3.5 text-white/60" />
                                )}
                                {isBookmarked ? 'Saved' : 'Save'} (
                                {bookmarkCount})
                            </span>
                        </Button>
                    )}

                    <CommentThreadTrigger
                        postId={post.id}
                        count={commentsCount}
                        onOpen={onComment}
                        disabled={disabled || !onComment}
                    />

                    {post.can?.viewAnalytics ? (
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="rounded-full border border-white/10 px-4 text-xs text-white/80 transition hover:border-amber-300/60 hover:bg-white/10 hover:text-white"
                        >
                            <Link
                                href={postAnalyticsRoutes.show.url({
                                    post: post.id,
                                })}
                                prefetch
                                preserveScroll
                                className="flex items-center gap-2"
                            >
                                <BarChart3 className="size-3.5" />
                                Live analytics ({viewsCount})
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(
                                'rounded-full px-4 text-xs text-white/75 hover:bg-white/10 hover:text-white',
                                post.locked &&
                                    'border border-amber-400/30 bg-amber-400/10 text-amber-200',
                            )}
                            onClick={() => onPurchase?.(post.id)}
                            disabled={!post.locked || disabled}
                        >
                            {post.locked
                                ? 'Unlock to view'
                                : `Views (${viewsCount})`}
                        </Button>
                    )}
                </footer>
            </Card>
        </div>
    );
}
