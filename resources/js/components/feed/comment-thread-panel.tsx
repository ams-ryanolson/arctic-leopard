import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Spark } from '@/components/ui/spark';
import {
    createComment,
    deleteComment as deleteCommentRequest,
    fetchComments,
    likeComment as likeCommentRequest,
    unlikeComment as unlikeCommentRequest,
} from '@/lib/comment-client';
import { FeedRequestError } from '@/lib/feed-client';
import { cn } from '@/lib/utils';
import type { Comment, FeedPost } from '@/types/feed';
import {
    BookmarkPlus,
    ChevronDown,
    ChevronUp,
    Flag,
    Loader2,
    MessageCircle,
    MoreHorizontal,
    Trash2,
} from 'lucide-react';

export type CommentThreadPanelProps = {
    post: FeedPost | null;
    open: boolean;
    onCommentAdded?: (postId: number, totalComments: number) => void;
    className?: string;
    layout?: 'sheet' | 'inline';
    disableInteractions?: boolean;
};

type CommentFormState = {
    body: string;
    error: string | null;
    submitting: boolean;
};

const initialFormState: CommentFormState = {
    body: '',
    error: null,
    submitting: false,
};

const EMPTY_COMMENTS: Comment[] = [];

const skeletonPlaceholders = Array.from({ length: 3 }, (_, index) => index);

const formatTimestamp = (iso: string | null): string => {
    if (!iso) {
        return 'Just now';
    }

    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return 'Just now';
    }

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
        return 'Just now';
    }

    if (diffMinutes < 60) {
        return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 24) {
        return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);

    if (diffDays < 7) {
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }

    return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
};

const getInitials = (label: string): string =>
    label
        .split(' ')
        .map((segment) => segment.trim().charAt(0))
        .filter(Boolean)
        .join('')
        .slice(0, 2)
        .toUpperCase();

const extractValidationMessage = (payload: unknown): string | null => {
    if (
        typeof payload === 'object' &&
        payload !== null &&
        'errors' in payload &&
        typeof (payload as { errors: unknown }).errors === 'object' &&
        (payload as { errors: Record<string, unknown> }).errors !== null
    ) {
        const errors = (payload as { errors: Record<string, unknown> }).errors;

        if (Array.isArray(errors.body) && typeof errors.body[0] === 'string') {
            return errors.body[0];
        }
    }

    return null;
};

const updateCommentInTree = (
    nodes: Comment[],
    commentId: number,
    mapper: (comment: Comment) => Comment,
): Comment[] => {
    let mutated = false;

    const nextNodes = nodes.map((node) => {
        const currentReplies = Array.isArray(node.replies) ? node.replies : [];

        if (node.id === commentId) {
            mutated = true;

            return mapper(node);
        }

        if (currentReplies.length > 0) {
            const updatedReplies = updateCommentInTree(
                currentReplies,
                commentId,
                mapper,
            );

            if (updatedReplies !== currentReplies) {
                mutated = true;

                return {
                    ...node,
                    replies: updatedReplies,
                };
            }
        }

        return node;
    });

    return mutated ? nextNodes : nodes;
};

const insertReplyIntoTree = (
    nodes: Comment[],
    parentId: number,
    reply: Comment,
): Comment[] => {
    let mutated = false;

    const nextNodes = nodes.map((node) => {
        const currentReplies = Array.isArray(node.replies) ? node.replies : [];

        if (node.id === parentId) {
            mutated = true;

            const replyExists = currentReplies.some(
                (existing) => existing.id === reply.id,
            );

            return {
                ...node,
                replies_count: node.replies_count + (replyExists ? 0 : 1),
                replies: replyExists
                    ? currentReplies
                    : [reply, ...currentReplies],
            };
        }

        if (currentReplies.length > 0) {
            const updatedReplies = insertReplyIntoTree(
                currentReplies,
                parentId,
                reply,
            );

            if (updatedReplies !== currentReplies) {
                mutated = true;

                return {
                    ...node,
                    replies: updatedReplies,
                };
            }
        }

        return node;
    });

    return mutated ? nextNodes : nodes;
};

type CommentEntryProps = {
    comment: Comment;
    depth?: number;
    disabled?: boolean;
    onReply: (parentId: number, body: string) => Promise<Comment>;
    onToggleLike: (comment: Comment) => Promise<Comment>;
    onDelete: (comment: Comment) => Promise<Comment>;
};

const CommentEntry = ({
    comment,
    depth = 0,
    disabled = false,
    onReply,
    onToggleLike,
    onDelete,
}: CommentEntryProps) => {
    const isHidden = Boolean(comment.is_hidden);
    const displayName = isHidden
        ? 'Hidden member'
        : (comment.author?.display_name ??
          comment.author?.username ??
          'Unknown member');
    const initials = getInitials(displayName);
    const avatarUrl = isHidden ? null : (comment.author?.avatar_url ?? null);
    const replies = Array.isArray(comment.replies) ? comment.replies : [];
    const [isReplying, setIsReplying] = useState(false);
    const [areRepliesVisible, setAreRepliesVisible] = useState(true);
    const [replyBody, setReplyBody] = useState('');
    const [replyError, setReplyError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [isProcessingLike, setIsProcessingLike] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const canInteract = !disabled && !comment.is_deleted && !isHidden;
    const canReply = canInteract && comment.can_reply;
    const canLike =
        !disabled && comment.can_like && !comment.is_deleted && !isHidden;
    const canDelete = !disabled && comment.can_delete;
    const repliesLoaded = replies.length > 0;
    const hasReplies = comment.replies_count > 0;

    const handleLikeClick = async () => {
        if (!canLike || isProcessingLike) {
            return;
        }

        setIsProcessingLike(true);
        setActionError(null);

        try {
            await onToggleLike(comment);
        } catch (thrown) {
            console.error(thrown);
            setActionError('We could not update your like. Please try again.');
        } finally {
            setIsProcessingLike(false);
        }
    };

    const handleDeleteClick = async () => {
        if (!canDelete || isDeleting) {
            return;
        }

        const confirmed =
            typeof window === 'undefined'
                ? true
                : window.confirm(
                      'Delete this comment? This action cannot be undone.',
                  );

        if (!confirmed) {
            return;
        }

        setIsDeleting(true);
        setActionError(null);

        try {
            await onDelete(comment);
            setIsReplying(false);
            setReplyBody('');
        } catch (thrown) {
            console.error(thrown);
            setActionError(
                'We could not delete this comment. Please try again.',
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const handleReport = () => {
        setActionError('Reporting is coming soon.');
    };

    const handleReplySubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (!canReply || isSubmittingReply) {
            return;
        }

        const trimmed = replyBody.trim();

        if (trimmed.length === 0) {
            setReplyError('Comments cannot be empty.');

            return;
        }

        setIsSubmittingReply(true);
        setReplyError(null);
        setActionError(null);

        try {
            await onReply(comment.id, trimmed);
            setReplyBody('');
            setIsReplying(false);
            setAreRepliesVisible(true);
        } catch (thrown) {
            console.error(thrown);

            if (thrown instanceof FeedRequestError) {
                const validationMessage = extractValidationMessage(
                    thrown.payload,
                );
                setReplyError(validationMessage ?? thrown.message);
            } else if (thrown instanceof Error) {
                setReplyError(thrown.message);
            } else {
                setReplyError(
                    'We could not post your reply. Please try again.',
                );
            }
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const likeCountLabel = comment.likes_count.toLocaleString();

    return (
        <div
            className={cn(
                'rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80',
                depth > 0 && 'border-white/5 bg-white/3',
            )}
        >
            <div className="flex items-start gap-3">
                <Avatar
                    className={cn(
                        'border border-white/10',
                        depth > 0 ? 'size-8' : 'size-10',
                        isHidden && 'opacity-70',
                    )}
                >
                    {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={displayName} />
                    ) : (
                        <AvatarFallback className="bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 text-xs font-semibold text-white">
                            {initials || '??'}
                        </AvatarFallback>
                    )}
                </Avatar>
                <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs tracking-[0.25em] text-white/50 uppercase">
                        <span className="font-semibold tracking-normal text-white">
                            {displayName}
                        </span>
                        <span>{formatTimestamp(comment.created_at)}</span>
                    </div>
                    {comment.is_deleted ? (
                        <p className="text-sm whitespace-pre-line text-white/60 italic">
                            Comment deleted
                        </p>
                    ) : isHidden ? (
                        <p className="text-sm whitespace-pre-line text-white/60 italic">
                            {comment.placeholder ??
                                'This comment is hidden because of your privacy settings.'}
                        </p>
                    ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-line text-white/80">
                            {comment.body}
                        </p>
                    )}

                    {!isHidden && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                            <Button
                                type="button"
                                variant={
                                    comment.has_liked ? 'default' : 'ghost'
                                }
                                size="sm"
                                className={cn(
                                    'rounded-full px-3 text-[11px] tracking-[0.2em] uppercase',
                                    comment.has_liked
                                        ? 'border border-amber-400/40 bg-gradient-to-br from-amber-400/10 via-rose-500/10 to-violet-600/10 text-amber-200 hover:border-amber-400/60 hover:from-amber-400/15 hover:via-rose-500/15 hover:to-violet-600/15 hover:text-amber-100'
                                        : 'text-white/75 hover:bg-white/10 hover:text-white',
                                    (!canLike || isProcessingLike) &&
                                        'border-white/10 bg-white/5 text-white/40 hover:bg-white/5 hover:text-white/40',
                                )}
                                onClick={handleLikeClick}
                                disabled={!canLike || isProcessingLike}
                            >
                                <span className="sr-only">
                                    {comment.has_liked
                                        ? 'Unspark comment'
                                        : 'Spark comment'}
                                </span>
                                <Spark
                                    sparked={comment.has_liked}
                                    className={cn(
                                        'size-3.5',
                                        !comment.has_liked && 'text-white/60',
                                    )}
                                />
                                <span className="text-[10px] font-semibold tracking-[0.3em]">
                                    {likeCountLabel}
                                </span>
                            </Button>
                            {comment.can_reply && !comment.is_deleted && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full px-3 text-white/75 hover:bg-white/10 hover:text-white disabled:text-white/40"
                                    onClick={() => {
                                        if (canReply) {
                                            setIsReplying(
                                                (previous) => !previous,
                                            );
                                            setReplyError(null);
                                        }
                                    }}
                                    disabled={!canReply}
                                >
                                    <span className="sr-only">
                                        {isReplying
                                            ? 'Cancel reply'
                                            : 'Reply to comment'}
                                    </span>
                                    <MessageCircle className="size-3.5" />
                                </Button>
                            )}
                            {hasReplies && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full px-3 text-[11px] tracking-[0.2em] text-white/60 uppercase hover:bg-white/10 hover:text-white"
                                    onClick={() =>
                                        setAreRepliesVisible(
                                            (previous) => !previous,
                                        )
                                    }
                                >
                                    <span className="flex items-center gap-1.5">
                                        {areRepliesVisible ? (
                                            <ChevronUp className="size-3.5" />
                                        ) : (
                                            <ChevronDown className="size-3.5" />
                                        )}
                                        {areRepliesVisible
                                            ? 'Hide Replies'
                                            : 'Show Replies'}{' '}
                                        ({comment.replies_count})
                                    </span>
                                </Button>
                            )}
                            <div className="ml-auto">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full border border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10 hover:text-white"
                                            aria-label="Comment actions"
                                        >
                                            <MoreHorizontal className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-44 border border-white/10 bg-neutral-950/95 text-white"
                                    >
                                        <DropdownMenuItem
                                            onSelect={(event) => {
                                                event.preventDefault();
                                                handleReport();
                                            }}
                                            className="cursor-pointer text-xs tracking-[0.25em] uppercase"
                                        >
                                            <Flag className="size-3.5" />
                                            Report
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            disabled
                                            className="text-xs tracking-[0.25em] uppercase"
                                        >
                                            <BookmarkPlus className="size-3.5" />
                                            Save Thread (soon)
                                        </DropdownMenuItem>
                                        {comment.can_delete &&
                                            !comment.is_deleted && (
                                                <>
                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                    <DropdownMenuItem
                                                        onSelect={(event) => {
                                                            event.preventDefault();
                                                            void handleDeleteClick();
                                                        }}
                                                        variant="destructive"
                                                        className="cursor-pointer text-xs tracking-[0.25em] uppercase"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )}
                    {actionError && (
                        <p className="text-xs text-rose-200">{actionError}</p>
                    )}
                    {isReplying && canReply && (
                        <form
                            onSubmit={handleReplySubmit}
                            className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                        >
                            <label
                                className="sr-only"
                                htmlFor={`reply-${comment.id}`}
                            >
                                Reply to comment
                            </label>
                            <textarea
                                id={`reply-${comment.id}`}
                                name="reply"
                                value={replyBody}
                                onChange={(event) => {
                                    setReplyBody(event.target.value);
                                    setReplyError(null);
                                }}
                                rows={3}
                                placeholder="Start the aftercare…"
                                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white transition placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-white/30 focus:outline-none"
                                disabled={isSubmittingReply}
                            />
                            {replyError && (
                                <p className="text-xs text-rose-200">
                                    {replyError}
                                </p>
                            )}
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full px-4 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                                    onClick={() => {
                                        setIsReplying(false);
                                        setReplyBody('');
                                        setReplyError(null);
                                    }}
                                    disabled={isSubmittingReply}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="rounded-full px-5 text-xs font-semibold"
                                    disabled={
                                        isSubmittingReply ||
                                        replyBody.trim().length === 0
                                    }
                                >
                                    <span className="flex items-center gap-2">
                                        {isSubmittingReply && (
                                            <Loader2 className="size-3 animate-spin" />
                                        )}
                                        {isSubmittingReply
                                            ? 'Posting…'
                                            : 'Post reply'}
                                    </span>
                                </Button>
                            </div>
                        </form>
                    )}
                    {areRepliesVisible && repliesLoaded && (
                        <div className="space-y-3 border-l border-white/10 pl-4">
                            {replies.map((reply) => (
                                <CommentEntry
                                    key={reply.id}
                                    comment={reply}
                                    depth={depth + 1}
                                    disabled={disabled}
                                    onReply={onReply}
                                    onToggleLike={onToggleLike}
                                    onDelete={onDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function CommentThreadPanel({
    post,
    open,
    onCommentAdded,
    className,
    layout = 'sheet',
    disableInteractions = false,
}: CommentThreadPanelProps) {
    // Use ULID if available, otherwise fall back to numeric ID
    const postId = post?.ulid ?? post?.id ?? null;
    const instanceId = useId();
    const commentFieldId = `comment-body-${instanceId}`;

    const [comments, setComments] = useState<Comment[]>(EMPTY_COMMENTS);
    const [totalComments, setTotalComments] = useState<number>(
        post?.comments_count ?? 0,
    );
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formState, setFormState] =
        useState<CommentFormState>(initialFormState);
    const fetchControllerRef = useRef<AbortController | null>(null);

    const resetState = useCallback(() => {
        fetchControllerRef.current?.abort();
        fetchControllerRef.current = null;
        setComments(EMPTY_COMMENTS);
        setTotalComments(post?.comments_count ?? 0);
        setCurrentPage(1);
        setLastPage(1);
        setError(null);
        setFormState(initialFormState);
        setIsInitialLoading(false);
        setIsLoadingMore(false);
    }, [post?.comments_count]);

    const handleFetchError = useCallback((thrown: unknown) => {
        if (thrown instanceof DOMException && thrown.name === 'AbortError') {
            return;
        }

        console.error(thrown);

        if (thrown instanceof FeedRequestError) {
            setError(thrown.message);

            return;
        }

        if (thrown instanceof Error) {
            setError(thrown.message);

            return;
        }

        setError('We could not load comments. Please try again.');
    }, []);

    const loadComments = useCallback(
        async (page = 1, append = false) => {
            if (!postId) {
                return;
            }

            if (!append) {
                fetchControllerRef.current?.abort();
                const controller = new AbortController();
                fetchControllerRef.current = controller;
                setIsInitialLoading(true);
                setError(null);

                try {
                    const payload = await fetchComments(postId, {
                        page,
                        signal: controller.signal,
                    });

                    setComments(payload.data);
                    setTotalComments(payload.meta.total);
                    setCurrentPage(payload.meta.current_page);
                    setLastPage(payload.meta.last_page);
                } catch (thrown) {
                    handleFetchError(thrown);
                } finally {
                    setIsInitialLoading(false);
                }

                return;
            }

            setIsLoadingMore(true);

            try {
                const payload = await fetchComments(postId, { page });

                setComments((previous) => {
                    const seen = new Set(previous.map((comment) => comment.id));
                    const merged = payload.data.filter(
                        (comment) => !seen.has(comment.id),
                    );

                    return [...previous, ...merged];
                });
                setTotalComments(payload.meta.total);
                setCurrentPage(payload.meta.current_page);
                setLastPage(payload.meta.last_page);
            } catch (thrown) {
                handleFetchError(thrown);
            } finally {
                setIsLoadingMore(false);
            }
        },
        [handleFetchError, postId],
    );

    useEffect(() => {
        if (!open || postId === null) {
            return undefined;
        }

        resetState();
        void loadComments(1, false);

        return () => {
            fetchControllerRef.current?.abort();
            fetchControllerRef.current = null;
        };
    }, [loadComments, open, postId, resetState]);

    useEffect(() => {
        if (!open) {
            resetState();
        }
    }, [open, resetState]);

    useEffect(() => {
        if (!open) {
            return;
        }

        setTotalComments((previous) =>
            post?.comments_count !== undefined ? post.comments_count : previous,
        );
    }, [open, post?.comments_count]);

    const hasMore = totalComments > comments.length && currentPage < lastPage;

    const handleLoadMore = () => {
        if (isLoadingMore || isInitialLoading || !hasMore) {
            return;
        }

        const nextPage = currentPage + 1;
        void loadComments(nextPage, true);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!postId) {
            return;
        }

        const trimmedBody = formState.body.trim();

        if (trimmedBody === '' || formState.submitting) {
            return;
        }

        setFormState((previous) => ({
            ...previous,
            submitting: true,
            error: null,
        }));

        try {
            const newComment = await createComment(postId, {
                body: trimmedBody,
            });

            setComments((previous) => [newComment, ...previous]);
            setTotalComments((previous) => {
                const next = previous + 1;

                if (postId !== null) {
                    onCommentAdded?.(postId, next);
                }

                return next;
            });
            setFormState({
                body: '',
                error: null,
                submitting: false,
            });
        } catch (thrown) {
            console.error(thrown);

            if (thrown instanceof FeedRequestError) {
                const validationMessage = extractValidationMessage(
                    thrown.payload,
                );
                setFormState((previous) => ({
                    ...previous,
                    error: validationMessage ?? thrown.message,
                    submitting: false,
                }));
            } else if (thrown instanceof Error) {
                setFormState((previous) => ({
                    ...previous,
                    error: thrown.message,
                    submitting: false,
                }));
            } else {
                setFormState((previous) => ({
                    ...previous,
                    error: 'We could not post your comment. Please try again.',
                    submitting: false,
                }));
            }
        }
    };

    const handleBodyChange = (
        event: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
        const nextValue = event.target.value;

        setFormState((previous) => ({
            ...previous,
            body: nextValue,
            error: null,
        }));
    };

    const handleReply = useCallback(
        async (parentId: number, body: string): Promise<Comment> => {
            if (!postId) {
                throw new Error('Comment thread is unavailable.');
            }

            const newComment = await createComment(postId, {
                body,
                parentId,
            });

            setComments((previous) =>
                insertReplyIntoTree(previous, parentId, newComment),
            );
            setTotalComments((previous) => {
                const next = previous + 1;
                onCommentAdded?.(postId, next);

                return next;
            });

            return newComment;
        },
        [postId, onCommentAdded],
    );

    const handleToggleLike = useCallback(
        async (target: Comment): Promise<Comment> => {
            if (!postId) {
                throw new Error('Comment thread is unavailable.');
            }

            const updated = await (target.has_liked
                ? unlikeCommentRequest(postId, target.id)
                : likeCommentRequest(postId, target.id));

            setComments((previous) =>
                updateCommentInTree(previous, updated.id, () => updated),
            );

            return updated;
        },
        [postId],
    );

    const handleDeleteComment = useCallback(
        async (target: Comment): Promise<Comment> => {
            if (!postId) {
                throw new Error('Comment thread is unavailable.');
            }

            const updated = await deleteCommentRequest(postId, target.id);

            setComments((previous) =>
                updateCommentInTree(previous, updated.id, () => updated),
            );

            return updated;
        },
        [postId],
    );

    const commentLabel = useMemo(() => {
        if (!post) {
            return 'Comments';
        }

        return `Comments (${totalComments})`;
    }, [post, totalComments]);

    if (!post || !open) {
        return null;
    }

    const displayName =
        post.author?.display_name ?? post.author?.username ?? 'Unknown creator';

    const containerClasses = cn(
        'flex h-full min-h-0 flex-col overflow-hidden',
        layout === 'inline'
            ? 'bg-transparent text-white'
            : 'bg-neutral-950/95 text-white sm:max-w-lg',
        className,
    );

    return (
        <div className={containerClasses}>
            <div className="border-b border-white/10 px-6 py-4">
                <p className="text-lg font-semibold text-white">
                    {commentLabel}
                </p>
                <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
                    Join the thread with {displayName}
                </p>
            </div>

            <div className="space-y-4 border-b border-white/10 p-4">
                <div className="flex items-start gap-3">
                    <Avatar className="size-11 border border-white/10">
                        <AvatarImage
                            src={post.author?.avatar_url ?? undefined}
                            alt={displayName}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 text-sm font-semibold text-white">
                            {getInitials(displayName) || '??'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                        <p className="font-semibold text-white">
                            {displayName}
                        </p>
                        <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
                            {formatTimestamp(
                                post.published_at ?? post.created_at ?? null,
                            )}
                        </p>
                        {post.body && (
                            <p className="mt-3 text-sm whitespace-pre-line text-white/70">
                                {post.body}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {isInitialLoading && (
                    <div className="space-y-4">
                        {skeletonPlaceholders.map((item) => (
                            <div
                                key={`skeleton-${item}`}
                                className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <Skeleton className="size-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-3 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-4/5" />
                            </div>
                        ))}
                    </div>
                )}

                {!isInitialLoading && error && (
                    <Alert
                        variant="destructive"
                        className="border border-rose-400/40 bg-rose-500/10 text-white"
                    >
                        <AlertTitle className="text-sm font-semibold">
                            Comments unavailable
                        </AlertTitle>
                        <AlertDescription className="text-xs text-rose-100/90">
                            {error}
                        </AlertDescription>
                        <div className="pt-3">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="rounded-full border border-white/10 bg-white/10 text-xs text-white/75 hover:border-white/30 hover:bg-white/20 hover:text-white"
                                onClick={() => void loadComments(1, false)}
                            >
                                Try again
                            </Button>
                        </div>
                    </Alert>
                )}

                {!isInitialLoading && !error && comments.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-white/70">
                        No comments yet. Be the first to start the aftercare.
                    </div>
                )}

                {!isInitialLoading && !error && comments.length > 0 && (
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <CommentEntry
                                key={comment.id}
                                comment={comment}
                                onReply={handleReply}
                                onToggleLike={handleToggleLike}
                                onDelete={handleDeleteComment}
                                disabled={
                                    disableInteractions || isInitialLoading
                                }
                            />
                        ))}

                        {hasMore && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full rounded-full border border-white/10 bg-white/5 text-xs text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/5 disabled:text-white/40"
                                onClick={handleLoadMore}
                                disabled={isLoadingMore}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    {isLoadingMore && (
                                        <Loader2 className="size-3 animate-spin text-white/70" />
                                    )}
                                    {isLoadingMore
                                        ? 'Loading more…'
                                        : 'Load older comments'}
                                </span>
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <form
                onSubmit={handleSubmit}
                className="flex-shrink-0 border-t border-white/10 p-4"
            >
                <label className="sr-only" htmlFor={commentFieldId}>
                    Add a comment
                </label>
                <textarea
                    id={commentFieldId}
                    name="body"
                    value={formState.body}
                    onChange={handleBodyChange}
                    placeholder="Offer feedback, drop aftercare notes, or share reactions…"
                    rows={4}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white transition placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-white/30 focus:outline-none"
                    disabled={disableInteractions}
                />
                {formState.error && (
                    <p className="mt-2 text-xs text-rose-200">
                        {formState.error}
                    </p>
                )}
                <div className="mt-3 flex items-center justify-end">
                    <Button
                        type="submit"
                        className="rounded-full px-5 text-xs font-semibold"
                        disabled={
                            formState.submitting ||
                            formState.body.trim().length === 0 ||
                            disableInteractions
                        }
                    >
                        <span className="flex items-center gap-2">
                            {formState.submitting && (
                                <Loader2 className="size-3 animate-spin" />
                            )}
                            {formState.submitting ? 'Posting…' : 'Post comment'}
                        </span>
                    </Button>
                </div>
            </form>
        </div>
    );
}
