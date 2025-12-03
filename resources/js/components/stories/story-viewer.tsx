import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getCsrfToken } from '@/lib/csrf';
import type { StoryResponse } from '@/lib/story-client';
import { cn } from '@/lib/utils';
import storiesRoutes from '@/routes/stories';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import StoryReactions from './story-reactions';

type StoryViewerProps = {
    storyId: number;
    onClose: () => void;
    onStoryChange?: (
        storyId: number,
        nextStoryId: number | null,
        previousStoryId: number | null,
    ) => void;
};

const STORY_DURATION = 7000; // 7 seconds in milliseconds

export default function StoryViewer({
    storyId: initialStoryId,
    onClose,
    onStoryChange,
}: StoryViewerProps) {
    const [currentStoryId, setCurrentStoryId] = useState(initialStoryId);
    const [story, setStory] = useState<StoryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [nextStoryId, setNextStoryId] = useState<number | null>(null);
    const [previousStoryId, setPreviousStoryId] = useState<number | null>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const pausedTimeRef = useRef<number | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const fetchStory = useCallback(async (id: number) => {
        if (!id || id === null || id === undefined || isNaN(Number(id))) {
            setError('Story ID is required');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setProgress(0); // Reset progress when loading new story

            const response = await fetch(
                storiesRoutes.show({ story: id }).url,
                {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(getCsrfToken()
                            ? { 'X-XSRF-TOKEN': getCsrfToken()! }
                            : {}),
                    },
                },
            );

            if (!response.ok) {
                throw new Error('Failed to fetch story');
            }

            const data = await response.json();
            const storyData = data.data as StoryResponse;
            setStory(storyData);

            // Update navigation IDs from response
            const nextId = data.nextStoryId ?? null;
            const prevId = data.previousStoryId ?? null;
            setNextStoryId(nextId);
            setPreviousStoryId(prevId);

            // Notify parent of story change
            if (onStoryChange) {
                onStoryChange(id, nextId, prevId);
            }

            // Mark as viewed
            try {
                await fetch(storiesRoutes.view({ story: id }).url, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(getCsrfToken()
                            ? { 'X-XSRF-TOKEN': getCsrfToken()! }
                            : {}),
                    },
                });
            } catch {
                // Silently fail if marking as viewed fails
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to load story',
            );
        } finally {
            setLoading(false);
        }
    }, []);

    const handleNext = useCallback(() => {
        if (nextStoryId) {
            setCurrentStoryId(nextStoryId);
        } else {
            onClose();
        }
    }, [nextStoryId, onClose]);

    const handlePrevious = useCallback(() => {
        if (previousStoryId) {
            setCurrentStoryId(previousStoryId);
        }
    }, [previousStoryId]);

    const startProgress = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }

        // Calculate elapsed time if we were paused
        let elapsedBeforePause = 0;
        if (pausedTimeRef.current !== null && startTimeRef.current !== null) {
            elapsedBeforePause = pausedTimeRef.current - startTimeRef.current;
        }

        // Reset progress tracking, accounting for any elapsed time before pause
        startTimeRef.current = Date.now() - elapsedBeforePause;
        pausedTimeRef.current = null;
        setProgress((elapsedBeforePause / STORY_DURATION) * 100);

        progressIntervalRef.current = setInterval(() => {
            if (startTimeRef.current === null) {
                return;
            }

            const elapsed = Date.now() - startTimeRef.current;
            const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);

            setProgress(newProgress);

            if (newProgress >= 100) {
                if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current);
                    progressIntervalRef.current = null;
                }
                // Auto-advance to next story
                handleNext();
            }
        }, 50);
    }, [handleNext]);

    const handleMouseDown = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
        // Record when we paused
        if (startTimeRef.current !== null) {
            pausedTimeRef.current = Date.now();
        }
        setIsPaused(true);
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsPaused(false);
        // Resume progress from where we left off
        startProgress();
    }, [startProgress]);

    // Fetch story when storyId changes
    useEffect(() => {
        // Reset progress when story changes
        setProgress(0);
        setIsPaused(false);
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
        startTimeRef.current = null;
        pausedTimeRef.current = null;

        fetchStory(currentStoryId);
    }, [currentStoryId, fetchStory]);

    // Update storyId prop when it changes externally
    useEffect(() => {
        if (initialStoryId !== currentStoryId) {
            setCurrentStoryId(initialStoryId);
        }
    }, [initialStoryId]);

    useEffect(() => {
        if (story && !isPaused) {
            startProgress();
        }

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [story, isPaused, startProgress]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                handleNext();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                handlePrevious();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, handleNext, handlePrevious]);

    // Prevent body scroll when story viewer is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleReactionUpdate = useCallback((updatedStory: StoryResponse) => {
        setStory(updatedStory);
    }, []);

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
                <div className="text-white">Loading story...</div>
            </div>
        );
    }

    if (error || !story) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
                <div className="text-center text-white">
                    <p className="mb-4">{error ?? 'Story not found'}</p>
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        );
    }

    const isImage = story.media?.mime_type?.startsWith('image/') ?? false;
    const isVideo = story.media?.mime_type?.startsWith('video/') ?? false;
    // Use optimized_url for images when available, fall back to url
    const mediaUrl =
        isImage && story.media?.optimized_url
            ? story.media.optimized_url
            : story.media?.url;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Progress bar */}
            <div className="absolute top-0 right-0 left-0 z-[9999] h-1 bg-white/20">
                <div
                    className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 transition-all duration-75"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
            >
                <X className="size-5" />
            </button>

            {/* Navigation areas - click left/right sides to navigate */}
            <div className="absolute inset-0 flex">
                {/* Left side - previous */}
                <button
                    onClick={handlePrevious}
                    disabled={!previousStoryId}
                    className={cn(
                        'flex-1 cursor-pointer transition',
                        previousStoryId ? 'hover:bg-white/5' : 'cursor-default',
                    )}
                    aria-label="Previous story"
                />
                {/* Right side - next */}
                <button
                    onClick={handleNext}
                    disabled={!nextStoryId}
                    className={cn(
                        'flex-1 cursor-pointer transition',
                        nextStoryId ? 'hover:bg-white/5' : 'cursor-default',
                    )}
                    aria-label="Next story"
                />
            </div>

            {/* Navigation buttons - visible on hover */}
            <div className="pointer-events-none absolute inset-0 flex items-center">
                {previousStoryId && (
                    <button
                        onClick={handlePrevious}
                        className="pointer-events-auto absolute left-4 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
                        aria-label="Previous story"
                    >
                        <ChevronLeft className="size-6" />
                    </button>
                )}
                {nextStoryId && (
                    <button
                        onClick={handleNext}
                        className="pointer-events-auto absolute right-4 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
                        aria-label="Next story"
                    >
                        <ChevronRight className="size-6" />
                    </button>
                )}
            </div>

            {/* Story content */}
            <div className="relative h-full w-full">
                {isImage && mediaUrl && (
                    <img
                        src={mediaUrl}
                        alt={`${story.author?.username ?? 'User'}'s story`}
                        className="h-full w-full object-contain"
                    />
                )}

                {isVideo && mediaUrl && (
                    <video
                        ref={videoRef}
                        src={mediaUrl}
                        className="h-full w-full object-contain"
                        autoPlay
                        playsInline
                        muted
                        loop={false}
                        onEnded={handleNext}
                        onPlay={() => {
                            if (!isPaused) {
                                startProgress();
                            }
                        }}
                        onPause={() => {
                            if (progressIntervalRef.current) {
                                clearInterval(progressIntervalRef.current);
                                progressIntervalRef.current = null;
                            }
                        }}
                    />
                )}

                {/* Author info overlay */}
                {story.author && (
                    <div className="absolute top-16 left-4 z-10 flex items-center gap-3">
                        <Avatar className="size-10 border-2 border-white/50">
                            <AvatarImage
                                src={story.author.avatar_url ?? undefined}
                                alt={story.author.username}
                            />
                            <AvatarFallback className="bg-white/10 text-white/70">
                                {story.author.username[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-white">
                            <p className="font-semibold">
                                {story.author.display_name ??
                                    story.author.username}
                            </p>
                            <p className="text-xs text-white/70">
                                {story.views_count} views
                            </p>
                        </div>
                    </div>
                )}

                {/* Reactions */}
                <div className="absolute right-4 bottom-4 z-10">
                    <StoryReactions
                        storyId={story.id}
                        reactions={story.reactions ?? []}
                        onUpdate={handleReactionUpdate}
                    />
                </div>
            </div>
        </div>
    );
}
