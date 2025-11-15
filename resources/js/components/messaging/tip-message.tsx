import { Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency, formatRelativeTime } from './message-utils';
import type { TipMessageMetadata } from './types';

type TipMessageProps = {
    isOwnMessage: boolean;
    metadata: TipMessageMetadata;
    createdAt: string;
};

export default function TipMessage({ isOwnMessage, metadata, createdAt }: TipMessageProps) {
    const amountLabel = formatCurrency(metadata.amount ?? 0, metadata.currency ?? 'USD');

    return (
        <div
            className={cn(
                'w-full max-w-sm rounded-xl border px-5 py-5 text-sm shadow-lg sm:max-w-md',
                isOwnMessage
                    ? 'border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent text-emerald-50'
                    : 'border-amber-400/30 bg-gradient-to-br from-amber-400/25 via-amber-400/10 to-transparent text-amber-50',
            )}
        >
            <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.3em]">
                <span className="flex items-center gap-2 text-white/80">
                    <Coins className="h-4 w-4" />
                    {isOwnMessage ? 'You sent a tip' : 'Tip received'}
                </span>
                <Badge
                    variant="secondary"
                    className="rounded-full border border-white/20 bg-white/15 px-3 py-0.5 text-[0.6rem] uppercase tracking-[0.3em] text-white"
                >
                    {(metadata.status ?? 'completed').toUpperCase()}
                </Badge>
            </div>
            <div className="mt-4 text-3xl font-semibold tracking-tight text-white">{amountLabel}</div>
            <p className="mt-3 text-xs text-white/75">
                {isOwnMessage
                    ? 'Thanks for taking care of your favorite creator.'
                    : 'Show some appreciation and keep the energy going.'}
            </p>
            <p className="mt-4 text-[0.65rem] uppercase tracking-[0.25em] text-white/50">
                {formatRelativeTime(createdAt)}
            </p>
        </div>
    );
}


