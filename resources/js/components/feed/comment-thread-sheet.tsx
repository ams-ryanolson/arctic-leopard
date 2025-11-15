import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { FeedPost } from '@/types/feed';

import CommentThreadPanel from './comment-thread-panel';

type CommentThreadSheetProps = {
    post: FeedPost | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCommentAdded?: (postId: number, totalComments: number) => void;
};

export default function CommentThreadSheet({
    post,
    open,
    onOpenChange,
    onCommentAdded,
}: CommentThreadSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="bg-neutral-950/95 p-0 text-white sm:max-w-lg"
            >
                <CommentThreadPanel
                    post={post}
                    open={open}
                    onCommentAdded={onCommentAdded}
                    layout="sheet"
                />
            </SheetContent>
        </Sheet>
    );
}







