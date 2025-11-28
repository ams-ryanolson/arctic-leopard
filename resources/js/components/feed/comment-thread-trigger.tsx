import { Button } from '@/components/ui/button';

type CommentThreadTriggerProps = {
    postId: number;
    count: number;
    onOpen?: (postId: number) => void;
    disabled?: boolean;
};

export default function CommentThreadTrigger({
    postId,
    count,
    onOpen,
    disabled,
}: CommentThreadTriggerProps) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 rounded-full px-3 text-[0.625rem] text-white/75 transition active:scale-95 hover:bg-white/10 hover:text-white sm:h-auto sm:px-4 sm:text-xs"
            onClick={() => onOpen?.(postId)}
            disabled={disabled}
        >
            <span className="whitespace-nowrap">Comments ({count})</span>
        </Button>
    );
}
