import { CornerUpRight, SmilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

type MessageActionsProps = {
    isOwnMessage: boolean;
    reactionCount: number;
    isReactionsExpanded: boolean;
    isHovered?: boolean;
    onToggleReactions: () => void;
    onReply: () => void;
};

export default function MessageActions({
    isOwnMessage,
    reactionCount,
    isReactionsExpanded,
    isHovered = false,
    onToggleReactions,
    onReply,
}: MessageActionsProps) {
    // Show actions on hover or when reactions are expanded
    const showActions = isHovered || isReactionsExpanded;

    return (
        <div
            className={cn(
                'flex items-center gap-1 transition-all duration-200',
                showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none',
            )}
        >
            <div className="flex items-center gap-0.5 rounded-full bg-white/10 px-1 py-0.5 backdrop-blur-sm border border-white/10 shadow-sm">
                <button
                    type="button"
                    aria-label="React"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleReactions();
                    }}
                    className={cn(
                        'rounded-full p-1.5 text-white/70 transition-all duration-150 hover:bg-white/20 hover:text-white active:scale-95',
                        isReactionsExpanded && 'bg-amber-400/20 text-amber-300 shadow-md shadow-amber-400/20',
                    )}
                >
                    <SmilePlus className="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    aria-label="Reply"
                    onClick={(e) => {
                        e.stopPropagation();
                        onReply();
                    }}
                    className="rounded-full p-1.5 text-white/70 transition-all duration-150 hover:bg-white/20 hover:text-white active:scale-95"
                >
                    <CornerUpRight className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}

