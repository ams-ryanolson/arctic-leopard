import { useCallback, useEffect, useMemo, useState } from 'react';

import TimelineEntryCard from '@/components/feed/timeline-entry-card';
import CommentThreadSheet from '@/components/feed/comment-thread-sheet';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import CoverGradient from '@/components/cover-gradient';
import { useInitials } from '@/hooks/use-initials';
import { useFeed } from '@/hooks/use-feed';
import profileRoutes from '@/routes/profile';
import messagesRoutes from '@/routes/messages';
import usersRoutes from '@/routes/users';
import { fetchProfileFeedPage } from '@/lib/feed-client';
import { getCsrfToken } from '@/lib/csrf';
import { SubscribeDialog, TipDialog } from '@/pages/Profile/dialogs';
import type {
    Availability,
    SubscriptionTier,
    TipOption,
    WishlistItem,
} from '@/pages/Profile/types';
import { Separator } from '@/components/ui/separator';
import type { SharedData, User as SharedUser } from '@/types';
import type {
    FeedFiltersGroup,
    FeedPost,
    PostCollectionPayload,
    TimelineEntry,
    TimelinePayload,
} from '@/types/feed';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertCircle, Ban, Loader2, Plane } from 'lucide-react';
import FeedLoadingPlaceholder from '@/components/feed/feed-loading-placeholder';

type ProfileUser = SharedUser & {
    display_name?: string | null;
    pronouns?: string | null;
    bio?: string | null;
    interests: string[];
    hashtags: string[];
    badges?: string[];
    role?: string | null;
    can_follow?: boolean;
    is_following?: boolean;
    is_traveling?: boolean;
    followers_count?: number;
    requires_follow_approval?: boolean;
    age?: number | null;
    location_city?: string | null;
    location_region?: string | null;
    location_country?: string | null;
    location?: string | null;
};

type ProfileViewer = {
    id: number | null;
    can_follow: boolean;
    is_following: boolean;
    has_pending_follow_request: boolean;
    has_subscription: boolean;
    can_block: boolean;
    has_blocked: boolean;
    is_blocked_by: boolean;
};

type FollowActionResponse = {
    status: 'pending' | 'following' | 'unfollowed';
    pending?: boolean;
    accepted?: boolean;
    followers_count?: number;
    followings_count?: number;
    message?: string;
};

type ProfilePageProps = SharedData & {
    user: ProfileUser;
    isOwnProfile: boolean;
    feed: PostCollectionPayload;
    feedPageName: string;
    feedPerPage: number;
    filters: FeedFiltersGroup;
    stats: Record<string, number>;
    viewer: ProfileViewer;
    subscriptionTiers?: SubscriptionTier[];
    tipOptions?: TipOption[];
    availability?: Availability;
    wishlist?: WishlistItem[];
};

const defaultSubscriptionTiers: SubscriptionTier[] = [
    {
        name: 'Backstage Access',
        price: '$12/mo',
        description: 'Weekly photo drops, rehearsal notes, and scene polls.',
        perks: [
            '3 premium drops per week',
            'Access to public circle rooms',
            'Voting power on upcoming rituals',
        ],
    },
    {
        name: 'Dungeon Keyholder',
        price: '$28/mo',
        description: 'Full scene archives, livestreams, and aftercare guides.',
        perks: [
            'Full archive access',
            'Monthly live Q&A with scene breakdowns',
            'Circle-only chat and tip trains',
        ],
    },
];

const defaultTipOptions: TipOption[] = [
    { amount: '$15', label: 'Buy a shot of courage' },
    { amount: '$35', label: 'Trigger the wax cascade' },
    { amount: '$80', label: 'Sponsor a suspension' },
];

const defaultAvailability: Availability = {
    status: 'Accepting IRL Collaborations',
    window: 'West Coast · Jan - Mar 2026',
    note: 'DM with references. Remote consults available weekly.',
};

const defaultWishlist: WishlistItem[] = [
    {
        title: 'Cinema-quality LED panel kit',
        price: '$1,250',
        link: '#',
    },
    {
        title: 'Custom suspension hardware upgrade',
        price: '$780',
        link: '#',
    },
    {
        title: 'Mobile audio mixing suite',
        price: '$520',
        link: '#',
    },
];

const EmptyFeedState = ({ isOwnProfile }: { isOwnProfile: boolean }) => (
    <Card className="border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-white/70">
        {isOwnProfile
            ? "You haven't shared a scene yet. Drop your first update to welcome visitors."
            : 'This creator has not posted yet. Follow to get notified the moment they drop something new.'}
    </Card>
);

const formatStatLabel = (key: string): string =>
    key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

export default function ProfileShow() {
    const {
        user,
        isOwnProfile,
        feed,
        filters,
        stats,
        viewer,
        subscriptionTiers: providedSubscriptionTiers,
        tipOptions: providedTipOptions,
        availability: providedAvailability,
        wishlist: providedWishlist,
        features: sharedFeatures,
    } = usePage<ProfilePageProps>().props;
    const features = (sharedFeatures ?? {}) as Record<string, boolean>;
    const getInitials = useInitials();
    const initials = getInitials(user.display_name ?? user.username ?? '');
    const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
    const [isBlockProcessing, setIsBlockProcessing] = useState(false);
    const [blockError, setBlockError] = useState<string | null>(null);
    const [isFollowProcessing, setIsFollowProcessing] = useState(false);
    const [followError, setFollowError] = useState<string | null>(null);
    const [isFollowing, setIsFollowing] = useState(viewer.is_following);
    const [hasPendingFollowRequest, setHasPendingFollowRequest] = useState(
        viewer.has_pending_follow_request ?? false,
    );
    const [followersCount, setFollowersCount] = useState(
        stats.followers ?? user.followers_count ?? 0,
    );
    const subscriptionTiers =
        providedSubscriptionTiers?.length
            ? providedSubscriptionTiers
            : defaultSubscriptionTiers;
    const tipOptions =
        providedTipOptions?.length ? providedTipOptions : defaultTipOptions;
    const canSupportCreator = !isOwnProfile;
    const canBlockProfile =
        viewer.can_block && !viewer.has_blocked && !viewer.is_blocked_by;
    const blockTargetLabel = user.display_name ?? user.username ?? 'this profile';

    const locationLabel =
        user.location ??
        [user.location_city, user.location_region, user.location_country]
            .filter((value) => Boolean(value && value.trim()))
            .join(', ');
    const availability = providedAvailability ?? defaultAvailability;
    const wishlist =
        providedWishlist?.length ? providedWishlist : defaultWishlist;
    useEffect(() => {
        setIsFollowing(viewer.is_following);
        setHasPendingFollowRequest(viewer.has_pending_follow_request ?? false);
    }, [viewer.is_following, viewer.has_pending_follow_request]);

    useEffect(() => {
        setFollowersCount(stats.followers ?? user.followers_count ?? 0);
    }, [stats.followers, user.followers_count]);

    const statEntries = useMemo(
        () => {
            const withFollowers = {
                ...stats,
                followers: followersCount,
            };

            return Object.entries(withFollowers).map(([key, value]) => ({
                label: formatStatLabel(key),
                value: Number.isFinite(value)
                    ? Number(value).toLocaleString()
                    : String(value),
            }));
        },
        [stats, followersCount],
    );
    const requiresApproval = Boolean(user.requires_follow_approval);
    const canFollowProfile =
        viewer.id !== null && viewer.can_follow && !viewer.has_blocked && !viewer.is_blocked_by;
    const followButtonLabel = isFollowProcessing
        ? 'Processing…'
        : isFollowing
        ? 'Following'
        : hasPendingFollowRequest
        ? 'Requested'
        : requiresApproval
        ? 'Request Follow'
        : 'Follow';
    const followButtonVariant: 'default' | 'outline' = hasPendingFollowRequest ? 'outline' : 'default';
    const followButtonClassName = [
        'rounded-full px-5 transition-colors',
        isFollowProcessing ? 'opacity-80' : null,
        isFollowing
            ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-white shadow-[0_18px_40px_-14px_rgba(249,115,22,0.55)] hover:from-amber-400/90 hover:via-rose-500/90 hover:to-violet-600/90'
            : hasPendingFollowRequest
            ? 'border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/20'
            : 'bg-white text-neutral-900 hover:bg-white/90',
    ]
        .filter(Boolean)
        .join(' ');
    const followButtonDisabled = isFollowProcessing;
    const topInterests = useMemo(
        () => (user.interests ?? []).slice(0, 4),
        [user.interests],
    );
    const canMessage = !isOwnProfile && viewer.id !== null;
    const messageHref = useMemo(() => {
        if (!canMessage) {
            return null;
        }

        if (user.username) {
            return messagesRoutes.index.url({
                query: { compose: user.username },
            });
        }

        return messagesRoutes.index.url();
    }, [canMessage, user.username]);

    const transformProfilePayload = useCallback(
        (payload: TimelinePayload | PostCollectionPayload): TimelinePayload => {
            if (
                payload.data.length > 0 &&
                typeof payload.data[0] === 'object' &&
                payload.data[0] !== null &&
                'post' in (payload.data[0] as Record<string, unknown>)
            ) {
                return payload as TimelinePayload;
            }

            const collection = payload as PostCollectionPayload;

            return {
                data: collection.data.map((post: FeedPost) => ({
                    id: post.id,
                    visibility_source: isOwnProfile ? 'self' : 'profile',
                    context: {
                        profile: user.username ?? user.id,
                    },
                    visible_at: post.published_at ?? post.created_at,
                    created_at: post.created_at,
                    post,
                })),
                links: collection.links ?? {},
                meta: collection.meta,
            };
        },
        [isOwnProfile, user.id, user.username],
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
        initialPayload: feed,
        fetchPage: (page) =>
            fetchProfileFeedPage(user.id, {
                page,
                mergeQuery: true,
            }),
        transformPayload: transformProfilePayload,
        errorMessage: 'We could not load this profile feed. Please try again.',
    });

    const submitFollowMutation = useCallback(
        async (method: 'POST' | 'DELETE') => {
            if (typeof user.id !== 'number') {
                return;
            }

            const endpoint =
                method === 'POST'
                    ? usersRoutes.follow.store.url(user.id)
                    : usersRoutes.follow.destroy.url(user.id);

            setIsFollowProcessing(true);
            setFollowError(null);

            try {
                const csrfToken = getCsrfToken();
                const response = await fetch(endpoint, {
                    method,
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
                    },
                    credentials: 'include',
                });

                let payload: FollowActionResponse | null = null;

                try {
                    payload = (await response.json()) as FollowActionResponse;
                } catch {
                    payload = null;
                }

                if (!response.ok || payload === null) {
                    const message =
                        payload?.message ??
                        'We could not update your follow settings. Please try again.';
                    throw new Error(message);
                }

                setIsFollowing(Boolean(payload.accepted));
                setHasPendingFollowRequest(Boolean(payload.pending));
                setFollowersCount((previous) =>
                    typeof payload.followers_count === 'number'
                        ? payload.followers_count
                        : previous,
                );
                setFollowError(null);
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : 'We could not update your follow settings. Please try again.';
                setFollowError(message);
                console.error(error);
            } finally {
                setIsFollowProcessing(false);
            }
        },
        [user.id],
    );

    const handleFollowClick = useCallback(async () => {
        if (followButtonDisabled) {
            return;
        }

        const method = isFollowing || hasPendingFollowRequest ? 'DELETE' : 'POST';

        await submitFollowMutation(method);
    }, [followButtonDisabled, isFollowing, hasPendingFollowRequest, submitFollowMutation]);

    const handleConfirmBlock = useCallback(() => {
        if (!canBlockProfile || isBlockProcessing) {
            return;
        }

        setBlockError(null);
        setIsBlockProcessing(true);

        router.post(
            usersRoutes.block.store.url(user.id),
            { reason: null },
            {
                preserveScroll: true,
                onError: (errors: Record<string, string>) => {
                    const message =
                        typeof errors.reason === 'string'
                            ? errors.reason
                            : 'We could not block this profile. Please try again.';
                    setBlockError(message);
                },
                onSuccess: () => {
                    setIsBlockDialogOpen(false);
                },
                onFinish: () => {
                    setIsBlockProcessing(false);
                },
            },
        );
    }, [canBlockProfile, isBlockProcessing, user.id]);


    return (
        <>
            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    {
                        title: user.display_name ?? user.username ?? 'Profile',
                        href: profileRoutes.show.url(user.username ?? ''),
                    },
                ]}
            >
            <Head title={`${user.display_name ?? user.username ?? 'Profile'} · Profile`} />

            <div className="space-y-8">
                <section className="rounded-3xl border border-white/15 bg-black/30">
                    <div className="relative h-48 w-full overflow-hidden rounded-t-3xl md:h-56">
                        {user.cover_url ? (
                            <div
                                className="h-full w-full bg-cover bg-center"
                                style={{ backgroundImage: `url(${user.cover_url})` }}
                            />
                        ) : (
                            <CoverGradient className="h-full w-full" />
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-black/20" />
                    </div>
                    <div className="p-6 sm:p-8">
                        <div className="-mt-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="flex items-end gap-4">
                                <div className="relative -mt-2 h-28 w-28 overflow-hidden rounded-3xl border-4 border-neutral-950 shadow-[0_18px_45px_-20px_rgba(249,115,22,0.5)]">
                                    {user.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.display_name ?? user.username ?? ''}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 text-2xl font-semibold text-white">
                                            {initials}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1 pt-4 text-white">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                                            {user.display_name ?? user.username ?? 'Creator'}
                                        </h1>
                                        {user.is_traveling ? (
                                            <Badge className="flex items-center gap-1 rounded-full border border-emerald-400/60 bg-emerald-400/15 px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-emerald-200">
                                                <Plane className="size-3" />
                                                Visiting
                                            </Badge>
                                        ) : null}
                                    </div>
                                    {user.username && (
                                        <p className="text-sm uppercase tracking-[0.4em] text-white/50">
                                            @{user.username}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 text-sm text-white/70 lg:items-end lg:self-end lg:mb-5">
                                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/55">
                                    {locationLabel && (
                                        <span>{locationLabel}</span>
                                    )}
                                    {locationLabel && user.pronouns && (
                                        <span className="text-white/45">•</span>
                                    )}
                                    {user.pronouns && <span>{user.pronouns}</span>}
                                </div>
                                {topInterests.length > 0 && (
                                    <div className="flex flex-wrap gap-2 lg:justify-end">
                                        {topInterests.map((interest) => (
                                            <Badge
                                                key={interest}
                                                className="rounded-full border-white/20 bg-white/10 text-xs text-white/70"
                                            >
                                                {interest}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <Separator className="my-6 border-white/10" />
                        <div className="space-y-4 text-sm text-white/70">
                            <div
                                className="[&_p:not(:first-child)]:mt-3 [&_strong]:font-semibold [&_u]:underline [&_s]:line-through [&_br]:block"
                                dangerouslySetInnerHTML={{
                                    __html: user.bio ?? '',
                                }}
                            />
                            {user.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {user.hashtags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="rounded-full border-white/20 bg-white/5 text-xs text-white/60"
                                        >
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {canFollowProfile && (
                                <div className="flex flex-col gap-1">
                                    <Button
                                        type="button"
                                        variant={followButtonVariant}
                                        className={followButtonClassName}
                                        onClick={handleFollowClick}
                                        disabled={followButtonDisabled}
                                    >
                                        {isFollowProcessing && (
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                        )}
                                        {followButtonLabel}
                                    </Button>
                                    {followError ? (
                                        <span className="text-xs text-rose-300">{followError}</span>
                                    ) : hasPendingFollowRequest ? (
                                        <span className="text-xs text-white/60">
                                            Awaiting approval — tap to cancel.
                                        </span>
                                    ) : requiresApproval && !isFollowing ? (
                                        <span className="text-xs text-white/60">
                                            This creator approves each follower before granting access.
                                        </span>
                                    ) : null}
                                </div>
                            )}
                            {canSupportCreator && subscriptionTiers.length > 0 && (
                                <SubscribeDialog
                                    tiers={subscriptionTiers}
                                    trigger={
                                        <Button className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-[1.02]">
                                            Subscribe
                                        </Button>
                                    }
                                />
                            )}
                            {canSupportCreator && tipOptions.length > 0 && (
                                <TipDialog
                                    options={tipOptions}
                                    trigger={
                                        <Button
                                            variant="outline"
                                            className="rounded-full border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/20"
                                        >
                                            Send Tip
                                        </Button>
                                    }
                                />
                            )}
                            {canSupportCreator && features.feature_signals_enabled && features.feature_wishlist_enabled && (
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                                >
                                    <Link href={`/w/${user.username ?? ''}`}>
                                        Wishlist
                                    </Link>
                                </Button>
                            )}
                            {canMessage && messageHref && (
                                <Button
                                    asChild
                                    variant="outline"
                                    className="rounded-full border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/20"
                                >
                                    <Link href={messageHref}>Message</Link>
                                </Button>
                            )}
                            {canBlockProfile && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-full border-rose-500/40 bg-rose-500/10 text-rose-100 hover:border-rose-500/60 hover:bg-rose-500/20 hover:text-rose-50"
                                    onClick={() => {
                                        if (isBlockProcessing) {
                                            return;
                                        }

                                        setBlockError(null);
                                        setIsBlockDialogOpen(true);
                                    }}
                                    disabled={isBlockProcessing}
                                >
                                    <Ban className="mr-2 size-4" />
                                    Block
                                </Button>
                            )}
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[1.7fr_1.1fr]">
                    <section className="space-y-6">
                        {statEntries.length > 0 && (
                            <Card className="border-white/10 bg-white/5 text-white">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Scene stats</CardTitle>
                                    <CardDescription className="text-white/60">
                                        Live metrics updated every hour.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        {statEntries.map((stat) => (
                                            <div
                                                key={stat.label}
                                                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-5"
                                            >
                                                <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                                                    {stat.label}
                                                </p>
                                                <p className="mt-2 text-2xl font-semibold text-white">
                                                    {stat.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Creator feed</CardTitle>
                                <CardDescription className="text-white/60">
                                    Latest drops, circle updates, and monetized moments.
                                </CardDescription>
                                {filters.time_ranges.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {filters.time_ranges.map((range) => (
                                            <Badge
                                                key={range.value}
                                                className="rounded-full border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60"
                                            >
                                                {range.label}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {error && (
                                    <Alert
                                        variant="destructive"
                                        className="border border-rose-400/40 bg-rose-500/10 text-white backdrop-blur"
                                    >
                                        <AlertCircle className="col-start-1 text-rose-100" />
                                        <div className="col-start-2 space-y-1">
                                            <AlertTitle className="text-sm font-semibold">
                                                Feed unavailable
                                            </AlertTitle>
                                            <AlertDescription className="text-xs text-rose-100/80">
                                                {error}
                                            </AlertDescription>
                                        </div>
                                    </Alert>
                                )}
                                {entries.length === 0 ? (
                                    <EmptyFeedState isOwnProfile={isOwnProfile} />
                                ) : (
                                    <>
                                        {entries.map((entry: TimelineEntry) => {
                                            const postId = entry.post?.id ?? null;
                                            const isPostPending =
                                                postId !== null &&
                                                (pendingLikes.includes(postId) ||
                                                    pendingPurchases.includes(postId) ||
                                                    pendingBookmarks.includes(postId));

                                            return (
                                                <TimelineEntryCard
                                                    key={`${entry.id}-${entry.created_at}`}
                                                    entry={entry}
                                                    onLike={toggleLike}
                                                    onBookmark={toggleBookmark}
                                                    onComment={openComments}
                                                    onPurchase={togglePurchase}
                                                    disabled={isPostPending || isRefreshing}
                                                />
                                            );
                                        })}
                                        {isLoadingMore && <FeedLoadingPlaceholder />}
                                    </>
                                )}
                            </CardContent>
                            <CardFooter className="justify-center">
                                {hasMore ? (
                                    <div ref={sentinelRef} className="h-8 w-full" />
                                ) : (
                                    <Button
                                        variant="ghost"
                                        className="rounded-full border border-white/10 bg-white/10 px-4 text-xs text-white/70 hover:border-white/30 hover:bg-white/20 disabled:cursor-wait disabled:border-white/10 disabled:bg-white/10 disabled:text-white/50"
                                        onClick={() => void refresh()}
                                        disabled={isRefreshing}
                                    >
                                        {isRefreshing ? 'Refreshing…' : 'Refresh feed'}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>

                        {isOwnProfile && (
                            <Card className="border border-dashed border-white/15 bg-white/5 p-6 text-sm text-white/70">
                                Compose tools for your profile feed are on deck. Drop posts from your
                                dashboard to spotlight them here.
                            </Card>
                        )}
                    </section>

                    <aside className="space-y-6">
                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Availability</CardTitle>
                                <CardDescription className="text-white/60">
                                    Updated weekly for collaborators.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-white/75">
                                <p className="text-base font-semibold text-white">{availability.status}</p>
                                <p className="text-white/65">{availability.window}</p>
                                <p>{availability.note}</p>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    variant="ghost"
                                    className="w-full rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                                >
                                    Request collaboration
                                </Button>
                            </CardFooter>
                        </Card>

                        {subscriptionTiers.length > 0 && (
                            <Card className="border-white/10 bg-white/5 text-white">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Membership tiers</CardTitle>
                                    <CardDescription className="text-white/60">
                                        Choose your level of access and perks.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {subscriptionTiers.map((tier) => (
                                        <div
                                            key={tier.name}
                                            className="space-y-3 rounded-2xl border border-white/10 bg-black/35 p-4"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="text-sm font-semibold text-white">{tier.name}</h3>
                                                <Badge className="rounded-full border-white/15 bg-white/10 text-xs text-white/70">
                                                    {tier.price}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-white/65">{tier.description}</p>
                                            <ul className="space-y-2 text-xs text-white/60">
                                                {tier.perks.map((perk) => (
                                                    <li key={perk} className="flex items-start gap-2">
                                                        <span className="mt-1 size-1.5 rounded-full bg-amber-400" />
                                                        <span>{perk}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <Button className="w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-xs font-semibold">
                                                Join tier
                                            </Button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {tipOptions.length > 0 && (
                            <Card className="border-white/10 bg-white/5 text-white">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Tip jar</CardTitle>
                                    <CardDescription className="text-white/60">
                                        Boost the next scene or unlock bonuses instantly.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-2">
                                    {tipOptions.map((tip) => (
                                        <Button
                                            key={tip.amount}
                                            variant="ghost"
                                            className="rounded-full border border-white/15 bg-white/5 px-4 text-sm text-white/80 hover:border-white/40 hover:bg-white/10 hover:text-white"
                                        >
                                            <span className="font-semibold text-white">{tip.amount}</span>
                                            <span className="ml-2 text-xs text-white/70">{tip.label}</span>
                                        </Button>
                                    ))}
                                </CardContent>
                                <CardFooter>
                                    <TipDialog
                                        options={tipOptions}
                                        trigger={
                                            <Button className="w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-sm font-semibold">
                                                Custom tip
                                            </Button>
                                        }
                                    />
                                </CardFooter>
                            </Card>
                        )}

                        {wishlist.length > 0 && (
                            <Card className="border-white/10 bg-white/5 text-white">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Wishlist</CardTitle>
                                    <CardDescription className="text-white/60">
                                        Help unlock new gear, travel, and production upgrades.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {wishlist.map((item) => (
                                        <div
                                            key={item.title}
                                            className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-white/75"
                                        >
                                            <div className="flex items-center justify-between gap-2 text-white">
                                                <p className="font-semibold">{item.title}</p>
                                                <span className="text-xs uppercase tracking-[0.3em] text-white/55">
                                                    {item.price}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-xs text-white/60">
                                                {user.display_name ?? user.username ?? 'This creator'} will shout you out
                                                on the next drop.
                                            </p>
                                            <Button
                                                variant="ghost"
                                                className="mt-3 w-full rounded-full border border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                            >
                                                Gift this
                                            </Button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </aside>
                </div>
            </div>
            </AppLayout>
            <CommentThreadSheet
                post={activeCommentPost}
                open={isCommentSheetOpen && activeCommentPost !== null}
                onOpenChange={handleCommentsOpenChange}
                onCommentAdded={handleCommentAdded}
            />
            <Dialog
                open={isBlockDialogOpen}
                onOpenChange={(open) => {
                    if (isBlockProcessing) {
                        return;
                    }

                    setIsBlockDialogOpen(open);

                    if (!open) {
                        setBlockError(null);
                    }
                }}
            >
                <DialogContent className="border-white/10 bg-neutral-950 text-white sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            Block {blockTargetLabel}
                        </DialogTitle>
                        <DialogDescription className="text-white/60">
                            Blocking removes past interactions and keeps your profile hidden from this member.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm text-white/75">
                        <p>
                            Once blocked, {blockTargetLabel} won&apos;t be able to follow you, view your profile, message you, or interact with your posts.
                        </p>
                        <ul className="list-disc space-y-2 pl-5 text-white/60">
                            <li>Removes existing follows, likes, bookmarks, and timeline entries between you both.</li>
                            <li>Hides all of their posts, comments, and notifications from your experience.</li>
                            <li>You can unblock them anytime from Settings &rarr; Blocked users.</li>
                        </ul>
                        {blockError && (
                            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                                {blockError}
                            </p>
                        )}
                    </div>
                    <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            className="rounded-full px-4 text-white/70 hover:bg-white/10 hover:text-white"
                            onClick={() => {
                                setBlockError(null);
                                setIsBlockDialogOpen(false);
                            }}
                            disabled={isBlockProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            className="rounded-full px-5"
                            onClick={handleConfirmBlock}
                            disabled={isBlockProcessing}
                        >
                            <span className="flex items-center gap-2">
                                {isBlockProcessing && <Loader2 className="size-4 animate-spin" />}
                                <Ban className="size-4" />
                                Block profile
                            </span>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
