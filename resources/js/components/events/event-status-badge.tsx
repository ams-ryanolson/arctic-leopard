import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    eventStatusTone,
    formatEventStatus,
    type EventStatus,
} from '@/types/events';

const toneClasses: Record<ReturnType<typeof eventStatusTone>, string> = {
    success:
        'border-emerald-400/40 bg-emerald-500/20 text-emerald-200 shadow-[0_12px_30px_-18px_rgba(16,185,129,0.45)]',
    warning:
        'border-amber-400/40 bg-amber-500/15 text-amber-200 shadow-[0_12px_28px_-18px_rgba(245,158,11,0.45)]',
    info: 'border-sky-400/40 bg-sky-500/15 text-sky-200 shadow-[0_12px_30px_-18px_rgba(14,165,233,0.45)]',
    danger: 'border-rose-400/40 bg-rose-500/20 text-rose-200 shadow-[0_12px_28px_-18px_rgba(244,63,94,0.45)]',
    muted: 'border-white/15 bg-white/10 text-white/65 shadow-[0_10px_22px_-16px_rgba(148,163,184,0.35)]',
};

type EventStatusBadgeProps = {
    status: EventStatus;
    className?: string;
};

export function EventStatusBadge({ status, className }: EventStatusBadgeProps) {
    const tone = eventStatusTone(status);

    return (
        <Badge
            variant="outline"
            className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium tracking-[0.25em] uppercase',
                toneClasses[tone],
                className,
            )}
        >
            {formatEventStatus(status)}
        </Badge>
    );
}
