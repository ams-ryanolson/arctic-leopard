import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import eventsRsvps from '@/routes/events/rsvps';
import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import {
    type Event,
    type EventRsvpStatus,
    formatEventDateRange,
} from '@/types/events';

type EventRsvpToggleProps = {
    event: Event;
    onUpdated?: () => void;
};

const RSVP_OPTIONS: Array<{ value: EventRsvpStatus; label: string }> = [
    {
        value: 'going',
        label: 'Going',
    },
    {
        value: 'tentative',
        label: 'Tentative',
    },
];

export function EventRsvpToggle({ event, onUpdated }: EventRsvpToggleProps) {
    const [processing, setProcessing] = useState(false);

    const currentStatus = event.viewer_rsvp?.status ?? null;

    const disabled = !event.can.rsvp || processing;
    const isInPast = event.is_past;

    const handleVisitComplete = useCallback(() => {
        setProcessing(false);

        if (onUpdated) {
            onUpdated();
        } else {
            router.reload({
                only: ['events', 'event', 'pastEvents'],
            });
        }
    }, [onUpdated]);

    const submit = useCallback(
        (status: EventRsvpStatus) => {
            if (disabled) {
                return;
            }

            setProcessing(true);

            router.visit(eventsRsvps.store({ event: event.slug }).url, {
                method: 'post',
                data: {
                    status,
                    guest_count: 0,
                },
                preserveScroll: true,
                onFinish: handleVisitComplete,
                onCancel: () => setProcessing(false),
            });
        },
        [disabled, event.slug, handleVisitComplete],
    );

    const clear = useCallback(() => {
        if (disabled) {
            return;
        }

        setProcessing(true);

        router.visit(eventsRsvps.destroy({ event: event.slug }).url, {
            method: 'delete',
            preserveScroll: true,
            onFinish: handleVisitComplete,
            onCancel: () => setProcessing(false),
        });
    }, [disabled, event.slug, handleVisitComplete]);

    if (!event.can.rsvp || isInPast) {
        const summary = event.viewer_rsvp
            ? `You RSVP’d ${event.viewer_rsvp.status === 'going' ? 'as going' : 'as tentative'}`
            : `RSVPs closed · ${formatEventDateRange(event)}`;

        return (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                {summary}
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2">
                {RSVP_OPTIONS.map((option) => {
                    const active = currentStatus === option.value;

                    return (
                        <Button
                            key={option.value}
                            type="button"
                            disabled={disabled}
                            variant={active ? 'default' : 'outline'}
                            onClick={() =>
                                active ? clear() : submit(option.value)
                            }
                            className={cn(
                                'flex-1 rounded-full text-sm font-semibold tracking-wide transition',
                                active
                                    ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 text-white shadow-[0_18px_55px_-28px_rgba(52,211,153,0.65)] hover:scale-[1.02]'
                                    : 'border-white/20 bg-white/10 text-white/75 hover:border-white/40 hover:bg-white/15 hover:text-white',
                            )}
                        >
                            {option.label}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

