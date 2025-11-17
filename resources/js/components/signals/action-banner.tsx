import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

type ActionBannerTone = 'emerald' | 'amber' | 'rose' | 'sky';

const toneStyles: Record<ActionBannerTone, string> = {
    emerald: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
    amber: 'border-amber-400/40 bg-amber-400/10 text-amber-100',
    rose: 'border-rose-400/40 bg-rose-400/10 text-rose-100',
    sky: 'border-sky-400/40 bg-sky-400/10 text-sky-100',
};

interface ActionBannerProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    tone?: ActionBannerTone;
    href?: string;
    actionLabel?: string;
    className?: string;
}

export function ActionBanner({
    title,
    description,
    icon: Icon,
    tone = 'emerald',
    href,
    actionLabel = 'Open',
    className,
}: ActionBannerProps) {
    const content = (
        <div
            className={cn(
                'flex flex-col gap-3 rounded-2xl border px-4 py-4 text-sm transition',
                toneStyles[tone],
                className,
            )}
        >
            <div className="flex items-center gap-3">
                {Icon ? (
                    <span className="inline-flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80">
                        <Icon className="size-4" />
                    </span>
                ) : null}
                <p className="text-sm font-semibold text-white">{title}</p>
            </div>
            <p className="text-sm text-white/80">{description}</p>
            {href ? (
                <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.3em] text-white/70 uppercase">
                    {actionLabel}
                    <span aria-hidden>→</span>
                </span>
            ) : null}
        </div>
    );

    if (href) {
        return (
            <Link href={href} prefetch className="block hover:scale-[1.01]">
                {content}
            </Link>
        );
    }

    return content;
}
