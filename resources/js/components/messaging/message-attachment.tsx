import VideoPlayer from '@/components/video-player';
import { cn } from '@/lib/utils';
import { Loader2, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Attachment } from './types';

type MessageAttachmentProps = {
    attachment: Attachment;
    onImageClick?: () => void;
};

function formatDuration(seconds: number | null | undefined): string {
    if (
        seconds === null ||
        seconds === undefined ||
        !isFinite(seconds) ||
        isNaN(seconds) ||
        seconds <= 0
    ) {
        return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getMimeType(
    url: string,
    filename: string,
    providedMimeType?: string | null,
): string {
    // Use provided MIME type if available
    if (providedMimeType && providedMimeType.startsWith('audio/')) {
        return providedMimeType;
    }

    // Try to get MIME type from filename extension
    const extension =
        filename.split('.').pop()?.toLowerCase() ||
        url.split('.').pop()?.toLowerCase() ||
        '';

    const mimeTypes: Record<string, string> = {
        mp3: 'audio/mpeg',
        mpeg: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        oga: 'audio/ogg',
        webm: 'audio/webm',
        aac: 'audio/aac',
        m4a: 'audio/mp4',
        mp4: 'audio/mp4',
        flac: 'audio/flac',
        opus: 'audio/opus',
    };

    return mimeTypes[extension] || 'audio/mpeg';
}

export default function MessageAttachment({
    attachment,
    onImageClick,
}: MessageAttachmentProps) {
    if (attachment.type === 'image' && attachment.url) {
        return (
            <figure
                className={cn(
                    'max-h-80 cursor-pointer overflow-hidden rounded-xl transition-all duration-200 hover:opacity-90',
                )}
                onClick={onImageClick}
            >
                <img
                    src={attachment.optimized_url ?? attachment.url}
                    alt={attachment.filename}
                    className="h-full w-full object-cover"
                />
            </figure>
        );
    }

    // Ensure we have a valid URL for media players
    const mediaUrl = attachment.url;
    if (!mediaUrl) {
        return (
            <figure className="overflow-hidden rounded-xl bg-white/5 p-4">
                <div className="text-xs tracking-[0.3em] text-white/50 uppercase">
                    {attachment.filename}
                </div>
            </figure>
        );
    }

    if (attachment.type === 'video') {
        return (
            <MessageVideoPlayer
                url={mediaUrl}
                filename={attachment.filename}
                mimeType={attachment.mime_type}
            />
        );
    }

    if (attachment.type === 'audio') {
        return (
            <AudioPlayer
                url={mediaUrl}
                filename={attachment.filename}
                duration={attachment.duration}
                mimeType={attachment.mime_type}
            />
        );
    }

    return (
        <figure className="overflow-hidden rounded-xl bg-white/5 p-4">
            <div className="text-xs tracking-[0.3em] text-white/50 uppercase">
                {attachment.filename}
            </div>
        </figure>
    );
}

type MessageVideoPlayerProps = {
    url: string;
    filename: string;
    mimeType?: string | null;
};

function MessageVideoPlayer({
    url,
    filename,
    mimeType,
}: MessageVideoPlayerProps) {
    return (
        <figure>
            <VideoPlayer
                src={url}
                mimeType={mimeType}
                lazyLoad
                maxHeight="24rem"
                aspectRatio="16/9"
                className="min-h-[200px]"
            />
        </figure>
    );
}

type AudioPlayerProps = {
    url: string;
    filename: string;
    duration?: number | null;
    mimeType?: string | null;
};

function AudioPlayer({
    url,
    filename,
    duration: attachmentDuration,
    mimeType,
}: AudioPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isInView, setIsInView] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        // Check if already in view immediately
        const checkVisibility = () => {
            const rect = container.getBoundingClientRect();
            const isVisible =
                rect.top < window.innerHeight + 100 &&
                rect.bottom > -100 &&
                rect.left < window.innerWidth + 100 &&
                rect.right > -100;
            return isVisible;
        };

        if (checkVisibility()) {
            setIsInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: '100px' }, // Start loading 100px before it comes into view
        );

        observer.observe(container);

        return () => {
            observer.disconnect();
        };
    }, []);

    // Load audio when in view
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !isInView) {
            console.log(
                '[AudioPlayer] Not loading - audio:',
                !!audio,
                'isInView:',
                isInView,
            );
            return;
        }

        console.log(
            '[AudioPlayer] Starting load - URL:',
            url,
            'attachmentDuration:',
            attachmentDuration,
        );
        setIsLoading(true);
        setError(null);

        let blobCleanup: (() => void) | undefined;

        const updateTime = () => {
            const time = audio.currentTime;
            if (
                time !== null &&
                time !== undefined &&
                isFinite(time) &&
                !isNaN(time)
            ) {
                setCurrentTime(time);
            }
        };

        const updateDuration = () => {
            const audioDuration = audio.duration;
            console.log(
                '[AudioPlayer] updateDuration - audio.duration:',
                audioDuration,
                'readyState:',
                audio.readyState,
                'networkState:',
                audio.networkState,
            );

            // Check if duration is valid (not NaN, not Infinity, > 0)
            if (
                audioDuration &&
                !isNaN(audioDuration) &&
                isFinite(audioDuration) &&
                audioDuration > 0
            ) {
                console.log('[AudioPlayer] Setting duration:', audioDuration);
                setDuration(audioDuration);
                setIsLoading(false);
                setIsReady(true);
                setError(null);
            } else if (
                audioDuration === Infinity ||
                audioDuration === Number.POSITIVE_INFINITY
            ) {
                // For WebM files, duration might not be available until playback starts
                // Use backend duration if available, otherwise allow play and update during playback
                if (attachmentDuration && attachmentDuration > 0) {
                    console.log(
                        '[AudioPlayer] Using backend duration:',
                        attachmentDuration,
                    );
                    setDuration(attachmentDuration);
                    setIsLoading(false);
                    setIsReady(true);
                    setError(null);
                } else {
                    // No duration available yet - allow play, duration will update during playback
                    console.log(
                        '[AudioPlayer] Duration is Infinity, no backend duration - allowing play, will update during playback',
                    );
                    setDuration(null); // Keep as null to show --:--
                    setIsLoading(false);
                    setIsReady(true); // Allow play even without duration
                    setError(null);
                }
            }
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };
        const handleLoadedMetadata = () => {
            console.log(
                '[AudioPlayer] loadedmetadata event - duration:',
                audio.duration,
            );
            updateDuration();
            // If duration is still not available, try seeking to trigger more metadata loading
            if (
                (!audio.duration ||
                    !isFinite(audio.duration) ||
                    audio.duration <= 0) &&
                audio.readyState >= 2
            ) {
                console.log(
                    '[AudioPlayer] Duration not available after loadedmetadata, trying seek trick',
                );
                const savedTime = audio.currentTime;
                audio.currentTime = 0.01;
                setTimeout(() => {
                    audio.currentTime = savedTime;
                    updateDuration();
                }, 50);
            }
        };
        const handleCanPlay = () => {
            console.log(
                '[AudioPlayer] canplay event - duration:',
                audio.duration,
            );
            updateDuration();
        };
        const handleDurationChange = () => {
            console.log(
                '[AudioPlayer] durationchange event - duration:',
                audio.duration,
            );
            updateDuration();
        };
        const handleLoadedData = () => {
            console.log(
                '[AudioPlayer] loadeddata event - duration:',
                audio.duration,
            );
            updateDuration();
        };
        const handleProgress = () => {
            // Sometimes duration becomes available during progress
            if (
                audio.duration &&
                isFinite(audio.duration) &&
                audio.duration > 0
            ) {
                updateDuration();
            }
        };
        const handleError = () => {
            const audioError = audio.error;
            console.error(
                '[AudioPlayer] Error - code:',
                audioError?.code,
                'message:',
                audioError?.message,
                'networkState:',
                audio.networkState,
                'readyState:',
                audio.readyState,
            );

            let errorMessage = 'Failed to load audio';
            if (audioError) {
                switch (audioError.code) {
                    case 1:
                        errorMessage = 'Audio aborted';
                        break;
                    case 2:
                        errorMessage = 'Network error - check CORS settings';
                        break;
                    case 3:
                        errorMessage = 'Decode error';
                        break;
                    case 4:
                        errorMessage = 'Format not supported or CORS error';
                        break;
                }
            }
            setError(errorMessage);
            setIsLoading(false);

            // Fallback to attachment duration if available
            if (attachmentDuration && attachmentDuration > 0) {
                console.log(
                    '[AudioPlayer] Using attachment duration fallback:',
                    attachmentDuration,
                );
                setDuration(attachmentDuration);
                setIsReady(true);
            }
        };

        // Set up event listeners BEFORE loading
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('loadeddata', handleLoadedData);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('progress', handleProgress);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        // Now set up the audio source
        const detectedMimeType = getMimeType(url, filename, mimeType);

        // Clear existing sources
        while (audio.firstChild) {
            audio.removeChild(audio.firstChild);
        }

        // Create source element
        const source = document.createElement('source');
        source.src = url;
        source.type = detectedMimeType;
        audio.appendChild(source);

        // Set src directly
        audio.src = url;
        // Use 'auto' to ensure metadata loads
        audio.preload = 'auto';

        // Force actual loading by fetching the file as a blob
        // This ensures the browser actually downloads the file to get duration
        const forcePreload = async () => {
            try {
                console.log('[AudioPlayer] Force preloading file as blob...');
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                // Fetch the entire file as a blob
                // For WebM files, duration is at the end, so we need the full file
                const blob = await response.blob();
                console.log(
                    '[AudioPlayer] File loaded as blob, size:',
                    blob.size,
                    'type:',
                    blob.type,
                );

                // Try to extract duration from WebM file
                // WebM stores duration in the EBML structure, often at the end
                const extractedDuration: number | null = null;
                if (
                    blob.type.includes('webm') ||
                    filename.toLowerCase().endsWith('.webm')
                ) {
                    try {
                        // Read the last 64KB of the file where duration metadata often is
                        const endBytes = Math.min(65536, blob.size);
                        const startByte = Math.max(0, blob.size - endBytes);
                        const endSlice = blob.slice(startByte);
                        const arrayBuffer = await endSlice.arrayBuffer();
                        const uint8Array = new Uint8Array(arrayBuffer);

                        // Look for duration in WebM (simplified - WebM uses EBML which is complex)
                        // For now, we'll try to get it from the audio element after seeking
                        console.log(
                            '[AudioPlayer] WebM file detected, will try to extract duration via seeking',
                        );
                    } catch (err) {
                        console.error('[AudioPlayer] Error parsing WebM:', err);
                    }
                }

                // Create object URL from blob
                const blobUrl = URL.createObjectURL(blob);

                // Update audio source to use blob URL
                while (audio.firstChild) {
                    audio.removeChild(audio.firstChild);
                }
                const source = document.createElement('source');
                source.src = blobUrl;
                source.type = detectedMimeType;
                audio.appendChild(source);
                audio.src = blobUrl;
                audio.preload = 'auto';

                // Load the audio
                audio.load();
                console.log(
                    '[AudioPlayer] Loaded from blob - readyState:',
                    audio.readyState,
                );

                // For WebM files, duration is often at the end of the file
                // The browser will determine it during playback
                // We use backend duration if available, otherwise update during playback

                // Clean up blob URL on unmount
                return () => {
                    URL.revokeObjectURL(blobUrl);
                };
            } catch (err) {
                console.error('[AudioPlayer] Force preload failed:', err);
                // Fallback to normal load
                audio.load();
                return undefined;
            }
        };

        // Start force preload and store cleanup function
        forcePreload().then((cleanup) => {
            blobCleanup = cleanup;
        });
        console.log(
            '[AudioPlayer] After load() - readyState:',
            audio.readyState,
            'networkState:',
            audio.networkState,
        );

        // Poll for duration - some formats (like WebM) store duration at the end of file
        // So we need to wait for the browser to read enough of the file
        let pollCount = 0;
        const maxPolls = 20; // Poll for up to 4 seconds (20 * 200ms)
        const pollInterval = setInterval(() => {
            pollCount++;
            const currentDuration = audio.duration;
            const hasValidDuration =
                currentDuration &&
                isFinite(currentDuration) &&
                currentDuration > 0 &&
                currentDuration !== Infinity;

            console.log(
                '[AudioPlayer] Poll',
                pollCount,
                '- duration:',
                currentDuration,
                'hasValidDuration:',
                hasValidDuration,
                'readyState:',
                audio.readyState,
            );

            if (hasValidDuration) {
                console.log(
                    '[AudioPlayer] Got valid duration from polling:',
                    currentDuration,
                );
                setDuration(currentDuration);
                setIsLoading(false);
                setIsReady(true);
                clearInterval(pollInterval);
            } else if (pollCount >= maxPolls) {
                // Timeout reached
                console.log('[AudioPlayer] Poll timeout - using fallback');
                clearInterval(pollInterval);
                if (attachmentDuration && attachmentDuration > 0) {
                    console.log(
                        '[AudioPlayer] Using attachment duration fallback:',
                        attachmentDuration,
                    );
                    setDuration(attachmentDuration);
                    setIsLoading(false);
                    setIsReady(true);
                } else {
                    // Allow play even without duration (for live streams or files without metadata)
                    console.log(
                        '[AudioPlayer] No duration available, allowing play anyway',
                    );
                    setIsLoading(false);
                    setIsReady(true);
                }
            }
        }, 200); // Poll every 200ms

        return () => {
            clearInterval(pollInterval);
            if (blobCleanup) {
                blobCleanup();
            }
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('loadeddata', handleLoadedData);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('progress', handleProgress);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, [isInView, url, attachmentDuration, mimeType, filename]);

    const handlePlayPause = async () => {
        const audio = audioRef.current;
        console.log(
            '[AudioPlayer] handlePlayPause - audio:',
            !!audio,
            'duration:',
            duration,
            'isPlaying:',
            isPlaying,
            'readyState:',
            audio?.readyState,
            'isReady:',
            isReady,
        );

        if (!audio) {
            console.log('[AudioPlayer] No audio element');
            return;
        }

        // Allow play if audio is ready (has loaded, even if duration is unknown)
        // Duration can be null for live streams or files without metadata
        const canPlay = isReady || audio.readyState >= 2; // readyState 2 = HAVE_CURRENT_DATA
        console.log(
            '[AudioPlayer] canPlay:',
            canPlay,
            'isReady:',
            isReady,
            'readyState:',
            audio.readyState,
        );
        if (!canPlay) {
            console.log('[AudioPlayer] Cannot play - audio not ready');
            return;
        }

        if (isPlaying) {
            console.log('[AudioPlayer] Pausing');
            audio.pause();
        } else {
            try {
                console.log(
                    '[AudioPlayer] Attempting to play - readyState:',
                    audio.readyState,
                    'src:',
                    audio.src,
                );
                // Ensure full file is loaded before playing
                if (audio.readyState < 4) {
                    console.log(
                        '[AudioPlayer] Loading full file - readyState:',
                        audio.readyState,
                    );
                    setIsLoading(true);
                    audio.preload = 'auto';
                    await audio.load();
                    console.log(
                        '[AudioPlayer] After load - readyState:',
                        audio.readyState,
                    );
                    setIsLoading(false);
                }
                console.log('[AudioPlayer] Calling audio.play()');
                await audio.play();
                console.log('[AudioPlayer] Play successful');
            } catch (error) {
                console.error(
                    '[AudioPlayer] Play error:',
                    error,
                    'audio.error:',
                    audio.error,
                );
                setError('Failed to play audio');
                setIsLoading(false);
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) {
            return;
        }
        const newTime = parseFloat(e.target.value);
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    return (
        <figure className="overflow-hidden rounded-xl" ref={containerRef}>
            <div className="rounded-lg bg-white/5 p-4">
                {isLoading ? (
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                            <Loader2 className="size-5 animate-spin text-white/60" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <div className="h-1.5 w-full animate-pulse rounded-full bg-white/20" />
                            <div className="flex items-center justify-between text-xs text-white/40">
                                <span>Loading...</span>
                                <span>
                                    {attachmentDuration
                                        ? formatDuration(attachmentDuration)
                                        : '--:--'}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-3 text-sm text-red-400">
                        <span>{error}</span>
                        {attachmentDuration && (
                            <span className="text-white/60">
                                (Duration: {formatDuration(attachmentDuration)})
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        {/* Play/Pause Button */}
                        <button
                            type="button"
                            onClick={handlePlayPause}
                            disabled={isLoading || !isReady}
                            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isLoading ? (
                                <Loader2 className="size-5 animate-spin text-white/60" />
                            ) : isPlaying ? (
                                <Pause className="h-5 w-5 fill-current" />
                            ) : (
                                <Play className="h-5 w-5 fill-current" />
                            )}
                        </button>

                        {/* Progress and Time */}
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min="0"
                                    max={
                                        duration && isFinite(duration)
                                            ? duration
                                            : 100
                                    }
                                    step="0.1"
                                    value={currentTime}
                                    onChange={handleSeek}
                                    disabled={
                                        !duration ||
                                        !isFinite(duration) ||
                                        duration <= 0
                                    }
                                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                                    style={{
                                        background:
                                            duration &&
                                            isFinite(duration) &&
                                            duration > 0
                                                ? `linear-gradient(to right, rgb(251 191 36 / 0.6) 0%, rgb(251 191 36 / 0.6) ${
                                                      (currentTime / duration) *
                                                      100
                                                  }%, rgba(255, 255, 255, 0.2) ${
                                                      (currentTime / duration) *
                                                      100
                                                  }%, rgba(255, 255, 255, 0.2) 100%)`
                                                : 'rgba(255, 255, 255, 0.2)',
                                    }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs text-white/60">
                                <span className="tabular-nums">
                                    {formatDuration(currentTime)}
                                </span>
                                <span className="tabular-nums">
                                    {duration &&
                                    isFinite(duration) &&
                                    duration > 0
                                        ? formatDuration(duration)
                                        : isLoading
                                          ? 'Loading...'
                                          : '--:--'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                {/* Hidden audio element */}
                <audio ref={audioRef} preload="none" />
            </div>
        </figure>
    );
}
