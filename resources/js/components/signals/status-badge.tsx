import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

export type StatusTone = 'emerald' | 'amber' | 'rose' | 'sky' | 'neutral';

const toneClasses: Record<StatusTone, string> = {
    emerald: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-100',
    amber: 'border-amber-400/40 bg-amber-400/10 text-amber-100',
    rose: 'border-rose-400/40 bg-rose-400/10 text-rose-100',
    sky: 'border-sky-400/40 bg-sky-400/10 text-sky-100',
    neutral: 'border-white/15 bg-white/10 text-white/70',
};

interface StatusBadgeProps {
    tone?: StatusTone;
    className?: string;
    children: ReactNode;
}

export function StatusBadge({
    tone = 'neutral',
    className,
    children,
}: StatusBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-3 py-1 text-[0.65rem] tracking-[0.3em] uppercase',
                toneClasses[tone],
                className,
            )}
        >
            {children}
        </span>
    );
}
