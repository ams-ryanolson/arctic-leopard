import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { ActiveConversation, PresenceMember } from './types';

type ConversationHeaderProps = {
    conversation: ActiveConversation;
    presenceMembers: PresenceMember[];
    onBack?: () => void;
    showBackButton?: boolean;
};

export default function ConversationHeader({
    conversation,
    presenceMembers,
    onBack,
    showBackButton = false,
}: ConversationHeaderProps) {
    const participants = conversation.participants.filter(
        (participant) => !participant.is_viewer,
    );
    const participantNames = participants
        .map((participant) => participant.display_name ?? participant.username)
        .join(' • ');

    // Get first participant for avatar (on mobile we show simpler header)
    const firstParticipant = participants[0];

    return (
        <div className="px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex items-center gap-3">
                {showBackButton && onBack && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="flex-shrink-0 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
                        aria-label="Back to conversations"
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
                )}
                {/* Avatar - show first participant's avatar */}
                {firstParticipant && (
                    <Avatar className="size-9 border border-white/10">
                        <AvatarImage
                            src={firstParticipant.avatar_url ?? undefined}
                            alt={firstParticipant.display_name ?? firstParticipant.username ?? 'User'}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-amber-500/20 to-amber-600/30 text-xs font-semibold text-amber-200">
                            {(firstParticipant.display_name ?? firstParticipant.username ?? '??')
                                .slice(0, 2)
                                .toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                    <h2 className="truncate text-base font-semibold text-white">
                        {conversation.title}
                    </h2>
                    {presenceMembers.length > 0 ? (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex h-full w-full rounded-full bg-emerald-400"></span>
                            </span>
                            Active now
                        </span>
                    ) : (
                        <p className="truncate text-xs text-white/60">
                            {participantNames}
                        </p>
                    )}
                </div>
                {/* Desktop: Show presence avatars */}
                {!showBackButton && presenceMembers.length > 0 && (
                    <div className="hidden shrink-0 items-center gap-2 sm:flex">
                        {presenceMembers.slice(0, 5).map((member) => {
                            const initials = (member.name ?? '??')
                                .slice(0, 2)
                                .toUpperCase();

                            return (
                                <div key={member.id} className="relative">
                                    <Avatar className="border-2 border-white/20 ring-2 ring-black/40">
                                        <AvatarImage
                                            src={(member.avatar_url || member.avatar) ?? undefined}
                                            alt={member.name ?? 'Active participant'}
                                        />
                                        <AvatarFallback className="bg-gradient-to-br from-amber-500/20 to-amber-600/30 text-xs font-semibold text-amber-200">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-black/40 bg-emerald-400"></span>
                                </div>
                            );
                        })}
                        {presenceMembers.length > 5 && (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-xs font-semibold text-white/70 ring-2 ring-black/40">
                                +{presenceMembers.length - 5}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
