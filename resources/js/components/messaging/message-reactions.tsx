import { useCallback, useMemo, useState } from 'react';

import { getCsrfToken } from '@/lib/csrf';
import { cn } from '@/lib/utils';
import messagesRoutes from '@/routes/messages';

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

export default function MessageReactions({
    messageId,
    reactions,
    onChange,
}: MessageReactionsProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const current = useMemo(
        () =>
            reactions.map((reaction) => ({
                key: reaction.variant
                    ? `${reaction.emoji}-${reaction.variant}`
                    : reaction.emoji,
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
                const response = await fetch(
                    messagesRoutes.reactions.store.url({ message: messageId }),
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            ...(csrfToken
                                ? {
                                      'X-CSRF-TOKEN': csrfToken,
                                      'X-XSRF-TOKEN': csrfToken,
                                  }
                                : {}),
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            emoji,
                            variant,
                        }),
                    },
                );

                if (!response.ok) {
                    throw new Error('Unable to update reactions at this time.');
                }

                const payload = await response.json().catch(() => ({}));
                const summary =
                    (payload?.reactions as ReactionSummary[] | undefined) ?? [];

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
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-1.5">
            {current.map((reaction) => (
                <button
                    key={reaction.key}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() =>
                        toggleReaction(reaction.emoji, reaction.variant)
                    }
                    className={cn(
                        'flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs transition-all duration-150',
                        reaction.reacted
                            ? 'bg-amber-400/20 text-amber-100'
                            : 'text-white/70 hover:bg-white/10',
                    )}
                    aria-pressed={reaction.reacted}
                >
                    <span className="text-sm">{reaction.emoji}</span>
                    <span className="font-medium">{reaction.count}</span>
                </button>
            ))}
            <div className="flex items-center gap-0.5 rounded-full border-l border-white/20 pl-1.5">
                {REACTION_PICKER.map((emoji) => (
                    <button
                        key={emoji}
                        type="button"
                        className="rounded-full p-1 text-sm text-white/60 transition-all duration-150 hover:scale-110 hover:bg-white/10 hover:text-white/80"
                        onClick={() => toggleReaction(emoji)}
                        disabled={isSubmitting}
                        aria-label={`React with ${emoji}`}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}
