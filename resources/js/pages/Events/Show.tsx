import { EventRsvpToggle } from '@/components/events/event-rsvp-toggle';
import { EventStatusBadge } from '@/components/events/event-status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/layouts/app-layout';
import eventsRoutes from '@/routes/events';
import { Head, router } from '@inertiajs/react';
import {
    type Event,
    formatEventDateRange,
    formatEventLocation,
    formatEventModality,
    formatEventType,
} from '@/types/events';
import { cn } from '@/lib/utils';

type EventShowProps = {
    event: Event;
};

export default function EventShow({ event }: EventShowProps) {
    const cover = event.cover_path;
    const viewerCanRsvp = event.can.rsvp && !event.is_past;

    const handleRsvpRefresh = () =>
        router.reload({
            only: ['event'],
        });

    const breadcrumbs = [
        { title: 'Home', href: '/dashboard' },
        { title: 'Events', href: eventsRoutes.index().url },
        { title: event.title, href: eventsRoutes.show({ event: event.slug }).url },
    ];

    const requirements = Array.isArray(event.requirements)
        ? event.requirements.filter(Boolean)
        : event.requirements && typeof event.requirements === 'object'
        ? Object.values(event.requirements).filter(Boolean)
        : [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${event.title} · Events`} />

            <article className="space-y-10 text-white">
                <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-[0_45px_110px_-65px_rgba(249,115,22,0.65)]">
                    <div className="relative h-64 overflow-hidden sm:h-72">
                        <div
                            className={cn(
                                'absolute inset-0 bg-cover bg-center',
                                !cover &&
                                    'bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.3),_transparent_70%)]',
                            )}
                            style={
                                cover
                                    ? { backgroundImage: `url(${cover})` }
                                    : undefined
                            }
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/40" />

                        <div className="absolute top-6 left-6 flex flex-wrap items-center gap-3">
                            <EventStatusBadge status={event.status} />
                            <Badge className="rounded-full border-white/20 bg-white/10 text-xs uppercase tracking-[0.35em] text-white/80">
                                {formatEventModality(event.modality)}
                            </Badge>
                            <Badge className="rounded-full border-white/20 bg-white/10 text-xs uppercase tracking-[0.35em] text-white/80">
                                {formatEventType(event.type)}
                            </Badge>
                        </div>

                        <div className="absolute bottom-6 left-6 space-y-2">
                            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                                {formatEventDateRange(event)}
                            </p>
                            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                                {event.title}
                            </h1>
                            {event.subtitle && (
                                <p className="max-w-xl text-sm text-white/75">
                                    {event.subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                </header>

                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_40px_100px_-70px_rgba(59,130,246,0.35)]">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <DetailBlock
                                label="Schedule"
                                value={formatEventDateRange(event)}
                            />
                            <DetailBlock
                                label="Location"
                                value={formatEventLocation(event.location)}
                            />
                            {event.virtual_meeting_url && (
                                <DetailBlock
                                    label="Virtual access"
                                    value={
                                        <a
                                            href={event.virtual_meeting_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-emerald-300 underline decoration-dotted underline-offset-4 hover:text-emerald-200"
                                        >
                                            Join link
                                        </a>
                                    }
                                />
                            )}
                            {event.manager && (
                                <DetailBlock
                                    label="Event manager"
                                    value={event.manager.display_name ?? event.manager.username}
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold">Overview</h2>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-white/70">
                                {event.description}
                            </p>
                        </div>

                        {requirements.length > 0 && (
                            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                                <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">
                                    Requirements & expectations
                                </h3>
                                <ul className="space-y-2 text-sm text-white/75">
                                    {requirements.map((item, index) => (
                                        <li key={index} className="flex gap-2">
                                            <span className="mt-1 size-1.5 rounded-full bg-emerald-400" />
                                            <span>{String(item)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {event.media.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">
                                    Media
                                </h3>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {event.media.map((media) => (
                                        <div
                                            key={media.id}
                                            className="h-44 overflow-hidden rounded-2xl border border-white/10 bg-black/30"
                                            style={{
                                                backgroundImage:
                                                    media.media_type === 'image'
                                                        ? `url(${media.path})`
                                                        : undefined,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        >
                                            {media.media_type === 'video' && (
                                                <div className="flex h-full items-center justify-center text-sm text-white/70">
                                                    Video • {media.meta?.duration_seconds ?? '—'}s
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    <aside className="space-y-6">
                        <Card className="border-white/10 bg-white/5">
                            <CardContent className="space-y-4 p-5">
                                <div className="space-y-1 text-sm text-white/70">
                                    <p>
                                        RSVP totals:{' '}
                                        <span className="text-white">
                                            {event.rsvp_summary.going} going /{' '}
                                            {event.rsvp_summary.tentative}{' '}
                                            tentative
                                        </span>
                                    </p>
                                    {event.viewer_rsvp && (
                                        <p className="text-emerald-300">
                                            You’re marked as{' '}
                                            {event.viewer_rsvp.status === 'going'
                                                ? 'going'
                                                : 'tentative'}
                                            {event.viewer_rsvp.guest_count
                                                ? ` · +${event.viewer_rsvp.guest_count}`
                                                : ''}
                                        </p>
                                    )}
                                </div>

                                {viewerCanRsvp ? (
                                    <EventRsvpToggle
                                        event={event}
                                        onUpdated={handleRsvpRefresh}
                                    />
                                ) : (
                                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs text-white/70">
                                        RSVPs are closed
                                        {event.is_past ? ' (event has ended).' : '.'}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {event.occurrences.length > 0 && (
                            <Card className="border-white/10 bg-white/5">
                                <CardContent className="space-y-3 p-5">
                                    <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">
                                        Upcoming occurrences
                                    </h3>
                                    <div className="space-y-3">
                                        {event.occurrences.map((occurrence) => (
                                            <div
                                                key={occurrence.id}
                                                className="rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-white/75"
                                            >
                                                <p className="font-semibold text-white">
                                                    {occurrence.title}
                                                </p>
                                                <p>{formatEventDateRange(occurrence)}</p>
                                                <p className="text-xs uppercase tracking-[0.3em] text-white/55">
                                                    {occurrence.status}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="border-white/10 bg-white/5">
                            <CardContent className="space-y-3 p-5">
                                <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">
                                    Tags
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {event.tags.length > 0 ? (
                                        event.tags.map((tag) => (
                                            <Badge
                                                key={tag.id}
                                                className="rounded-full border-white/15 bg-white/10 text-[0.65rem] uppercase tracking-[0.3em] text-white/70"
                                            >
                                                {tag.name}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-xs text-white/60">
                                            No tags yet.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </article>
        </AppLayout>
    );
}

type DetailBlockProps = {
    label: string;
    value: React.ReactNode;
};

function DetailBlock({ label, value }: DetailBlockProps) {
    return (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                {label}
            </p>
            <p className="mt-2 text-sm text-white/80">{value}</p>
        </div>
    );
}

EventShow.Skeleton = function EventShowSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-64 rounded-3xl bg-white/10" />
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <Skeleton className="h-96 rounded-3xl bg-white/10" />
                <Skeleton className="h-64 rounded-3xl bg-white/10" />
            </div>
        </div>
    );
};

