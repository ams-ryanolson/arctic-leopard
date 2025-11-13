import { EventCard } from '@/components/events/event-card';
import { EventFilterBar } from '@/components/events/event-filter-bar';
import { EventSubmissionDialog } from '@/components/events/event-submission-dialog';
import { EventStatusBadge } from '@/components/events/event-status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import eventsRoutes from '@/routes/events';
import AppLayout from '@/layouts/app-layout';
import { router, Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    type Event,
    type EventCollection,
    type EventFilters,
    type EventMeta,
    formatEventDateRange,
    formatEventLocation,
} from '@/types/events';

type EventsIndexProps = {
    events: EventCollection;
    pastEvents: Event[];
    filters: EventFilters;
    meta: EventMeta;
};

export default function EventsIndex({
    events,
    pastEvents,
    filters,
    meta,
}: EventsIndexProps) {
    const [submissionOpen, setSubmissionOpen] = useState(false);

    const highlightEvent = events.data[0] ?? null;
    const remainingEvents = highlightEvent
        ? events.data.slice(1)
        : events.data;

    const emptyState = events.meta.total === 0;

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

            <div className="space-y-10 text-white">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Official events & immersive rituals
                        </h1>
                        <p className="text-sm text-white/65">
                            Curated happenings that honor consent, craft, and
                            community care. Submit yours and we’ll help bring it
                            to life.
                        </p>
                    </div>
                    <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
                        {events.meta.total} scheduled
                    </div>
                </header>

                <EventFilterBar
                    filters={filters}
                    meta={{
                        modalities: meta.modalities ?? [],
                        types: meta.types ?? [],
                        tags: meta.tags ?? [],
                    }}
                    statuses={meta.statuses ?? undefined}
                    onOpenSubmission={() => setSubmissionOpen(true)}
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
                        {highlightEvent && (
                            <EventCard
                                event={highlightEvent}
                                highlight
                                onRsvpUpdated={handleRsvpRefresh}
                            />
                        )}

                        {remainingEvents.length > 0 && (
                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                {remainingEvents.map((event) => (
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

            <EventSubmissionDialog
                open={submissionOpen}
                onOpenChange={setSubmissionOpen}
                tags={meta.tags ?? []}
                modalities={meta.modalities ?? []}
                types={meta.types ?? []}
            />
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
 