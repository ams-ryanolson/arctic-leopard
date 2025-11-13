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
            <div className="relative h-48 overflow-hidden sm:h-56">
                <div
                    className={cn(
                        'absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105',
                        coverImage ? '' : gradientBackdrop,
                    )}
                    style={
                        coverImage
                            ? { backgroundImage: `url(${coverImage})` }
                            : undefined
                    }
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/40" />

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

                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                    {showManager && (
                        <Avatar className="size-11 border border-white/30 bg-white/20 text-white shadow-[0_18px_55px_-28px_rgba(249,115,22,0.6)]">
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
                    )}
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                            {formatEventDateRange(event)}
                        </p>
                        <h3 className="text-lg font-semibold text-white">
                            {event.title}
                        </h3>
                    </div>
                </div>
            </div>

            <CardContent className="space-y-5 p-5">
                <p className="text-sm text-white/75">
                    {event.subtitle ?? event.description.slice(0, 140)}
                    {event.description.length > 140 && '…'}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                    <span className="rounded-full border border-white/15 bg-black/25 px-3 py-1">
                        {formatEventLocation(event.location)}
                    </span>
                    {event.tags.slice(0, 3).map((tag) => (
                        <span
                            key={tag.id}
                            className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white/70"
                        >
                            {tag.name}
                        </span>
                    ))}
                    {event.tags.length > 3 && (
                        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white/60">
                            +{event.tags.length - 3} more
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1 text-xs text-white/65">
                        <p>
                            RSVP totals:{' '}
                            <span className="text-white">
                                {event.rsvp_summary.going} going /{' '}
                                {event.rsvp_summary.tentative} tentative
                            </span>
                        </p>
                        {event.viewer_rsvp && (
                            <p className="text-emerald-200">
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

                    <Button
                        asChild
                        variant="outline"
                        className="rounded-full border-white/20 bg-white/5 text-xs font-semibold uppercase tracking-[0.35em] text-white/75 hover:border-white/40 hover:bg-white/15 hover:text-white"
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

