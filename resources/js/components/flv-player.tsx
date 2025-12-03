import { cn } from '@/lib/utils';
import flvjs from 'flv.js';
import { useEffect, useRef, useState } from 'react';

export type FlvPlayerProps = {
    src: string;
    className?: string;
    aspectRatio?: string;
    maxHeight?: string;
    controls?: boolean;
    autoplay?: boolean;
    muted?: boolean;
    onReady?: () => void;
    onError?: (error: Error) => void;
    onPlay?: () => void;
    onPause?: () => void;
    onEnded?: () => void;
};

export default function FlvPlayer({
    src,
    className,
    aspectRatio = '16/9',
    maxHeight = '24rem',
    controls = true,
    autoplay = false,
    muted = false,
    onReady,
    onError,
    onPlay,
    onPause,
    onEnded,
}: FlvPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<flvjs.Player | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [useNativePlayer, setUseNativePlayer] = useState(false);

    useEffect(() => {
        if (!videoRef.current) {
            return;
        }

        // If we're using native player (fallback), just set up the video element
        if (useNativePlayer) {
            const video = videoRef.current;
            video.src = src;
            video.load();

            const handleLoadedMetadata = () => {
                setIsLoading(false);
                onReady?.();
            };

            const handleError = () => {
                const videoError = video.error;
                let errorMsg = 'Failed to load video';
                if (videoError) {
                    switch (videoError.code) {
                        case 1:
                            errorMsg = 'Video aborted';
                            break;
                        case 2:
                            errorMsg = 'Network error - check CORS settings';
                            break;
                        case 3:
                            errorMsg =
                                'Decode error - video codec not supported';
                            break;
                        case 4:
                            errorMsg =
                                'Format not supported. FLV files may need to be converted to MP4/H.264.';
                            break;
                    }
                }
                setError(errorMsg);
                setIsLoading(false);
                onError?.(new Error(errorMsg));
            };

            video.addEventListener('loadedmetadata', handleLoadedMetadata);
            video.addEventListener('error', handleError);
            video.addEventListener('play', () => onPlay?.());
            video.addEventListener('pause', () => onPause?.());
            video.addEventListener('ended', () => onEnded?.());

            if (autoplay) {
                video.autoplay = true;
            }
            if (muted) {
                video.muted = true;
            }

            return () => {
                video.removeEventListener(
                    'loadedmetadata',
                    handleLoadedMetadata,
                );
                video.removeEventListener('error', handleError);
            };
        }

        // Check if flv.js is supported
        if (!flvjs.isSupported()) {
            // Fall back to native player
            setUseNativePlayer(true);
            return;
        }

        // Create FLV player
        try {
            const player = flvjs.createPlayer(
                {
                    type: 'flv',
                    url: src,
                    isLive: false,
                    hasAudio: true,
                    hasVideo: true,
                },
                {
                    enableWorker: false,
                    enableStashBuffer: false,
                    stashInitialSize: 128,
                    autoCleanupSourceBuffer: true,
                },
            );

            player.attachMediaElement(videoRef.current);
            player.load();

            playerRef.current = player;

            const handleError = (errorType: number, errorDetail: string) => {
                // Check for unsupported codec errors
                const isCodecError =
                    errorDetail?.includes('Unsupported') &&
                    (errorDetail?.includes('codec') ||
                        errorDetail?.includes('CodecUnsupported'));

                if (isCodecError && !useNativePlayer) {
                    // Try falling back to native video player
                    if (playerRef.current) {
                        try {
                            playerRef.current.pause();
                            playerRef.current.unload();
                            playerRef.current.detachMediaElement();
                            playerRef.current.destroy();
                        } catch (e) {
                            // Ignore cleanup errors
                        }
                        playerRef.current = null;
                    }

                    // Try native HTML5 video player as fallback
                    setUseNativePlayer(true);
                    setIsLoading(true);
                    setError(null);

                    // Set up native video element
                    if (videoRef.current) {
                        videoRef.current.src = src;
                        videoRef.current.load();
                    }
                    return;
                }

                let errorMsg = `FLV playback error: ${errorDetail}`;

                // Check for CORS-related errors
                if (
                    errorDetail?.toLowerCase().includes('cors') ||
                    errorDetail?.toLowerCase().includes('cross-origin') ||
                    errorType === flvjs.ErrorTypes.NETWORK_ERROR
                ) {
                    errorMsg =
                        'CORS error: The CDN must allow cross-origin requests. Please configure CORS headers on cdn.fetishmen.net to allow your domain.';
                } else if (isCodecError) {
                    errorMsg =
                        'Video uses unsupported codec (Sorenson H.263). FLV files need to be converted to MP4 (H.264/AAC) for browser playback. The native player will be attempted as a fallback.';
                }

                setError(errorMsg);
                setIsLoading(false);
                onError?.(new Error(errorMsg));
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

            player.on(flvjs.Events.ERROR, handleError);
            videoRef.current.addEventListener('play', handlePlay);
            videoRef.current.addEventListener('pause', handlePause);
            videoRef.current.addEventListener('ended', handleEnded);

            // Hide loading when metadata is loaded
            const handleLoadedMetadata = () => {
                setIsLoading(false);
                onReady?.();
            };

            videoRef.current.addEventListener(
                'loadedmetadata',
                handleLoadedMetadata,
            );

            // Set autoplay and muted if needed
            if (autoplay) {
                videoRef.current.autoplay = true;
            }
            if (muted) {
                videoRef.current.muted = true;
            }

            // Cleanup
            return () => {
                if (playerRef.current) {
                    try {
                        playerRef.current.pause();
                        playerRef.current.unload();
                        playerRef.current.detachMediaElement();
                        playerRef.current.destroy();
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                    playerRef.current = null;
                }
            };
        } catch (err) {
            const errorMsg =
                err instanceof Error
                    ? err.message
                    : 'Failed to initialize FLV player';
            setError(errorMsg);
            setIsLoading(false);
            onError?.(new Error(errorMsg));
        }
    }, [
        src,
        autoplay,
        muted,
        onReady,
        onError,
        onPlay,
        onPause,
        onEnded,
        useNativePlayer,
    ]);

    return (
        <div
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
                        <video
                            ref={videoRef}
                            controls={controls}
                            crossOrigin="anonymous"
                            className="h-full w-full"
                            style={{ minHeight: '200px' }}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
