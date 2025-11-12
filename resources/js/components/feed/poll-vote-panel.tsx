import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { FeedPoll } from '@/types/feed';

type PollVotePanelProps = {
    poll: FeedPoll;
    onVote?: (optionId: number) => void;
    disabled?: boolean;
};

export default function PollVotePanel({ poll, onVote, disabled }: PollVotePanelProps) {
    if (!poll.options.length) {
        return null;
    }

    return (
        <Card className="mt-4 border border-white/10 bg-white/5 p-4 text-sm text-white/75">
            <header className="mb-3">
                <p className="font-semibold text-white">{poll.question}</p>
                {poll.closes_at && (
                    <p className="text-xs text-white/50">
                        Closes{' '}
                        {new Date(poll.closes_at).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                        })}
                    </p>
                )}
            </header>

            <div className="flex flex-col gap-2">
                {poll.options.map((option) => (
                    <Button
                        key={option.id}
                        type="button"
                        variant="ghost"
                        className="justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-left text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white"
                        disabled={disabled}
                        onClick={() => onVote?.(option.id)}
                    >
                        <span>{option.title}</span>
                        <span className="text-xs text-white/50">{option.vote_count} votes</span>
                    </Button>
                ))}
            </div>
        </Card>
    );
}


