import { EventCard } from '@/components/events/event-card';
import { EventFilterBar } from '@/components/events/event-filter-bar';
import { EventStatusBadge } from '@/components/events/event-status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import eventsRoutes from '@/routes/events';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import {
    type Event,
    type EventCollection,
    type EventFilters,
    type EventMeta,
    formatEventDateRange,
    formatEventLocation,
    formatEventModality,
    formatEventType,
} from '@/types/events';
import { Calendar, MapPin, Users, CalendarCheck, Tag, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EventsIndexProps = {
    events: EventCollection;
    pastEvents: Event[];
    featuredEvent?: Event | null;
    filters: EventFilters;
    meta: EventMeta;
};

const numberFormatter = new Intl.NumberFormat();

export default function EventsIndex({
    events,
    pastEvents,
    featuredEvent,
    filters,
    meta,
}: EventsIndexProps) {

    const emptyState = events.meta.total === 0 && !featuredEvent;
    // Total includes featured event (which is excluded from pagination)
    const totalUpcoming = events.meta.total + (featuredEvent ? 1 : 0);

    const paginationMeta = {
        currentPage: events.meta.current_page,
        perPage: events.meta.per_page,
        total: events.meta.total,
        hasMorePages: events.meta.current_page < events.meta.last_page,
    };

    const handleRsvpRefresh = () =>
        router.reload({
            only: ['events', 'pastEvents'],
            preserveScroll: true,
        });

    const handlePageChange = (page: number) => {
        const query: Record<string, string> = {};

        if (filters.search) query.search = filters.search;
        if (filters.status) query.status = filters.status;
        if (filters.modality) query.modality = filters.modality;
        if (filters.type) query.type = filters.type;
        if (filters.tag) query.tag = String(filters.tag);
        if (filters.city) query.city = filters.city;

        query.page = page.toString();

        router.visit(eventsRoutes.index({ query }).url, {
            preserveScroll: true,
            only: ['events'],
        });
    };

    const hasPastHighlights = pastEvents.length > 0;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Events', href: '/events' },
            ]}
        >
            <Head title="Events · Real Kink Men" />

            <div className="space-y-16 text-white">
                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_60px_120px_-70px_rgba(59,130,246,0.6)]">
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-blue-400/25 via-blue-400/10 to-transparent blur-3xl" />
                        <div className="absolute -left-32 top-1/2 size-[520px] -translate-y-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
                        <div className="absolute -right-36 top-16 size-[460px] rounded-full bg-cyan-600/20 blur-3xl" />
                    </div>

                    <div className="relative grid gap-12 p-10 sm:p-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
                        <div className="space-y-10">
                            <div className="space-y-5">
                                <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                                    Official events &{' '}
                                    <span className="bg-gradient-to-br from-blue-400 via-indigo-500 to-cyan-600 bg-clip-text text-transparent">
                                        community gatherings
                                    </span>
                                </h1>
                                <p className="max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
                                    Curated happenings that honor consent, craft, and community care. Submit yours and we'll help bring it to life.
                                </p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                {[
                                    {
                                        label: 'Events scheduled',
                                        value: numberFormatter.format(totalUpcoming),
                                        icon: CalendarCheck,
                                        iconColor: 'blue',
                                        gradient: 'from-blue-400/20 via-blue-300/15 to-blue-400/10',
                                        borderColor: 'border-blue-400/20',
                                        textColor: 'text-blue-300',
                                        shadowColor: 'rgba(59,130,246,0.3)',
                                    },
                                    {
                                        label: 'Event types',
                                        value: numberFormatter.format(meta.types?.length ?? 0),
                                        icon: Tag,
                                        iconColor: 'indigo',
                                        gradient: 'from-indigo-400/20 via-indigo-300/15 to-indigo-400/10',
                                        borderColor: 'border-indigo-400/20',
                                        textColor: 'text-indigo-300',
                                        shadowColor: 'rgba(99,102,241,0.3)',
                                    },
                                    {
                                        label: 'Past highlights',
                                        value: numberFormatter.format(pastEvents.length),
                                        icon: Archive,
                                        iconColor: 'cyan',
                                        gradient: 'from-cyan-400/20 via-cyan-300/15 to-cyan-400/10',
                                        borderColor: 'border-cyan-400/20',
                                        textColor: 'text-cyan-300',
                                        shadowColor: 'rgba(6,182,212,0.3)',
                                    },
                                ].map(({ label, value, icon: Icon, gradient, borderColor, textColor, shadowColor }) => (
                                    <div
                                        key={label}
                                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black/50 via-black/40 to-black/50 px-5 py-4 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-all hover:border-white/20 hover:shadow-[0_8px_32px_-16px_rgba(59,130,246,0.2)] sm:text-center"
                                    >
                                        <div className="relative flex items-center gap-4 sm:flex-col sm:gap-3">
                                            <div
                                                className={`flex size-11 shrink-0 items-center justify-center rounded-xl border ${borderColor} bg-gradient-to-br ${gradient} ${textColor} transition-all group-hover:scale-105`}
                                                style={{
                                                    boxShadow: `0 4px 16px -8px ${shadowColor}`,
                                                }}
                                            >
                                                <Icon className="size-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="mb-1 text-xs font-medium uppercase tracking-[0.3em] text-white/55">
                                                    {label}
                                                </p>
                                                <p className="text-xl font-semibold text-white">{value}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {featuredEvent && (
                                <div className="space-y-6 rounded-3xl border border-white/10 bg-black/40 p-7 backdrop-blur-sm">
                                    <Link
                                        href={eventsRoutes.show({ event: featuredEvent.slug }).url}
                                        className="group block space-y-4"
                                    >
                                        <div className="relative h-40 overflow-hidden rounded-2xl border border-white/10">
                                            <div
                                                className={cn(
                                                    'absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105',
                                                    featuredEvent.cover_path
                                                        ? ''
                                                        : 'bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_65%)]',
                                                )}
                                                style={
                                                    featuredEvent.cover_path
                                                        ? { backgroundImage: `url(${featuredEvent.cover_path})` }
                                                        : undefined
                                                }
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />
                                            <div className="absolute top-3 left-3">
                                                <Badge className="rounded-full border-blue-400/40 bg-blue-500/15 text-[0.65rem] uppercase tracking-[0.35em] text-blue-100">
                                                    Featured Event
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Badge className="rounded-full border-white/25 bg-white/15 text-[0.65rem] uppercase tracking-[0.3em] text-white">
                                                    {formatEventModality(featuredEvent.modality)}
                                                </Badge>
                                                <Badge className="rounded-full border-white/20 bg-black/30 text-[0.65rem] uppercase tracking-[0.25em] text-white/80">
                                                    {formatEventType(featuredEvent.type)}
                                                </Badge>
                                            </div>
                                            <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-blue-300 transition-colors">
                                                {featuredEvent.title}
                                            </h3>
                                        </div>
                                    </Link>

                                    <div className="space-y-3 text-sm text-white/75">
                                        <div className="flex items-center gap-2 text-xs text-white/60">
                                            <Calendar className="size-3.5" />
                                            <span>{formatEventDateRange(featuredEvent)}</span>
                                        </div>
                                        {featuredEvent.location.location_city && (
                                            <div className="flex items-center gap-2 text-xs text-white/60">
                                                <MapPin className="size-3.5" />
                                                <span>{formatEventLocation(featuredEvent.location)}</span>
                                            </div>
                                        )}
                                        {featuredEvent.rsvp_summary && (
                                            <div className="flex items-center gap-2 text-xs text-white/60">
                                                <Users className="size-3.5" />
                                                <span>
                                                    {featuredEvent.rsvp_summary.going} going
                                                    {featuredEvent.rsvp_summary.tentative > 0 &&
                                                        ` · ${featuredEvent.rsvp_summary.tentative} tentative`}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        asChild
                                        className="w-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_4px_12px_-4px_rgba(59,130,246,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(59,130,246,0.5)]"
                                    >
                                        <Link href={eventsRoutes.show({ event: featuredEvent.slug }).url}>
                                            View Details →
                                        </Link>
                                    </Button>
                                </div>
                            )}

                            <Button
                                asChild
                                className="w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white shadow-[0_28px_70px_-36px_rgba(249,115,22,0.65)] transition-all hover:scale-[1.02] hover:shadow-[0_35px_80px_-36px_rgba(249,115,22,0.75)]"
                            >
                                <Link href={eventsRoutes.submit().url}>
                                    Suggest an Event
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                <EventFilterBar
                    filters={filters}
                    meta={{
                        modalities: meta.modalities ?? [],
                        types: meta.types ?? [],
                        tags: meta.tags ?? [],
                    }}
                />

                {emptyState ? (
                    <Card className="border-white/10 bg-white/5 text-white shadow-[0_40px_100px_-70px_rgba(59,130,246,0.45)]">
                        <CardContent className="flex flex-col gap-4 p-8 text-center">
                            <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-white/15 bg-white/10 text-lg font-semibold text-white/70">
                                RK
                            </div>
                            <h2 className="text-xl font-semibold">
                                Nothing is scheduled… yet.
                            </h2>
                            <p className="text-sm text-white/65">
                                Coordinate a scene, host a workshop, or rally a
                                pop-up. Submit the concept and we’ll help craft
                                the official experience.
                            </p>
                            <div>
                                <Badge className="rounded-full border-white/20 bg-white/15 px-3 py-1 text-xs text-white/75">
                                    Official events are curated by admins and
                                    run hosts
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <section className="space-y-8">
                        {events.data.length > 0 && (
                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                {events.data.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        onRsvpUpdated={handleRsvpRefresh}
                                    />
                                ))}
                            </div>
                        )}

                        <Pagination
                            meta={paginationMeta}
                            onPageChange={handlePageChange}
                            className="border-white/10 bg-white/5"
                        />
                    </section>
                )}

                {hasPastHighlights && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                Past highlights
                            </h2>
                            <span className="text-xs uppercase tracking-[0.35em] text-white/60">
                                {pastEvents.length} archived
                            </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {pastEvents.map((event) => (
                                <PastEventCard key={event.id} event={event} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}

type PastEventCardProps = {
    event: Event;
};

function PastEventCard({ event }: PastEventCardProps) {
    const cover = event.cover_path;

    return (
        <Card className="overflow-hidden border-white/10 bg-white/5 text-white transition hover:border-white/20 hover:shadow-[0_35px_95px_-65px_rgba(147,197,253,0.4)]">
            <div className="relative h-36 overflow-hidden">
                <div
                    className={cn(
                        'absolute inset-0 bg-cover bg-center',
                        !cover &&
                            'bg-[radial-gradient(circle_at_top,_rgba(203,213,225,0.3),_transparent_70%)]',
                    )}
                    style={
                        cover ? { backgroundImage: `url(${cover})` } : undefined
                    }
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                <div className="absolute bottom-3 left-3 space-y-1 text-xs uppercase tracking-[0.3em] text-white/65">
                    <span>{formatEventDateRange(event)}</span>
                    <span>{formatEventLocation(event.location)}</span>
                </div>
            </div>

            <CardContent className="space-y-3 p-4 text-sm text-white/75">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-white">
                        {event.title}
                    </h3>
                    <EventStatusBadge status={event.status} />
                </div>

                <p className="text-white/65">
                    {event.description.slice(0, 160)}
                    {event.description.length > 160 && '…'}
                </p>

                <div className="flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-[0.3em] text-white/60">
                    <Badge className="rounded-full border-white/15 bg-white/10 text-[0.65rem]">
                        Archive
                    </Badge>
                    <Badge className="rounded-full border-white/15 bg-white/10 text-[0.65rem]">
                        {event.tags[0]?.name ?? 'Community'}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}
 