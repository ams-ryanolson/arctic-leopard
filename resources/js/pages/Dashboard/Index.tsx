import SidebarAd from '@/components/ads/sidebar-ad';
import TimelineAd from '@/components/ads/timeline-ad';
import CommentThreadSheet from '@/components/feed/comment-thread-sheet';
import FeedLoadingPlaceholder from '@/components/feed/feed-loading-placeholder';
import FeedPostComposer from '@/components/feed/feed-post-composer';
import TimelineEntryCard from '@/components/feed/timeline-entry-card';
import StoriesSection from '@/components/stories/stories-section';
import StoryViewer from '@/components/stories/story-viewer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useFeed } from '@/hooks/use-feed';
import AppLayout from '@/layouts/app-layout';
import { getPrivateChannel, leaveEchoChannel } from '@/lib/echo';
import { fetchFollowingFeedPage } from '@/lib/feed-client';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import type {
    FeedComposerConfig,
    FeedFiltersGroup,
    FeedPulseMetric,
    PostCollectionPayload,
    TimelinePayload,
    TrendingTag,
    ViewerContext,
} from '@/types/feed';
import { Deferred, Head, usePage } from '@inertiajs/react';
import { AlertCircle, Clock3, Flame, Sparkles, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

const metricIcons = [Flame, Sparkles, Users, Clock3];

const ScenePulseCard = ({ items }: { items: FeedPulseMetric[] }) => (
    <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
            <CardTitle className="text-base font-semibold">
                Scene pulse
            </CardTitle>
            <CardDescription className="text-white/60">
                Real-time signal for your network tonight.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
            {items.map((metric, index) => {
                const Icon = metricIcons[index % metricIcons.length];

                return (
                    <div
                        key={metric.title}
                        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3"
                    >
                        <div className="mt-1 rounded-full bg-gradient-to-br from-amber-400/30 via-rose-500/25 to-violet-600/25 p-2">
                            <Icon className="size-4 text-amber-300" />
                        </div>
                        <div>
                            <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                {metric.title}
                            </p>
                            <p className="text-base font-semibold text-white">
                                {metric.value}
                            </p>
                            <p className="text-xs text-white/60">
                                {metric.description}
                            </p>
                        </div>
                    </div>
                );
            })}
        </CardContent>
    </Card>
);

const formatUsage = (count: number): string => {
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K uses`;
    }

    return `${count} uses`;
};

type TimelineBroadcastPayload = {
    timeline_id: number;
    post_id: number;
    visibility_source: string;
    post: {
        id: number;
        type: string;
        audience: string;
        body: string | null;
        published_at: string | null;
        created_at: string | null;
        author: {
            id: number;
            display_name: string | null;
            username: string | null;
            avatar_url: string | null;
        } | null;
    };
};

type DashboardProps = SharedData & {
    timeline: TimelinePayload;
    timelinePageName: string;
    timelinePerPage: number;
    composer: FeedComposerConfig;
    filters: FeedFiltersGroup;
    pulse: FeedPulseMetric[];
    trending: TrendingTag[];
    sidebarAds: Array<{
        id: number;
        ad_id: number;
        placement: string;
        size: string;
        asset_type: string;
        asset_path: string | null;
        asset_url: string | null;
        headline: string | null;
        body_text: string | null;
        cta_text: string | null;
        cta_url: string;
        display_order: number;
        is_active: boolean;
    }>;
    stories?: Array<{
        id: number;
        username: string;
        display_name: string;
        avatar_url: string | null;
        latest_story_preview: string | null;
        story_count: number;
        has_new_stories: boolean;
    }>;
    viewer: ViewerContext & { avatar?: string | null };
};

export default function Dashboard() {
    const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_nextStoryId, setNextStoryId] = useState<number | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_previousStoryId, setPreviousStoryId] = useState<number | null>(
        null,
    );

    const { timeline, composer, pulse, trending, sidebarAds, stories, viewer, features } =
        usePage<DashboardProps>().props;
    
    const adsEnabled = features?.feature_ads_enabled ?? false;

    const transformTimelinePayload = useCallback(
        (payload: TimelinePayload | PostCollectionPayload): TimelinePayload =>
            payload as TimelinePayload,
        [],
    );

    const [pendingBroadcasts, setPendingBroadcasts] = useState<
        TimelineBroadcastPayload[]
    >([]);
    const pendingIdsRef = useRef<Set<number>>(new Set());

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
        initialPayload: timeline,
        fetchPage: (page) =>
            fetchFollowingFeedPage({
                page,
                mergeQuery: true,
            }),
        transformPayload: transformTimelinePayload,
        errorMessage: 'We could not load the feed. Please try again.',
    });

    const handleComposerSubmitted = useCallback(() => {
        void refresh();
    }, [refresh]);

    const handleViewNewEntries = useCallback(async () => {
        if (isRefreshing || pendingBroadcasts.length === 0) {
            return;
        }

        try {
            await refresh();
        } finally {
            pendingIdsRef.current.clear();
            setPendingBroadcasts([]);
        }
    }, [isRefreshing, pendingBroadcasts.length, refresh]);

    useEffect(() => {
        if (viewer.id === null) {
            return;
        }

        const channelName = `timeline.${viewer.id}`;
        const channel = getPrivateChannel(channelName);

        if (!channel) {
            return;
        }

        const handleBroadcast = (payload: TimelineBroadcastPayload) => {
            if (pendingIdsRef.current.has(payload.timeline_id)) {
                return;
            }

            pendingIdsRef.current.add(payload.timeline_id);
            setPendingBroadcasts((previous) => [...previous, payload]);
        };

        channel.listen('.TimelineEntryBroadcast', handleBroadcast);

        return () => {
            channel.stopListening('.TimelineEntryBroadcast');
            leaveEchoChannel(channelName);
        };
    }, [viewer.id]);

    const pendingBroadcastCount = pendingBroadcasts.length;
    const pendingBroadcastLabel = useMemo(() => {
        if (pendingBroadcastCount === 0) {
            return '';
        }

        return pendingBroadcastCount === 1
            ? '1 new drop'
            : `${pendingBroadcastCount} new drops`;
    }, [pendingBroadcastCount]);

    const toolkitPrompts = [
        'Drop a 60-second teaser to warm the feed before prime time.',
        'Schedule a tip train goal so circles can rally mid-scene.',
        `Bundle a download + aftercare note pack for ${viewer.name?.split(' ')[0] ?? 'your'} biggest fans.`,
    ];

    const circleSpotlights = [
        {
            name: 'Switchcraft Syndicate',
            members: '1.9K members · NYC',
            status: 'Scene review live for 32 mins',
        },
        {
            name: 'Midnight Pups Collective',
            members: '860 members · Berlin',
            status: 'Traveler mode unlocked this week',
        },
        {
            name: 'Edge Guardians',
            members: '2.4K members · Digital',
            status: 'Consent drills scheduled tomorrow',
        },
    ];

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />

                <div className="space-y-8">
                    {features?.feature_stories_enabled && (
                        <StoriesSection
                            stories={stories}
                            onStoryClick={(storyId) => setSelectedStoryId(storyId)}
                        />
                    )}

                    <div className="flex flex-col gap-6 xl:flex-row">
                        <section className="min-w-0 flex-1 space-y-6">
                            <FeedPostComposer
                                config={composer}
                                onSubmitted={handleComposerSubmitted}
                            />

                            <Card className="border-white/10 bg-white/5 text-white">
                                <CardHeader>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <CardTitle className="text-lg font-semibold">
                                                Scene feed
                                            </CardTitle>
                                            <CardDescription className="text-white/60">
                                                Latest drops, circle updates,
                                                and monetized moments.
                                            </CardDescription>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => void refresh()}
                                            disabled={isRefreshing}
                                            className="rounded-full border border-white/10 bg-white/5 px-4 text-xs text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white disabled:cursor-wait disabled:border-white/10 disabled:bg-white/5 disabled:text-white/50"
                                        >
                                            {isRefreshing
                                                ? 'Refreshing…'
                                                : 'Refresh'}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {pendingBroadcastCount > 0 && (
                                        <Alert className="flex flex-col items-center gap-3 border border-emerald-400/40 bg-emerald-500/15 text-center text-white shadow-lg shadow-emerald-500/10">
                                            <div className="flex items-center gap-2 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold tracking-[0.3em] text-emerald-200 uppercase">
                                                <Sparkles className="size-3" />
                                                Live
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-base font-semibold text-white">
                                                    {pendingBroadcastLabel}{' '}
                                                    ready to view
                                                </p>
                                                <p className="text-sm text-white/70">
                                                    Pull in the latest timeline
                                                    drops while they’re still
                                                    hot.
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="rounded-full bg-emerald-500 px-5 text-white shadow hover:bg-emerald-400"
                                                onClick={() =>
                                                    void handleViewNewEntries()
                                                }
                                                disabled={isRefreshing}
                                            >
                                                {isRefreshing
                                                    ? 'Refreshing…'
                                                    : 'View latest'}
                                            </Button>
                                        </Alert>
                                    )}
                                    {error && (
                                        <Alert
                                            variant="destructive"
                                            className="border border-rose-400/40 bg-rose-500/10 text-white backdrop-blur"
                                        >
                                            <AlertCircle className="col-start-1 text-rose-100" />
                                            <div className="col-start-2 space-y-1">
                                                <AlertTitle className="text-sm font-semibold">
                                                    Timeline unavailable
                                                </AlertTitle>
                                                <AlertDescription className="text-xs text-rose-100/80">
                                                    {error}
                                                </AlertDescription>
                                            </div>
                                        </Alert>
                                    )}
                                    {entries.length === 0 ? (
                                        <Card className="border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-white/70">
                                            Your circles are quiet right now.
                                            Share a scene to spark the timeline.
                                        </Card>
                                    ) : (
                                        entries.map((entry) => {
                                            // Render ad entries differently
                                            if (
                                                entry.type === 'ad' &&
                                                entry.ad &&
                                                adsEnabled
                                            ) {
                                                return (
                                                    <TimelineAd
                                                        key={`ad-${entry.ad.id}`}
                                                        ad={entry.ad}
                                                    />
                                                );
                                            }

                                            // Render regular timeline entries
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
                                                    onBookmark={toggleBookmark}
                                                    onComment={openComments}
                                                    onPurchase={togglePurchase}
                                                    disabled={
                                                        isPostPending ||
                                                        isRefreshing
                                                    }
                                                />
                                            );
                                        })
                                    )}
                                    {isLoadingMore && (
                                        <FeedLoadingPlaceholder />
                                    )}
                                    {hasMore ? (
                                        <div
                                            ref={sentinelRef}
                                            className="h-8 w-full"
                                        />
                                    ) : (
                                        entries.length > 0 && (
                                            <div className="flex justify-center pt-3">
                                                <Button
                                                    variant="ghost"
                                                    className="rounded-full border border-white/10 bg-white/10 px-4 text-xs text-white/70 hover:border-white/30 hover:bg-white/20 disabled:cursor-wait disabled:border-white/10 disabled:bg-white/10 disabled:text-white/50"
                                                    onClick={() =>
                                                        void refresh()
                                                    }
                                                    disabled={isRefreshing}
                                                >
                                                    {isRefreshing
                                                        ? 'Refreshing…'
                                                        : 'Refresh feed'}
                                                </Button>
                                            </div>
                                        )
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-white/10 bg-white/5 text-white">
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">
                                        Creator toolkit
                                    </CardTitle>
                                    <CardDescription className="text-white/60">
                                        Prompts to keep your earnings aligned
                                        with the feed vibe.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {toolkitPrompts.map((prompt) => (
                                        <div
                                            key={prompt}
                                            className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/75"
                                        >
                                            {prompt}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </section>

                        <aside className="hidden w-full max-w-[320px] flex-col gap-4 lg:flex">
                            <Card className="border-white/10 bg-white/5 text-white shadow-[0_24px_65px_-35px_rgba(249,115,22,0.45)]">
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">
                                        Trending tags
                                    </CardTitle>
                                    <CardDescription className="text-white/60">
                                        What the scene is amplifying right now.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {trending.map(
                                        ({ id, tag, usage_count }) => (
                                            <div
                                                key={id}
                                                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-semibold text-white">
                                                        {tag}
                                                    </p>
                                                    <Badge className="rounded-full border-white/15 bg-white/10 px-2 py-0.5 text-[0.65rem] tracking-[0.3em] text-white/70 uppercase">
                                                        {formatUsage(
                                                            usage_count,
                                                        )}
                                                    </Badge>
                                                </div>
                                                <p className="mt-1 text-xs text-white/60">
                                                    Momentum from your circles
                                                    over the last 24 hours.
                                                </p>
                                            </div>
                                        ),
                                    )}
                                    {trending.length === 0 && (
                                        <Card className="border border-dashed border-white/15 bg-black/35 px-4 py-3 text-sm text-white/70">
                                            Tag your scenes to start building
                                            heat charts.
                                        </Card>
                                    )}
                                </CardContent>
                            </Card>

                            {pulse.length > 0 && (
                                <ScenePulseCard items={pulse} />
                            )}

                            {adsEnabled && (
                                <Deferred data="sidebarAds" fallback={null}>
                                    {sidebarAds &&
                                        sidebarAds.length > 0 &&
                                        sidebarAds[0] && (
                                            <SidebarAd
                                                ad={sidebarAds[0]}
                                                size={
                                                    sidebarAds[0].placement ===
                                                    'dashboard_sidebar_small'
                                                        ? 'small'
                                                        : sidebarAds[0]
                                                                .placement ===
                                                            'dashboard_sidebar_medium'
                                                          ? 'medium'
                                                          : 'large'
                                                }
                                            />
                                        )}
                                </Deferred>
                            )}

                            <Card className="border-white/10 bg-white/5 text-white">
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">
                                        Circle spotlights
                                    </CardTitle>
                                    <CardDescription className="text-white/60">
                                        Rooms where your energy would pop.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {circleSpotlights.map(
                                        ({ name, members, status }) => (
                                            <div
                                                key={name}
                                                className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3"
                                            >
                                                <p className="text-sm font-semibold text-white">
                                                    {name}
                                                </p>
                                                <p className="text-xs text-white/55">
                                                    {members}
                                                </p>
                                                <p className="mt-1 text-xs text-amber-300">
                                                    {status}
                                                </p>
                                            </div>
                                        ),
                                    )}
                                </CardContent>
                                <div className="px-6 pb-6">
                                    <Button
                                        variant="ghost"
                                        className="w-full rounded-full border border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                    >
                                        View circle invites
                                    </Button>
                                </div>
                            </Card>

                            <Card className="border-white/10 bg-white/5 text-white">
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">
                                        Need-to-know
                                    </CardTitle>
                                    <CardDescription className="text-white/60">
                                        Consent and safety updates from
                                        moderators.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3 text-sm text-white/75">
                                        <li>
                                            <span className="font-semibold">
                                                -
                                            </span>{' '}
                                            Consensual kink week is live - tag
                                            scenes with{' '}
                                            <span className="text-white">
                                                #greenlight
                                            </span>{' '}
                                            to be featured on the welcome
                                            stream.
                                        </li>
                                        <li>
                                            <span className="font-semibold">
                                                -
                                            </span>{' '}
                                            New alias controls let you mask your
                                            handle during traveler mode. Toggle
                                            it in settings before IRL dungeons.
                                        </li>
                                        <li>
                                            <span className="font-semibold">
                                                -
                                            </span>{' '}
                                            Verification queue is averaging 4
                                            hours. Upload your documents early
                                            if you plan to go live tonight.
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            {adsEnabled && (
                                <Deferred data="sidebarAds" fallback={null}>
                                    {sidebarAds &&
                                        sidebarAds.length > 1 &&
                                        sidebarAds[1] && (
                                            <SidebarAd
                                                ad={sidebarAds[1]}
                                                size={
                                                    sidebarAds[1].placement ===
                                                    'dashboard_sidebar_small'
                                                        ? 'small'
                                                        : sidebarAds[1]
                                                                .placement ===
                                                            'dashboard_sidebar_medium'
                                                          ? 'medium'
                                                          : 'large'
                                                }
                                            />
                                        )}
                                </Deferred>
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

            {/* Story Viewer Modal */}
            {features?.feature_stories_enabled && selectedStoryId && (
                <StoryViewer
                    storyId={selectedStoryId}
                    onClose={() => {
                        setSelectedStoryId(null);
                        setNextStoryId(null);
                        setPreviousStoryId(null);
                    }}
                    onStoryChange={(storyId, nextId, prevId) => {
                        setNextStoryId(nextId);
                        setPreviousStoryId(prevId);
                    }}
                />
            )}
        </>
    );
}
