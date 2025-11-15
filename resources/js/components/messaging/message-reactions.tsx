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
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-2">
                {current.map((reaction) => (
                    <button
                        key={reaction.key}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => toggleReaction(reaction.emoji, reaction.variant)}
                        className={cn(
                            'flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-sm transition-all duration-150',
                            reaction.reacted
                                ? 'border-amber-400/50 bg-amber-400/20 text-amber-100 shadow-lg shadow-amber-400/20'
                                : 'border-white/20 bg-white/10 text-white/80 hover:border-white/30 hover:bg-white/15 hover:shadow-md',
                        )}
                        aria-pressed={reaction.reacted}
                    >
                        <span className="text-base">{reaction.emoji}</span>
                        <span className="text-xs font-semibold">{reaction.count}</span>
                    </button>
                ))}
                <div className="flex items-center gap-1 rounded-full border border-dashed border-white/20 bg-white/5 px-2 py-1">
                    {REACTION_PICKER.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            className="rounded-full p-1.5 text-base text-white/70 transition-all duration-150 hover:bg-white/10 hover:scale-110 hover:text-white"
                            onClick={() => toggleReaction(emoji)}
                            disabled={isSubmitting}
                            aria-label={`React with ${emoji}`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

