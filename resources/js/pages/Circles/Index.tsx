import { SuggestCircleDialog } from '@/components/circles/suggest-circle-dialog';
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
import { Pagination } from '@/components/ui/pagination';
import AppLayout from '@/layouts/app-layout';
import {
    join as circleJoin,
    leave as circleLeave,
    index as circlesIndex,
    show as circlesShow,
} from '@/routes/circles';
import type {
    Circle,
    CircleCollection,
    CircleFacet,
    CircleFilterState,
} from '@/types/circles';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Compass, Layers, Lightbulb, Users } from 'lucide-react';

type InterestOption = {
    id: number;
    name: string;
    slug: string;
};

interface CirclesPageProps {
    filters?: CircleFilterState;
    joinedCircles?: Circle[];
    circles?: CircleCollection;
    interests?: InterestOption[];
}

const numberFormatter = new Intl.NumberFormat();

type CircleCardProps = {
    circle: Circle;
};

type CircleFacetRelationship = {
    data?: CircleFacet[] | null;
};

const extractFacets = (
    facets: CircleFacet[] | CircleFacetRelationship,
): CircleFacet[] => {
    if (Array.isArray(facets)) {
        return facets;
    }

    if (facets?.data && Array.isArray(facets.data)) {
        return facets.data;
    }

    return [];
};

const JoinedCircleCard = ({ circle }: CircleCardProps) => {
    const facets = extractFacets(
        circle.facets as CircleFacet[] | CircleFacetRelationship,
    );
    const memberCount = Number.isFinite(circle.membersCount)
        ? circle.membersCount
        : 0;
    const hasFacetOptions = facets.length > 1;

    const form = useForm({});

    const handleLeave = () => {
        form.delete(circleLeave.url(circle.slug), {
            preserveScroll: true,
        });
    };

    return (
        <Card className="group relative overflow-hidden border-white/10 bg-black/40 text-white transition-all duration-200 hover:border-emerald-400/30 hover:bg-black/50">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

            <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
                        <CheckCircle2 className="size-6 text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-lg leading-tight font-semibold">
                                <Link
                                    href={circlesShow.url(circle.slug)}
                                    className="transition-colors hover:text-emerald-400/90"
                                >
                                    {circle.name}
                                </Link>
                            </CardTitle>
                            {circle.interest && (
                                <Badge className="rounded-full border-white/15 bg-white/10 px-2.5 py-0.5 text-[0.65rem] font-medium tracking-[0.3em] text-white/70 uppercase">
                                    {circle.interest.name}
                                </Badge>
                            )}
                        </div>
                        {circle.tagline && (
                            <p className="line-clamp-1 text-sm leading-snug text-white/65">
                                {circle.tagline}
                            </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
                            <span className="flex items-center gap-1.5">
                                <Users className="size-3.5" />
                                {numberFormatter.format(memberCount)} members
                            </span>
                            {hasFacetOptions && (
                                <span className="flex items-center gap-1.5">
                                    <Layers className="size-3.5" />
                                    {facets.length} segment
                                    {facets.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3 border-t border-white/10 pt-4 sm:border-t-0 sm:border-l sm:border-white/10 sm:pt-0 sm:pl-6">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="rounded-full border-white/20 bg-white/10 px-3.5 text-xs font-medium text-white transition-colors hover:border-rose-400/40 hover:bg-rose-500/20 hover:text-rose-50"
                        onClick={handleLeave}
                        disabled={form.processing}
                    >
                        Leave
                    </Button>
                    <Link
                        href={circlesShow.url(circle.slug)}
                        className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_4px_12px_-4px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(16,185,129,0.5)]"
                    >
                        Enter →
                    </Link>
                </div>
            </div>
        </Card>
    );
};

const CircleCard = ({ circle }: CircleCardProps) => {
    const facets = extractFacets(
        circle.facets as CircleFacet[] | CircleFacetRelationship,
    );
    const memberCount = Number.isFinite(circle.membersCount)
        ? circle.membersCount
        : 0;
    const isJoined = circle.joined === true;

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
        <Card className="group relative flex flex-col overflow-hidden border-white/10 bg-black/40 text-white shadow-[0_40px_80px_-40px_rgba(249,115,22,0.55)] transition-all duration-300 hover:border-amber-400/40 hover:bg-black/50 hover:shadow-[0_50px_100px_-40px_rgba(249,115,22,0.65)]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-400/15 via-transparent to-violet-600/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <CardHeader className="relative space-y-3 pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <CardTitle className="text-xl leading-tight font-semibold">
                            <Link
                                href={circlesShow.url(circle.slug)}
                                className="transition-colors hover:text-amber-400/90"
                            >
                                {circle.name}
                            </Link>
                        </CardTitle>
                    </div>
                    <Badge className="shrink-0 rounded-full border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70">
                        <Users className="mr-1.5 inline-block size-3.5" />
                        {numberFormatter.format(memberCount)}
                    </Badge>
                </div>

                {circle.tagline && (
                    <CardDescription className="text-sm leading-relaxed text-white/65">
                        {circle.tagline}
                    </CardDescription>
                )}
            </CardHeader>

            <CardContent className="relative flex-1 space-y-3 pb-4">
                {hasFacetOptions && (
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {facets.slice(0, 5).map((facet) => (
                                <span
                                    key={`${facet.key}:${facet.value}`}
                                    className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white/70"
                                >
                                    {facet.label}
                                </span>
                            ))}
                            {facets.length > 5 && (
                                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/50">
                                    +{facets.length - 5}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {circle.description && !circle.tagline && (
                    <p className="line-clamp-2 text-sm leading-relaxed text-white/60">
                        {circle.description}
                    </p>
                )}
            </CardContent>

            <CardFooter className="relative mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                {isJoined ? (
                    <>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-full border-white/20 bg-white/10 px-4 text-xs font-medium text-white transition-colors hover:border-rose-400/40 hover:bg-rose-500/20 hover:text-rose-50"
                            onClick={handleLeave}
                            disabled={form.processing}
                        >
                            Leave circle
                        </Button>
                        <Link
                            href={circlesShow.url(circle.slug)}
                            className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-[0_4px_12px_-4px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(16,185,129,0.5)]"
                        >
                            Enter →
                        </Link>
                    </>
                ) : (
                    <>
                        <Button
                            type="button"
                            size="sm"
                            className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-5 text-xs font-semibold text-white shadow-[0_18px_40px_-20px_rgba(249,115,22,0.6)] transition-all hover:scale-[1.02] hover:shadow-[0_22px_50px_-20px_rgba(249,115,22,0.7)]"
                            onClick={handleJoin}
                            disabled={form.processing}
                        >
                            Join circle
                        </Button>
                        <Link
                            href={circlesShow.url(circle.slug)}
                            className="text-xs font-medium text-white/75 underline-offset-4 transition-colors hover:text-white hover:underline"
                        >
                            Preview →
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
    joinedCircles = [],
    circles,
    interests = [],
}: CirclesPageProps) {
    const safeFilters: CircleFilterState = filters;
    const joinedCirclesList = Array.isArray(joinedCircles) ? joinedCircles : [];
    const circleCollection: CircleCollection = circles ?? {
        data: [],
        meta: emptyMeta,
    };
    const interestOptions = Array.isArray(interests) ? interests : [];

    const totalCircles =
        circleCollection.meta.total ?? circleCollection.data.length;
    const joinedCirclesCount = joinedCirclesList.length;
    const heroHighlights = [
        {
            title: 'Join niche communities',
            description:
                'Connect with circles organized around specific interests, kinks, and scenes. Each circle has its own feed, members, and culture.',
            icon: Users,
        },
        {
            title: 'Explore circle segments',
            description:
                'Many circles offer specialized segments or facets, letting you focus on specific aspects that matter most to you.',
            icon: Layers,
        },
        {
            title: 'Discover by interest',
            description:
                'Browse circles anchored to curated interests, making it easy to find communities that align with your preferences.',
            icon: Compass,
        },
        {
            title: 'Suggest a new circle',
            description:
                "Have an idea for a circle that doesn't exist yet? Suggest it to our team and we'll consider adding it to the directory.",
            icon: Lightbulb,
        },
    ] as const;
    const paginationMeta = {
        currentPage: circleCollection.meta.current_page,
        perPage:
            circleCollection.meta.per_page ||
            Math.max(circleCollection.data.length, 1),
        total: circleCollection.meta.total || circleCollection.data.length,
        hasMorePages: circleCollection.meta.has_more_pages,
    };

    const applyFilters = (
        next: Partial<CircleFilterState & { page?: number }>,
    ) => {
        router.get(
            circlesIndex.url(),
            buildQuery(safeFilters, next) as Record<string, string | number>,
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Circles', href: circlesIndex.url() },
            ]}
        >
            <Head title="Circles · Real Kink Men" />

            <div className="space-y-16 text-white">
                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_60px_120px_-70px_rgba(249,115,22,0.6)]">
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-amber-400/25 via-amber-400/10 to-transparent blur-3xl" />
                        <div className="absolute top-1/2 -left-32 size-[520px] -translate-y-1/2 rounded-full bg-rose-500/20 blur-3xl" />
                        <div className="absolute top-16 -right-36 size-[460px] rounded-full bg-violet-600/20 blur-3xl" />
                    </div>

                    <div className="relative grid gap-12 p-10 sm:p-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                        <div className="space-y-10">
                            <div className="space-y-5">
                                <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                                    Discover the crews shaping{' '}
                                    <span className="bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 bg-clip-text text-transparent">
                                        kink culture
                                    </span>
                                </h1>
                                <p className="max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
                                    Filter by niche interests, tease out
                                    invite-only houses, and join circles where
                                    conversations, drops, and aftercare rituals
                                    match your exact scene.
                                </p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                {[
                                    {
                                        label: 'Circles live',
                                        value: numberFormatter.format(
                                            totalCircles,
                                        ),
                                    },
                                    {
                                        label: 'Curated interests',
                                        value: numberFormatter.format(
                                            interestOptions.length,
                                        ),
                                    },
                                    {
                                        label: 'Your memberships',
                                        value:
                                            joinedCirclesCount > 0
                                                ? joinedCirclesCount
                                                : 'Tap in',
                                    },
                                ].map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="group relative overflow-hidden rounded-2xl border border-white/15 bg-black/40 px-6 py-5 text-left transition-all hover:border-white/25 hover:bg-black/50 sm:text-center"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-violet-600/5 opacity-0 transition-opacity group-hover:opacity-100" />
                                        <div className="relative">
                                            <p className="text-3xl font-semibold text-white">
                                                {stat.value}
                                            </p>
                                            <p className="mt-2 text-[0.7rem] font-medium tracking-[0.35em] text-white/60 uppercase">
                                                {stat.label}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6 rounded-3xl border border-white/10 bg-black/40 p-7 backdrop-blur-sm">
                            <div>
                                <p className="text-xs font-medium tracking-[0.35em] text-white/60 uppercase">
                                    What you'll find here
                                </p>
                            </div>
                            <div className="space-y-6">
                                {heroHighlights.map(
                                    ({ title, description, icon: Icon }) => (
                                        <div
                                            key={title}
                                            className="flex items-start gap-4"
                                        >
                                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white/15 to-white/5 text-white shadow-sm">
                                                <Icon className="size-5" />
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-1.5">
                                                <p className="text-sm leading-snug font-semibold text-white">
                                                    {title}
                                                </p>
                                                <p className="text-xs leading-relaxed text-white/65">
                                                    {description}
                                                </p>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {joinedCirclesList.length > 0 && (
                    <section className="space-y-6 rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-600/5 p-6 shadow-[0_50px_110px_-70px_rgba(16,185,129,0.4)] sm:p-8">
                        <header className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-semibold tracking-tight">
                                    Your circles
                                </h2>
                                <p className="text-sm text-white/65">
                                    Circles you've joined and are actively
                                    participating in.
                                </p>
                            </div>
                            <Badge className="rounded-full border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-[0.6rem] font-medium tracking-[0.35em] text-emerald-100 uppercase">
                                <CheckCircle2 className="mr-1.5 inline-block size-3" />
                                {joinedCirclesList.length}{' '}
                                {joinedCirclesList.length === 1
                                    ? 'circle'
                                    : 'circles'}
                            </Badge>
                        </header>

                        <div className="space-y-3">
                            {joinedCirclesList.map((circle) => (
                                <JoinedCircleCard
                                    key={`joined-${circle.id}`}
                                    circle={circle}
                                />
                            ))}
                        </div>
                    </section>
                )}

                <section className="space-y-6">
                    <header className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                All circles
                            </h2>
                            <p className="text-sm text-white/65">
                                Page {circleCollection.meta.current_page} of{' '}
                                {Math.max(
                                    1,
                                    Math.ceil(
                                        (circleCollection.meta.total ||
                                            circleCollection.data.length) /
                                            (circleCollection.meta.per_page ||
                                                circleCollection.data.length ||
                                                1),
                                    ),
                                )}{' '}
                                · Showing {circleCollection.data.length}{' '}
                                results.
                            </p>
                        </div>
                        <SuggestCircleDialog
                            trigger={
                                <Button
                                    size="sm"
                                    className="rounded-full border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white transition-colors hover:border-amber-400/40 hover:bg-amber-500/20 hover:text-amber-50"
                                >
                                    <Lightbulb className="mr-2 size-4" />
                                    Suggest a circle
                                </Button>
                            }
                        />
                    </header>

                    {circleCollection.data.length > 0 ? (
                        <>
                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {circleCollection.data.map((circle) => (
                                    <CircleCard
                                        key={circle.id}
                                        circle={circle}
                                    />
                                ))}
                            </div>

                            <Pagination
                                meta={paginationMeta}
                                onPageChange={(page) => applyFilters({ page })}
                                className="bg-black/30"
                            />
                        </>
                    ) : (
                        <div className="rounded-3xl border border-white/10 bg-black/30 p-12 text-center">
                            <p className="text-white/70">
                                No circles found matching your filters.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
