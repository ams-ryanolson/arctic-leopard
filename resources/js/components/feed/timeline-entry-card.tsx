import { useCallback, useEffect, useRef, useState } from 'react';

import postAnalyticsRoutes from '@/actions/App/Http/Controllers/Posts/PostAnalyticsController';
import CommentThreadTrigger from '@/components/feed/comment-thread-trigger';
import { useLightbox } from '@/components/feed/lightbox-context';
import FeedMediaGallery from '@/components/feed/media-gallery';
import PollVotePanel from '@/components/feed/poll-vote-panel';
import PostBody from '@/components/feed/post-body';
import { UserHoverCard } from '@/components/feed/user-hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spark } from '@/components/ui/spark';
import { recordPostView } from '@/lib/feed-client';
import { cn } from '@/lib/utils';
import profileRoutes from '@/routes/profile';
import type { SharedData } from '@/types';
import type { TimelineEntry } from '@/types/feed';
import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookmarkCheck,
    Bookmark as BookmarkIcon,
    Repeat,
} from 'lucide-react';

type TimelineEntryCardProps = {
    entry: TimelineEntry;
    onLike?: (postId: number) => void;
    onBookmark?: (postId: number) => void;
    onComment?: (postId: number) => void;
    onPurchase?: (postId: number) => void;
    onPollVote?: (optionId: number) => void;
    onAmplify?: (postId: number) => void;
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
    onAmplify,
    disabled,
}: TimelineEntryCardProps) {
    const { features } = usePage<SharedData>().props;
    const bookmarksEnabled = features?.bookmarks ?? false;
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
            <div className="border-b border-dashed border-white/15 pt-4 pb-5 text-sm text-white/70 sm:pt-6 sm:pb-6">
                This timeline entry has been removed.
            </div>
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
    const hasAmplified = Boolean(post.has_amplified);
    const bookmarkCount = post.bookmark_count ?? 0;
    const canBookmark = post.can?.bookmark ?? false;
    const viewsCount = post.views_count + (optimisticView ? 1 : 0);
    const isAmplifyPost = post.type === 'amplify';
    const originalPost = post.original_post ?? null;
    const initials = displayName
        .split(' ')
        .map((segment) => segment.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const handleMediaClick = (index: number) => {
        const targetPost = isAmplifyPost && originalPost ? originalPost : post;
        openLightbox(targetPost.media ?? [], {
            startIndex: index,
            post: targetPost,
            onCommentCountChange: (total) => {
                setPendingCounts((previous) => ({
                    ...previous,
                    [targetPost.id]: total,
                }));
            },
        });
    };

    // Determine which post to display (original if this is an amplify)
    const displayPost = isAmplifyPost && originalPost ? originalPost : post;
    const amplifier = isAmplifyPost ? post.author : null;
    const amplifierName = amplifier
        ? (amplifier.display_name ?? amplifier.username ?? 'Someone')
        : null;
    const amplifierUsername = amplifier?.username ?? null;
    const amplifierProfileHref = amplifierUsername
        ? profileRoutes.show.url(amplifierUsername)
        : null;

    return (
        <div
            ref={cardWrapperRef}
            className="border-b border-white/10 pt-4 pb-5 text-sm text-white/75 sm:pt-6 sm:pb-6"
        >
            {isAmplifyPost &&
                amplifier &&
                amplifierName &&
                amplifier.id &&
                amplifierUsername && (
                    <div className="mb-3 flex items-center gap-2 text-xs text-white/60 sm:mb-4 sm:text-sm">
                        <Repeat className="size-4 text-white/50" />
                        {amplifierProfileHref ? (
                            <UserHoverCard
                                userId={amplifier.id}
                                username={amplifierUsername}
                                displayName={amplifier.display_name}
                                avatarUrl={amplifier.avatar_url}
                            >
                                <Link
                                    href={amplifierProfileHref}
                                    prefetch
                                    className="font-semibold text-white/80 transition hover:text-amber-200 focus:outline-none focus-visible:text-amber-200"
                                >
                                    {amplifierName}
                                </Link>
                            </UserHoverCard>
                        ) : (
                            <span className="font-semibold text-white/80">
                                {amplifierName}
                            </span>
                        )}
                        <span>amplified this</span>
                    </div>
                )}

            {isAmplifyPost && post.body && (
                <div className="mb-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/80 sm:mb-4 sm:p-4">
                    <PostBody body={post.body} />
                </div>
            )}

            <header className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
                    {displayPost.author?.id && displayPost.author?.username ? (
                        <UserHoverCard
                            userId={displayPost.author.id}
                            username={displayPost.author.username}
                            displayName={displayPost.author.display_name}
                            avatarUrl={displayPost.author.avatar_url}
                        >
                            <Avatar className="size-9 shrink-0 cursor-pointer border border-white/10 transition hover:border-white/20 sm:size-12">
                                <AvatarImage
                                    src={
                                        displayPost.author.avatar_url ??
                                        undefined
                                    }
                                    alt={
                                        displayPost.author.display_name ??
                                        displayPost.author.username ??
                                        'Unknown'
                                    }
                                />
                                <AvatarFallback className="bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 text-xs font-semibold text-white sm:text-sm">
                                    {(
                                        displayPost.author.display_name ??
                                        displayPost.author.username ??
                                        ''
                                    )
                                        .split(' ')
                                        .map((segment) => segment.charAt(0))
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase() || '??'}
                                </AvatarFallback>
                            </Avatar>
                        </UserHoverCard>
                    ) : (
                        <Avatar className="size-9 shrink-0 border border-white/10 sm:size-12">
                            <AvatarImage
                                src={
                                    displayPost.author?.avatar_url ?? undefined
                                }
                                alt={
                                    displayPost.author?.display_name ??
                                    displayPost.author?.username ??
                                    'Unknown'
                                }
                            />
                            <AvatarFallback className="bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 text-xs font-semibold text-white sm:text-sm">
                                {(
                                    displayPost.author?.display_name ??
                                    displayPost.author?.username ??
                                    ''
                                )
                                    .split(' ')
                                    .map((segment) => segment.charAt(0))
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase() || '??'}
                            </AvatarFallback>
                        </Avatar>
                    )}
                    <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                        <div className="truncate text-sm font-semibold text-white sm:text-base">
                            {displayPost.author?.username ? (
                                <UserHoverCard
                                    userId={displayPost.author.id}
                                    username={displayPost.author.username}
                                    displayName={
                                        displayPost.author.display_name
                                    }
                                    avatarUrl={displayPost.author.avatar_url}
                                >
                                    <Link
                                        href={profileRoutes.show.url(
                                            displayPost.author.username,
                                        )}
                                        prefetch
                                        className="transition hover:text-amber-200 focus:outline-none focus-visible:text-amber-200"
                                    >
                                        {displayPost.author.display_name ??
                                            displayPost.author.username ??
                                            'Unknown'}
                                    </Link>
                                </UserHoverCard>
                            ) : (
                                (displayPost.author?.display_name ??
                                displayPost.author?.username ??
                                'Unknown')
                            )}
                        </div>
                        <p className="flex flex-wrap items-center gap-1.5 text-[0.625rem] tracking-[0.3em] text-white/50 uppercase sm:gap-2 sm:text-xs">
                            {displayPost.author?.username &&
                            displayPost.author?.id ? (
                                <UserHoverCard
                                    userId={displayPost.author.id}
                                    username={displayPost.author.username}
                                    displayName={
                                        displayPost.author.display_name
                                    }
                                    avatarUrl={displayPost.author.avatar_url}
                                >
                                    <Link
                                        href={profileRoutes.show.url(
                                            displayPost.author.username,
                                        )}
                                        prefetch
                                        className="truncate text-white/60 transition hover:text-white focus:outline-none focus-visible:text-white"
                                    >
                                        @{displayPost.author.username}
                                    </Link>
                                </UserHoverCard>
                            ) : displayPost.author?.username ? (
                                <Link
                                    href={profileRoutes.show.url(
                                        displayPost.author.username,
                                    )}
                                    prefetch
                                    className="truncate text-white/60 transition hover:text-white focus:outline-none focus-visible:text-white"
                                >
                                    @{displayPost.author.username}
                                </Link>
                            ) : null}
                            {displayPost.author?.username && (
                                <span className="text-white/30">•</span>
                            )}
                            <span className="whitespace-nowrap">
                                {formatTimestamp(
                                    displayPost.published_at ??
                                        displayPost.created_at ??
                                        entry.visible_at,
                                )}
                            </span>
                        </p>
                    </div>
                </div>

                <Badge className="shrink-0 rounded-full border-white/20 bg-white/10 text-[0.6rem] tracking-[0.25em] text-white/70 uppercase sm:text-[0.65rem] sm:tracking-[0.3em]">
                    {audienceLabel(displayPost.audience)}
                </Badge>
            </header>

            {displayPost.body && !isAmplifyPost && (
                <PostBody
                    body={displayPost.body}
                    className="mt-3 text-white/80 sm:mt-4"
                />
            )}

            {(() => {
                const displayTipGoal =
                    displayPost.extra_attributes &&
                    !Array.isArray(displayPost.extra_attributes) &&
                    typeof displayPost.extra_attributes === 'object' &&
                    'tip_goal' in displayPost.extra_attributes
                        ? ((
                              displayPost.extra_attributes as {
                                  tip_goal?: {
                                      amount?: number;
                                      currency?: string;
                                      label?: string | null;
                                      deadline?: string | null;
                                  };
                              }
                          ).tip_goal ?? null)
                        : null;

                return displayTipGoal &&
                    displayTipGoal.amount &&
                    displayTipGoal.currency ? (
                    <div className="mt-3 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-xs text-emerald-100 sm:mt-4 sm:rounded-2xl sm:p-4">
                        <p className="text-[0.6rem] tracking-[0.3em] text-emerald-200/80 uppercase sm:text-[0.65rem] sm:tracking-[0.35em]">
                            Tip train goal
                        </p>
                        <div className="mt-2 flex flex-col gap-1 text-xs text-white sm:text-sm">
                            <span className="font-semibold">
                                {formatCurrency(
                                    displayTipGoal.amount,
                                    displayTipGoal.currency,
                                )}
                            </span>
                            {displayTipGoal.label && (
                                <span className="text-white/80">
                                    {displayTipGoal.label}
                                </span>
                            )}
                            {displayTipGoal.deadline && (
                                <span className="text-emerald-100/70">
                                    Ends{' '}
                                    {new Date(
                                        displayTipGoal.deadline,
                                    ).toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>
                ) : null;
            })()}

            <FeedMediaGallery
                media={
                    Array.isArray(displayPost.media) ? displayPost.media : []
                }
                post={displayPost}
                onMediaClick={handleMediaClick}
            />

            {displayPost.poll && (
                <PollVotePanel
                    poll={displayPost.poll}
                    onVote={onPollVote}
                    disabled={disabled}
                />
            )}

            {displayPost.hashtags && displayPost.hashtags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
                    {displayPost.hashtags.map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[0.625rem] text-white/60 sm:px-3 sm:py-1 sm:text-xs"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            <footer className="mt-4 flex flex-wrap gap-1.5 text-xs text-white/60 sm:mt-6 sm:gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                        'h-9 rounded-full px-3 text-[0.625rem] text-white/75 transition hover:bg-white/10 hover:text-white active:scale-95 sm:h-auto sm:px-4 sm:text-xs',
                        hasLiked &&
                            'border border-amber-400/40 bg-gradient-to-br from-amber-400/10 via-rose-500/10 to-violet-600/10 text-amber-200',
                    )}
                    onClick={() => onLike?.(post.id)}
                    disabled={disabled}
                >
                    <span className="flex items-center gap-1.5 sm:gap-2">
                        <Spark
                            sparked={hasLiked}
                            className={cn(
                                'size-3 sm:size-3.5',
                                !hasLiked && 'text-white/60',
                            )}
                        />
                        <span className="whitespace-nowrap">
                            {hasLiked ? 'Sparked' : 'Spark'} ({post.likes_count}
                            )
                        </span>
                    </span>
                </Button>

                {onAmplify && !isAmplifyPost && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                            'h-9 rounded-full px-3 text-[0.625rem] text-white/75 transition hover:bg-white/10 hover:text-white active:scale-95 sm:h-auto sm:px-4 sm:text-xs',
                            hasAmplified &&
                                'border border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
                        )}
                        onClick={() => onAmplify?.(displayPost.id)}
                        disabled={disabled}
                        aria-pressed={hasAmplified}
                    >
                        <span className="flex items-center gap-1.5 sm:gap-2">
                            <Repeat
                                className={cn(
                                    'size-3 sm:size-3.5',
                                    !hasAmplified && 'text-white/60',
                                )}
                            />
                            <span className="whitespace-nowrap">
                                {hasAmplified ? 'Amplified' : 'Amplify'} (
                                {displayPost.reposts_count ?? 0})
                            </span>
                        </span>
                    </Button>
                )}

                {bookmarksEnabled && onBookmark && canBookmark && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                            'h-9 rounded-full px-3 text-[0.625rem] text-white/75 transition hover:bg-white/10 hover:text-white active:scale-95 sm:h-auto sm:px-4 sm:text-xs',
                            isBookmarked &&
                                'border border-blue-400/40 bg-blue-400/10 text-blue-200',
                        )}
                        onClick={() => onBookmark?.(displayPost.id)}
                        disabled={disabled}
                        aria-pressed={isBookmarked}
                    >
                        <span className="flex items-center gap-1.5 sm:gap-2">
                            {isBookmarked ? (
                                <BookmarkCheck className="size-3 sm:size-3.5" />
                            ) : (
                                <BookmarkIcon className="size-3 text-white/60 sm:size-3.5" />
                            )}
                            <span className="whitespace-nowrap">
                                {isBookmarked ? 'Saved' : 'Save'} (
                                {bookmarkCount})
                            </span>
                        </span>
                    </Button>
                )}

                <CommentThreadTrigger
                    postId={displayPost.id}
                    count={commentsCount}
                    onOpen={onComment}
                    disabled={disabled || !onComment}
                />

                {(() => {
                    // For amplify posts, check the amplify post's permissions (not the original)
                    // The policy will ensure only the original poster can see analytics
                    const postToCheck = isAmplifyPost ? post : displayPost;
                    const canViewAnalytics =
                        postToCheck.can?.viewAnalytics ?? false;

                    return canViewAnalytics ? (
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-9 rounded-full border border-white/10 px-3 text-[0.625rem] text-white/80 transition hover:border-amber-300/60 hover:bg-white/10 hover:text-white active:scale-95 sm:h-auto sm:px-4 sm:text-xs"
                        >
                            <Link
                                href={postAnalyticsRoutes.show.url({
                                    post:
                                        isAmplifyPost && originalPost
                                            ? (originalPost.ulid ??
                                              originalPost.id)
                                            : (displayPost.ulid ??
                                              displayPost.id),
                                })}
                                prefetch
                                preserveScroll
                                className="flex items-center gap-1.5 sm:gap-2"
                            >
                                <BarChart3 className="size-3 sm:size-3.5" />
                                <span className="whitespace-nowrap">
                                    Analytics ({viewsCount})
                                </span>
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(
                                'h-9 rounded-full px-3 text-[0.625rem] text-white/75 transition hover:bg-white/10 hover:text-white active:scale-95 sm:h-auto sm:px-4 sm:text-xs',
                                displayPost.locked &&
                                    'border border-amber-400/30 bg-amber-400/10 text-amber-200',
                            )}
                            onClick={() => onPurchase?.(displayPost.id)}
                            disabled={!displayPost.locked || disabled}
                        >
                            <span className="whitespace-nowrap">
                                {displayPost.locked
                                    ? 'Unlock to view'
                                    : `Views (${viewsCount})`}
                            </span>
                        </Button>
                    );
                })()}
            </footer>
        </div>
    );
}
