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
            className="rounded-full px-4 text-xs text-white/75 hover:bg-white/10 hover:text-white"
            onClick={() => onOpen?.(postId)}
            disabled={disabled}
        >
            Comments ({count})
        </Button>
    );
}


