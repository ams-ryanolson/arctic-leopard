import { useCallback, useMemo, useState } from 'react';
import { SmilePlus } from 'lucide-react';

import messagesRoutes from '@/routes/messages';
import { getCsrfToken } from '@/lib/csrf';
import { cn } from '@/lib/utils';

type ReactionSummary = {
    emoji: string;
    variant?: string | null;
    count: number;
    reacted: boolean;
};

type MessageReactionsProps = {
    messageId: number | string;
    reactions: ReactionSummary[];
    onChange?: (reactions: ReactionSummary[]) => void;
};

const REACTION_PICKER = ['❤️', '🔥', '👏', '😍', '😂', '😮'];

export default function MessageReactions({ messageId, reactions, onChange }: MessageReactionsProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const current = useMemo(
        () =>
            reactions.map((reaction) => ({
                key: reaction.variant ? `${reaction.emoji}-${reaction.variant}` : reaction.emoji,
                ...reaction,
            })),
        [reactions],
    );

    const toggleReaction = useCallback(
        async (emoji: string, variant?: string | null) => {
            if (isSubmitting) {
                return;
            }

            setIsSubmitting(true);

            const csrfToken = getCsrfToken();

            try {
                const response = await fetch(messagesRoutes.reactions.store.url({ message: messageId }), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken, 'X-XSRF-TOKEN': csrfToken } : {}),
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        emoji,
                        variant,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Unable to update reactions at this time.');
                }

                const payload = await response.json().catch(() => ({}));
                const summary = (payload?.reactions as ReactionSummary[] | undefined) ?? [];

                onChange?.(summary);
            } catch (error) {
                console.error('Unable to toggle reaction', error);
            } finally {
                setIsSubmitting(false);
            }
        },
        [isSubmitting, messageId, onChange],
    );

    return (
        <div className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
                {current.map((reaction) => (
                    <button
                        key={reaction.key}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => toggleReaction(reaction.emoji, reaction.variant)}
                        className={cn(
                            'flex items-center gap-1 rounded-full border px-2 py-1 transition',
                            reaction.reacted
                                ? 'border-amber-400/40 bg-amber-400/15 text-amber-100'
                                : 'border-white/15 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10',
                        )}
                        aria-pressed={reaction.reacted}
                    >
                        <span>{reaction.emoji}</span>
                        <span className="font-semibold">{reaction.count}</span>
                    </button>
                ))}
                <div className="relative inline-flex items-center gap-1">
                    {REACTION_PICKER.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-white/60 transition hover:border-white/25 hover:bg-white/10"
                            onClick={() => toggleReaction(emoji)}
                            disabled={isSubmitting}
                            aria-label={`React with ${emoji}`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
            {current.length === 0 && (
                <div className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.3em] text-white/40">
                    <SmilePlus className="h-4 w-4" />
                    <span>React</span>
                </div>
            )}
        </div>
    );
}

