import { Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency, formatRelativeTime } from './message-utils';
import type { TipMessageMetadata } from './types';

type TipRequestMessageProps = {
    isOwnMessage: boolean;
    metadata: TipMessageMetadata;
    createdAt: string;
    messageId: number;
    canRespond: boolean;
    isProcessing: boolean;
    onAccept: (messageId: number) => void;
    onDecline: (messageId: number) => void;
};

export default function TipRequestMessage({
    isOwnMessage,
    metadata,
    createdAt,
    messageId,
    canRespond,
    isProcessing,
    onAccept,
    onDecline,
}: TipRequestMessageProps) {
    const status = metadata.status ?? 'pending';
    const amountLabel = formatCurrency(metadata.amount ?? 0, metadata.currency ?? 'USD');
    const statusBadgeClasses =
        status === 'accepted'
            ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/40'
            : status === 'declined'
                ? 'bg-rose-500/20 text-rose-100 border border-rose-400/40'
                : 'bg-white/10 text-white/80 border border-white/15';

    return (
        <div className="w-full max-w-sm rounded-xl border border-white/15 bg-white/5 px-5 py-5 text-sm text-white shadow-lg sm:max-w-md">
            <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
                <span className="flex items-center gap-2 text-white">
                    <Coins className="h-4 w-4" />
                    {isOwnMessage ? 'Tip request sent' : 'Tip request'}
                </span>
                <Badge
                    variant="secondary"
                    className={cn('rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.3em]', statusBadgeClasses)}
                >
                    {status.toUpperCase()}
                </Badge>
            </div>
            <div className="mt-4 text-3xl font-semibold tracking-tight text-white">{amountLabel}</div>
            <p className="mt-3 text-xs text-white/70">
                {isOwnMessage
                    ? 'Awaiting their response.'
                    : 'Send a tip to keep the good vibes going.'}
            </p>
            {canRespond ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-full border border-transparent px-4 text-xs uppercase tracking-[0.3em] text-white/70 hover:border-white/15 hover:bg-white/5 disabled:opacity-50"
                        onClick={() => onDecline(messageId)}
                        disabled={isProcessing}
                    >
                        Decline
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-4 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_30px_-16px_rgba(249,115,22,0.65)] hover:from-amber-400/90 hover:via-rose-500/90 hover:to-violet-600/90 disabled:opacity-50"
                        onClick={() => onAccept(messageId)}
                        disabled={isProcessing}
                    >
                        Pay now · {amountLabel}
                    </Button>
                </div>
            ) : null}
            {status === 'accepted' ? (
                <p className="mt-3 text-xs text-emerald-200">
                    Tip sent {metadata.responded_at ? formatRelativeTime(metadata.responded_at) : ''}
                </p>
            ) : null}
            {status === 'declined' ? (
                <p className="mt-3 text-xs text-rose-200">Tip request declined</p>
            ) : null}
            <p className="mt-3 text-[0.65rem] uppercase tracking-[0.25em] text-white/35">
                {formatRelativeTime(createdAt)}
            </p>
        </div>
    );
}


