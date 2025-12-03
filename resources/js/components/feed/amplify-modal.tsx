import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Repeat } from 'lucide-react';

type AmplifyModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAmplify: (comment?: string) => void;
    onUnamplify?: () => void;
    isAmplifying?: boolean;
    hasAmplified?: boolean;
};

export default function AmplifyModal({
    open,
    onOpenChange,
    onAmplify,
    onUnamplify,
    isAmplifying = false,
    hasAmplified = false,
}: AmplifyModalProps) {
    const [comment, setComment] = useState('');
    const [showCommentField, setShowCommentField] = useState(false);
    const maxLength = 5000;
    const remaining = maxLength - comment.length;

    const handleQuickAmplify = () => {
        onAmplify();
        handleClose();
    };

    const handleAmplifyWithComment = () => {
        onAmplify(comment.trim() || undefined);
        handleClose();
    };

    const handleClose = () => {
        setComment('');
        setShowCommentField(false);
        onOpenChange(false);
    };

    const handleUnamplify = () => {
        onUnamplify?.();
        handleClose();
    };

    // If already amplified, show unamplify confirmation
    if (hasAmplified) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                            <Repeat className="size-5" />
                            Remove amplify?
                        </DialogTitle>
                        <DialogDescription className="text-white/70">
                            This will remove your amplify of this post. The post
                            will no longer appear in your feed.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-3 py-4">
                        <Button
                            type="button"
                            onClick={handleUnamplify}
                            disabled={isAmplifying}
                            className="w-full rounded-full bg-gradient-to-r from-red-500 to-rose-600 font-semibold text-white transition hover:from-red-600 hover:to-rose-700 disabled:opacity-50"
                        >
                            {isAmplifying ? 'Removing...' : 'Remove amplify'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isAmplifying}
                            className="w-full rounded-full border-white/20 bg-white/5 font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                        >
                            Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                        <Repeat className="size-5" />
                        Amplify post
                    </DialogTitle>
                    <DialogDescription className="text-white/70">
                        Share this post with your followers. You can add a comment
                        to provide context.
                    </DialogDescription>
                </DialogHeader>

                {!showCommentField ? (
                    <div className="flex flex-col gap-3 py-4">
                        <Button
                            type="button"
                            onClick={handleQuickAmplify}
                            disabled={isAmplifying}
                            className="w-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 font-semibold text-white transition hover:from-amber-600 hover:to-rose-600 disabled:opacity-50"
                        >
                            {isAmplifying ? 'Amplifying...' : 'Amplify'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowCommentField(true)}
                            disabled={isAmplifying}
                            className="w-full rounded-full border-white/20 bg-white/5 font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                        >
                            Add comment
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment..."
                                maxLength={maxLength}
                                className={cn(
                                    'min-h-[120px] resize-none border-white/20 bg-white/5 text-white placeholder:text-white/50 focus:border-amber-400/50 focus:ring-amber-400/20',
                                    remaining < 100 && 'border-amber-400/50',
                                )}
                                disabled={isAmplifying}
                            />
                            <div
                                className={cn(
                                    'text-right text-xs',
                                    remaining < 100
                                        ? 'text-amber-400'
                                        : 'text-white/50',
                                )}
                            >
                                {remaining} characters remaining
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCommentField(false)}
                                disabled={isAmplifying}
                                className="flex-1 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleAmplifyWithComment}
                                disabled={isAmplifying || comment.trim().length === 0}
                                className="flex-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 font-semibold text-white transition hover:from-amber-600 hover:to-rose-600 disabled:opacity-50"
                            >
                                {isAmplifying ? 'Amplifying...' : 'Amplify'}
                            </Button>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClose}
                        disabled={isAmplifying}
                        className="rounded-full text-white/70 hover:text-white disabled:opacity-50"
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

