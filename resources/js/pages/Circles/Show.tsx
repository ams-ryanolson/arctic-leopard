import { useCallback } from 'react';

import AppLayout from '@/layouts/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useCirclePresence } from '@/hooks/use-circle-presence';
import { useFeed } from '@/hooks/use-feed';
import { useInitials } from '@/hooks/use-initials';
import type { Circle, CircleFacet as CircleFacetType } from '@/types/circles';
import type { FeedPost, PostCollectionPayload, TimelineEntry, TimelinePayload } from '@/types/feed';
import { Head, router, useForm } from '@inertiajs/react';
import { index as circlesIndex, join as circleJoin, leave as circleLeave, show as circlesShow } from '@/routes/circles';
import { Activity, Layers, Sparkles, Users } from 'lucide-react';
import TimelineEntryCard from '@/components/feed/timeline-entry-card';
import CommentThreadSheet from '@/components/feed/comment-thread-sheet';
import FeedLoadingPlaceholder from '@/components/feed/feed-loading-placeholder';
import { fetchCircleFeedPage } from '@/lib/feed-client';

type CircleShowProps = {
    circle: Circle;
    posts: PostCollectionPayload;
    filters: {
        facet?: string | null;
    };
};

const numberFormatter = new Intl.NumberFormat();

type RouterPayload = Record<string, string | number | boolean | null | undefined>;

const getCircleFacets = (circle: Circle): CircleFacetType[] => {
    const rawFacets = (circle as unknown as { facets?: unknown }).facets;

    if (Array.isArray(rawFacets)) {
        return rawFacets as CircleFacetType[];
    }

    if (
        rawFacets &&
        typeof rawFacets === 'object' &&
        Array.isArray((rawFacets as { data?: unknown[] }).data)
    ) {
        return ((rawFacets as { data: CircleFacetType[] }).data) ?? [];
    }

    return [];
};

const CircleMembershipControls = ({ circle }: { circle: Circle }) => {
    const facets = getCircleFacets(circle);

    const defaultFacet =
        (circle.membership?.preferences?.facet as string | undefined) ??
        facets.find((facet) => facet.isDefault)?.value ??
        facets[0]?.value ??
        null;

    const form = useForm({
        role: 'member' as const,
        facet: defaultFacet,
    });

    const hasFacetOptions = facets.length > 1;

    const handleJoin = () => {
        form.post(circleJoin.url(circle.slug), {
            preserveScroll: true,
        });
    };

    const handleLeave = () => {
        form.delete(circleLeave.url(circle.slug), {
            preserveScroll: true,
        });
    };

    return (
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-6 text-sm text-white/70 shadow-[0_45px_95px_-60px_rgba(249,115,22,0.55)]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/15 via-transparent to-violet-500/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>

            <div className="relative space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                            Membership status
                        </p>
                        <h3 className="text-xl font-semibold text-white">
                            {circle.joined ? 'You’re part of this circle' : 'Claim your membership'}
                        </h3>
                    </div>

                    <Badge className="rounded-full border-white/15 bg-white/10 text-xs uppercase tracking-[0.3em] text-white/75">
                        {numberFormatter.format(circle.membersCount)} members
                    </Badge>
                </div>

                <p className="text-xs text-white/60">
                    {circle.joined
                        ? 'Fine-tune your segment preferences to match the conversations you want front and center.'
                        : 'Join to access circle-only drops, aftercare threads, and invite-only live sessions.'}
                </p>

                {hasFacetOptions && (
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-[0.35em] text-white/50">
                            Preferred segment
                        </label>
                        <Select
                            value={form.data.facet ?? undefined}
                            onValueChange={(value) => form.setData('facet', value)}
                            disabled={form.processing}
                        >
                            <SelectTrigger className="border-white/15 bg-black/40 text-sm text-white">
                                <SelectValue placeholder="Choose a segment" />
                            </SelectTrigger>
                            <SelectContent className="border-white/10 bg-black/90 text-white">
                                {facets.map((facet: CircleFacetType) => (
                                    <SelectItem
                                        key={`${facet.key}:${facet.value}`}
                                        value={facet.value}
                                        className="text-sm"
                                    >
                                        <span className="font-medium">{facet.label}</span>
                                        {facet.description && (
                                            <span className="block text-xs text-white/60">
                                                {facet.description}
                                            </span>
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                    {circle.joined ? (
                        <>
                            {hasFacetOptions && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-full border-white/20 bg-white/5 text-white hover:border-emerald-400/40 hover:bg-emerald-500/20 hover:text-emerald-50"
                                    onClick={handleJoin}
                                    disabled={form.processing}
                                >
                                    Update segment
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="secondary"
                                className="rounded-full border-white/20 bg-white/10 text-white hover:border-rose-500/40 hover:bg-rose-500/20"
                                onClick={handleLeave}
                                disabled={form.processing}
                            >
                                Leave circle
                            </Button>
                        </>
                    ) : (
                        <Button
                            type="button"
                            className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-[0_22px_55px_-30px_rgba(249,115,22,0.65)] transition hover:scale-[1.02]"
                            onClick={handleJoin}
                            disabled={form.processing}
                        >
                            Join circle
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function CircleShow({ circle, posts, filters }: CircleShowProps) {
    const facets = getCircleFacets(circle);
    const segmentsCount = facets.length;
    const circleChannelIdentifier = circle.slug ?? circle.id;
    const { count: liveCount, members: liveMembers, isSubscribed: presenceReady } = useCirclePresence(
        circleChannelIdentifier,
        { enabled: circle.joined },
    );
    const getInitials = useInitials();
    const livePreviewMembers =
        circle.joined && presenceReady ? liveMembers.slice(0, 4).filter((member) => member.id !== 0) : [];
    const remainingLiveMembers =
        circle.joined && presenceReady ? Math.max(liveMembers.length - livePreviewMembers.length, 0) : 0;
    const liveValue = circle.joined
        ? presenceReady
            ? liveCount > 0
                ? `${numberFormatter.format(liveCount)} online`
                : 'Quiet now'
            : 'Connecting…'
        : 'Join to view';

        console.log(circle);
    const heroHighlights = [
        {
            label: 'Members',
            value: numberFormatter.format(circle.membersCount),
            icon: Users,
        },
        {
            label: 'Live now',
            value: liveValue,
            icon: Activity,
            footer:
                livePreviewMembers.length > 0 ? (
                    <div className="mt-3 flex items-center justify-center gap-2">
                        {livePreviewMembers.map((member) => (
                            <Avatar
                                key={member.id}
                                className="size-8 border border-white/20 bg-black/60 text-white"
                            >
                                {member.avatar ? (
                                    <AvatarImage
                                        src={member.avatar ?? undefined}
                                        alt={member.name ?? 'Live member'}
                                    />
                                ) : (
                                    <AvatarFallback className="text-xs uppercase tracking-[0.2em]">
                                        {getInitials(member.name ?? 'Member') || '•'}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                        ))}
                        {remainingLiveMembers > 0 && (
                            <div className="grid size-8 place-items-center rounded-full border border-dashed border-white/30 text-[0.65rem] uppercase tracking-[0.2em] text-white/70">
                                +{Math.min(remainingLiveMembers, 99)}
                            </div>
                        )}
                    </div>
                ) : undefined,
        },
        {
            label: 'Segments',
            value: segmentsCount > 0 ? String(segmentsCount) : 'Single stream',
            icon: Layers,
        },
        {
            label: 'Visibility',
            value: circle.visibility ?? 'Private',
            icon: Sparkles,
        },
    ];
    const prominentFacets: CircleFacetType[] = facets.slice(0, 6);
    const hasFacetOptions = facets.length > 1;
    const transformCirclePayload = useCallback(
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
                    visibility_source: 'circle',
                    context: {
                        circle: circle.slug,
                    },
                    visible_at: post.published_at ?? post.created_at,
                    created_at: post.created_at,
                    post,
                })),
                links: collection.links ?? {},
                meta: collection.meta,
            };
        },
        [circle.slug],
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
        initialPayload: posts,
        fetchPage: (page) =>
            fetchCircleFeedPage(circle.slug, {
                page,
                mergeQuery: true,
            }),
        transformPayload: transformCirclePayload,
        errorMessage: 'We could not load this circle feed. Please try again.',
    });

    const applyFacetFilter = (facetValue: string | null) => {
        const payload: RouterPayload = { page: 1 };

        if (facetValue) {
            payload.facet = facetValue;
        }

        router.get(circlesShow.url(circle.slug), payload, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Circles', href: circlesIndex.url() },
                { title: circle.name, href: circlesShow.url(circle.slug) },
            ]}
        >
            <Head title={`${circle.name} · Circles`} />

            <div className="space-y-12 text-white">
                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_60px_120px_-70px_rgba(249,115,22,0.6)]">
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-amber-400/15 via-transparent to-transparent blur-3xl" />
                        <div className="absolute -left-32 top-1/2 size-[520px] -translate-y-1/2 rounded-full bg-rose-500/15 blur-3xl" />
                        <div className="absolute -right-36 top-16 size-[460px] rounded-full bg-violet-600/15 blur-3xl" />
                    </div>

                    <div className="relative grid gap-10 p-8 sm:p-10 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-6">
                            <Badge className="rounded-full border-white/20 bg-white/10 text-[0.65rem] uppercase tracking-[0.35em] text-white/70">
                                {circle.interest?.name ?? 'Curated house'}
                            </Badge>

                            <div className="space-y-4">
                                <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                                    {circle.name}
                                </h1>
                                <p className="max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
                                    {circle.description ??
                                        'Join this circle to share scenes, build rituals, and stay tapped into a crew that matches your kink energy.'}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                {heroHighlights.map(({ label, value, icon: Icon, footer }) => (
                                    <div
                                        key={label}
                                        className="rounded-2xl border border-white/15 bg-black/35 px-5 py-4 text-left sm:text-center"
                                    >
                                        <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.35em] text-white/55">
                                            <Icon className="size-3.5" />
                                            <span>{label}</span>
                                        </div>
                                        <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                                        {footer ?? null}
                                    </div>
                                ))}
                            </div>

                            {prominentFacets.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs uppercase tracking-[0.35em] text-white/55">
                                        Segment spotlight
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {prominentFacets.map((facet: CircleFacetType) => (
                                            <Badge
                                                key={`${facet.key}:${facet.value}`}
                                                className={cn(
                                                    'rounded-full border-white/15 bg-white/10 text-xs text-white/70',
                                                    filters.facet === facet.value &&
                                                        'border-emerald-400/40 bg-emerald-500/20 text-emerald-100',
                                                )}
                                            >
                                                {facet.label}
                                            </Badge>
                                        ))}
                                        {segmentsCount > prominentFacets.length && (
                                            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/60">
                                                +{segmentsCount - prominentFacets.length} more segments
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-5">
                            <CircleMembershipControls circle={circle} />
                            <div className="rounded-3xl border border-white/10 bg-black/35 p-5 text-sm text-white/70">
                                <p className="text-xs uppercase tracking-[0.35em] text-white/55">
                                    Concierge notes
                                </p>
                                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-white/60">
                                    <li>• Weekly live mentoring sessions led by veteran doms.</li>
                                    <li>• Dedicated aftercare thread monitored by circle moderators.</li>
                                    <li>• Segment opt-ins unlock specialized drop schedules and alerts.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 shadow-[0_45px_100px_-65px_rgba(249,115,22,0.55)]">
                        <header className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.35em] text-white/55">
                                Recent drops
                            </p>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2 className="text-2xl font-semibold tracking-tight">
                                    Latest circle activity
                                </h2>
                                {hasFacetOptions && (
                                    <Select
                                        value={filters.facet ?? 'all'}
                                        onValueChange={(value) => applyFacetFilter(value === 'all' ? null : value)}
                                    >
                                        <SelectTrigger className="w-56 border-white/15 bg-black/40 text-sm text-white">
                                            <SelectValue placeholder="All segments" />
                                        </SelectTrigger>
                                        <SelectContent className="border-white/10 bg-black/90 text-white">
                                            <SelectItem value="all" className="text-sm">
                                                All segments
                                            </SelectItem>
                                            {facets.map((facet: CircleFacetType) => (
                                                <SelectItem
                                                    key={`filter-${facet.value}`}
                                                    value={facet.value}
                                                    className="text-sm"
                                                >
                                                    {facet.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <p className="text-xs text-white/60">
                                Showcasing drops, scene recaps, and announcements curated for this circle’s members.
                            </p>
                        </header>

                        {error && (
                            <Alert
                                variant="destructive"
                                className="border border-rose-400/40 bg-rose-500/10 text-white backdrop-blur"
                            >
                                <AlertTitle className="text-sm font-semibold">Feed unavailable</AlertTitle>
                                <AlertDescription className="text-xs text-rose-100/80">
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}

                        {entries.length === 0 ? (
                            <Card className="border-white/10 bg-black/35 p-10 text-center text-sm text-white/65">
                                No drops have been shared in this circle yet. Be the first to post once you join.
                            </Card>
                        ) : (
                            <>
                                <div className="space-y-6">
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
                                </div>
                                {hasMore ? (
                                    <div ref={sentinelRef} className="h-8 w-full" />
                                ) : (
                                    <div className="flex justify-center pt-3">
                                        <Button
                                            variant="ghost"
                                            className="rounded-full border border-white/10 bg-white/10 px-4 text-xs text-white/70 hover:border-white/30 hover:bg-white/20 disabled:cursor-wait disabled:border-white/10 disabled:bg-white/10 disabled:text-white/50"
                                            onClick={() => void refresh()}
                                            disabled={isRefreshing}
                                        >
                                            {isRefreshing ? 'Refreshing…' : 'Refresh feed'}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="space-y-6 rounded-3xl border border-white/10 bg-gradient-to-br from-black/50 via-black/35 to-black/25 p-6 sm:p-8 shadow-[0_50px_110px_-70px_rgba(59,130,246,0.45)]">
                        <div className="space-y-3">
                            <h3 className="text-sm uppercase tracking-[0.35em] text-white/55">
                                Circle metadata
                            </h3>
                            <div className="grid gap-4">
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                                    <p className="text-white/80">Interest anchor</p>
                                    <p className="mt-1 text-sm font-semibold text-white">
                                        {circle.interest?.name ?? 'Not assigned'}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                                    <p className="text-white/80">Visibility tier</p>
                                    <p className="mt-1 text-sm font-semibold text-white capitalize">
                                        {circle.visibility}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                                    <p className="text-white/80">Segment count</p>
                                    <p className="mt-1 text-sm font-semibold text-white">
                                        {segmentsCount > 0 ? segmentsCount : 'Single stream'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {facets.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-xs uppercase tracking-[0.35em] text-white/55">
                                    Segment overview
                                </h4>
                                <div className="space-y-3">
                                    {facets.map((facet: CircleFacetType) => (
                                        <div
                                            key={`overview-${facet.value}`}
                                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70"
                                        >
                                            <div className="flex items-center justify-between gap-2 text-white">
                                                <p className="text-sm font-semibold">{facet.label}</p>
                                                {facet.isDefault && (
                                                    <Badge className="rounded-full border-emerald-400/40 bg-emerald-500/15 text-[0.6rem] uppercase tracking-[0.35em] text-emerald-100">
                                                        Default
                                                    </Badge>
                                                )}
                                            </div>
                                            {facet.description && (
                                                <p className="mt-2 text-white/60">{facet.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Separator className="border-white/10" />

                        <div className="space-y-3 text-xs text-white/60">
                            <h4 className="text-xs uppercase tracking-[0.35em] text-white/55">
                                Participation tips
                            </h4>
                            <ul className="space-y-2">
                                <li>• Tag your drops with relevant segment keywords for easier discovery.</li>
                                <li>• Use aftercare threads to continue consent conversations post-scene.</li>
                                <li>• Share mentor resources in the default segment to welcome new members.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <CommentThreadSheet
                    post={activeCommentPost}
                    open={isCommentSheetOpen && activeCommentPost !== null}
                    onOpenChange={handleCommentsOpenChange}
                    onCommentAdded={handleCommentAdded}
                />
            </div>
        </AppLayout>
    );
}

