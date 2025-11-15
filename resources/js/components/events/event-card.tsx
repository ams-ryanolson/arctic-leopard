import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import eventsRoutes from '@/routes/events';
import { Link } from '@inertiajs/react';
import {
    EventStatusBadge,
} from '@/components/events/event-status-badge';
import { EventRsvpToggle } from '@/components/events/event-rsvp-toggle';
import {
    type Event,
    formatEventDateRange,
    formatEventLocation,
    formatEventModality,
    formatEventType,
} from '@/types/events';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { memo } from 'react';

type EventCardProps = {
    event: Event;
    highlight?: boolean;
    compact?: boolean;
    onRsvpUpdated?: () => void;
};

const gradientBackdrop =
    'bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.2),_transparent_65%)]';

export const EventCard = memo(function EventCard({
    event,
    highlight = false,
    compact = false,
    onRsvpUpdated,
}: EventCardProps) {
    const getInitials = useInitials();
    const coverImage = event.cover_path;
    const showManager = event.manager ?? event.creator ?? event.submitter;

    return (
        <Card
            className={cn(
                'group relative overflow-hidden border-white/10 bg-white/5 text-white shadow-[0_35px_90px_-60px_rgba(249,115,22,0.65)]',
                highlight && 'border-white/20',
                compact && 'shadow-none',
            )}
        >
            <Link
                href={eventsRoutes.show({ event: event.slug }).url}
                className="group/cover block"
            >
                <div className="relative h-48 overflow-hidden sm:h-56">
                    <div
                        className={cn(
                            'absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover/cover:scale-105',
                            coverImage ? '' : gradientBackdrop,
                        )}
                        style={
                            coverImage
                                ? { backgroundImage: `url(${coverImage})` }
                                : undefined
                        }
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

                    <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full border-white/25 bg-white/15 text-[0.65rem] uppercase tracking-[0.35em] text-white shadow-[0_16px_45px_-25px_rgba(59,130,246,0.45)]">
                            {formatEventModality(event.modality)}
                        </Badge>
                        <Badge className="rounded-full border-white/20 bg-black/30 text-[0.65rem] uppercase tracking-[0.3em] text-white/80">
                            {formatEventType(event.type)}
                        </Badge>
                    </div>

                    {event.status !== 'published' && (
                        <div className="absolute top-4 right-4">
                            <EventStatusBadge status={event.status} />
                        </div>
                    )}

                    {showManager && (
                        <div className="absolute bottom-4 left-4">
                            <Avatar className="size-10 border-2 border-white/40 bg-white/20 text-white shadow-[0_18px_55px_-28px_rgba(249,115,22,0.6)]">
                                <AvatarImage
                                    src={showManager.avatar_url ?? undefined}
                                    alt={showManager.display_name ?? showManager.username}
                                />
                                <AvatarFallback>
                                    {getInitials(
                                        showManager.display_name ??
                                            showManager.username,
                                    )}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    )}
                </div>
            </Link>

            <CardContent className="space-y-4 p-5">
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-orange-300 transition-colors">
                            <Link
                                href={eventsRoutes.show({ event: event.slug }).url}
                                className="hover:underline"
                            >
                                {event.title}
                            </Link>
                        </h3>
                    </div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                        {formatEventDateRange(event)}
                    </p>
                </div>

                {event.subtitle && (
                    <p className="text-sm font-medium text-white/90">
                        {event.subtitle}
                    </p>
                )}

                <p className="text-sm leading-relaxed text-white/75 line-clamp-2">
                    {event.description.slice(0, 140)}
                    {event.description.length > 140 && '…'}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                    {event.location.location_city && (
                        <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-medium text-white/80">
                            {formatEventLocation(event.location)}
                        </span>
                    )}
                    {event.tags.slice(0, 2).map((tag) => (
                        <span
                            key={tag.id}
                            className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70"
                        >
                            {tag.name}
                        </span>
                    ))}
                    {event.tags.length > 2 && (
                        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/60">
                            +{event.tags.length - 2}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <div className="space-y-1 text-xs">
                        <p className="text-white/65">
                            <span className="font-semibold text-white">
                                {event.rsvp_summary.going}
                            </span>{' '}
                            going
                            {event.rsvp_summary.tentative > 0 && (
                                <>
                                    {' '}
                                    ·{' '}
                                    <span className="font-semibold text-white">
                                        {event.rsvp_summary.tentative}
                                    </span>{' '}
                                    tentative
                                </>
                            )}
                        </p>
                        {event.viewer_rsvp && (
                            <p className="text-emerald-300 font-medium">
                                You're{' '}
                                {event.viewer_rsvp.status === 'going'
                                    ? 'going'
                                    : 'tentative'}
                            </p>
                        )}
                    </div>

                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-full border-white/20 bg-white/5 text-xs font-semibold uppercase tracking-[0.3em] text-white/75 hover:border-white/40 hover:bg-white/15 hover:text-white"
                    >
                        <Link href={eventsRoutes.show({ event: event.slug }).url}>
                            Details
                        </Link>
                    </Button>
                </div>

                <EventRsvpToggle event={event} onUpdated={onRsvpUpdated} />
            </CardContent>
        </Card>
    );
});

export function EventCardSkeleton() {
    return (
        <Card className="border-white/10 bg-white/5">
            <Skeleton className="h-48 w-full bg-white/10 sm:h-56" />
            <CardContent className="space-y-4 p-5">
                <Skeleton className="h-4 w-2/3 bg-white/10" />
                <Skeleton className="h-4 w-1/2 bg-white/10" />
                <div className="flex gap-2">
                    <Skeleton className="h-7 w-20 rounded-full bg-white/10" />
                    <Skeleton className="h-7 w-20 rounded-full bg-white/10" />
                </div>
                <Skeleton className="h-10 w-full rounded-2xl bg-white/10" />
            </CardContent>
        </Card>
    );
}

