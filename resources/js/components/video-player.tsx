import FlvPlayer from '@/components/flv-player';
import { cn } from '@/lib/utils';
import '@videojs/themes/dist/forest/index.css';
import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

export type VideoPlayerProps = {
    src: string;
    mimeType?: string | null;
    className?: string;
    aspectRatio?: string;
    maxHeight?: string;
    preload?: 'none' | 'metadata' | 'auto';
    controls?: boolean;
    autoplay?: boolean;
    muted?: boolean;
    playsInline?: boolean;
    playbackRates?: number[];
    onReady?: () => void;
    onError?: (error: Error) => void;
    onPlay?: () => void;
    onPause?: () => void;
    onEnded?: () => void;
    lazyLoad?: boolean;
    lazyLoadRootMargin?: string;
};

export default function VideoPlayer({
    src,
    mimeType,
    className,
    aspectRatio = '16/9',
    maxHeight = '24rem',
    preload = 'metadata',
    controls = true,
    autoplay = false,
    muted = false,
    playsInline = true,
    playbackRates = [0.5, 1, 1.25, 1.5, 2],
    onReady,
    onError,
    onPlay,
    onPause,
    onEnded,
    lazyLoad = false,
    lazyLoadRootMargin = '100px',
}: VideoPlayerProps) {
    // Check if this is an FLV file
    const isFlv = mimeType === 'video/x-flv' || src.endsWith('.flv');

    // Use FLV player for FLV files
    if (isFlv) {
        return (
            <FlvPlayer
                src={src}
                className={className}
                aspectRatio={aspectRatio}
                maxHeight={maxHeight}
                controls={controls}
                autoplay={autoplay}
                muted={muted}
                onReady={onReady}
                onError={onError}
                onPlay={onPlay}
                onPause={onPause}
                onEnded={onEnded}
            />
        );
    }
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
    const [isInView, setIsInView] = useState(!lazyLoad);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (!lazyLoad) {
            return;
        }

        const container = containerRef.current;
        if (!container) {
            // If container doesn't exist yet, check again after a short delay
            const timeout = setTimeout(() => {
                if (containerRef.current) {
                    setIsInView(true);
                }
            }, 100);
            return () => clearTimeout(timeout);
        }

        const checkVisibility = () => {
            const rect = container.getBoundingClientRect();
            const margin = parseInt(lazyLoadRootMargin) || 100;
            const isVisible =
                rect.top < window.innerHeight + margin &&
                rect.bottom > -margin &&
                rect.left < window.innerWidth + margin &&
                rect.right > -margin;
            return isVisible;
        };

        // Check immediately
        if (checkVisibility()) {
            setIsInView(true);
            return;
        }

        // Set up observer for when it comes into view
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: lazyLoadRootMargin },
        );

        observer.observe(container);

        return () => {
            observer.disconnect();
        };
    }, [lazyLoad, lazyLoadRootMargin]);

    // Initialize Video.js when in view
    useEffect(() => {
        // Don't re-initialize if player already exists
        if (playerRef.current) {
            return;
        }

        if (!isInView) {
            return;
        }

        if (!videoRef.current) {
            return;
        }

        // Wait for the element to be in the DOM
        // Use double requestAnimationFrame to ensure DOM is fully ready
        let initFrame: number;
        let timeout: NodeJS.Timeout;
        let retryCount = 0;
        const MAX_RETRIES = 10;

        const initializePlayer = () => {
            // Check if player was already created (prevent double initialization)
            if (playerRef.current) {
                return;
            }

            if (!videoRef.current) {
                return;
            }

            // Double-check element is connected to DOM (but limit retries)
            if (!videoRef.current.isConnected) {
                retryCount++;
                if (retryCount > MAX_RETRIES) {
                    return;
                }
                // Retry after a short delay
                timeout = setTimeout(() => {
                    initializePlayer();
                }, 50);
                return;
            }

            // Initialize Video.js player
            try {
                const player = videojs(videoRef.current, {
                    controls,
                    responsive: true,
                    fluid: false,
                    preload,
                    autoplay,
                    muted,
                    playsInline,
                    playbackRates,
                    sources: [
                        {
                            src,
                            type: mimeType || 'video/mp4',
                        },
                    ],
                });

                playerRef.current = player;

                const handleError = () => {
                    const playerError = player.error();
                    const errorMessage =
                        playerError?.message || 'Failed to load video';
                    setError(errorMessage);
                    setIsLoading(false);
                    onError?.(new Error(errorMessage));
                };

                const handlePlay = () => {
                    onPlay?.();
                };

                const handlePause = () => {
                    onPause?.();
                };

                const handleEnded = () => {
                    onEnded?.();
                };

                // Set up event listeners
                let loadingTimeout: NodeJS.Timeout;
                let hasHiddenLoading = false;

                const hideLoading = () => {
                    if (hasHiddenLoading) {
                        return;
                    }
                    hasHiddenLoading = true;
                    setIsLoading(false);
                    if (loadingTimeout) {
                        clearTimeout(loadingTimeout);
                    }
                };

                player.ready(() => {
                    // Video.js player is initialized
                    onReady?.();
                });

                player.on('error', handleError);
                player.on('play', handlePlay);
                player.on('pause', handlePause);
                player.on('ended', handleEnded);

                // Listen for loadedmetadata to hide loading state
                player.on('loadedmetadata', () => {
                    hideLoading();
                });

                // Also listen for canplay to ensure video is ready
                player.on('canplay', () => {
                    hideLoading();
                });

                // Fallback timeout - hide loading after 5 seconds max
                loadingTimeout = setTimeout(() => {
                    hideLoading();
                }, 5000);
            } catch (error) {
                setError('Failed to initialize video player');
                setIsLoading(false);
            }
        };

        // Use requestAnimationFrame to ensure DOM is ready
        initFrame = requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                initializePlayer();
            });
        });

        // Cleanup
        return () => {
            if (initFrame) {
                cancelAnimationFrame(initFrame);
            }
            if (timeout) {
                clearTimeout(timeout);
            }
            if (playerRef.current) {
                try {
                    playerRef.current.dispose();
                } catch (e) {
                    // Ignore disposal errors
                }
                playerRef.current = null;
            }
        };
        // Only re-run if src, mimeType, or isInView changes - not on callback changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isInView, src, mimeType]);

    return (
        <div
            ref={containerRef}
            className={cn('overflow-hidden rounded-xl', className)}
            style={{ maxHeight }}
        >
            <div
                className="relative w-full"
                style={{
                    aspectRatio,
                    minHeight: '200px',
                }}
            >
                {error ? (
                    <div className="flex h-full items-center justify-center rounded-lg bg-black/50 text-sm text-red-400">
                        {error}
                    </div>
                ) : (
                    <>
                        {isLoading && (
                            <div className="absolute inset-0 z-10 rounded-lg bg-black/20">
                                <div
                                    className="absolute inset-0 animate-pulse rounded-lg bg-white/10"
                                    style={{
                                        aspectRatio,
                                        minWidth: '100%',
                                        width: '100%',
                                        height: '100%',
                                    }}
                                />
                            </div>
                        )}
                        <div
                            data-vjs-player
                            className="h-full w-full"
                            style={{ minHeight: '200px' }}
                        >
                            <video
                                ref={videoRef}
                                className="video-js vjs-theme-forest"
                                playsInline={playsInline}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    minHeight: '200px',
                                }}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
