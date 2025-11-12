import { useMemo, useState } from 'react';

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
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Pagination } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import type { Circle, CircleCollection, CircleFilterState } from '@/types/circles';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { index as circlesIndex, join as circleJoin, leave as circleLeave, show as circlesShow } from '@/routes/circles';
import { Compass, Sparkles, Users } from 'lucide-react';

type InterestOption = {
    id: number;
    name: string;
    slug: string;
};

interface CirclesPageProps {
    filters?: CircleFilterState;
    featured?: Circle[];
    circles?: CircleCollection;
    interests?: InterestOption[];
}

const numberFormatter = new Intl.NumberFormat();

type CircleCardProps = {
    circle: Circle;
};

const CircleCard = ({ circle }: CircleCardProps) => {
    const facetCollection = Array.isArray((circle as any).facets?.data)
        ? (circle as any).facets.data
        : circle.facets;
    const facets = Array.isArray(facetCollection) ? facetCollection : [];
    const memberCount = Number.isFinite(circle.membersCount)
        ? circle.membersCount
        : 0;
    const isFeaturedCircle = circle.isFeatured === true;

    const defaultFacet =
        (circle.membership?.preferences?.facet as string | undefined) ??
        facets.find((facet) => facet.isDefault)?.value ??
        facets[0]?.value ??
        null;

    const form = useForm({
        role: 'member' as const,
        facet: defaultFacet,
    });

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

    const hasFacetOptions = facets.length > 1;

    return (
        <Card className="relative overflow-hidden border-white/10 bg-black/40 text-white shadow-[0_40px_80px_-40px_rgba(249,115,22,0.55)] transition hover:border-amber-400/40 hover:bg-black/50">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-400/15 via-transparent to-violet-600/20 opacity-0 transition-opacity duration-200 hover:opacity-100" />

            <CardHeader className="relative space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            {isFeaturedCircle && (
                                <Badge className="rounded-full border-amber-300/40 bg-amber-400/20 text-[0.6rem] uppercase tracking-[0.35em] text-amber-100">
                                    Featured
                                </Badge>
                            )}
                            {circle.joined && (
                                <Badge className="rounded-full border-emerald-400/40 bg-emerald-500/20 text-[0.6rem] uppercase tracking-[0.35em] text-emerald-100">
                                    You’re in
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="text-xl font-semibold">
                            <Link
                                href={circlesShow.url(circle.slug)}
                                className="transition hover:text-white/80"
                            >
                                {circle.name}
                            </Link>
                        </CardTitle>
                    </div>
                    <Badge className="rounded-full border-white/15 bg-white/10 text-xs uppercase tracking-[0.3em] text-white/70">
                        {numberFormatter.format(memberCount)} members
                            </Badge>
                </div>

                <CardDescription className="max-w-2xl text-white/65">
                    {circle.tagline ??
                        circle.description ??
                        'This circle curates kink-first conversations, drops, and connections.'}
                </CardDescription>
            </CardHeader>

            <CardContent className="relative space-y-5 text-sm text-white/70">
                {circle.interest && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/65">
                        {circle.interest.name}
                    </div>
                )}

                {hasFacetOptions && (
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.35em] text-white/45">
                            Circle segments
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-white/60">
                            {facets.slice(0, 4).map((facet) => (
                                <span
                                        key={`${facet.key}:${facet.value}`}
                                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1"
                                >
                                    {facet.label}
                                </span>
                            ))}
                            {facets.length > 4 && (
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/50">
                                    +{facets.length - 4} more
                                            </span>
                                        )}
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-white/55">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        Visibility · {circle.visibility}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        Anchor · #{circle.metadata?.interest_slug ?? circle.slug}
                    </span>
                </div>
            </CardContent>

            <CardFooter className="relative flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                    {circle.joined ? (
                        <>
                            {hasFacetOptions && (
                                <Button
                                    type="button"
                                    size="sm"
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
                                size="sm"
                            className="rounded-full border-white/20 bg-white/10 text-white hover:border-rose-400/40 hover:bg-rose-500/20"
                                onClick={handleLeave}
                                disabled={form.processing}
                            >
                                Leave circle
                            </Button>
                            <Link
                            href={circlesShow.url(circle.slug)}
                            className="text-xs text-white/75 underline-offset-4 transition hover:text-white hover:underline"
                            >
                                Enter community
                            </Link>
                        </>
                    ) : (
                        <>
                            <Button
                                type="button"
                                size="sm"
                            className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-white shadow-[0_18px_40px_-20px_rgba(249,115,22,0.6)] hover:scale-[1.02]"
                                onClick={handleJoin}
                                disabled={form.processing}
                            >
                                Join circle
                            </Button>
                            <Link
                            href={circlesShow.url(circle.slug)}
                            className="text-xs text-white/75 underline-offset-4 transition hover:text-white hover:underline"
                            >
                                Preview circle
                            </Link>
                        </>
                    )}
            </CardFooter>
        </Card>
    );
};

const buildQuery = (
    filters: CircleFilterState,
    overrides: Partial<CircleFilterState & { page?: number }> = {},
) => {
    const payload: Record<string, unknown> = {};
    const merged = { ...filters, ...overrides };

    if (merged.search) {
        payload.search = merged.search;
    }

    if (merged.interest) {
        payload.interest = merged.interest;
    }

    if (merged.sort) {
        payload.sort = merged.sort;
    }

    if (merged.joined) {
        payload.joined = 1;
    }

    if ('page' in overrides && overrides.page) {
        payload.page = overrides.page;
    }

    return payload;
};

const emptyMeta = {
    current_page: 1,
    per_page: 12,
    total: 0,
    has_more_pages: false,
};

export default function CirclesIndex({
    filters = {},
    featured = [],
    circles,
    interests = [],
}: CirclesPageProps) {
    const safeFilters: CircleFilterState = filters;
    const featuredList = Array.isArray(featured) ? featured : [];
    const circleCollection: CircleCollection = circles ?? {
        data: [],
        meta: emptyMeta,
    };
    const interestOptions = Array.isArray(interests) ? interests : [];

    const [searchInput, setSearchInput] = useState(safeFilters.search ?? '');

    const currentSort = safeFilters.sort ?? 'featured';
    const joinedOnly = Boolean(safeFilters.joined);

    const recommended = useMemo(
        () => circleCollection.data.filter((circle) => circle.isFeatured),
        [circleCollection.data],
    );

    const totalCircles =
        circleCollection.meta.total ?? circleCollection.data.length;
    const joinedCirclesCount = circleCollection.data.filter((circle) => circle.joined).length;
    const heroHighlights = [
        {
            title: 'Private houses & crews',
            description: 'Spin up moderated spaces with role-based segments, aftercare channels, and invite-only access.',
            icon: Users,
        },
        {
            title: 'Interest-first discovery',
            description: 'Sort by niche interests, facet paths, and visibility to instantly find circles that match your scene.',
            icon: Compass,
        },
        {
            title: 'Curated weekly spotlights',
            description: 'We feature high-signal circles, mentor programs, and collaborative drops to keep energy high.',
            icon: Sparkles,
        },
    ] as const;
    const spotlightInterests = interestOptions.slice(0, 8);
    const paginationMeta = {
        currentPage: circleCollection.meta.current_page,
        perPage:
            circleCollection.meta.per_page ||
            Math.max(circleCollection.data.length, 1),
        total: circleCollection.meta.total || circleCollection.data.length,
        hasMorePages: circleCollection.meta.has_more_pages,
    };

    const applyFilters = (next: Partial<CircleFilterState & { page?: number }>) => {
        router.get(circlesIndex.url(), buildQuery(safeFilters, next), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        applyFilters({ search: searchInput || null, page: 1 });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Circles', href: circlesIndex.url() },
            ]}
        >
            <Head title="Circles · Real Kink Men" />

            <div className="space-y-12 text-white">
                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_60px_120px_-70px_rgba(249,115,22,0.6)]">
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-amber-400/20 via-transparent to-transparent blur-3xl" />
                        <div className="absolute -left-32 top-1/2 size-[520px] -translate-y-1/2 rounded-full bg-rose-500/15 blur-3xl" />
                        <div className="absolute -right-36 top-16 size-[460px] rounded-full bg-violet-600/15 blur-3xl" />
                    </div>

                    <div className="relative grid gap-10 p-8 sm:p-10 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-8">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-white/70">
                                Circle directory
                            </span>
                            <div className="space-y-4">
                                <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                                    Discover the crews shaping kink culture
                                </h1>
                                <p className="max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
                                    Filter by niche interests, tease out invite-only houses, and join circles where
                                    conversations, drops, and aftercare rituals match your exact scene.
                                </p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                {[
                                    { label: 'Circles live', value: numberFormatter.format(totalCircles) },
                                    { label: 'Curated interests', value: numberFormatter.format(interestOptions.length) },
                                    {
                                        label: 'Your memberships',
                                        value: joinedCirclesCount > 0 ? joinedCirclesCount : 'Tap in',
                                    },
                                ].map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="rounded-2xl border border-white/15 bg-black/35 px-5 py-4 text-left sm:text-center"
                                    >
                                        <p className="text-2xl font-semibold text-white">{stat.value}</p>
                                        <p className="mt-1 text-[0.7rem] uppercase tracking-[0.35em] text-white/55">
                                            {stat.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-5 rounded-3xl border border-white/10 bg-black/30 p-6">
                            <p className="text-xs uppercase tracking-[0.35em] text-white/55">
                                What you’ll find here
                            </p>
                            <div className="space-y-5">
                                {heroHighlights.map(({ title, description, icon: Icon }) => (
                                    <div key={title} className="flex items-start gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white">
                                            <Icon className="size-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-white">{title}</p>
                                            <p className="text-xs leading-relaxed text-white/65">{description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 shadow-[0_45px_100px_-65px_rgba(249,115,22,0.55)]">
                        <header className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.35em] text-white/55">
                                Tune the directory
                            </p>
                            <h2 className="text-2xl font-semibold tracking-tight">Dial in your vibe</h2>
                            <p className="text-sm text-white/65">
                                Search by keywords, spotlight a specific interest, and show only the circles you already
                                belong to or the most active crews on the network.
                            </p>
                        </header>

                        <form onSubmit={submitSearch} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px] lg:grid-cols-[minmax(0,1fr)_260px_190px]">
                        <Input
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Search by title, tagline, or keywords…"
                            className="border-white/15 bg-black/40 text-white placeholder:text-white/45"
                        />

                        <Select
                                    value={safeFilters.interest ?? 'all'}
                                    onValueChange={(value) =>
                                        applyFilters({
                                            interest: value === 'all' ? null : value,
                                            page: 1,
                                        })
                                    }
                        >
                            <SelectTrigger className="border-white/15 bg-black/40 text-white">
                                <SelectValue placeholder="All interests" />
                            </SelectTrigger>
                            <SelectContent className="border-white/10 bg-black/90 text-white">
                                        <SelectItem value="all" className="text-sm">
                                    All interests
                                </SelectItem>
                                {interestOptions.map((interest) => (
                                    <SelectItem
                                        key={interest.slug}
                                        value={interest.slug}
                                        className="text-sm"
                                    >
                                        {interest.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center justify-end gap-3">
                            <Toggle
                                pressed={joinedOnly}
                                onPressedChange={(pressed) =>
                                    applyFilters({ joined: pressed || undefined, page: 1 })
                                }
                                className={cn(
                                            'rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] transition data-[state=on]:border-emerald-400/40 data-[state=on]:bg-emerald-500/15 data-[state=on]:text-emerald-100',
                                            joinedOnly ? 'text-emerald-100' : 'text-white/70',
                                )}
                            >
                                Joined only
                            </Toggle>
                            <Button
                                type="submit"
                                size="sm"
                                        className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_22px_55px_-30px_rgba(249,115,22,0.65)] transition hover:scale-[1.03]"
                            >
                                Search
                            </Button>
                        </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs uppercase tracking-[0.35em] text-white/55">
                                        Sort results
                                    </p>
                                    <p className="text-xs text-white/60">
                                        Choose how the directory orders circles for you.
                                    </p>
                                </div>
                    <ToggleGroup
                        type="single"
                        value={currentSort}
                        onValueChange={(value) => {
                            if (value) {
                                applyFilters({ sort: value, page: 1 });
                            }
                        }}
                                    className="flex w-full overflow-hidden rounded-full border border-white/15 bg-black/30 text-xs text-white/70 sm:w-auto"
                        variant="outline"
                    >
                                    <ToggleGroupItem
                                        value="featured"
                                        className="flex-1 px-4 py-2 transition data-[state=on]:bg-white/15 data-[state=on]:text-white/95"
                                    >
                            Featured
                        </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="recent"
                                        className="flex-1 px-4 py-2 transition data-[state=on]:bg-white/15 data-[state=on]:text-white/95"
                                    >
                            Newest
                        </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="members"
                                        className="flex-1 px-4 py-2 transition data-[state=on]:bg-white/15 data-[state=on]:text-white/95"
                                    >
                            Most active
                        </ToggleGroupItem>
                    </ToggleGroup>
                            </div>
                        </form>
                    </div>

                    <div className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 shadow-[0_45px_100px_-65px_rgba(59,130,246,0.45)]">
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.35em] text-white/55">
                                Quick sparks
                            </p>
                            <p className="text-sm text-white/65">
                                Explore popular interests to immediately connect with crews that fit your energy.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {spotlightInterests.map((interest) => (
                                <Badge
                                    key={`spotlight-${interest.slug}`}
                                    className="rounded-full border-white/20 bg-white/10 px-3 py-1 text-xs text-white/75"
                                >
                                    {interest.name}
                                </Badge>
                            ))}
                            {spotlightInterests.length === 0 && (
                                <p className="text-xs text-white/60">
                                    Interests will appear here as soon as they’re configured.
                                </p>
                            )}
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/35 p-5 text-sm text-white/70">
                            {joinedCirclesCount > 0 ? (
                                <>
                                    You’re currently active in{' '}
                                    <span className="font-semibold text-white">{joinedCirclesCount}</span>{' '}
                                    {joinedCirclesCount === 1 ? 'circle' : 'circles'} shown on this page. Keep joining to unlock
                                    richer recommendations and concierge spotlights.
                                </>
                            ) : (
                                <>
                                    You haven’t joined any of the circles in this view yet. Jump into a crew to unlock tailored
                                    recommendations and member-only drops.
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {featuredList.length > 0 && (
                    <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 shadow-[0_50px_110px_-70px_rgba(249,115,22,0.55)]">
                        <header className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-2xl font-semibold tracking-tight">Concierge spotlights</h2>
                                <p className="text-sm text-white/65">
                                    Hand-picked circles with high signal, active moderators, and specialty programming.
                                </p>
                            </div>
                            <Badge className="rounded-full border-amber-400/40 bg-amber-400/20 text-[0.6rem] uppercase tracking-[0.35em] text-amber-100">
                                Weekly feature
                            </Badge>
                        </header>

                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {featuredList.map((circle) => (
                                <CircleCard key={`featured-${circle.id}`} circle={circle} />
                            ))}
                        </div>
                    </section>
                )}

                <section className="space-y-6">
                    <header className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight">All circles</h2>
                            <p className="text-sm text-white/65">
                            Page {circleCollection.meta.current_page} of{' '}
                            {Math.max(
                                1,
                                Math.ceil(
                                        (circleCollection.meta.total || circleCollection.data.length) /
                                            (circleCollection.meta.per_page || circleCollection.data.length || 1),
                                ),
                                )}{' '}
                                · Showing {circleCollection.data.length} results.
                        </p>
                    </div>
                    </header>

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {circleCollection.data.map((circle) => (
                            <CircleCard key={circle.id} circle={circle} />
                        ))}
                    </div>

                    <Pagination
                        meta={paginationMeta}
                        onPageChange={(page) => applyFilters({ page })}
                        className="bg-black/30"
                    />
                </section>

                {recommended.length > 0 && (
                    <section className="space-y-6 rounded-3xl border border-white/10 bg-gradient-to-br from-black/60 via-black/40 to-black/25 p-6 sm:p-8 shadow-[0_55px_120px_-75px_rgba(59,130,246,0.55)]">
                        <header className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-2xl font-semibold tracking-tight">Circles you already resonate with</h3>
                                <p className="text-sm text-white/70">
                                    Based on your memberships, saved posts, and creator follows. Lean in or explore similar crews.
                                </p>
                            </div>
                        </header>

                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {recommended.map((circle) => (
                                <Card
                                    key={`recommended-${circle.id}`}
                                    className="relative overflow-hidden border-white/10 bg-black/35 text-white shadow-[0_45px_100px_-70px_rgba(59,130,246,0.55)] transition hover:border-emerald-400/30 hover:bg-black/45"
                                >
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-400/15 via-transparent to-cyan-500/15 opacity-0 transition-opacity duration-200 hover:opacity-100" />
                                    <CardHeader className="relative space-y-2">
                                        <CardTitle className="text-base font-semibold">
                                            <Link
                                                href={circlesShow.url(circle.slug)}
                                                className="transition hover:text-white/80"
                                            >
                                                {circle.name}
                                            </Link>
                                        </CardTitle>
                                        {circle.tagline && (
                                            <CardDescription className="text-xs text-white/65">
                                                {circle.tagline}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="relative space-y-3 text-xs text-white/60">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge className="rounded-full border-white/15 bg-white/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
                                                {circle.interest?.name ?? 'Circle'}
                                            </Badge>
                                            <Badge className="rounded-full border-white/15 bg-white/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
                                                {numberFormatter.format(circle.membersCount ?? 0)} members
                                            </Badge>
                                        </div>
                                        <p>
                                            Curated segments:{' '}
                                            {Array.isArray((circle as any).facets?.data)
                                                ? (circle as any).facets.data.length
                                                : Array.isArray(circle.facets)
                                                    ? circle.facets.length
                                                    : 0}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="relative flex items-center justify-between border-t border-white/10 px-6 py-4 text-xs text-white/75">
                                        <Link
                                            href={circlesShow.url(circle.slug)}
                                            className="underline-offset-4 transition hover:text-white hover:underline"
                                        >
                                            Visit circle
                                        </Link>
                                        <span className="text-white/55">
                                            Visibility: {circle.visibility}
                                        </span>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
