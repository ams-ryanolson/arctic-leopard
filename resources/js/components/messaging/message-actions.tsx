import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { CornerUpRight, SmilePlus } from 'lucide-react';

type MessageActionsProps = {
    isOwnMessage: boolean;
    reactionCount: number;
    isReactionsExpanded: boolean;
    isHovered?: boolean;
    onToggleReactions: () => void;
    onReply: () => void;
};

export default function MessageActions({
    isOwnMessage: _isOwnMessage, // eslint-disable-line @typescript-eslint/no-unused-vars
    reactionCount: _reactionCount, // eslint-disable-line @typescript-eslint/no-unused-vars
    isReactionsExpanded,
    isHovered = false,
    onToggleReactions,
    onReply,
}: MessageActionsProps) {
    const isMobile = useIsMobile();
    // Show actions always on mobile, or on hover/expanded on desktop
    const showActions = isMobile || isHovered || isReactionsExpanded;

    return (
        <div
            className={cn(
                'flex items-center gap-1 transition-all duration-200',
                showActions
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none translate-y-1 opacity-0',
            )}
        >
            <div className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-1 py-0.5 shadow-sm backdrop-blur-sm">
                <button
                    type="button"
                    aria-label="React"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleReactions();
                    }}
                    className={cn(
                        'min-h-[44px] min-w-[44px] rounded-full p-2.5 text-white/70 transition-all duration-150 hover:bg-white/20 hover:text-white active:scale-95 sm:min-h-0 sm:min-w-0 sm:p-1.5',
                        isReactionsExpanded &&
                            'bg-amber-400/20 text-amber-300 shadow-md shadow-amber-400/20',
                    )}
                >
                    <SmilePlus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                </button>
                <button
                    type="button"
                    aria-label="Reply"
                    onClick={(e) => {
                        e.stopPropagation();
                        onReply();
                    }}
                    className="min-h-[44px] min-w-[44px] rounded-full p-2.5 text-white/70 transition-all duration-150 hover:bg-white/20 hover:text-white active:scale-95 sm:min-h-0 sm:min-w-0 sm:p-1.5"
                >
                    <CornerUpRight className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                </button>
            </div>
        </div>
    );
}
