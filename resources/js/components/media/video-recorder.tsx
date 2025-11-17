import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Square, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type VideoRecorderProps = {
    onRecorded: (blob: Blob) => void;
    onCancel: () => void;
    onError?: (error: string) => void;
    maxDuration?: number; // in seconds, default 60
    autoStart?: boolean; // default true
};

export default function VideoRecorder({
    onRecorded,
    onCancel,
    onError,
    maxDuration = 60,
    autoStart = true,
}: VideoRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
        [],
    );
    const [selectedCameraId, setSelectedCameraId] = useState<string | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);

    const videoRecorderRef = useRef<MediaRecorder | null>(null);
    const videoStreamRef = useRef<MediaStream | null>(null);
    const videoChunksRef = useRef<Blob[]>([]);
    const videoRecordingIntervalRef = useRef<number | undefined>(undefined);
    const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
    const sessionIdRef = useRef<number>(0);
    const hasStartedRef = useRef(false);

    const formatRecordingTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const getAvailableCameras = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(
                (device) => device.kind === 'videoinput',
            );
            setAvailableCameras(videoInputs);

            if (videoInputs.length > 0 && !selectedCameraId) {
                setSelectedCameraId(videoInputs[0].deviceId);
            }

            if (videoInputs.length === 0) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                });
                stream.getTracks().forEach((track) => track.stop());
                const devicesAfterPermission =
                    await navigator.mediaDevices.enumerateDevices();
                const videoInputsAfterPermission =
                    devicesAfterPermission.filter(
                        (device) => device.kind === 'videoinput',
                    );
                setAvailableCameras(videoInputsAfterPermission);
                if (videoInputsAfterPermission.length > 0) {
                    setSelectedCameraId(videoInputsAfterPermission[0].deviceId);
                }
            }
        } catch {
            // Ignore error getting cameras
        }
    }, [selectedCameraId]);

    const stopVideoRecording = useCallback(() => {
        if (videoRecorderRef.current) {
            const state = videoRecorderRef.current.state;
            if (state === 'recording' || state === 'paused') {
                try {
                    videoRecorderRef.current.requestData();
                } catch {
                    // Ignore error requesting final data
                }
                videoRecorderRef.current.stop();
            }
            if (videoRecordingIntervalRef.current) {
                window.clearInterval(videoRecordingIntervalRef.current);
                videoRecordingIntervalRef.current = undefined;
            }
        }
    }, []);

    const startVideoRecording = useCallback(async () => {
        if (isRecording) {
            return;
        }

        try {
            const videoConstraints: MediaTrackConstraints = {
                width: { ideal: 1280 },
                height: { ideal: 720 },
            };

            if (selectedCameraId) {
                videoConstraints.deviceId = { exact: selectedCameraId };
            } else {
                videoConstraints.facingMode = 'user';
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: true,
            });

            if (!window.MediaRecorder) {
                const errorMsg =
                    'Video recording is not supported in this browser.';
                setError(errorMsg);
                onError?.(errorMsg);
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            let mimeType = 'video/webm';
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
                mimeType = 'video/webm;codecs=vp9,opus';
            } else if (
                MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
            ) {
                mimeType = 'video/webm;codecs=vp8,opus';
            } else if (MediaRecorder.isTypeSupported('video/webm')) {
                mimeType = 'video/webm';
            } else if (MediaRecorder.isTypeSupported('video/mp4')) {
                mimeType = 'video/mp4';
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });

            if (!mediaRecorder) {
                throw new Error('Failed to create MediaRecorder');
            }

            setTimeout(() => {
                if (videoPreviewRef.current && stream) {
                    videoPreviewRef.current.srcObject = stream;
                    videoPreviewRef.current.muted = true;
                    videoPreviewRef.current.autoplay = true;
                    videoPreviewRef.current.playsInline = true;
                    videoPreviewRef.current.play().catch(() => {
                        // Ignore error playing video preview
                    });
                }
            }, 100);

            const currentSessionId = sessionIdRef.current;
            videoChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (currentSessionId !== sessionIdRef.current) {
                    return;
                }
                if (event.data && event.data.size > 0) {
                    videoChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onerror = () => {
                if (currentSessionId !== sessionIdRef.current) {
                    return;
                }
                const errorMsg =
                    'An error occurred while recording. Please try again.';
                setError(errorMsg);
                onError?.(errorMsg);
                setIsRecording(false);
                setIsInitializing(false);
                cleanup();
                if (videoRecordingIntervalRef.current) {
                    window.clearInterval(videoRecordingIntervalRef.current);
                    videoRecordingIntervalRef.current = undefined;
                }
                if (videoStreamRef.current) {
                    videoStreamRef.current
                        .getTracks()
                        .forEach((track) => track.stop());
                    videoStreamRef.current = null;
                }
                if (videoPreviewRef.current) {
                    videoPreviewRef.current.srcObject = null;
                }
            };

            mediaRecorder.onstop = () => {
                if (currentSessionId !== sessionIdRef.current) {
                    return;
                }

                setTimeout(() => {
                    if (currentSessionId !== sessionIdRef.current) {
                        return;
                    }

                    if (videoChunksRef.current.length === 0) {
                        if (recordingTime > 0) {
                            const errorMsg =
                                'No video was recorded. Please try again.';
                            setError(errorMsg);
                            onError?.(errorMsg);
                        }
                        setIsRecording(false);
                        videoChunksRef.current = [];
                        cleanup();
                        return;
                    }

                    const totalSize = videoChunksRef.current.reduce(
                        (sum, chunk) => sum + chunk.size,
                        0,
                    );
                    if (totalSize === 0) {
                        if (recordingTime > 0) {
                            const errorMsg =
                                'No video data was recorded. Please try again.';
                            setError(errorMsg);
                            onError?.(errorMsg);
                        }
                        setIsRecording(false);
                        videoChunksRef.current = [];
                        cleanup();
                        return;
                    }

                    const blob = new Blob(videoChunksRef.current, {
                        type: mediaRecorder.mimeType,
                    });

                    if (blob.size === 0) {
                        if (recordingTime > 0) {
                            const errorMsg =
                                'No video data was recorded. Please try again.';
                            setError(errorMsg);
                            onError?.(errorMsg);
                        }
                        setIsRecording(false);
                        videoChunksRef.current = [];
                        cleanup();
                        return;
                    }

                    const url = URL.createObjectURL(blob);
                    setVideoBlob(blob);
                    setVideoUrl(url);
                    setIsRecording(false);

                    if (videoPreviewRef.current) {
                        videoPreviewRef.current.srcObject = null;
                    }

                    cleanup();
                }, 100);
            };

            videoRecorderRef.current = mediaRecorder;
            videoStreamRef.current = stream;

            mediaRecorder.start(100);

            await new Promise((resolve) => setTimeout(resolve, 100));

            if (mediaRecorder.state !== 'recording') {
                throw new Error(
                    `MediaRecorder did not start recording. State: ${mediaRecorder.state}`,
                );
            }

            setIsInitializing(false);
            setIsRecording(true);
            setRecordingTime(0);

            videoRecordingIntervalRef.current = window.setInterval(() => {
                setRecordingTime((prev) => {
                    const next = prev + 1;
                    if (next >= maxDuration) {
                        stopVideoRecording();
                        return maxDuration;
                    }
                    return next;
                });
                if (
                    videoRecorderRef.current &&
                    videoRecorderRef.current.state === 'recording'
                ) {
                    try {
                        videoRecorderRef.current.requestData();
                    } catch {
                        // Ignore error requesting data
                    }
                }
            }, 1000);
        } catch (error) {
            const errorMsg =
                error instanceof Error
                    ? error.message
                    : 'Failed to start video recording. Please check camera permissions.';
            setError(errorMsg);
            onError?.(errorMsg);
            setIsInitializing(false);
            setIsRecording(false);
            cleanup();
        }
    }, [
        isRecording,
        selectedCameraId,
        maxDuration,
        stopVideoRecording,
        recordingTime,
        onError,
    ]);

    // Store startVideoRecording in a ref to avoid dependency issues
    const startVideoRecordingRef = useRef(startVideoRecording);
    startVideoRecordingRef.current = startVideoRecording;

    const cleanup = useCallback(() => {
        if (videoRecordingIntervalRef.current) {
            window.clearInterval(videoRecordingIntervalRef.current);
            videoRecordingIntervalRef.current = undefined;
        }
        if (videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach((track) => track.stop());
            videoStreamRef.current = null;
        }
        if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = null;
        }
    }, []);

    const handleCancel = useCallback(() => {
        stopVideoRecording();
        cleanup();
        hasStartedRef.current = false;
        setIsInitializing(false);
        setVideoBlob(null);
        if (videoUrl) {
            URL.revokeObjectURL(videoUrl);
            setVideoUrl(null);
        }
        setIsRecording(false);
        setRecordingTime(0);
        setError(null);
        onCancel();
    }, [videoUrl, stopVideoRecording, cleanup, onCancel]);

    // Get available cameras on mount
    useEffect(() => {
        void getAvailableCameras();
    }, [getAvailableCameras]);

    // Auto-start recording if autoStart is true
    useEffect(() => {
        if (
            !autoStart ||
            isRecording ||
            videoBlob ||
            hasStartedRef.current ||
            availableCameras.length === 0
        ) {
            return;
        }

        hasStartedRef.current = true;
        setIsInitializing(true);

        const timer = setTimeout(() => {
            if (startVideoRecordingRef.current) {
                void startVideoRecordingRef.current();
            }
        }, 200);

        return () => {
            clearTimeout(timer);
        };
    }, [autoStart, isRecording, videoBlob, availableCameras.length]); // Removed startVideoRecording from deps

    // Watch for video stream changes and attach to video element
    useEffect(() => {
        if (isRecording && videoStreamRef.current && videoPreviewRef.current) {
            const stream = videoStreamRef.current;
            const video = videoPreviewRef.current;

            video.srcObject = stream;
            video.muted = true;
            video.autoplay = true;
            video.playsInline = true;

            video.play().catch(() => {
                // Ignore error playing video
            });

            return () => {
                if (video.srcObject) {
                    video.srcObject = null;
                }
            };
        }
    }, [isRecording]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (videoRecorderRef.current) {
                const recorder = videoRecorderRef.current;
                recorder.ondataavailable = null;
                recorder.onstop = null;
                recorder.onerror = null;
                if (
                    recorder.state === 'recording' ||
                    recorder.state === 'paused'
                ) {
                    recorder.stop();
                }
            }
            cleanup();
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Expose recorded blob via callback when ready
    useEffect(() => {
        if (videoBlob && videoUrl && !isRecording) {
            onRecorded(videoBlob);
        }
    }, [videoBlob, videoUrl, isRecording, onRecorded]);

    const maxDurationFormatted = formatRecordingTime(maxDuration);

    return (
        <div className="space-y-3">
            {error && (
                <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
                    {error}
                </p>
            )}
            {isInitializing && !isRecording ? (
                <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                        <span className="text-sm text-white/70">
                            Preparing video recorder...
                        </span>
                        {availableCameras.length === 0 && (
                            <span className="text-xs text-white/50">
                                Requesting camera access...
                            </span>
                        )}
                    </div>
                </div>
            ) : !isRecording && !videoBlob && availableCameras.length > 1 ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Label
                            htmlFor="camera-select"
                            className="text-sm text-white/70"
                        >
                            Camera:
                        </Label>
                        <Select
                            value={selectedCameraId ?? ''}
                            onValueChange={(value) =>
                                setSelectedCameraId(value)
                            }
                        >
                            <SelectTrigger
                                id="camera-select"
                                className="flex-1 rounded-2xl border-white/20 bg-black/40 text-sm text-white focus:ring-amber-400/40"
                            >
                                <SelectValue placeholder="Select camera" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border border-white/10 bg-black/85 text-white shadow-[0_30px_80px_-45px_rgba(0,0,0,0.75)] backdrop-blur-xl">
                                {availableCameras.map((camera) => (
                                    <SelectItem
                                        key={camera.deviceId}
                                        value={camera.deviceId}
                                        className="text-sm text-white/80 focus:bg-white/10 focus:text-white"
                                    >
                                        {camera.label ||
                                            `Camera ${availableCameras.indexOf(camera) + 1}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="aspect-video rounded-2xl border border-white/10 bg-black" />
                </div>
            ) : isRecording ? (
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
                    <video
                        ref={videoPreviewRef}
                        autoPlay
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                    />
                    {/* Timer overlay at top */}
                    <div className="absolute inset-x-0 top-4 flex justify-center">
                        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2 backdrop-blur-sm">
                            <div className="size-3 animate-pulse rounded-full bg-rose-500" />
                            <span className="font-mono text-sm font-semibold text-white">
                                {formatRecordingTime(recordingTime)} /{' '}
                                {maxDurationFormatted}
                            </span>
                        </div>
                    </div>
                    {/* Buttons overlay at bottom */}
                    <div className="absolute inset-x-0 bottom-4 flex justify-center">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleCancel}
                                className="flex size-12 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/90 backdrop-blur-sm transition hover:border-white/30 hover:bg-black/80 hover:text-white"
                                aria-label="Cancel recording"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                            <Button
                                type="button"
                                onClick={stopVideoRecording}
                                className="flex size-12 items-center justify-center rounded-full border-2 border-rose-500/80 bg-rose-500/90 text-white shadow-lg backdrop-blur-sm transition hover:border-rose-500 hover:bg-rose-500"
                                aria-label="Stop recording"
                            >
                                <Square className="h-5 w-5 fill-white" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : videoBlob && videoUrl ? (
                <div className="space-y-3">
                    <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
                        <video
                            src={videoUrl}
                            controls
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleCancel}
                            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10"
                            aria-label="Cancel"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
