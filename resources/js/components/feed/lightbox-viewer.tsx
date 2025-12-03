import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';
import type { FeedMedia, FeedPost } from '@/types/feed';

import FlvPlayer from '@/components/flv-player';
import CommentThreadPanel from './comment-thread-panel';
import CommentThreadSheet from './comment-thread-sheet';
import CommentThreadTrigger from './comment-thread-trigger';

type LightboxViewerProps = {
    media: FeedMedia[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    startIndex?: number;
    post?: FeedPost | null;
    initialCommentsOpen?: boolean;
    onCommentCountChange?: (postId: number, total: number) => void;
    className?: string;
};

const dialogOverlayClasses =
    'fixed inset-0 z-[110] bg-neutral-950/95 backdrop-blur-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0';

const dialogContentClasses =
    'fixed inset-0 z-[120] flex flex-col focus:outline-hidden data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0';

const isVideoMedia = (media: FeedMedia | null | undefined): boolean =>
    !!media?.type && media.type.startsWith('video/');

const isFlvVideo = (media: FeedMedia | null | undefined): boolean =>
    !!media?.type &&
    (media.type === 'video/x-flv' || media.url?.endsWith('.flv'));

export default function LightboxViewer({
    media,
    open,
    onOpenChange,
    startIndex = 0,
    post,
    initialCommentsOpen = false,
    onCommentCountChange,
    className,
}: LightboxViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const [isCommentsOpen, setIsCommentsOpen] = useState(initialCommentsOpen);
    const [commentCount, setCommentCount] = useState(post?.comments_count ?? 0);

    useEffect(() => {
        setCurrentIndex(startIndex);
    }, [startIndex, open]);

    useEffect(() => {
        if (post?.comments_count !== undefined) {
            setCommentCount(post.comments_count);
        }
    }, [post?.comments_count]);

    useEffect(() => {
        if (!open) {
            setIsCommentsOpen(false);
        }
    }, [open]);

    const currentMedia = useMemo(
        () => media[currentIndex] ?? null,
        [media, currentIndex],
    );

    const hasMultipleMedia = media.length > 1;
    const hasPost = Boolean(post);

    const handlePrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
    }, [media.length]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
    }, [media.length]);

    const handleCommentAdded = useCallback(
        (postId: number, total: number) => {
            setCommentCount(total);
            onCommentCountChange?.(postId, total);
        },
        [onCommentCountChange],
    );

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                handlePrevious();
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                handleNext();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                onOpenChange(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, handlePrevious, handleNext, onOpenChange]);

    return (
        <>
            <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className={dialogOverlayClasses} />
                    <DialogPrimitive.Content
                        className={cn(dialogContentClasses, className)}
                        aria-label="Media lightbox viewer"
                    >
                        <DialogPrimitive.Title className="sr-only">
                            Post media lightbox
                        </DialogPrimitive.Title>
                        <DialogPrimitive.Description className="sr-only">
                            View post media and comments
                            {post?.author?.display_name
                                ? ` by ${post.author.display_name}`
                                : ''}
                            .
                        </DialogPrimitive.Description>
                        <header className="flex items-center justify-between border-b border-white/10 bg-black/60 px-6 py-4 backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 shadow-[0_0_12px_rgba(249,115,22,0.6)]" />
                                    <span className="text-[0.65rem] font-semibold tracking-[0.35em] text-white/60 uppercase sm:text-xs">
                                        Lightbox Viewer
                                    </span>
                                </div>
                                {post && (
                                    <span className="hidden text-sm text-white/50 sm:inline">
                                        {post.author?.display_name ??
                                            post.author?.username ??
                                            'Creator'}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {hasPost && (
                                    <div className="sm:hidden">
                                        <CommentThreadTrigger
                                            postId={post.id}
                                            count={commentCount}
                                            onOpen={() =>
                                                setIsCommentsOpen(true)
                                            }
                                            disabled={!open}
                                        />
                                    </div>
                                )}
                                <DialogPrimitive.Close
                                    aria-label="Close lightbox"
                                    className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/30 hover:bg-white/10 hover:text-white focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white/40"
                                >
                                    <X className="size-4" />
                                </DialogPrimitive.Close>
                            </div>
                        </header>

                        <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden sm:grid-cols-[3fr_2fr]">
                            <section className="relative flex h-full min-h-0 flex-col bg-gradient-to-br from-black/80 via-black/70 to-black/60">
                                <div className="relative flex flex-1 items-center justify-center overflow-hidden p-8">
                                    {currentMedia ? (
                                        <>
                                            {isVideoMedia(currentMedia) ? (
                                                isFlvVideo(currentMedia) ? (
                                                    <FlvPlayer
                                                        src={currentMedia.url}
                                                        className="max-h-full max-w-full rounded-3xl border border-white/10 bg-black object-contain shadow-[0_35px_60px_-25px_rgba(0,0,0,0.8)]"
                                                        aspectRatio="16/9"
                                                        maxHeight="80vh"
                                                        controls
                                                    />
                                                ) : (
                                                    <video
                                                        controls
                                                        preload="metadata"
                                                        className="max-h-full max-w-full rounded-3xl border border-white/10 bg-black object-contain shadow-[0_35px_60px_-25px_rgba(0,0,0,0.8)]"
                                                        src={currentMedia.url}
                                                    >
                                                        <track
                                                            kind="captions"
                                                            label="Captions"
                                                        />
                                                    </video>
                                                )
                                            ) : (
                                                <img
                                                    src={
                                                        currentMedia.optimized_url ??
                                                        currentMedia.url
                                                    }
                                                    alt={
                                                        currentMedia.alt ??
                                                        'Post media'
                                                    }
                                                    loading="lazy"
                                                    className="max-h-full max-w-full rounded-3xl border border-white/10 bg-black object-contain shadow-[0_35px_60px_-25px_rgba(0,0,0,0.8)]"
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-sm text-white/60">
                                            No media available.
                                        </div>
                                    )}
                                    {hasMultipleMedia && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handlePrevious}
                                                className="group absolute top-1/2 left-6 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/80 shadow-[0_15px_30px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl transition hover:border-white/30 hover:bg-white/10 hover:text-white focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white/40"
                                            >
                                                <span className="sr-only">
                                                    View previous media
                                                </span>
                                                <ChevronLeft className="size-6 transition group-hover:scale-110" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleNext}
                                                className="group absolute top-1/2 right-6 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/80 shadow-[0_15px_30px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl transition hover:border-white/30 hover:bg-white/10 hover:text-white focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white/40"
                                            >
                                                <span className="sr-only">
                                                    View next media
                                                </span>
                                                <ChevronRight className="size-6 transition group-hover:scale-110" />
                                            </button>
                                        </>
                                    )}
                                </div>

                                {currentMedia?.alt && (
                                    <div className="flex-shrink-0 border-t border-white/10 bg-black/60 px-8 py-4 backdrop-blur-xl">
                                        <p className="text-sm leading-relaxed text-white/70">
                                            {currentMedia.alt}
                                        </p>
                                    </div>
                                )}
                            </section>

                            {hasPost ? (
                                <aside className="hidden h-full border-l border-white/10 bg-black/60 backdrop-blur-xl sm:flex sm:flex-col">
                                    <CommentThreadPanel
                                        post={post}
                                        open={open}
                                        onCommentAdded={handleCommentAdded}
                                        layout="inline"
                                    />
                                </aside>
                            ) : (
                                <aside className="hidden h-full border-l border-white/10 bg-black/60 backdrop-blur-xl sm:flex sm:flex-col">
                                    <div className="flex flex-1 items-center justify-center p-6 text-sm text-white/60">
                                        Comments unavailable for this media.
                                    </div>
                                </aside>
                            )}
                        </div>

                        <footer
                            className="border-t border-white/10 bg-black/60 px-6 py-4 text-center backdrop-blur-xl"
                            aria-live="polite"
                        >
                            <p className="text-[0.65rem] font-semibold tracking-[0.35em] text-white/40 uppercase sm:text-xs">
                                {media.length > 0
                                    ? `Viewing item ${currentIndex + 1} of ${media.length}`
                                    : 'No media'}
                            </p>
                        </footer>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
            {hasPost && (
                <CommentThreadSheet
                    post={post}
                    open={isCommentsOpen}
                    onOpenChange={setIsCommentsOpen}
                    onCommentAdded={handleCommentAdded}
                />
            )}
        </>
    );
}
