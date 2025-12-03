import { useCallback, useEffect, useMemo, useState } from 'react';

import CoverGradient from '@/components/cover-gradient';
import CommentThreadSheet from '@/components/feed/comment-thread-sheet';
import FeedLoadingPlaceholder from '@/components/feed/feed-loading-placeholder';
import { useLightbox } from '@/components/feed/lightbox-context';
import TimelineEntryCard from '@/components/feed/timeline-entry-card';
import { GiftMembershipDialog } from '@/components/memberships/GiftMembershipDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFeed } from '@/hooks/use-feed';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import { getCsrfToken } from '@/lib/csrf';
import { fetchProfileFeedPage } from '@/lib/feed-client';
import { SubscribeDialog, TipDialog } from '@/pages/Profile/dialogs';
import type {
    SubscriptionTier,
    TipOption,
    WishlistItem,
} from '@/pages/Profile/types';
import messagesRoutes from '@/routes/messages';
import profileRoutes from '@/routes/profile';
import usersRoutes from '@/routes/users';
import type { SharedData, User as SharedUser } from '@/types';
import type {
    FeedFiltersGroup,
    FeedMedia,
    FeedPost,
    PostCollectionPayload,
    TimelineEntry,
    TimelinePayload,
} from '@/types/feed';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Ban,
    BookmarkCheck,
    CheckCircle2,
    Coins,
    FileText,
    Gift,
    Loader2,
    MessageCircle,
    MoreVertical,
    Plane,
} from 'lucide-react';

type ProfileUser = SharedUser & {
    display_name?: string | null;
    pronouns?: string | null;
    bio?: string | null;
    interests: string[];
    hashtags: string[];
    circles?: Array<{
        id: number;
        name: string;
        slug: string;
    }>;
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
    is_creator?: boolean;
    is_verified?: boolean;
};

type MediaItem = {
    id: number;
    url: string;
    thumbnail_url?: string | null;
    mime_type?: string | null;
    is_video: boolean;
    post_id: number;
    post?: FeedPost | null;
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
    can_receive_gift?: boolean;
};

type FollowActionResponse = {
    status: 'pending' | 'following' | 'unfollowed';
    pending?: boolean;
    accepted?: boolean;
    followers_count?: number;
    followings_count?: number;
    message?: string;
};

type MembershipPlan = {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    description: string;
    monthly_price: number;
    currency: string;
    one_time_duration_days: number;
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
    wishlist?: WishlistItem[];
    recentMedia?: MediaItem[];
    giftMembershipPlans?: MembershipPlan[];
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
    key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

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
        wishlist: providedWishlist,
        recentMedia = [],
        giftMembershipPlans = [],
        features: sharedFeatures,
    } = usePage<ProfilePageProps>().props;
    const features = (sharedFeatures ?? {}) as Record<string, boolean>;
    const { openLightbox } = useLightbox();
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
    const subscriptionTiers = providedSubscriptionTiers?.length
        ? providedSubscriptionTiers
        : defaultSubscriptionTiers;
    const tipOptions = providedTipOptions?.length
        ? providedTipOptions
        : defaultTipOptions;
    const canSupportCreator = !isOwnProfile;
    const canBlockProfile =
        viewer.can_block && !viewer.has_blocked && !viewer.is_blocked_by;
    const canGiftMembership =
        !isOwnProfile &&
        viewer.can_receive_gift &&
        giftMembershipPlans.length > 0;
    const blockTargetLabel =
        user.display_name ?? user.username ?? 'this profile';

    const locationLabel =
        user.location ??
        [user.location_city, user.location_region, user.location_country]
            .filter((value) => Boolean(value && value.trim()))
            .join(', ');
    const wishlist = providedWishlist?.length
        ? providedWishlist
        : defaultWishlist;
    useEffect(() => {
        setIsFollowing(viewer.is_following);
        setHasPendingFollowRequest(viewer.has_pending_follow_request ?? false);
    }, [viewer.is_following, viewer.has_pending_follow_request]);

    useEffect(() => {
        setFollowersCount(stats.followers ?? user.followers_count ?? 0);
    }, [stats.followers, user.followers_count]);

    const statEntries = useMemo(() => {
        const withFollowers = {
            ...stats,
            followers: followersCount,
        };

        // Filter out followers, following, and subscribers - they'll be in the header
        // Also exclude: likes, circles, events, stories, tips_sent
        const excludedKeys = [
            'followers',
            'following',
            'subscribers',
            'likes',
            'circles',
            'events',
            'stories',
            'tips_sent',
        ];

        // Filter out stats for disabled features
        const signalsEnabled = features.feature_signals_enabled ?? false;
        const wishlistEnabled = features.feature_wishlist_enabled ?? false;

        if (!signalsEnabled || !wishlistEnabled) {
            excludedKeys.push('wishlist_items');
        }

        const iconMap: Record<string, typeof FileText> = {
            posts: FileText,
            comments: MessageCircle,
            bookmarks: BookmarkCheck,
            wishlist_items: Gift,
        };

        return Object.entries(withFollowers)
            .filter(([key]) => !excludedKeys.includes(key))
            .map(([key, value]) => ({
                key,
                label: formatStatLabel(key),
                value: Number.isFinite(value)
                    ? Number(value).toLocaleString()
                    : String(value),
                icon: iconMap[key] ?? FileText,
            }));
    }, [
        stats,
        followersCount,
        features.feature_signals_enabled,
        features.feature_wishlist_enabled,
    ]);

    // Extract social stats for header display
    const socialStats = useMemo(() => {
        return {
            followers: followersCount,
            following: stats.following ?? 0,
            subscribers: stats.subscribers ?? 0,
        };
    }, [stats, followersCount]);
    const requiresApproval = Boolean(user.requires_follow_approval);
    const canFollowProfile =
        viewer.id !== null &&
        viewer.can_follow &&
        !viewer.has_blocked &&
        !viewer.is_blocked_by;
    const followButtonLabel = isFollowProcessing
        ? 'Processing…'
        : isFollowing
          ? 'Following'
          : hasPendingFollowRequest
            ? 'Requested'
            : requiresApproval
              ? 'Request Follow'
              : 'Follow';
    const followButtonVariant: 'default' | 'outline' = hasPendingFollowRequest
        ? 'outline'
        : 'default';
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
    const canMessage = viewer.can_message ?? false;
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

        const method =
            isFollowing || hasPendingFollowRequest ? 'DELETE' : 'POST';

        await submitFollowMutation(method);
    }, [
        followButtonDisabled,
        isFollowing,
        hasPendingFollowRequest,
        submitFollowMutation,
    ]);

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
                <Head
                    title={`${user.display_name ?? user.username ?? 'Profile'} · Profile`}
                />

                <div className="space-y-8">
                    <section className="relative rounded-2xl border border-white/15 bg-black/30 sm:rounded-3xl">
                        <div className="relative h-40 w-full overflow-hidden rounded-t-2xl sm:h-48 sm:rounded-t-3xl md:h-56">
                            {user.cover_url ? (
                                <div
                                    className="h-full w-full bg-cover bg-center"
                                    style={{
                                        backgroundImage: `url(${user.cover_url})`,
                                    }}
                                />
                            ) : (
                                <CoverGradient className="h-full w-full" />
                            )}
                            <div className="pointer-events-none absolute inset-0 bg-black/20" />
                            {/* Darken gradient at bottom for better text readability */}
                            <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent sm:h-32" />
                        </div>
                        <div className="relative z-10 p-4 sm:p-6 md:p-8">
                            <div className="-mt-10 flex flex-col gap-4 sm:-mt-14 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="relative z-10 -mt-2 h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-neutral-950 shadow-[0_18px_45px_-20px_rgba(249,115,22,0.5)] sm:h-28 sm:w-28 sm:rounded-3xl">
                                        {user.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={
                                                    user.display_name ??
                                                    user.username ??
                                                    ''
                                                }
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 text-xl font-semibold text-white sm:text-2xl">
                                                {initials}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-1.5 text-white sm:space-y-2">
                                        <h1 className="text-2xl leading-tight font-semibold break-words sm:truncate sm:text-3xl md:text-4xl">
                                            {user.display_name ??
                                                user.username ??
                                                'Creator'}
                                        </h1>
                                        {user.username && (
                                            <p className="truncate text-xs tracking-[0.3em] text-white/50 uppercase sm:text-sm sm:tracking-[0.4em]">
                                                @{user.username}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                            {user.is_verified && (
                                                <Badge className="flex items-center gap-0.5 rounded-full border border-blue-400/60 bg-blue-400/15 px-2 py-0.5 text-[0.6rem] tracking-[0.3em] text-blue-200 uppercase sm:gap-1 sm:px-3 sm:py-1 sm:text-[0.65rem] sm:tracking-[0.35em]">
                                                    <CheckCircle2 className="size-2.5 sm:size-3" />
                                                    Verified
                                                </Badge>
                                            )}
                                            {user.is_traveling ? (
                                                <Badge className="flex items-center gap-0.5 rounded-full border border-emerald-400/60 bg-emerald-400/15 px-2 py-0.5 text-[0.6rem] tracking-[0.3em] text-emerald-200 uppercase sm:gap-1 sm:px-3 sm:py-1 sm:text-[0.65rem] sm:tracking-[0.35em]">
                                                    <Plane className="size-2.5 sm:size-3" />
                                                    Visiting
                                                </Badge>
                                            ) : null}
                                        </div>
                                        {/* Social Stats */}
                                        <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs sm:gap-4 sm:pt-1 sm:text-sm">
                                            <Link
                                                href={`/f/${user.username}/followers`}
                                                className="flex items-center gap-1 text-white/70 transition hover:text-white sm:gap-1.5"
                                            >
                                                <span className="font-semibold text-white">
                                                    {socialStats.followers.toLocaleString()}
                                                </span>
                                                <span className="text-[0.65rem] tracking-[0.15em] uppercase sm:text-xs sm:tracking-[0.2em]">
                                                    Followers
                                                </span>
                                            </Link>
                                            <Link
                                                href={`/f/${user.username}/following`}
                                                className="flex items-center gap-1 text-white/70 transition hover:text-white sm:gap-1.5"
                                            >
                                                <span className="font-semibold text-white">
                                                    {socialStats.following.toLocaleString()}
                                                </span>
                                                <span className="text-[0.65rem] tracking-[0.15em] uppercase sm:text-xs sm:tracking-[0.2em]">
                                                    Following
                                                </span>
                                            </Link>
                                            {features.feature_signals_enabled && (
                                                <button
                                                    type="button"
                                                    className="flex items-center gap-1 text-white/70 transition hover:text-white sm:gap-1.5"
                                                >
                                                    <span className="font-semibold text-white">
                                                        {socialStats.subscribers.toLocaleString()}
                                                    </span>
                                                    <span className="text-[0.65rem] tracking-[0.15em] uppercase sm:text-xs sm:tracking-[0.2em]">
                                                        Subscribers
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5 text-xs text-white/70 sm:gap-2 sm:text-sm lg:mb-5 lg:items-end lg:self-end">
                                    <div className="flex flex-wrap items-center gap-1.5 text-[0.65rem] tracking-[0.3em] text-white/55 uppercase sm:gap-2 sm:text-xs sm:tracking-[0.35em]">
                                        {locationLabel && (
                                            <span className="truncate">
                                                {locationLabel}
                                            </span>
                                        )}
                                        {locationLabel && user.pronouns && (
                                            <span className="text-white/45">
                                                •
                                            </span>
                                        )}
                                        {user.pronouns && (
                                            <span className="truncate">
                                                {user.pronouns}
                                            </span>
                                        )}
                                    </div>
                                    {topInterests.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2 lg:justify-end">
                                            {topInterests.map((interest) => (
                                                <Badge
                                                    key={interest}
                                                    className="rounded-full border-white/20 bg-white/10 text-[0.65rem] text-white/70 sm:text-xs"
                                                >
                                                    {interest}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Separator className="my-4 border-white/10 sm:my-6" />
                            <div className="space-y-3 text-xs text-white/70 sm:space-y-4 sm:text-sm">
                                <div
                                    className="[&_br]:block [&_p:not(:first-child)]:mt-2 sm:[&_p:not(:first-child)]:mt-3 [&_s]:line-through [&_strong]:font-semibold [&_u]:underline"
                                    dangerouslySetInnerHTML={{
                                        __html: user.bio ?? '',
                                    }}
                                />
                                {user.hashtags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        {user.hashtags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="secondary"
                                                className="rounded-full border-white/20 bg-white/5 text-[0.65rem] text-white/60 sm:text-xs"
                                            >
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="mt-3 flex flex-wrap items-start gap-2 sm:mt-4 sm:items-center sm:gap-3">
                                {/* Primary Action: Follow */}
                                {canFollowProfile && (
                                    <div className="flex flex-col gap-0.5 sm:gap-1">
                                        <Button
                                            type="button"
                                            variant={followButtonVariant}
                                            className={`${followButtonClassName} text-xs sm:text-sm`}
                                            onClick={handleFollowClick}
                                            disabled={followButtonDisabled}
                                        >
                                            {isFollowProcessing && (
                                                <Loader2 className="mr-1.5 size-3 animate-spin sm:mr-2 sm:size-4" />
                                            )}
                                            {followButtonLabel}
                                        </Button>
                                        {followError ? (
                                            <span className="text-[0.65rem] text-rose-300 sm:text-xs">
                                                {followError}
                                            </span>
                                        ) : hasPendingFollowRequest ? (
                                            <span className="text-[0.65rem] text-white/60 sm:text-xs">
                                                Awaiting approval — tap to
                                                cancel.
                                            </span>
                                        ) : requiresApproval && !isFollowing ? (
                                            <span className="text-[0.65rem] text-white/60 sm:text-xs">
                                                This creator approves each
                                                follower before granting access.
                                            </span>
                                        ) : null}
                                    </div>
                                )}

                                {/* Support Actions: Subscribe */}
                                {canSupportCreator &&
                                    features.feature_signals_enabled &&
                                    subscriptionTiers.length > 0 && (
                                        <SubscribeDialog
                                            tiers={subscriptionTiers}
                                            trigger={
                                                <Button className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-3 text-xs font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-[1.02] sm:px-4 sm:text-sm">
                                                    Subscribe
                                                </Button>
                                            }
                                        />
                                    )}

                                {/* Support Actions: Gift Membership */}
                                {canGiftMembership && (
                                    <GiftMembershipDialog
                                        recipientId={user.id}
                                        recipientName={
                                            user.display_name ??
                                            user.username ??
                                            'this user'
                                        }
                                        plans={giftMembershipPlans}
                                        trigger={
                                            <Button className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 text-xs font-semibold text-amber-300 shadow-[0_18px_40px_-12px_rgba(249,115,22,0.25)] hover:scale-[1.02] hover:border-amber-400/60 hover:bg-amber-400/20 sm:px-4 sm:text-sm">
                                                <Gift className="mr-1.5 size-3 sm:size-3.5" />
                                                Gift Membership
                                            </Button>
                                        }
                                    />
                                )}

                                {/* Quick Actions: Icon Buttons */}
                                <TooltipProvider delayDuration={300}>
                                    <div className="flex items-center gap-1.5 sm:ml-auto sm:gap-2">
                                        {canMessage &&
                                            features.feature_messaging_enabled &&
                                            messageHref && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            asChild
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-9 rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10 hover:text-white sm:size-10"
                                                        >
                                                            <Link
                                                                href={
                                                                    messageHref
                                                                }
                                                            >
                                                                <MessageCircle className="size-3.5 sm:size-4" />
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        side="bottom"
                                                        className="border-white/10 bg-black/95 text-white shadow-[0_28px_85px_-58px_rgba(249,115,22,0.5)] ring-1 ring-amber-400/20 backdrop-blur-xl"
                                                    >
                                                        Message
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        {canSupportCreator &&
                                            features.feature_signals_enabled &&
                                            features.feature_wishlist_enabled && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            asChild
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-9 rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10 hover:text-white sm:size-10"
                                                        >
                                                            <Link
                                                                href={`/w/${user.username ?? ''}`}
                                                            >
                                                                <Gift className="size-3.5 sm:size-4" />
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        side="bottom"
                                                        className="border-white/10 bg-black/95 text-white shadow-[0_28px_85px_-58px_rgba(249,115,22,0.5)] ring-1 ring-amber-400/20 backdrop-blur-xl"
                                                    >
                                                        Wishlist
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        {canSupportCreator &&
                                            features.feature_signals_enabled &&
                                            tipOptions.length > 0 && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <TipDialog
                                                            options={tipOptions}
                                                            trigger={
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-9 rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10 hover:text-white sm:size-10"
                                                                >
                                                                    <Coins className="size-3.5 sm:size-4" />
                                                                </Button>
                                                            }
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        side="bottom"
                                                        className="border-white/10 bg-black/95 text-white shadow-[0_28px_85px_-58px_rgba(249,115,22,0.5)] ring-1 ring-amber-400/20 backdrop-blur-xl"
                                                    >
                                                        Send tip
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        {canBlockProfile &&
                                            features.blocking && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-9 rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10 hover:text-white sm:size-10"
                                                            title="More options"
                                                        >
                                                            <MoreVertical className="size-3.5 sm:size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-48 border border-amber-400/30 bg-black/95 shadow-[0_28px_85px_-58px_rgba(249,115,22,0.5)] ring-1 ring-amber-400/20 backdrop-blur-xl"
                                                    >
                                                        <DropdownMenuItem
                                                            className="cursor-pointer text-rose-100 focus:bg-rose-500/20 focus:text-rose-50"
                                                            onClick={() => {
                                                                if (
                                                                    isBlockProcessing
                                                                ) {
                                                                    return;
                                                                }

                                                                setBlockError(
                                                                    null,
                                                                );
                                                                setIsBlockDialogOpen(
                                                                    true,
                                                                );
                                                            }}
                                                            disabled={
                                                                isBlockProcessing
                                                            }
                                                        >
                                                            <Ban className="mr-2 size-4" />
                                                            Block profile
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                    </div>
                                </TooltipProvider>
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-6 lg:grid-cols-[1.7fr_1.1fr]">
                        <section className="space-y-6">
                            {statEntries.length > 0 && (
                                <Card className="border-white/10 bg-white/5 text-white">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold">
                                            Scene stats
                                        </CardTitle>
                                        <CardDescription className="text-white/60">
                                            Live metrics updated every hour.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {statEntries.map((stat) => {
                                                const Icon = stat.icon;
                                                return (
                                                    <div
                                                        key={stat.key}
                                                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-black/50 via-black/40 to-black/50 px-4 py-4 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-all hover:border-white/20 hover:shadow-[0_8px_32px_-16px_rgba(249,115,22,0.2)] sm:rounded-2xl sm:px-5 sm:py-5"
                                                    >
                                                        <div className="relative flex items-center gap-3 sm:gap-4">
                                                            <div className="flex size-9 items-center justify-center rounded-lg border border-amber-400/20 bg-gradient-to-br from-amber-400/20 via-amber-300/15 to-amber-400/10 text-amber-300 shadow-[0_4px_16px_-8px_rgba(251,191,36,0.3)] transition-all group-hover:shadow-[0_6px_20px_-8px_rgba(251,191,36,0.4)] sm:size-10 sm:rounded-xl">
                                                                <Icon className="size-4 sm:size-5" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="mb-0.5 text-xs font-semibold text-white sm:text-sm">
                                                                    {stat.value}
                                                                </p>
                                                                <p className="text-[0.65rem] tracking-[0.3em] text-white/55 uppercase sm:text-xs">
                                                                    {stat.label}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="border-white/10 bg-white/5 text-white">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">
                                        Creator feed
                                    </CardTitle>
                                    <CardDescription className="text-white/60">
                                        Latest drops, circle updates, and
                                        monetized moments.
                                    </CardDescription>
                                    {filters.time_ranges.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {filters.time_ranges.map(
                                                (range) => (
                                                    <Badge
                                                        key={range.value}
                                                        className="rounded-full border-white/15 bg-white/5 px-3 py-1 text-xs tracking-[0.3em] text-white/60 uppercase"
                                                    >
                                                        {range.label}
                                                    </Badge>
                                                ),
                                            )}
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
                                        <EmptyFeedState
                                            isOwnProfile={isOwnProfile}
                                        />
                                    ) : (
                                        <>
                                            {entries.map(
                                                (entry: TimelineEntry) => {
                                                    const postId =
                                                        entry.post?.id ?? null;
                                                    const isPostPending =
                                                        postId !== null &&
                                                        (pendingLikes.includes(
                                                            postId,
                                                        ) ||
                                                            pendingPurchases.includes(
                                                                postId,
                                                            ) ||
                                                            pendingBookmarks.includes(
                                                                postId,
                                                            ));

                                                    return (
                                                        <TimelineEntryCard
                                                            key={`${entry.id}-${entry.created_at}`}
                                                            entry={entry}
                                                            onLike={toggleLike}
                                                            onBookmark={
                                                                toggleBookmark
                                                            }
                                                            onComment={
                                                                openComments
                                                            }
                                                            onPurchase={
                                                                togglePurchase
                                                            }
                                                            disabled={
                                                                isPostPending ||
                                                                isRefreshing
                                                            }
                                                        />
                                                    );
                                                },
                                            )}
                                            {isLoadingMore && (
                                                <FeedLoadingPlaceholder />
                                            )}
                                        </>
                                    )}
                                </CardContent>
                                <CardFooter className="justify-center">
                                    {hasMore ? (
                                        <div
                                            ref={sentinelRef}
                                            className="h-8 w-full"
                                        />
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            className="rounded-full border border-white/10 bg-white/10 px-4 text-xs text-white/70 hover:border-white/30 hover:bg-white/20 disabled:cursor-wait disabled:border-white/10 disabled:bg-white/10 disabled:text-white/50"
                                            onClick={() => void refresh()}
                                            disabled={isRefreshing}
                                        >
                                            {isRefreshing
                                                ? 'Refreshing…'
                                                : 'Refresh feed'}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>

                            {isOwnProfile && (
                                <Card className="border border-dashed border-white/15 bg-white/5 p-6 text-sm text-white/70">
                                    Compose tools for your profile feed are on
                                    deck. Drop posts from your dashboard to
                                    spotlight them here.
                                </Card>
                            )}
                        </section>

                        <aside className="space-y-6">
                            {/* Media Card - Shows for everyone */}
                            <Card className="border-white/10 bg-white/5 text-white">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-semibold">
                                                Media
                                            </CardTitle>
                                            <CardDescription className="text-white/60">
                                                Recent photos and videos.
                                            </CardDescription>
                                        </div>
                                        {recentMedia.length > 0 && (
                                            <Link
                                                href={profileRoutes.media.url(
                                                    user.username ?? '',
                                                )}
                                                className="text-sm font-medium text-white/70 transition hover:text-white"
                                            >
                                                View All
                                            </Link>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {recentMedia.length === 0 ? (
                                        <div className="py-8 text-center text-sm text-white/60">
                                            No media yet
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {recentMedia
                                                .slice(0, 9)
                                                .map((media, index) => {
                                                    const handleClick = () => {
                                                        // Find the post for this media item
                                                        const post = media.post;

                                                        // If we have a post, use its media array; otherwise build from recentMedia
                                                        let feedMedia: FeedMedia[];
                                                        if (
                                                            post?.media &&
                                                            Array.isArray(
                                                                post.media,
                                                            ) &&
                                                            post.media.length >
                                                                0
                                                        ) {
                                                            // Use the post's media array
                                                            feedMedia =
                                                                post.media;
                                                            // Find the index of the clicked media within the post's media
                                                            const mediaIndex =
                                                                feedMedia.findIndex(
                                                                    (m) =>
                                                                        m.id ===
                                                                        media.id,
                                                                );
                                                            if (
                                                                mediaIndex >= 0
                                                            ) {
                                                                openLightbox(
                                                                    feedMedia,
                                                                    {
                                                                        startIndex:
                                                                            mediaIndex,
                                                                        post: post,
                                                                    },
                                                                );
                                                            } else {
                                                                // Fallback: use clicked media as start
                                                                openLightbox(
                                                                    feedMedia,
                                                                    {
                                                                        startIndex: 0,
                                                                        post: post,
                                                                    },
                                                                );
                                                            }
                                                        } else {
                                                            // Fallback: convert MediaItem[] to FeedMedia[] format
                                                            feedMedia =
                                                                recentMedia.map(
                                                                    (m) => ({
                                                                        id: m.id,
                                                                        url: m.url,
                                                                        type:
                                                                            m.mime_type ??
                                                                            (m.is_video
                                                                                ? 'video/mp4'
                                                                                : 'image/jpeg'),
                                                                        alt: null,
                                                                        thumbnail_url:
                                                                            m.thumbnail_url ??
                                                                            null,
                                                                        optimized_url:
                                                                            null,
                                                                        blur_url:
                                                                            null,
                                                                    }),
                                                                );

                                                            openLightbox(
                                                                feedMedia,
                                                                {
                                                                    startIndex:
                                                                        index,
                                                                    post:
                                                                        post ??
                                                                        null,
                                                                },
                                                            );
                                                        }
                                                    };

                                                    return (
                                                        <button
                                                            key={media.id}
                                                            type="button"
                                                            onClick={
                                                                handleClick
                                                            }
                                                            className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-black/40 transition hover:border-white/20"
                                                        >
                                                            {media.is_video ? (
                                                                <>
                                                                    {media.thumbnail_url ? (
                                                                        <img
                                                                            src={
                                                                                media.thumbnail_url
                                                                            }
                                                                            alt="Video thumbnail"
                                                                            className="size-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex size-full items-center justify-center bg-gradient-to-br from-black/50 to-black/30">
                                                                            <Plane className="size-6 text-white/40" />
                                                                        </div>
                                                                    )}
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                                                                        <div className="rounded-full bg-black/60 p-2">
                                                                            <Plane className="size-4 text-white" />
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <img
                                                                    src={
                                                                        media.thumbnail_url ??
                                                                        media.url
                                                                    }
                                                                    alt="Media"
                                                                    className="size-full object-cover transition group-hover:scale-105"
                                                                />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Creator-specific cards */}
                            {user.is_creator && (
                                <>
                                    {features.signals &&
                                        subscriptionTiers.length > 0 && (
                                            <Card className="border-white/10 bg-white/5 text-white">
                                                <CardHeader>
                                                    <CardTitle className="text-lg font-semibold">
                                                        Membership tiers
                                                    </CardTitle>
                                                    <CardDescription className="text-white/60">
                                                        Choose your level of
                                                        access and perks.
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {subscriptionTiers.map(
                                                        (tier) => (
                                                            <div
                                                                key={tier.name}
                                                                className="space-y-3 rounded-2xl border border-white/10 bg-black/35 p-4"
                                                            >
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <h3 className="text-sm font-semibold text-white">
                                                                        {
                                                                            tier.name
                                                                        }
                                                                    </h3>
                                                                    <Badge className="rounded-full border-white/15 bg-white/10 text-xs text-white/70">
                                                                        {
                                                                            tier.price
                                                                        }
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs text-white/65">
                                                                    {
                                                                        tier.description
                                                                    }
                                                                </p>
                                                                <ul className="space-y-2 text-xs text-white/60">
                                                                    {tier.perks.map(
                                                                        (
                                                                            perk,
                                                                        ) => (
                                                                            <li
                                                                                key={
                                                                                    perk
                                                                                }
                                                                                className="flex items-start gap-2"
                                                                            >
                                                                                <span className="mt-1 size-1.5 rounded-full bg-amber-400" />
                                                                                <span>
                                                                                    {
                                                                                        perk
                                                                                    }
                                                                                </span>
                                                                            </li>
                                                                        ),
                                                                    )}
                                                                </ul>
                                                                <Button className="w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-xs font-semibold">
                                                                    Join tier
                                                                </Button>
                                                            </div>
                                                        ),
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )}

                                    {features.signals &&
                                        tipOptions.length > 0 && (
                                            <Card className="border-white/10 bg-white/5 text-white">
                                                <CardHeader>
                                                    <CardTitle className="text-lg font-semibold">
                                                        Tip jar
                                                    </CardTitle>
                                                    <CardDescription className="text-white/60">
                                                        Boost the next scene or
                                                        unlock bonuses
                                                        instantly.
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="flex flex-wrap gap-2">
                                                    {tipOptions.map((tip) => (
                                                        <Button
                                                            key={tip.amount}
                                                            variant="ghost"
                                                            className="rounded-full border border-white/15 bg-white/5 px-4 text-sm text-white/80 hover:border-white/40 hover:bg-white/10 hover:text-white"
                                                        >
                                                            <span className="font-semibold text-white">
                                                                {tip.amount}
                                                            </span>
                                                            <span className="ml-2 text-xs text-white/70">
                                                                {tip.label}
                                                            </span>
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

                                    {features.signals &&
                                        features.wishlist &&
                                        wishlist.length > 0 && (
                                            <Card className="border-white/10 bg-white/5 text-white">
                                                <CardHeader>
                                                    <CardTitle className="text-lg font-semibold">
                                                        Wishlist
                                                    </CardTitle>
                                                    <CardDescription className="text-white/60">
                                                        Help unlock new gear,
                                                        travel, and production
                                                        upgrades.
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    {wishlist.map((item) => (
                                                        <div
                                                            key={item.title}
                                                            className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-white/75"
                                                        >
                                                            <div className="flex items-center justify-between gap-2 text-white">
                                                                <p className="font-semibold">
                                                                    {item.title}
                                                                </p>
                                                                <span className="text-xs tracking-[0.3em] text-white/55 uppercase">
                                                                    {item.price}
                                                                </span>
                                                            </div>
                                                            <p className="mt-2 text-xs text-white/60">
                                                                {user.display_name ??
                                                                    user.username ??
                                                                    'This creator'}{' '}
                                                                will shout you
                                                                out on the next
                                                                drop.
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
                                </>
                            )}

                            {/* Regular user sidebar content */}
                            {!user.is_creator && (
                                <>
                                    {user.circles &&
                                        user.circles.length > 0 && (
                                            <Card className="border-white/10 bg-white/5 text-white">
                                                <CardHeader>
                                                    <CardTitle className="text-lg font-semibold">
                                                        Circles
                                                    </CardTitle>
                                                    <CardDescription className="text-white/60">
                                                        Communities{' '}
                                                        {user.display_name ??
                                                            user.username ??
                                                            'they'}{' '}
                                                        belong to.
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex flex-wrap gap-2">
                                                        {user.circles.map(
                                                            (circle) => (
                                                                <Link
                                                                    key={
                                                                        circle.id
                                                                    }
                                                                    href={`/circles/${circle.slug}`}
                                                                >
                                                                    <Badge className="rounded-full border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70 transition hover:border-white/30 hover:bg-white/15">
                                                                        {
                                                                            circle.name
                                                                        }
                                                                    </Badge>
                                                                </Link>
                                                            ),
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    {user.hashtags &&
                                        user.hashtags.length > 0 && (
                                            <Card className="border-white/10 bg-white/5 text-white">
                                                <CardHeader>
                                                    <CardTitle className="text-lg font-semibold">
                                                        Hashtags
                                                    </CardTitle>
                                                    <CardDescription className="text-white/60">
                                                        Tags{' '}
                                                        {user.display_name ??
                                                            user.username ??
                                                            'they'}{' '}
                                                        use.
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex flex-wrap gap-2">
                                                        {user.hashtags.map(
                                                            (hashtag) => (
                                                                <Link
                                                                    key={
                                                                        hashtag
                                                                    }
                                                                    href={`/hashtags/${hashtag.replace('#', '')}`}
                                                                >
                                                                    <Badge className="rounded-full border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70 transition hover:border-white/30 hover:bg-white/15">
                                                                        #
                                                                        {hashtag.replace(
                                                                            '#',
                                                                            '',
                                                                        )}
                                                                    </Badge>
                                                                </Link>
                                                            ),
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                </>
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
                            Blocking removes past interactions and keeps your
                            profile hidden from this member.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm text-white/75">
                        <p>
                            Once blocked, {blockTargetLabel} won&apos;t be able
                            to follow you, view your profile, message you, or
                            interact with your posts.
                        </p>
                        <ul className="list-disc space-y-2 pl-5 text-white/60">
                            <li>
                                Removes existing follows, likes, bookmarks, and
                                timeline entries between you both.
                            </li>
                            <li>
                                Hides all of their posts, comments, and
                                notifications from your experience.
                            </li>
                            <li>
                                You can unblock them anytime from Settings
                                &rarr; Blocked users.
                            </li>
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
                                {isBlockProcessing && (
                                    <Loader2 className="size-4 animate-spin" />
                                )}
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
