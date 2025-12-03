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
    // Show actions on hover/expanded on desktop, always on mobile but subtle
    const showActions = isMobile || isHovered || isReactionsExpanded;

    return (
        <div
            className={cn(
                'flex items-center gap-0.5 transition-all duration-150',
                showActions
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none translate-y-0.5 opacity-0',
            )}
        >
            {/* Compact inline actions - no container background on mobile */}
            <button
                type="button"
                aria-label="React"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleReactions();
                }}
                className={cn(
                    'rounded-full p-1.5 text-white/50 transition-all duration-150 hover:bg-white/10 hover:text-white/70 active:scale-95',
                    isMobile && 'p-1',
                    isReactionsExpanded &&
                        'bg-amber-400/20 text-amber-300',
                )}
            >
                <SmilePlus className={cn(
                    'h-3.5 w-3.5',
                    isMobile && 'h-3 w-3',
                )} />
            </button>
            <button
                type="button"
                aria-label="Reply"
                onClick={(e) => {
                    e.stopPropagation();
                    onReply();
                }}
                className={cn(
                    'rounded-full p-1.5 text-white/50 transition-all duration-150 hover:bg-white/10 hover:text-white/70 active:scale-95',
                    isMobile && 'p-1',
                )}
            >
                <CornerUpRight className={cn(
                    'h-3.5 w-3.5',
                    isMobile && 'h-3 w-3',
                )} />
            </button>
        </div>
    );
}
