import { useCallback, useState } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StoryReaction, StoryResponse } from '@/lib/story-client';
import storiesRoutes from '@/routes/stories';
import { getCsrfToken } from '@/lib/csrf';

type StoryReactionsProps = {
    storyId: number;
    reactions: StoryReaction[];
    onUpdate?: (story: StoryResponse) => void;
};

const ALLOWED_REACTIONS = ['❤️', '🔥', '👍', '😍', '😮'];

export default function StoryReactions({ storyId, reactions, onUpdate }: StoryReactionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isToggling, setIsToggling] = useState<string | null>(null);
    const [localReactions, setLocalReactions] = useState<StoryReaction[]>(reactions);

    const handleToggleReaction = useCallback(
        async (emoji: string) => {
            if (isToggling) {
                return;
            }

            setIsToggling(emoji);

            try {
                const response = await fetch(storiesRoutes.reactions.store({ story: storyId }).url, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(getCsrfToken() ? { 'X-XSRF-TOKEN': getCsrfToken()! } : {}),
                    },
                    body: JSON.stringify({ emoji }),
                });

                if (!response.ok) {
                    throw new Error('Failed to toggle reaction');
                }

                const data = await response.json();

                // Update local reactions
                const updatedReactions = data.reactions as StoryReaction[];
                setLocalReactions(updatedReactions);

                // Notify parent if callback provided
                if (onUpdate) {
                    // We'd need to fetch the full story to update it, but for now just update reactions
                    // The parent component can handle full story updates if needed
                }
            } catch (error) {
                console.error('Failed to toggle reaction:', error);
            } finally {
                setIsToggling(null);
            }
        },
        [storyId, isToggling, onUpdate],
    );

    const reactionCount = localReactions.reduce((sum, reaction) => sum + reaction.count, 0);

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="lg"
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full bg-black/80 text-white shadow-lg ring-2 ring-white/20 hover:bg-black/90 hover:ring-white/30"
            >
                <Smile className="size-5" />
                {reactionCount > 0 && (
                    <span className="ml-2 text-sm font-semibold">{reactionCount}</span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute bottom-full right-0 mb-3 rounded-2xl bg-black/90 p-3 backdrop-blur-md shadow-xl ring-1 ring-white/10">
                    <div className="flex flex-col gap-2">
                        {ALLOWED_REACTIONS.map((emoji) => {
                            const reaction = localReactions.find((r) => r.emoji === emoji);
                            const isActive = reaction?.reacted ?? false;
                            const isTogglingThis = isToggling === emoji;
                            const count = reaction?.count ?? 0;

                            return (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleToggleReaction(emoji)}
                                    disabled={isTogglingThis}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl px-3 py-2 text-xl transition',
                                        isActive
                                            ? 'bg-rose-500/20 ring-2 ring-rose-500/50'
                                            : 'bg-white/10 hover:bg-white/20',
                                        isTogglingThis && 'opacity-50',
                                    )}
                                >
                                    <span className="text-2xl">{emoji}</span>
                                    {count > 0 && (
                                        <span className="text-sm font-semibold text-white">{count}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

