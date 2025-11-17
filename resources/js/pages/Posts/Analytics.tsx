import { useMemo } from 'react';

import { Deferred, Head, Link, usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import {
    Activity,
    ArrowUpRight,
    CircleDashed,
    Eye,
    Gauge,
    MapPin,
    Radar,
    Sparkles,
    Users,
} from 'lucide-react';

import postAnalyticsRoutes from '@/actions/App/Http/Controllers/Posts/PostAnalyticsController';
import { DualLineChart } from '@/components/signals/dual-line-chart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/layouts/app-layout';
import profileRoutes from '@/routes/profile';
import type { SharedData } from '@/types';
import type {
    AnalyticsTimelinePoint,
    PostAnalyticsPageProps,
    RecentViewEvent,
} from '@/types/analytics';

type PageProps = SharedData & PostAnalyticsPageProps;

const navSections = [
    { id: 'overview', label: 'Overview' },
    { id: 'audience', label: 'Audience' },
    { id: 'engagement', label: 'Engagement' },
    { id: 'activity', label: 'Recent activity' },
];

export default function PostAnalyticsPage(props: PageProps) {
    const { post, heading, range, metrics, timeline } = props;
    const authorUsername = post.author?.username ?? null;
    const authorProfileHref = authorUsername
        ? profileRoutes.show.url(authorUsername)
        : null;

    const timelineSeries = useMemo(
        () =>
            buildTimelineSeries(timeline, [
                {
                    key: 'views',
                    label: 'Views',
                    color: 'rgba(251, 191, 36, 0.85)',
                },
                {
                    key: 'unique_viewers',
                    label: 'Unique viewers',
                    color: 'rgba(165, 180, 252, 0.85)',
                },
            ]),
        [timeline],
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                ...(authorProfileHref && authorUsername
                    ? [{ title: `@${authorUsername}`, href: authorProfileHref }]
                    : []),
                {
                    title: 'Post analytics',
                    href: postAnalyticsRoutes.show.url({ post: post.id }),
                },
            ]}
        >
            <Head title={`Analytics · ${heading.title}`} />

            <div className="space-y-20 text-white">
                <Hero
                    post={post}
                    heading={heading}
                    metrics={metrics}
                    range={range}
                    authorLink={authorProfileHref}
                    authorUsername={authorUsername}
                />

                <StickySectionNav sections={navSections} />

                <section id="overview" className="space-y-8">
                    <SectionHeader
                        title="Performance at a glance"
                        description="Track how this post is shaping attention, reach, and conversion in the selected window."
                    />
                    <MetricGrid timeline={timeline} metrics={metrics} />
                </section>

                <section id="audience" className="space-y-8">
                    <SectionHeader
                        title="Who you reached"
                        description="Understand where viewers are coming from and how many signed-in fans are tuning in."
                    />
                    <AudiencePanels metrics={metrics} />
                </section>

                <section id="engagement" className="space-y-8">
                    <SectionHeader
                        title="Momentum & cadence"
                        description="Spot surges and slowdowns with a live overlay so you can intervene in real time."
                    />
                    <TimelinePanel
                        timeline={timeline}
                        timelineSeries={timelineSeries}
                        range={range}
                    />
                </section>

                <section id="activity" className="space-y-8">
                    <SectionHeader
                        title="Recent activity"
                        description="Latest view events with source and device hints so you can follow up with intent."
                    />
                    <Deferred
                        data="recentViews"
                        fallback={<RecentViewsFallback />}
                    >
                        <RecentActivity />
                    </Deferred>
                </section>
            </div>
        </AppLayout>
    );
}

function Hero({
    post,
    heading,
    metrics,
    range,
    authorLink,
    authorUsername,
}: {
    post: PageProps['post'];
    heading: PageProps['heading'];
    metrics: PageProps['metrics'];
    range: PageProps['range'];
    authorLink: string | null;
    authorUsername: string | null;
}) {
    const heroImage = post.media?.[0]?.url ?? null;
    const liveViews = metrics.today.views.toLocaleString();
    const refreshedAt = formatDistanceToNow(
        new Date(metrics.live.refreshed_at),
        { addSuffix: true },
    );

    return (
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-indigo-950/60">
            {heroImage && (
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-60 blur-2xl"
                    style={{ backgroundImage: `url(${heroImage})` }}
                    aria-hidden
                />
            )}

            <div className="relative flex flex-col gap-10 p-10 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl space-y-6">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[0.35em] text-white/60 uppercase">
                        <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.63rem] tracking-[0.35em] text-white/70">
                            {post.audience.replace(/_/g, ' ')}
                        </Badge>
                        {authorLink && authorUsername && (
                            <Link
                                href={authorLink}
                                prefetch
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60 transition hover:border-amber-400/40 hover:text-amber-200 focus:outline-none focus-visible:text-amber-200"
                            >
                                @{authorUsername}
                            </Link>
                        )}
                        <span className="hidden text-white/30 sm:inline">
                            •
                        </span>
                        <span className="text-white/40">
                            {range.start} → {range.end}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-4xl leading-tight font-semibold text-white md:text-5xl">
                            {heading.title}
                        </h1>
                        {heading.excerpt && (
                            <p className="text-base text-white/70">
                                {heading.excerpt}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-emerald-100">
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/20 px-4 py-2 text-xs tracking-[0.35em] text-emerald-100 uppercase">
                            <Sparkles className="size-4" />
                            Live pulse
                        </span>
                        <span className="text-white/80">
                            {liveViews} views today · refreshed {refreshedAt}
                        </span>
                    </div>
                </div>

                <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur md:self-end">
                    <h2 className="text-sm font-semibold tracking-[0.3em] text-white/60 uppercase">
                        Refine window
                    </h2>
                    <p className="mt-2 text-xs text-white/70">
                        Switch ranges to see how the post is pacing. All charts,
                        breakdowns, and live metrics adapt instantly.
                    </p>
                    <RangeSelector
                        postId={post.id}
                        options={range.options}
                        active={range.value}
                    />
                </div>
            </div>
        </section>
    );
}

function StickySectionNav({ sections }: { sections: typeof navSections }) {
    return (
        <nav className="sticky top-20 z-20 -mx-6 bg-slate-950/70 px-6 py-4 backdrop-blur lg:-mx-10 lg:px-10">
            <ul className="flex flex-wrap gap-2 text-sm text-white/60">
                {sections.map((section) => (
                    <li key={section.id}>
                        <a
                            href={`#${section.id}`}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 tracking-[0.25em] uppercase transition hover:border-white/50 hover:text-white focus:outline-none focus-visible:border-white/60 focus-visible:text-white"
                        >
                            <CircleDashed className="size-3.5" />
                            {section.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

function SectionHeader({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <header className="space-y-3">
            <h2 className="text-2xl font-semibold text-white md:text-3xl">
                {title}
            </h2>
            <p className="max-w-2xl text-sm text-white/60">{description}</p>
        </header>
    );
}

function MetricGrid({
    timeline,
    metrics,
}: {
    timeline: AnalyticsTimelinePoint[];
    metrics: PageProps['metrics'];
}) {
    const metricCards = buildMetricCards(timeline, metrics);

    return (
        <div className="grid gap-4 lg:grid-cols-4">
            {metricCards.map((card) => (
                <Card
                    key={card.key}
                    className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-white/8 via-white/3 to-transparent p-6"
                >
                    <div className="flex items-center justify-between gap-4">
                        <span className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/70">
                            <card.icon className="size-4" />
                        </span>
                        {card.sparkline && (
                            <Sparkline values={card.sparkline} />
                        )}
                    </div>
                    <div className="mt-6 space-y-1">
                        <p className="text-xs tracking-[0.35em] text-white/50 uppercase">
                            {card.label}
                        </p>
                        <p className="text-3xl font-semibold text-white">
                            {card.value}
                        </p>
                    </div>
                    <p className="mt-2 text-xs text-white/60">{card.caption}</p>
                    {card.delta !== null && (
                        <p
                            className={`mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.65rem] tracking-[0.3em] uppercase ${
                                card.delta > 0
                                    ? 'border border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                                    : card.delta < 0
                                      ? 'border border-rose-400/40 bg-rose-500/10 text-rose-200'
                                      : 'border border-white/10 bg-white/5 text-white/60'
                            }`}
                        >
                            {card.delta > 0 ? (
                                <ArrowUpRight className="size-3" />
                            ) : (
                                <CircleDashed className="size-3" />
                            )}
                            {formatDeltaLabel(card.delta, card.deltaPercent)}
                        </p>
                    )}
                </Card>
            ))}
        </div>
    );
}

function AudiencePanels({ metrics }: { metrics: PageProps['metrics'] }) {
    const authenticated = metrics.totals.unique_authenticated_viewers;
    const guests = metrics.totals.unique_guest_viewers;
    const total = authenticated + guests || 1;
    const authenticatedPercent = authenticated / total;

    return (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <Card className="space-y-6 border border-white/10 bg-white/5 p-6">
                <header className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs tracking-[0.35em] text-white/50 uppercase">
                            Country mix
                        </p>
                        <p className="text-sm text-white/60">
                            Top regions attributed by combined profile + IP
                            signals.
                        </p>
                    </div>
                </header>
                <Deferred data="countries" fallback={<CountriesFallback />}>
                    <CountriesBreakdown />
                </Deferred>
            </Card>

            <Card className="flex flex-col gap-5 border border-white/10 bg-white/5 p-6">
                <div className="space-y-2">
                    <p className="text-xs tracking-[0.35em] text-white/50 uppercase">
                        Signed-in reach
                    </p>
                    <p className="text-2xl font-semibold text-white">
                        {(authenticatedPercent * 100).toFixed(0)}%{' '}
                        <span className="text-sm font-normal text-white/60">
                            ({authenticated.toLocaleString()} logged-in viewers)
                        </span>
                    </p>
                </div>
                <div className="h-3 w-full rounded-full bg-white/10">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400/80 via-sky-400/80 to-indigo-400/80"
                        style={{
                            width: `${Math.max(8, authenticatedPercent * 100)}%`,
                        }}
                    />
                </div>
                <ul className="space-y-3 text-sm text-white/70">
                    <li className="flex items-center justify-between gap-4">
                        <span className="inline-flex items-center gap-2">
                            <Users className="size-4 text-emerald-300" />
                            Logged-in viewers
                        </span>
                        <span>{authenticated.toLocaleString()}</span>
                    </li>
                    <li className="flex items-center justify-between gap-4">
                        <span className="inline-flex items-center gap-2">
                            <CircleDashed className="size-4 text-white/50" />
                            Guest traffic
                        </span>
                        <span>{guests.toLocaleString()}</span>
                    </li>
                </ul>
                <p className="text-xs text-white/40">
                    Encourage followers to sign in for tighter geo + conversion
                    attribution. Guests are deduped via fingerprint & session
                    hash.
                </p>
            </Card>
        </div>
    );
}

function CountriesBreakdown() {
    const { countries } = usePage<PageProps>().props;

    if (!countries || countries.data.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-white/60">
                Not enough attributed traffic yet. Encourage signed-in followers
                or share the permalink to build a signal.
            </div>
        );
    }

    const topFive = countries.data.slice(0, 5);
    const tailCount =
        countries.total - topFive.reduce((sum, item) => sum + item.views, 0);

    return (
        <div className="space-y-4">
            <ol className="space-y-3">
                {topFive.map((country) => (
                    <li
                        key={country.country_code}
                        className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-amber-300/50 hover:bg-white/10"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-white">
                                    {flagForCountry(country.country_code)}{' '}
                                    {country.country}
                                </p>
                                <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                    {country.country_code}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-white">
                                    {country.views.toLocaleString()}
                                </p>
                                <p className="text-xs text-white/50">
                                    {(country.percentage * 100).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-amber-300/80 via-rose-400/80 to-indigo-400/80"
                                style={{
                                    width: `${Math.max(8, country.percentage * 100)}%`,
                                }}
                            />
                        </div>
                    </li>
                ))}
            </ol>
            {tailCount > 0 && (
                <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/50">
                    +{tailCount.toLocaleString()} views across additional
                    regions
                </p>
            )}
        </div>
    );
}

function TimelinePanel({
    timeline,
    timelineSeries,
    range,
}: {
    timeline: AnalyticsTimelinePoint[];
    timelineSeries: ReturnType<typeof buildTimelineSeries>;
    range: PageProps['range'];
}) {
    return (
        <Card className="space-y-8 overflow-hidden border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-xs tracking-[0.35em] text-white/50 uppercase">
                        {range.start} → {range.end}
                    </p>
                    <p className="text-sm text-white/60">
                        Views and unique reach with live blending for today.
                    </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs tracking-[0.3em] text-emerald-200 uppercase">
                    <Radar className="size-3.5" />
                    Live overlay
                </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <DualLineChart
                    series={timelineSeries}
                    width={640}
                    height={260}
                />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                {timeline.map((point) => (
                    <div
                        key={point.date}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
                    >
                        <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
                            {point.date}
                        </p>
                        <p className="mt-2 text-white">
                            {point.views.toLocaleString()} views ·{' '}
                            {point.unique_viewers.toLocaleString()} unique
                        </p>
                        <p className="text-xs text-white/40">
                            {point.unique_authenticated_viewers.toLocaleString()}{' '}
                            logged in ·{' '}
                            {point.unique_guest_viewers.toLocaleString()} guests
                        </p>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function RecentActivity() {
    const { recentViews } = usePage<PageProps>().props;

    if (!recentViews || recentViews.length === 0) {
        return (
            <Card className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-white/60">
                No recent view events. Once viewers land on this post you’ll see
                live context, device origin, and surface details here.
            </Card>
        );
    }

    return (
        <div className="grid gap-3 md:grid-cols-2">
            {recentViews.map((event, index) => (
                <RecentViewCard
                    key={`${event.occurred_at ?? 'unknown'}-${index}`}
                    event={event}
                />
            ))}
        </div>
    );
}

function RecentViewCard({ event }: { event: RecentViewEvent }) {
    const viewer = event.viewer;
    const initials =
        viewer?.display_name
            ?.split(' ')
            .map((segment) => segment.slice(0, 1))
            .join('')
            .slice(0, 2)
            .toUpperCase() ?? '??';

    const viewedAt = event.occurred_at
        ? formatDistanceToNow(new Date(event.occurred_at), { addSuffix: true })
        : 'Unknown';

    const contextTags = buildContextTags(event.context);

    return (
        <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-amber-300/40 hover:bg-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5 opacity-0 transition group-hover:opacity-100" />
            <div className="relative flex items-start gap-4">
                <Avatar className="size-12 border border-white/10">
                    <AvatarImage
                        src={viewer?.avatar_url ?? undefined}
                        alt={viewer?.display_name ?? undefined}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 text-sm font-semibold text-white">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">
                            {viewer?.display_name ?? 'Guest viewer'}
                        </p>
                        {viewer?.username && (
                            <Link
                                href={profileRoutes.show.url(viewer.username)}
                                prefetch
                                className="text-xs tracking-[0.3em] text-white/50 uppercase transition hover:text-white focus:outline-none focus-visible:text-white"
                            >
                                @{viewer.username}
                            </Link>
                        )}
                        {event.country_code && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.6rem] tracking-[0.3em] text-white/50 uppercase">
                                <MapPin className="size-3" />
                                {event.country_code}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-white/50">Viewed {viewedAt}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-white/60">
                        {contextTags.length > 0 ? (
                            contextTags.map(({ label, value }) => (
                                <span
                                    key={`${label}-${value}`}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1"
                                >
                                    <span className="text-white/40">
                                        {label}:
                                    </span>
                                    <span className="text-white/80">
                                        {value}
                                    </span>
                                </span>
                            ))
                        ) : (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/50">
                                No extra context captured
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

function buildContextTags(context: RecentViewEvent['context']) {
    const tags: Array<{ label: string; value: string }> = [];

    if (typeof context.source === 'string' && context.source !== '') {
        tags.push({ label: 'Source', value: context.source });
    }

    if (typeof context.location === 'string' && context.location !== '') {
        tags.push({ label: 'Surface', value: context.location });
    }

    if (typeof context.viewport === 'string' && context.viewport !== '') {
        tags.push({ label: 'Viewport', value: context.viewport });
    }

    return tags;
}

function RangeSelector({
    postId,
    options,
    active,
}: {
    postId: number;
    options: PageProps['range']['options'];
    active: PageProps['range']['value'];
}) {
    return (
        <div className="mt-4 flex flex-wrap items-center gap-2">
            {options.map((option) => {
                const href = postAnalyticsRoutes.show.url(
                    { post: postId },
                    { query: { range: option.value } },
                );

                if (option.value === active) {
                    return (
                        <span
                            key={option.value}
                            className="rounded-full border border-amber-400/50 bg-amber-400/15 px-3 py-1 text-xs tracking-[0.3em] text-amber-100 uppercase"
                        >
                            {option.label}
                        </span>
                    );
                }

                return (
                    <Button
                        key={option.value}
                        variant="ghost"
                        size="sm"
                        asChild
                        className="rounded-full border border-white/15 px-3 py-1 text-xs tracking-[0.3em] text-white/60 uppercase hover:border-white/50 hover:text-white"
                    >
                        <Link href={href} prefetch preserveScroll>
                            {option.label}
                        </Link>
                    </Button>
                );
            })}
        </div>
    );
}

function buildMetricCards(
    timeline: AnalyticsTimelinePoint[],
    metrics: PageProps['metrics'],
) {
    const viewsSpark = timeline.map((point) => point.views);
    const uniquesSpark = timeline.map((point) => point.unique_viewers);
    const purchasesSpark = timeline.map((point) => point.purchases);

    const [viewsDelta, viewsDeltaPercent] = computeDelta(viewsSpark);
    const [uniquesDelta, uniquesDeltaPercent] = computeDelta(uniquesSpark);
    const [purchasesDelta, purchasesDeltaPercent] =
        computeDelta(purchasesSpark);

    return [
        {
            key: 'views',
            icon: Eye,
            label: 'Total views',
            value: formatNumber(metrics.totals.views),
            caption: `${metrics.today.views.toLocaleString()} so far today`,
            delta: viewsDelta,
            deltaPercent: viewsDeltaPercent,
            sparkline: viewsSpark,
        },
        {
            key: 'unique',
            icon: Users,
            label: 'Unique viewers',
            value: formatNumber(metrics.totals.unique_viewers),
            caption: `${metrics.today.unique_viewers.toLocaleString()} unique viewers today`,
            delta: uniquesDelta,
            deltaPercent: uniquesDeltaPercent,
            sparkline: uniquesSpark,
        },
        {
            key: 'purchases',
            icon: Activity,
            label: 'Purchases',
            value: formatNumber(metrics.totals.purchases),
            caption: `${metrics.totals.conversion_rate ? (metrics.totals.conversion_rate * 100).toFixed(1) : '0.0'}% conversion rate`,
            delta: purchasesDelta,
            deltaPercent: purchasesDeltaPercent,
            sparkline: purchasesSpark,
        },
        {
            key: 'engagement',
            icon: Gauge,
            label: 'Logged-in mix',
            value: `${((metrics.totals.unique_authenticated_viewers / Math.max(1, metrics.totals.unique_viewers)) * 100).toFixed(0)}%`,
            caption: `${metrics.totals.unique_authenticated_viewers.toLocaleString()} logged-in viewers`,
            delta: null,
            deltaPercent: null,
            sparkline: null,
        },
    ] as const;
}

function Sparkline({ values }: { values: number[] }) {
    if (!values.length) {
        return null;
    }

    const width = 120;
    const height = 40;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    const points = values.map((value, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * width;
        const normalized = (value - min) / range;
        const y = height - normalized * height;
        return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    });

    const pathData = points.join(' ');

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-10 w-28 text-amber-300"
            role="img"
            aria-hidden
        >
            <path
                d={`${pathData}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
}

function computeDelta(values: number[]): [number, number] {
    if (values.length < 2) {
        return [0, 0];
    }

    const first = values[0];
    const last = values[values.length - 1];
    const delta = last - first;
    const percent = first === 0 ? 0 : delta / first;

    return [delta, percent];
}

function buildTimelineSeries(
    timeline: AnalyticsTimelinePoint[],
    datasets: Array<{
        key: keyof AnalyticsTimelinePoint;
        label: string;
        color?: string;
    }>,
) {
    return datasets.map((dataset) => ({
        name: dataset.label,
        color: dataset.color,
        values: timeline.map((point) => ({
            label: point.date,
            value: point[dataset.key] as number,
        })),
    }));
}

function formatNumber(value: number) {
    const formatter = new Intl.NumberFormat(undefined, { notation: 'compact' });
    return formatter.format(value);
}

function formatDeltaLabel(delta: number, percent: number) {
    if (delta === 0) {
        return 'Holding steady';
    }

    const percentLabel =
        percent === 0 ? '' : ` (${(percent * 100).toFixed(1)}%)`;

    return `${delta > 0 ? '+' : ''}${formatNumber(Math.abs(delta))}${percentLabel}`;
}

function flagForCountry(code: string | null) {
    if (!code) {
        return '🌍';
    }

    const upper = code.toUpperCase();

    return upper.replace(/./g, (char) =>
        String.fromCodePoint(127397 + char.charCodeAt(0)),
    );
}

function CountriesFallback() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-4 w-32 rounded-full" />
            <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-28 rounded" />
                            <Skeleton className="h-3 w-16 rounded" />
                        </div>
                        <Skeleton className="h-4 w-16 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function RecentViewsFallback() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_45px_-35px_rgba(129,140,248,0.45)]"
                >
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="mt-3 h-3 w-24 rounded" />
                    <div className="mt-4 flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}
