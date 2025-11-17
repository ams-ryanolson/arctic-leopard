import { Button } from '@/components/ui/button';
import { Loader2, Square, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type AudioRecorderProps = {
    onRecorded: (blob: Blob) => void;
    onCancel: () => void;
    onError?: (error: string) => void;
    maxDuration?: number; // in seconds, default 240
    autoStart?: boolean; // default true
};

export default function AudioRecorder({
    onRecorded,
    onCancel,
    onError,
    maxDuration = 240,
    autoStart = true,
}: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [waveformData, setWaveformData] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<number | undefined>(undefined);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const sessionIdRef = useRef<number>(0);
    const hasStartedRef = useRef(false);
    const isStartingRef = useRef(false);

    const formatRecordingTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const cleanup = useCallback(() => {
        if (recordingIntervalRef.current) {
            window.clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = undefined;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
        }
        analyserRef.current = null;
    }, []);

    const updateWaveform = useCallback(() => {
        if (!analyserRef.current) {
            return;
        }

        const analyser = analyserRef.current;
        const bufferLength = analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        const samples = 50;
        const step = Math.floor(bufferLength / samples);
        const waveform: number[] = [];

        for (let i = 0; i < samples; i++) {
            const index = i * step;
            let value = Math.abs((dataArray[index] - 128) / 128);
            value = Math.pow(value, 0.5);
            value = Math.min(1, value * 2);
            waveform.push(value);
        }

        setWaveformData(waveform);
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current) {
            const state = mediaRecorderRef.current.state;
            if (state === 'recording' || state === 'paused') {
                try {
                    mediaRecorderRef.current.requestData();
                } catch {
                    // Ignore error requesting final data
                }
                mediaRecorderRef.current.stop();
            }
            if (recordingIntervalRef.current) {
                window.clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = undefined;
            }
        }
    }, [isRecording]);

    const startRecording = useCallback(async () => {
        // Always ensure isInitializing is false if we're already recording
        if (isRecording) {
            setIsInitializing(false);
            return;
        }

        // Note: isInitializing should already be true from useEffect
        // Don't set it here to avoid race conditions

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            if (!window.MediaRecorder) {
                const errorMsg =
                    'Audio recording is not supported in this browser.';
                setError(errorMsg);
                onError?.(errorMsg);
                stream.getTracks().forEach((track) => track.stop());
                setIsInitializing(false);
                return;
            }

            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = 'audio/webm';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                mimeType = 'audio/ogg;codecs=opus';
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });

            const audioContext = new (window.AudioContext ||
                (
                    window as unknown as {
                        webkitAudioContext: typeof AudioContext;
                    }
                ).webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            const currentSessionId = sessionIdRef.current;
            audioChunksRef.current = [];
            setWaveformData(new Array(50).fill(0));

            mediaRecorder.ondataavailable = (event) => {
                if (currentSessionId !== sessionIdRef.current) {
                    return;
                }
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
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
                if (recordingIntervalRef.current) {
                    window.clearInterval(recordingIntervalRef.current);
                    recordingIntervalRef.current = undefined;
                }
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = undefined;
                }
                if (audioContextRef.current) {
                    audioContextRef.current.close().catch(console.error);
                    audioContextRef.current = null;
                }
                if (mediaStreamRef.current) {
                    mediaStreamRef.current
                        .getTracks()
                        .forEach((track) => track.stop());
                    mediaStreamRef.current = null;
                }
                analyserRef.current = null;
            };

            mediaRecorder.onstop = () => {
                if (currentSessionId !== sessionIdRef.current) {
                    return;
                }

                setTimeout(() => {
                    if (currentSessionId !== sessionIdRef.current) {
                        return;
                    }

                    if (audioChunksRef.current.length === 0) {
                        if (recordingTime > 0) {
                            const errorMsg =
                                'No audio was recorded. Please try again.';
                            setError(errorMsg);
                            onError?.(errorMsg);
                        }
                        setIsRecording(false);
                        setWaveformData([]);
                        cleanup();
                        return;
                    }

                    const totalSize = audioChunksRef.current.reduce(
                        (sum, chunk) => sum + chunk.size,
                        0,
                    );
                    if (totalSize === 0) {
                        if (recordingTime > 0) {
                            const errorMsg =
                                'No audio data was recorded. Please try again.';
                            setError(errorMsg);
                            onError?.(errorMsg);
                        }
                        setIsRecording(false);
                        setWaveformData([]);
                        audioChunksRef.current = [];
                        cleanup();
                        return;
                    }

                    const blob = new Blob(audioChunksRef.current, {
                        type: mediaRecorder.mimeType,
                    });

                    if (blob.size === 0) {
                        if (recordingTime > 0) {
                            const errorMsg =
                                'No audio data was recorded. Please try again.';
                            setError(errorMsg);
                            onError?.(errorMsg);
                        }
                        setIsRecording(false);
                        setWaveformData([]);
                        audioChunksRef.current = [];
                        cleanup();
                        return;
                    }

                    const url = URL.createObjectURL(blob);
                    setAudioBlob(blob);
                    setAudioUrl(url);
                    setIsRecording(false);
                    setWaveformData([]);

                    if (animationFrameRef.current) {
                        cancelAnimationFrame(animationFrameRef.current);
                        animationFrameRef.current = undefined;
                    }

                    cleanup();
                }, 100);
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaStreamRef.current = stream;

            mediaRecorder.start(100);

            // Wait a bit to ensure MediaRecorder has started
            await new Promise((resolve) => setTimeout(resolve, 150));

            if (mediaRecorder.state !== 'recording') {
                throw new Error(
                    `MediaRecorder did not start recording. State: ${mediaRecorder.state}`,
                );
            }

            // Update both states together - React batches these updates
            // Setting isRecording=true first makes the condition (isInitializing && !isRecording) false immediately
            setIsRecording(true);
            setRecordingTime(0);

            // Reset the starting flag
            isStartingRef.current = false;

            // Set isInitializing to false - this will hide the spinner
            setIsInitializing(false);

            recordingIntervalRef.current = window.setInterval(() => {
                setRecordingTime((prev) => {
                    const next = prev + 1;
                    if (next >= maxDuration) {
                        stopRecording();
                        return maxDuration;
                    }
                    return next;
                });
                if (
                    mediaRecorderRef.current &&
                    mediaRecorderRef.current.state === 'recording'
                ) {
                    try {
                        mediaRecorderRef.current.requestData();
                    } catch {
                        // Ignore error requesting data
                    }
                }
            }, 1000);

            requestAnimationFrame(() => {
                updateWaveform();
            });
        } catch (error) {
            const errorMsg =
                error instanceof Error
                    ? error.message
                    : 'Unable to access microphone. Please check your permissions.';

            // Always ensure isInitializing is set to false on error
            setIsInitializing(false);
            setIsRecording(false);

            // Clean up any resources
            cleanup();

            // Set error state
            setError(errorMsg);
            onError?.(errorMsg);

            // Reset refs so user can try again
            hasStartedRef.current = false;
            isStartingRef.current = false;
        }
    }, [
        isRecording,
        maxDuration,
        updateWaveform,
        stopRecording,
        recordingTime,
        onError,
        cleanup,
    ]); // cleanup is stable (empty deps)

    // Store startRecording in a ref to avoid dependency issues
    const startRecordingRef = useRef(startRecording);
    startRecordingRef.current = startRecording;

    const handleCancel = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
        cleanup();
        hasStartedRef.current = false;
        isStartingRef.current = false;
        setIsInitializing(false);
        setIsRecording(false);
        setRecordingTime(0);
        setWaveformData([]);
        setAudioBlob(null);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
        }
        setError(null);
        onCancel();
    }, [isRecording, audioUrl, cleanup, onCancel]);

    // Auto-start recording if autoStart is true
    useEffect(() => {
        // Skip if conditions aren't met
        if (
            !autoStart ||
            isRecording ||
            audioBlob ||
            hasStartedRef.current ||
            isStartingRef.current
        ) {
            return;
        }

        // Mark that we're starting to prevent re-runs
        isStartingRef.current = true;
        hasStartedRef.current = true;
        setIsInitializing(true);

        // Call startRecording directly instead of using setTimeout
        // This avoids cleanup issues
        const fn = startRecordingRef.current;
        if (fn) {
            void fn().catch((error) => {
                isStartingRef.current = false;
                setIsInitializing(false);
                setIsRecording(false);
                hasStartedRef.current = false;
                const errorMsg =
                    error instanceof Error
                        ? error.message
                        : 'Failed to start recording';
                setError(errorMsg);
                onError?.(errorMsg);
            });
        } else {
            isStartingRef.current = false;
            setIsInitializing(false);
            hasStartedRef.current = false;
        }
    }, [autoStart, isRecording, audioBlob]); // Removed onError - it's stable and we handle errors in the catch

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current) {
                const recorder = mediaRecorderRef.current;
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
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Expose recorded blob via callback when ready
    useEffect(() => {
        if (audioBlob && audioUrl && !isRecording) {
            onRecorded(audioBlob);
        }
    }, [audioBlob, audioUrl, isRecording, onRecorded]);

    const maxDurationFormatted = formatRecordingTime(maxDuration);

    return (
        <div className="space-y-3">
            {error && (
                <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
                    {error}
                </p>
            )}
            {isInitializing && !isRecording ? (
                <div className="flex h-[68px] items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
                    <span className="text-sm text-white/70">
                        Preparing audio recorder...
                    </span>
                </div>
            ) : isRecording ? (
                <div className="flex h-[68px] items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex-1">
                        <div className="flex h-12 items-center justify-center gap-0.5">
                            {waveformData.map((value, index) => {
                                const height = Math.max(3, value * 60);
                                return (
                                    <div
                                        key={index}
                                        className="rounded-full bg-rose-500 transition-all duration-75"
                                        style={{
                                            width: '3px',
                                            height: `${height}px`,
                                            minHeight: '3px',
                                            opacity: value > 0.05 ? 1 : 0.2,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="min-w-[3rem] text-right font-mono text-xs font-medium text-white/70">
                            {formatRecordingTime(recordingTime)} /{' '}
                            {maxDurationFormatted}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={stopRecording}
                            className="flex size-10 items-center justify-center rounded-full border border-rose-500/50 bg-rose-500/20 text-rose-400 transition hover:border-rose-500/70 hover:bg-rose-500/30"
                            aria-label="Stop recording"
                        >
                            <Square className="h-4 w-4 fill-rose-500" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleCancel}
                            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10"
                            aria-label="Cancel recording"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : audioBlob && audioUrl ? (
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex-1">
                        <audio src={audioUrl} controls className="h-10 w-full">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                    <div className="flex items-center gap-2">
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
