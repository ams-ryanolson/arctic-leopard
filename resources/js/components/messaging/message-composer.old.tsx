import http from '@/lib/http';
import type { FilePondFile } from 'filepond';
import { useRef, useState, useCallback, useEffect } from 'react';
import { Coins, Film, Image, Loader2, Mic, Paperclip, Smile, Square, Video, X } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import FilePondUploader from '@/components/filepond-uploader';
import type FilePond from 'react-filepond';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type UploadPayload = {
    id: string;
    filename?: string;
    original_name?: string;
    mime_type?: string;
    size?: number;
    url?: string | null;
    thumbnail_url?: string | null;
};

type MessagePreview = {
    id: number;
    body?: string | null;
    author?: {
        id?: number | null;
        display_name?: string | null;
        username?: string | null;
    } | null;
};

type MessageComposerProps = {
    conversationId: number | string;
    className?: string;
    onMessageSent?: (message: Record<string, unknown>) => void;
    replyTo?: MessagePreview | null;
    onCancelReply?: () => void;
    onTyping?: () => void;
    isConversationBlocked?: boolean;
    blockedMessage?: string;
    viewer: {
        id: number;
        display_name?: string | null;
        username?: string | null;
        avatar_url?: string | null;
    };
};

export default function MessageComposer({
    conversationId,
    className,
    onMessageSent,
    replyTo = null,
    onCancelReply,
    onTyping,
    isConversationBlocked = false,
    blockedMessage,
    viewer,
}: MessageComposerProps) {
    const [uploads, setUploads] = useState<UploadPayload[]>([]);
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const typingTimeoutRef = useRef<number | undefined>(undefined);
    const [isTyping, setIsTyping] = useState(false);
    const [isTipDialogOpen, setIsTipDialogOpen] = useState(false);
    const [tipMode, setTipMode] = useState<'send' | 'request'>('send');
    const [tipAmount, setTipAmount] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card-1');
    const [isProcessingTip, setIsProcessingTip] = useState(false);
    const [tipError, setTipError] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    const [isRecordingAudio, setIsRecordingAudio] = useState(false);
    const [isRecordingVideo, setIsRecordingVideo] = useState(false);
    const [showAudioRecorder, setShowAudioRecorder] = useState(false);
    const [showVideoRecorder, setShowVideoRecorder] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [videoRecordingTime, setVideoRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isUploadingAudio, setIsUploadingAudio] = useState(false);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [waveformData, setWaveformData] = useState<number[]>([]);
    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const videoRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const videoStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const videoChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<number | undefined>(undefined);
    const videoRecordingIntervalRef = useRef<number | undefined>(undefined);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
    const audioSessionIdRef = useRef<number>(0);
    const videoSessionIdRef = useRef<number>(0);
    
    const photoUploaderRef = useRef<FilePond>(null);
    const videoUploaderRef = useRef<FilePond>(null);

    const hasAttachments = uploads.length > 0;
    const bodyCharacterCount = body.trim().length;
    const isSendMode = tipMode === 'send';
    const parsedTipAmount =
        tipAmount.trim() === '' ? Number.NaN : Number.parseFloat(tipAmount.trim());
    const isValidTipAmount = Number.isFinite(parsedTipAmount) && parsedTipAmount > 0;
    const canConfirmTip =
        isValidTipAmount && (tipMode === 'request' || Boolean(selectedPaymentMethod));
    const blockedNotice =
        blockedMessage ??
        'This conversation is currently unavailable. One of you has restricted messaging, so new messages can’t be sent.';
    const paymentMethods = [
        {
            id: 'card-1',
            label: 'Visa •••• 4242',
            detail: 'Personal · Expires 09/27',
        },
        {
            id: 'wallet-1',
            label: 'Creator Wallet',
            detail: 'Available balance · $182.40',
        },
    ] as const;

    if (isConversationBlocked) {
        return (
            <div
                className={cn(
                    'rounded-3xl border border-white/15 bg-black/40 px-5 py-6 text-sm text-white/70 shadow-[0_20px_45px_-30px_rgba(255,255,255,0.45)] sm:px-6',
                    className,
                )}
            >
                <h3 className="text-base font-semibold text-white">Messaging unavailable</h3>
                <p className="mt-2 text-xs text-white/60 sm:text-sm">{blockedNotice}</p>
            </div>
        );
    }

    const triggerTyping = useCallback(() => {
        onTyping?.();

        setIsTyping((prev) => {
            if (!prev) {
                return true;
            }
            return prev;
        });

        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = window.setTimeout(() => {
            setIsTyping(false);
            typingTimeoutRef.current = undefined;
        }, 2400);
    }, [onTyping]);

    function handleProcess(file?: FilePondFile | null) {
        const payload = (file?.getMetadata?.('uploadPayload') ?? file?.getMetadata?.('upload')) as UploadPayload | undefined;

        if (!payload?.id) {
            return;
        }

        setUploads((previous) => [...previous.filter((item) => item.id !== payload.id), payload]);
        triggerTyping();
    }

    function handleRemove(file?: FilePondFile | null) {
        const payload = (file?.getMetadata?.('uploadPayload') ?? file?.getMetadata?.('upload')) as UploadPayload | undefined;

        if (!payload?.id) {
            return;
        }

        setUploads((previous) => previous.filter((item) => item.id !== payload.id));
        triggerTyping();
    }

    const resetTypingState = () => {
        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = undefined;
        }

        setIsTyping(false);
    };
    const resetTipState = () => {
        setTipAmount('');
        setTipMode('send');
        setSelectedPaymentMethod(paymentMethods[0]?.id ?? 'card-1');
        setTipError(null);
        setIsProcessingTip(false);
    };

    const handleEmojiClick = useCallback((emojiData: EmojiClickData) => {
        const emoji = emojiData.emoji;
        const textarea = textareaRef.current;
        
        setBody((prevBody) => {
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const textBefore = prevBody.substring(0, start);
                const textAfter = prevBody.substring(end);
                const newBody = textBefore + emoji + textAfter;
                
                // Restore cursor position after emoji
                setTimeout(() => {
                    if (textarea) {
                        textarea.focus();
                        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
                    }
                }, 0);
                
                return newBody;
            }
            
            return prevBody + emoji;
        });
        
        setShowEmojiPicker(false);
        triggerTyping();
    }, [triggerTyping]);

    const triggerPhotoUpload = useCallback(() => {
        const pond = photoUploaderRef.current;
        if (pond && typeof (pond as { browse?: () => void }).browse === 'function') {
            (pond as { browse: () => void }).browse();
        } else {
            // Fallback: find the input element within the photos uploader
            const wrapper = document.querySelector<HTMLElement>('[data-uploader="photos"]');
            const input = wrapper?.querySelector<HTMLInputElement>('input[type="file"]');
            input?.click();
        }
    }, []);

    const triggerVideoUpload = useCallback(() => {
        const pond = videoUploaderRef.current;
        if (pond && typeof (pond as { browse?: () => void }).browse === 'function') {
            (pond as { browse: () => void }).browse();
        } else {
            // Fallback: find the input element within the videos uploader
            const wrapper = document.querySelector<HTMLElement>('[data-uploader="videos"]');
            const input = wrapper?.querySelector<HTMLInputElement>('input[type="file"]');
            input?.click();
        }
    }, []);

    const updateWaveform = useCallback(() => {
        if (!analyserRef.current) {
            return;
        }

        const analyser = analyserRef.current;
        // For time domain, we use fftSize directly (which is the buffer length)
        const bufferLength = analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        // Use time domain data for waveform visualization
        analyser.getByteTimeDomainData(dataArray);

        // Convert to normalized values (0-1) and take a subset for visualization
        const samples = 50; // Number of bars in waveform
        const step = Math.floor(bufferLength / samples);
        const waveform: number[] = [];

        for (let i = 0; i < samples; i++) {
            const index = i * step;
            // Convert from 0-255 range to -1 to 1, then to 0-1 for visualization
            // Time domain data represents the amplitude at each point
            let value = Math.abs((dataArray[index] - 128) / 128);
            // Amplify the signal to make it more sensitive
            // Apply a power curve to make quiet sounds more visible
            value = Math.pow(value, 0.5); // Square root makes smaller values more visible
            // Amplify by 2x to increase sensitivity
            value = Math.min(1, value * 2);
            waveform.push(value);
        }

        setWaveformData(waveform);
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
    }, []);

    const startRecording = useCallback(async (event?: React.MouseEvent) => {
        console.log('🎤 [AUDIO] startRecording called', { 
            event: !!event, 
            isRecordingAudio, 
            sessionId: audioSessionIdRef.current 
        });
        
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        if (isRecordingAudio) {
            console.log('🎤 [AUDIO] Already recording, returning');
            return; // Already recording
        }
        
        try {
            console.log('🎤 [AUDIO] Requesting microphone access...');
            // Use default system microphone
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true // Uses default system microphone
            });
            console.log('🎤 [AUDIO] Got microphone stream', { 
                active: stream.active, 
                tracks: stream.getTracks().length,
                sessionId: audioSessionIdRef.current
            });
            
            // Check if MediaRecorder is supported
            if (!window.MediaRecorder) {
                console.error('🎤 [AUDIO] MediaRecorder not supported');
                setError('Audio recording is not supported in this browser.');
                stream.getTracks().forEach((track) => track.stop());
                return;
            }
            
            // Try to determine the best MIME type
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
            
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType,
            });
            
            // Validate that MediaRecorder was created successfully
            if (!mediaRecorder) {
                throw new Error('Failed to create MediaRecorder');
            }
            
            // Set up audio context for waveform visualization
            const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048; // Higher FFT size for smoother waveform
            analyser.smoothingTimeConstant = 0.8; // Smooth the waveform
            source.connect(analyser);
            
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            
            // Generate a new session ID for this recording
            const currentSessionId = audioSessionIdRef.current;
            console.log('🎤 [AUDIO] Setting up MediaRecorder with session ID', { 
                currentSessionId, 
                mimeType 
            });
            
            audioChunksRef.current = [];
            setWaveformData(new Array(50).fill(0));
            
            mediaRecorder.ondataavailable = (event) => {
                // Only process data if this is still the active session
                if (currentSessionId !== audioSessionIdRef.current) {
                    console.log('🎤 [AUDIO] ondataavailable IGNORED - session mismatch', {
                        handlerSessionId: currentSessionId,
                        currentSessionId: audioSessionIdRef.current,
                        dataSize: event.data?.size
                    });
                    return;
                }
                if (event.data && event.data.size > 0) {
                    console.log('🎤 [AUDIO] ondataavailable - chunk received', {
                        sessionId: currentSessionId,
                        size: event.data.size,
                        totalChunks: audioChunksRef.current.length + 1
                    });
                    audioChunksRef.current.push(event.data);
                }
            };
            
            mediaRecorder.onerror = (event) => {
                // Only process errors if this is still the active session
                if (currentSessionId !== audioSessionIdRef.current) {
                    console.log('🎤 [AUDIO] onerror IGNORED - session mismatch', {
                        handlerSessionId: currentSessionId,
                        currentSessionId: audioSessionIdRef.current
                    });
                    return;
                }
                console.error('🎤 [AUDIO] MediaRecorder error:', {
                    sessionId: currentSessionId,
                    event,
                    recorderState: mediaRecorder.state
                });
                setError('An error occurred while recording. Please try again.');
                setIsRecordingAudio(false);
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
                setShowAudioRecorder(false);
            };
            
            mediaRecorder.onstop = () => {
                // Check stream state when stop fires
                const streamStillActive = mediaStreamRef.current?.active ?? false;
                const tracksState = mediaStreamRef.current?.getTracks().map(t => ({
                    kind: t.kind,
                    readyState: t.readyState,
                    enabled: t.enabled,
                    muted: t.muted
                })) ?? [];
                
                console.log('🎤 [AUDIO] onstop FIRED', {
                    handlerSessionId: currentSessionId,
                    currentSessionId: audioSessionIdRef.current,
                    recorderState: mediaRecorder.state,
                    chunksCount: audioChunksRef.current.length,
                    isRecordingAudio,
                    recordingTime,
                    streamActive: streamStillActive,
                    streamId: mediaStreamRef.current?.id,
                    tracksState,
                    stack: new Error().stack
                });
                
                // Only process if this is still the active session
                if (currentSessionId !== audioSessionIdRef.current) {
                    console.log('🎤 [AUDIO] onstop IGNORED - session mismatch', {
                        handlerSessionId: currentSessionId,
                        currentSessionId: audioSessionIdRef.current,
                        reason: 'Session ID changed - new recording started'
                    });
                    return;
                }
                
                console.log('🎤 [AUDIO] onstop PROCESSING - valid session', {
                    sessionId: currentSessionId,
                    chunksCount: audioChunksRef.current.length,
                    chunksSize: audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0),
                    recordingTime
                });
                
                // Small delay to ensure all chunks are collected
                setTimeout(() => {
                    console.log('🎤 [AUDIO] onstop setTimeout callback', {
                        handlerSessionId: currentSessionId,
                        currentSessionId: audioSessionIdRef.current,
                        chunksCount: audioChunksRef.current.length
                    });
                    
                    // Double-check session ID after delay (session might have changed)
                    if (currentSessionId !== audioSessionIdRef.current) {
                        console.log('🎤 [AUDIO] onstop IGNORED - session changed during delay', {
                            handlerSessionId: currentSessionId,
                            currentSessionId: audioSessionIdRef.current
                        });
                        return;
                    }
                    
                    // Only process if we have chunks (indicates recording actually happened)
                    if (audioChunksRef.current.length === 0) {
                        console.log('🎤 [AUDIO] No chunks collected', {
                            sessionId: currentSessionId,
                            recordingTime,
                            willShowError: recordingTime > 0
                        });
                        // Only show error if recording time was > 0 (actual recording happened)
                        if (recordingTime > 0) {
                            console.warn('🎤 [AUDIO] No audio data recorded - showing error');
                            setError('No audio was recorded. Please try again.');
                        } else {
                            console.log('🎤 [AUDIO] No chunks but recordingTime is 0 - not showing error');
                        }
                        setIsRecordingAudio(false);
                        setWaveformData([]);
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
                        // Don't close the recorder, let user try again
                        return;
                    }
                    
                    const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
                    if (totalSize === 0) {
                        if (recordingTime > 0) {
                            console.warn('Audio chunks have no data');
                            setError('No audio data was recorded. Please try again.');
                        }
                        setIsRecordingAudio(false);
                        setWaveformData([]);
                        audioChunksRef.current = [];
                        // Don't close the recorder, let user try again
                        return;
                    }
                    
                    const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
                    console.log('Created audio blob', { size: blob.size, type: blob.type });
                    
                    if (blob.size === 0) {
                        if (recordingTime > 0) {
                            console.warn('Audio blob is empty');
                            setError('No audio data was recorded. Please try again.');
                        }
                        setIsRecordingAudio(false);
                        setWaveformData([]);
                        audioChunksRef.current = [];
                        // Don't close the recorder, let user try again
                        return;
                    }
                    
                    const url = URL.createObjectURL(blob);
                    setAudioBlob(blob);
                    setAudioUrl(url);
                    setIsRecordingAudio(false);
                    setWaveformData([]);
                    
                    // Stop waveform animation
                    if (animationFrameRef.current) {
                        cancelAnimationFrame(animationFrameRef.current);
                        animationFrameRef.current = undefined;
                    }
                    
                    // Clean up audio context
                    if (audioContextRef.current) {
                        audioContextRef.current.close().catch(console.error);
                        audioContextRef.current = null;
                    }
                    analyserRef.current = null;
                    
                    // Stop all tracks to release microphone
                    if (mediaStreamRef.current) {
                        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
                        mediaStreamRef.current = null;
                    }
                }, 100);
            };
            
            mediaRecorderRef.current = mediaRecorder;
            mediaStreamRef.current = stream;
            
            // Add stream event listeners to track stream lifecycle
            stream.getTracks().forEach((track) => {
                track.addEventListener('ended', () => {
                    console.log('🎤 [AUDIO] Stream track ended', {
                        sessionId: currentSessionId,
                        kind: track.kind,
                        readyState: track.readyState,
                        enabled: track.enabled,
                        muted: track.muted
                    });
                });
                track.addEventListener('mute', () => {
                    console.log('🎤 [AUDIO] Stream track muted', {
                        sessionId: currentSessionId,
                        kind: track.kind
                    });
                });
                track.addEventListener('unmute', () => {
                    console.log('🎤 [AUDIO] Stream track unmuted', {
                        sessionId: currentSessionId,
                        kind: track.kind
                    });
                });
            });
            
            console.log('🎤 [AUDIO] Starting MediaRecorder...', {
                sessionId: currentSessionId,
                state: mediaRecorder.state,
                mimeType: mediaRecorder.mimeType,
                streamActive: stream.active,
                streamId: stream.id
            });
            
            // Start recording with timeslice to get periodic data chunks
            // This ensures we get data even if recording is stopped immediately
            // Use a smaller timeslice (100ms) to get data very frequently
            try {
                mediaRecorder.start(100); // Get data every 100ms
                console.log('🎤 [AUDIO] mediaRecorder.start() succeeded immediately', {
                    sessionId: currentSessionId,
                    state: mediaRecorder.state
                });
            } catch (startError) {
                console.error('🎤 [AUDIO] mediaRecorder.start() threw error', {
                    sessionId: currentSessionId,
                    error: startError,
                    state: mediaRecorder.state
                });
                throw startError;
            }
            
            console.log('🎤 [AUDIO] mediaRecorder.start() called', {
                sessionId: currentSessionId,
                state: mediaRecorder.state
            });
            
            // Wait a moment to verify recording started
            await new Promise((resolve) => setTimeout(resolve, 100));
            
            // Verify recording started
            if (mediaRecorder.state !== 'recording') {
                console.error('🎤 [AUDIO] Recording failed to start', {
                    sessionId: currentSessionId,
                    state: mediaRecorder.state
                });
                throw new Error(`MediaRecorder did not start recording. State: ${mediaRecorder.state}`);
            }
            
            console.log('🎤 [AUDIO] Recording started successfully', {
                sessionId: currentSessionId,
                state: mediaRecorder.state,
                mimeType: mediaRecorder.mimeType,
                streamActive: stream.active,
            });
            
            console.log('🎤 [AUDIO] Setting state to recording=true');
            setIsRecordingAudio(true);
            setRecordingTime(0);
            
            // Start timer with 240 second limit for audio
            const MAX_AUDIO_SECONDS = 240;
            recordingIntervalRef.current = window.setInterval(() => {
                setRecordingTime((prev) => {
                    const next = prev + 1;
                    // Auto-stop at 240 seconds
                    if (next >= MAX_AUDIO_SECONDS) {
                        stopRecording();
                        return MAX_AUDIO_SECONDS;
                    }
                    return next;
                });
                // Request data periodically to ensure we have chunks
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    try {
                        mediaRecorderRef.current.requestData();
                    } catch (e) {
                        console.warn('Error requesting data:', e);
                    }
                }
            }, 1000);
            
            // Start waveform visualization after a small delay to ensure state is set
            requestAnimationFrame(() => {
                updateWaveform();
            });
        } catch (error) {
            console.error('🎤 [AUDIO] Error starting audio recording:', {
                sessionId: audioSessionIdRef.current,
                error,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
            setError(error instanceof Error ? error.message : 'Unable to access microphone. Please check your permissions.');
            
            // Clean up on error
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach((track) => track.stop());
                mediaStreamRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(console.error);
                audioContextRef.current = null;
            }
            analyserRef.current = null;
            setIsRecordingAudio(false);
        }
    }, [isRecordingAudio, updateWaveform]);

    const stopRecording = useCallback(() => {
        console.log('🎤 [AUDIO] stopRecording called', {
            hasRecorder: !!mediaRecorderRef.current,
            state: mediaRecorderRef.current?.state,
            sessionId: audioSessionIdRef.current,
            isRecordingAudio
        });
        
        if (mediaRecorderRef.current) {
            const state = mediaRecorderRef.current.state;
            console.log('🎤 [AUDIO] Stopping recorder', { state, sessionId: audioSessionIdRef.current });
            if (state === 'recording' || state === 'paused') {
                // Request final data before stopping
                try {
                    mediaRecorderRef.current.requestData();
                    console.log('🎤 [AUDIO] Requested final data');
                } catch (e) {
                    console.warn('🎤 [AUDIO] Error requesting final data:', e);
                }
                mediaRecorderRef.current.stop();
                console.log('🎤 [AUDIO] Called stop() on recorder');
            }
            if (recordingIntervalRef.current) {
                window.clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = undefined;
            }
        }
    }, []);

    const cancelRecording = useCallback(() => {
        console.log('🎤 [AUDIO] cancelRecording called', {
            hasRecorder: !!mediaRecorderRef.current,
            isRecordingAudio,
            sessionId: audioSessionIdRef.current
        });
        
        if (mediaRecorderRef.current && isRecordingAudio) {
            console.log('🎤 [AUDIO] Stopping recorder in cancelRecording');
            mediaRecorderRef.current.stop();
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
        }
        if (recordingIntervalRef.current) {
            window.clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = undefined;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        analyserRef.current = null;
        setIsRecordingAudio(false);
        setRecordingTime(0);
        setWaveformData([]);
        setAudioBlob(null);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
        }
        setShowAudioRecorder(false);
    }, [isRecordingAudio, audioUrl]);

    const handleAudioButtonClick = useCallback(async () => {
        console.log('🎤 [AUDIO] handleAudioButtonClick called', {
            showVideoRecorder,
            showAudioRecorder,
            isRecordingAudio,
            isRecordingVideo,
            currentSessionId: audioSessionIdRef.current,
            hasMediaRecorder: !!mediaRecorderRef.current
        });
        
        // Close video recorder if open
        if (showVideoRecorder) {
            console.log('🎤 [AUDIO] Closing video recorder');
            if (videoRecorderRef.current && isRecordingVideo) {
                videoRecorderRef.current.stop();
            }
            if (videoStreamRef.current) {
                videoStreamRef.current.getTracks().forEach((track) => track.stop());
                videoStreamRef.current = null;
            }
            if (videoRecordingIntervalRef.current) {
                window.clearInterval(videoRecordingIntervalRef.current);
                videoRecordingIntervalRef.current = undefined;
            }
            if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = null;
            }
            setIsRecordingVideo(false);
            setVideoRecordingTime(0);
            setVideoBlob(null);
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
                setVideoUrl(null);
            }
            setShowVideoRecorder(false);
        }
        
        // Stop any existing audio recording first
        if (mediaRecorderRef.current) {
            console.log('🎤 [AUDIO] Stopping existing recorder', {
                state: mediaRecorderRef.current.state,
                isRecordingAudio,
                oldSessionId: audioSessionIdRef.current
            });
            
            // Remove event handlers to prevent them from firing
            const oldRecorder = mediaRecorderRef.current;
            console.log('🎤 [AUDIO] Removing event handlers from old recorder');
            oldRecorder.ondataavailable = null;
            oldRecorder.onstop = null;
            oldRecorder.onerror = null;
            
            if (isRecordingAudio) {
                console.log('🎤 [AUDIO] Calling stop() on old recorder');
                oldRecorder.stop();
            }
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach((track) => track.stop());
                mediaStreamRef.current = null;
            }
            if (recordingIntervalRef.current) {
                window.clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = undefined;
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = undefined;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            analyserRef.current = null;
        }
        
        // Increment session ID to invalidate any pending handlers
        const newSessionId = audioSessionIdRef.current + 1;
        audioSessionIdRef.current = newSessionId;
        console.log('🎤 [AUDIO] Session ID incremented', {
            newSessionId,
            previousSessionId: newSessionId - 1
        });
        
        // Clear any existing audio data
        setAudioBlob(null);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
        }
        setRecordingTime(0);
        setIsRecordingAudio(false);
        setWaveformData([]);
        audioChunksRef.current = [];
        mediaRecorderRef.current = null; // Clear the ref to prevent old handlers from firing
        
        console.log('🎤 [AUDIO] Setting showAudioRecorder=true');
        setShowAudioRecorder(true);
        setError(null);
        setBody(''); // Clear text when starting audio
        
        // Auto-start recording
        // Use setTimeout to ensure state is updated first
        console.log('🎤 [AUDIO] Scheduling startRecording in 100ms', {
            sessionId: audioSessionIdRef.current
        });
        setTimeout(() => {
            console.log('🎤 [AUDIO] setTimeout callback - calling startRecording', {
                sessionId: audioSessionIdRef.current,
                isRecordingAudio
            });
            void startRecording();
        }, 100);
    }, [audioUrl, showVideoRecorder, videoUrl, isRecordingVideo, isRecordingAudio, startRecording]);

    // Get available cameras
    const getAvailableCameras = useCallback(async () => {
        try {
            // Request permission first to get device labels
            try {
                await navigator.mediaDevices.getUserMedia({ video: true });
            } catch {
                // Permission denied, but we can still enumerate devices
            }
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter((device) => device.kind === 'videoinput');
            setAvailableCameras(cameras);
            
            // Set default camera if none selected
            if (!selectedCameraId && cameras.length > 0) {
                setSelectedCameraId(cameras[0].deviceId);
            }
        } catch (error) {
            console.error('Error getting cameras:', error);
        }
    }, [selectedCameraId]);

    // Video recording functions - must be before handleVideoButtonClick
    const stopVideoRecording = useCallback(() => {
        console.log('📹 [VIDEO] stopVideoRecording called', {
            hasRecorder: !!videoRecorderRef.current,
            state: videoRecorderRef.current?.state,
            sessionId: videoSessionIdRef.current,
            isRecordingVideo
        });
        
        if (videoRecorderRef.current && isRecordingVideo) {
            console.log('📹 [VIDEO] Stopping recorder', {
                state: videoRecorderRef.current.state,
                sessionId: videoSessionIdRef.current
            });
            videoRecorderRef.current.stop();
            console.log('📹 [VIDEO] Called stop() on recorder');
        }
        if (videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach((track) => track.stop());
            videoStreamRef.current = null;
        }
        if (videoRecordingIntervalRef.current) {
            window.clearInterval(videoRecordingIntervalRef.current);
            videoRecordingIntervalRef.current = undefined;
        }
        if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = null;
        }
        setIsRecordingVideo(false);
        setVideoRecordingTime(0);
    }, [isRecordingVideo]);

    const startVideoRecording = useCallback(async (event?: React.MouseEvent) => {
        console.log('📹 [VIDEO] startVideoRecording called', {
            event: !!event,
            isRecordingVideo,
            sessionId: videoSessionIdRef.current,
            selectedCameraId
        });
        
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        if (isRecordingVideo) {
            console.log('📹 [VIDEO] Already recording, returning');
            return;
        }
        
        try {
            console.log('📹 [VIDEO] Requesting camera access...');
            const videoConstraints: MediaTrackConstraints = {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            };
            
            // Use selected camera if available, otherwise use default facingMode
            if (selectedCameraId) {
                videoConstraints.deviceId = { exact: selectedCameraId };
            } else {
                videoConstraints.facingMode = 'user';
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: videoConstraints,
                audio: true // Use default system microphone
            });
            console.log('📹 [VIDEO] Got camera stream', {
                active: stream.active,
                tracks: stream.getTracks().length,
                videoTracks: stream.getVideoTracks().length,
                audioTracks: stream.getAudioTracks().length,
                sessionId: videoSessionIdRef.current
            });
            
            if (!window.MediaRecorder) {
                console.error('📹 [VIDEO] MediaRecorder not supported');
                setError('Video recording is not supported in this browser.');
                stream.getTracks().forEach((track) => track.stop());
                return;
            }
            
            let mimeType = 'video/webm';
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
                mimeType = 'video/webm;codecs=vp9,opus';
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
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
            
            // Set up video preview - use setTimeout to ensure DOM is ready
            setTimeout(() => {
                if (videoPreviewRef.current && stream) {
                    console.log('📹 [VIDEO] Setting up video preview', {
                        sessionId: currentSessionId,
                        streamActive: stream.active,
                        hasVideoTracks: stream.getVideoTracks().length > 0
                    });
                    videoPreviewRef.current.srcObject = stream;
                    videoPreviewRef.current.muted = true;
                    videoPreviewRef.current.autoplay = true;
                    videoPreviewRef.current.playsInline = true;
                    videoPreviewRef.current.play().then(() => {
                        console.log('📹 [VIDEO] Video preview playing');
                    }).catch((error) => {
                        console.error('📹 [VIDEO] Error playing video preview:', error);
                    });
                }
            }, 100);
            
            // Generate a new session ID for this recording
            const currentSessionId = videoSessionIdRef.current;
            console.log('📹 [VIDEO] Setting up MediaRecorder with session ID', {
                currentSessionId,
                mimeType
            });
            
            videoChunksRef.current = [];
            
            mediaRecorder.ondataavailable = (event) => {
                // Only process data if this is still the active session
                if (currentSessionId !== videoSessionIdRef.current) {
                    console.log('📹 [VIDEO] ondataavailable IGNORED - session mismatch', {
                        handlerSessionId: currentSessionId,
                        currentSessionId: videoSessionIdRef.current,
                        dataSize: event.data?.size
                    });
                    return;
                }
                if (event.data && event.data.size > 0) {
                    console.log('📹 [VIDEO] ondataavailable - chunk received', {
                        sessionId: currentSessionId,
                        size: event.data.size,
                        totalChunks: videoChunksRef.current.length + 1
                    });
                    videoChunksRef.current.push(event.data);
                }
            };
            
            mediaRecorder.onerror = (event) => {
                // Only process errors if this is still the active session
                if (currentSessionId !== videoSessionIdRef.current) {
                    console.log('📹 [VIDEO] onerror IGNORED - session mismatch', {
                        handlerSessionId: currentSessionId,
                        currentSessionId: videoSessionIdRef.current
                    });
                    return;
                }
                console.error('📹 [VIDEO] MediaRecorder error:', {
                    sessionId: currentSessionId,
                    event,
                    recorderState: mediaRecorder.state
                });
                setError('An error occurred while recording. Please try again.');
                setIsRecordingVideo(false);
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
                setShowVideoRecorder(false);
            };
            
            mediaRecorder.onstop = () => {
                // Check stream state when stop fires
                const streamStillActive = videoStreamRef.current?.active ?? false;
                const tracksState = videoStreamRef.current?.getTracks().map(t => ({
                    kind: t.kind,
                    readyState: t.readyState,
                    enabled: t.enabled,
                    muted: t.muted
                })) ?? [];
                
                console.log('📹 [VIDEO] onstop FIRED', {
                    handlerSessionId: currentSessionId,
                    currentSessionId: videoSessionIdRef.current,
                    recorderState: mediaRecorder.state,
                    chunksCount: videoChunksRef.current.length,
                    isRecordingVideo,
                    videoRecordingTime,
                    streamActive: streamStillActive,
                    streamId: videoStreamRef.current?.id,
                    tracksState,
                    stack: new Error().stack
                });
                
                // Only process if this is still the active session
                if (currentSessionId !== videoSessionIdRef.current) {
                    console.log('📹 [VIDEO] onstop IGNORED - session mismatch', {
                        handlerSessionId: currentSessionId,
                        currentSessionId: videoSessionIdRef.current,
                        reason: 'Session ID changed - new recording started'
                    });
                    return;
                }
                
                console.log('📹 [VIDEO] onstop PROCESSING - valid session', {
                    sessionId: currentSessionId,
                    chunksCount: videoChunksRef.current.length,
                    chunksSize: videoChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0),
                    videoRecordingTime
                });
                
                // Small delay to ensure all chunks are collected
                setTimeout(() => {
                    console.log('📹 [VIDEO] onstop setTimeout callback', {
                        handlerSessionId: currentSessionId,
                        currentSessionId: videoSessionIdRef.current,
                        chunksCount: videoChunksRef.current.length
                    });
                    
                    // Double-check session ID after delay (session might have changed)
                    if (currentSessionId !== videoSessionIdRef.current) {
                        console.log('📹 [VIDEO] onstop IGNORED - session changed during delay', {
                            handlerSessionId: currentSessionId,
                            currentSessionId: videoSessionIdRef.current
                        });
                        return;
                    }
                    
                    // Only process if we have chunks (indicates recording actually happened)
                    if (videoChunksRef.current.length === 0) {
                        console.log('📹 [VIDEO] No chunks collected', {
                            sessionId: currentSessionId,
                            videoRecordingTime,
                            willShowError: videoRecordingTime > 0
                        });
                        // Only show error if recording time was > 0 (actual recording happened)
                        if (videoRecordingTime > 0) {
                            console.warn('📹 [VIDEO] No video data recorded - showing error');
                            setError('No video was recorded. Please try again.');
                        } else {
                            console.log('📹 [VIDEO] No chunks but videoRecordingTime is 0 - not showing error');
                        }
                        setIsRecordingVideo(false);
                        videoChunksRef.current = [];
                        return;
                    }
                    
                    const totalSize = videoChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
                    console.log('📹 [VIDEO] Processing video chunks', {
                        sessionId: currentSessionId,
                        chunksCount: videoChunksRef.current.length,
                        totalSize
                    });
                    
                    if (totalSize === 0) {
                        if (videoRecordingTime > 0) {
                            console.warn('📹 [VIDEO] Video chunks have no data - showing error');
                            setError('No video data was recorded. Please try again.');
                        }
                        setIsRecordingVideo(false);
                        videoChunksRef.current = [];
                        return;
                    }
                    
                    const blob = new Blob(videoChunksRef.current, { type: mediaRecorder.mimeType });
                    console.log('📹 [VIDEO] Created video blob', {
                        sessionId: currentSessionId,
                        size: blob.size,
                        type: blob.type
                    });
                    
                    if (blob.size === 0) {
                        if (videoRecordingTime > 0) {
                            console.warn('📹 [VIDEO] Video blob is empty - showing error');
                            setError('No video data was recorded. Please try again.');
                        }
                        setIsRecordingVideo(false);
                        videoChunksRef.current = [];
                        return;
                    }
                    
                    const url = URL.createObjectURL(blob);
                    console.log('📹 [VIDEO] Setting video blob and URL', {
                        sessionId: currentSessionId,
                        blobSize: blob.size
                    });
                    setVideoBlob(blob);
                    setVideoUrl(url);
                    setIsRecordingVideo(false);
                    
                    // Stop video preview
                    if (videoPreviewRef.current) {
                        videoPreviewRef.current.srcObject = null;
                    }
                    
                    if (videoStreamRef.current) {
                        videoStreamRef.current.getTracks().forEach((track) => track.stop());
                        videoStreamRef.current = null;
                    }
                }, 100);
            };
            
            videoRecorderRef.current = mediaRecorder;
            videoStreamRef.current = stream;
            
            // Add stream event listeners to track stream lifecycle
            stream.getTracks().forEach((track) => {
                track.addEventListener('ended', () => {
                    console.log('📹 [VIDEO] Stream track ended', {
                        sessionId: currentSessionId,
                        kind: track.kind,
                        readyState: track.readyState,
                        enabled: track.enabled,
                        muted: track.muted
                    });
                });
                track.addEventListener('mute', () => {
                    console.log('📹 [VIDEO] Stream track muted', {
                        sessionId: currentSessionId,
                        kind: track.kind
                    });
                });
                track.addEventListener('unmute', () => {
                    console.log('📹 [VIDEO] Stream track unmuted', {
                        sessionId: currentSessionId,
                        kind: track.kind
                    });
                });
            });
            
            console.log('📹 [VIDEO] Starting MediaRecorder...', {
                sessionId: currentSessionId,
                state: mediaRecorder.state,
                mimeType: mediaRecorder.mimeType,
                streamActive: stream.active,
                streamId: stream.id
            });
            
            try {
                mediaRecorder.start(100);
                console.log('📹 [VIDEO] mediaRecorder.start() succeeded immediately', {
                    sessionId: currentSessionId,
                    state: mediaRecorder.state
                });
            } catch (startError) {
                console.error('📹 [VIDEO] mediaRecorder.start() threw error', {
                    sessionId: currentSessionId,
                    error: startError,
                    state: mediaRecorder.state
                });
                throw startError;
            }
            
            console.log('📹 [VIDEO] mediaRecorder.start() called', {
                sessionId: currentSessionId,
                state: mediaRecorder.state
            });
            
            await new Promise((resolve) => setTimeout(resolve, 100));
            
            // Verify recording started
            if (mediaRecorder.state !== 'recording') {
                console.error('📹 [VIDEO] Recording failed to start', {
                    sessionId: currentSessionId,
                    state: mediaRecorder.state
                });
                throw new Error(`MediaRecorder did not start recording. State: ${mediaRecorder.state}`);
            }
            
            console.log('📹 [VIDEO] Recording started successfully', {
                sessionId: currentSessionId,
                state: mediaRecorder.state,
                mimeType: mediaRecorder.mimeType,
                streamActive: stream.active
            });
            
            console.log('📹 [VIDEO] Setting state to recording=true');
            setIsRecordingVideo(true);
            setVideoRecordingTime(0);
            
            // Start timer with 60 second limit for video
            const MAX_VIDEO_SECONDS = 60;
            videoRecordingIntervalRef.current = window.setInterval(() => {
                setVideoRecordingTime((prev) => {
                    const next = prev + 1;
                    if (next >= MAX_VIDEO_SECONDS) {
                        stopVideoRecording();
                        return MAX_VIDEO_SECONDS;
                    }
                    return next;
                });
                if (videoRecorderRef.current && videoRecorderRef.current.state === 'recording') {
                    try {
                        videoRecorderRef.current.requestData();
                    } catch (e) {
                        console.warn('Error requesting data:', e);
                    }
                }
            }, 1000);
        } catch (error) {
            console.error('📹 [VIDEO] Error starting video recording:', {
                sessionId: videoSessionIdRef.current,
                error,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
            setError(error instanceof Error ? error.message : 'Failed to start video recording. Please check camera permissions.');
            setIsRecordingVideo(false);
            if (videoStreamRef.current) {
                videoStreamRef.current.getTracks().forEach((track) => track.stop());
                videoStreamRef.current = null;
            }
            setShowVideoRecorder(false);
        }
    }, [isRecordingVideo, selectedCameraId, stopVideoRecording]);

    const handleVideoButtonClick = useCallback(async () => {
        console.log('📹 [VIDEO] handleVideoButtonClick called', {
            showVideoRecorder,
            showAudioRecorder,
            isRecordingAudio,
            isRecordingVideo,
            currentSessionId: videoSessionIdRef.current,
            hasVideoRecorder: !!videoRecorderRef.current
        });
        
        // Close audio recorder if open
        if (showAudioRecorder) {
            console.log('📹 [VIDEO] Closing audio recorder');
            if (mediaRecorderRef.current && isRecordingAudio) {
                mediaRecorderRef.current.stop();
            }
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach((track) => track.stop());
                mediaStreamRef.current = null;
            }
            if (recordingIntervalRef.current) {
                window.clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = undefined;
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = undefined;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            analyserRef.current = null;
            setIsRecordingAudio(false);
            setRecordingTime(0);
            setWaveformData([]);
            setAudioBlob(null);
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
                setAudioUrl(null);
            }
            setShowAudioRecorder(false);
        }
        
        // Stop any existing video recording first
        if (videoRecorderRef.current) {
            console.log('📹 [VIDEO] Stopping existing recorder', {
                state: videoRecorderRef.current.state,
                isRecordingVideo,
                oldSessionId: videoSessionIdRef.current
            });
            
            // Remove event handlers to prevent them from firing
            const oldRecorder = videoRecorderRef.current;
            console.log('📹 [VIDEO] Removing event handlers from old recorder');
            oldRecorder.ondataavailable = null;
            oldRecorder.onstop = null;
            oldRecorder.onerror = null;
            
            if (isRecordingVideo) {
                console.log('📹 [VIDEO] Calling stop() on old recorder');
                oldRecorder.stop();
            }
            if (videoStreamRef.current) {
                videoStreamRef.current.getTracks().forEach((track) => track.stop());
                videoStreamRef.current = null;
            }
            if (videoRecordingIntervalRef.current) {
                window.clearInterval(videoRecordingIntervalRef.current);
                videoRecordingIntervalRef.current = undefined;
            }
            if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = null;
            }
        }
        
        // Increment session ID to invalidate any pending handlers
        const newSessionId = videoSessionIdRef.current + 1;
        videoSessionIdRef.current = newSessionId;
        console.log('📹 [VIDEO] Session ID incremented', {
            newSessionId,
            previousSessionId: newSessionId - 1
        });
        
        // Clear any existing video data
        setVideoBlob(null);
        if (videoUrl) {
            URL.revokeObjectURL(videoUrl);
            setVideoUrl(null);
        }
        setVideoRecordingTime(0);
        setIsRecordingVideo(false);
        videoChunksRef.current = [];
        videoRecorderRef.current = null; // Clear the ref to prevent old handlers from firing
        
        console.log('📹 [VIDEO] Setting showVideoRecorder=true');
        setShowVideoRecorder(true);
        setError(null);
        setBody(''); // Clear text when starting video
        
        // Get available cameras first
        console.log('📹 [VIDEO] Getting available cameras...');
        await getAvailableCameras();
        console.log('📹 [VIDEO] Available cameras:', availableCameras.length);
        
        // Auto-start recording after a brief delay to ensure state is updated
        console.log('📹 [VIDEO] Scheduling startVideoRecording in 200ms', {
            sessionId: videoSessionIdRef.current
        });
        setTimeout(() => {
            console.log('📹 [VIDEO] setTimeout callback - calling startVideoRecording', {
                sessionId: videoSessionIdRef.current,
                isRecordingVideo
            });
            void startVideoRecording();
        }, 200);
    }, [videoUrl, showAudioRecorder, audioUrl, isRecordingAudio, isRecordingVideo, getAvailableCameras, startVideoRecording]);

    // Cleanup on unmount only - don't include state variables that change during recording
    // This prevents cleanup from running every time isRecordingAudio/isRecordingVideo changes
    useEffect(() => {
        return () => {
            console.log('🧹 [CLEANUP] Component unmounting - cleaning up all resources', {
                hasAudioRecorder: !!mediaRecorderRef.current,
                hasVideoRecorder: !!videoRecorderRef.current,
                audioRecorderState: mediaRecorderRef.current?.state,
                videoRecorderState: videoRecorderRef.current?.state,
            });
            
            // Always cleanup audio on unmount - the component is being destroyed
            if (mediaRecorderRef.current) {
                console.log('🧹 [CLEANUP] Stopping audio recorder');
                const recorder = mediaRecorderRef.current;
                // Remove handlers to prevent side effects
                recorder.ondataavailable = null;
                recorder.onstop = null;
                recorder.onerror = null;
                if (recorder.state === 'recording' || recorder.state === 'paused') {
                    recorder.stop();
                }
            }
            if (mediaStreamRef.current) {
                console.log('🧹 [CLEANUP] Stopping audio stream tracks');
                mediaStreamRef.current.getTracks().forEach((track) => track.stop());
                mediaStreamRef.current = null;
            }
            if (recordingIntervalRef.current) {
                window.clearInterval(recordingIntervalRef.current);
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(console.error);
                audioContextRef.current = null;
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            
            // Always cleanup video on unmount - the component is being destroyed
            if (videoRecorderRef.current) {
                console.log('🧹 [CLEANUP] Stopping video recorder');
                const recorder = videoRecorderRef.current;
                // Remove handlers to prevent side effects
                recorder.ondataavailable = null;
                recorder.onstop = null;
                recorder.onerror = null;
                if (recorder.state === 'recording' || recorder.state === 'paused') {
                    recorder.stop();
                }
            }
            if (videoStreamRef.current) {
                console.log('🧹 [CLEANUP] Stopping video stream tracks');
                videoStreamRef.current.getTracks().forEach((track) => track.stop());
                videoStreamRef.current = null;
            }
            if (videoRecordingIntervalRef.current) {
                window.clearInterval(videoRecordingIntervalRef.current);
            }
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
            if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = null;
            }
        };
        // Empty dependency array - only run cleanup on unmount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Watch for video stream changes and attach to video element
    useEffect(() => {
        if (isRecordingVideo && videoStreamRef.current && videoPreviewRef.current) {
            const stream = videoStreamRef.current;
            const video = videoPreviewRef.current;
            
            console.log('📹 [VIDEO] useEffect: Attaching stream to video element', {
                streamActive: stream.active,
                hasVideoTracks: stream.getVideoTracks().length > 0,
                videoElement: !!video
            });
            
            video.srcObject = stream;
            video.muted = true;
            video.autoplay = true;
            video.playsInline = true;
            
            video.play().then(() => {
                console.log('📹 [VIDEO] useEffect: Video preview started playing');
            }).catch((error) => {
                console.error('📹 [VIDEO] useEffect: Error playing video:', error);
            });
            
            // Cleanup function
            return () => {
                if (video.srcObject) {
                    console.log('📹 [VIDEO] useEffect cleanup: Clearing video srcObject');
                    video.srcObject = null;
                }
            };
        }
    }, [isRecordingVideo]);

    const sendAudioMessage = useCallback(async () => {
        if (!audioBlob || isUploadingAudio) {
            return;
        }

        // Validate audio blob has content
        if (audioBlob.size === 0) {
            setError('Audio clip is empty. Please record again.');
            return;
        }

        setIsUploadingAudio(true);
        setError(null);

        try {
            // Create a File from the Blob
            const file = new File([audioBlob], `audio-clip-${Date.now()}.webm`, {
                type: audioBlob.type || 'audio/webm',
            });
            
            console.log('Sending audio message', { size: file.size, type: file.type });

            // Upload the audio file as a temporary upload
            const formData = new FormData();
            formData.append('file', file);

            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
            const uploadResponse = await http.post('/uploads/tmp', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken, 'X-XSRF-TOKEN': csrfToken } : {}),
                },
            });

            const uploadPayload = uploadResponse.data as UploadPayload;

            if (!uploadPayload?.id) {
                throw new Error('Failed to upload audio');
            }

            // Send message with audio attachment only (no body)
            const response = await http.post(`/api/conversations/${conversationId}/messages`, {
                body: '',
                attachments: [uploadPayload],
                ...(replyTo ? { reply_to_id: replyTo.id } : {}),
            });

            const payload = response.data?.data ?? response.data;

            // Clean up
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            setAudioBlob(null);
            setAudioUrl(null);
            setRecordingTime(0);
            setBody('');
            resetTypingState();
            setShowAudioRecorder(false);

            if (typeof onMessageSent === 'function' && payload) {
                onMessageSent(payload as Record<string, unknown>);
            }

            onCancelReply?.();
        } catch (caught) {
            console.error('Error sending audio message:', caught);
            const defaultMessage = 'We could not send your audio clip right now. Please try again.';
            
            if (typeof caught === 'object' && caught !== null && 'response' in caught && typeof caught.response === 'object' && caught.response !== null && 'data' in caught.response) {
                const responseData = (caught as { response?: { data?: { message?: string } } }).response?.data;
                const message = responseData?.message ?? defaultMessage;
                setError(message);
            } else if (caught instanceof Error) {
                setError(caught.message ?? defaultMessage);
            } else {
                setError(defaultMessage);
            }
        } finally {
            setIsUploadingAudio(false);
        }
    }, [audioBlob, audioUrl, conversationId, isUploadingAudio, onMessageSent, onCancelReply, replyTo, resetTypingState]);

    const formatRecordingTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const cancelVideoRecording = useCallback(() => {
        console.log('📹 [VIDEO] cancelVideoRecording called', {
            sessionId: videoSessionIdRef.current,
            isRecordingVideo
        });
        stopVideoRecording();
        setVideoBlob(null);
        if (videoUrl) {
            URL.revokeObjectURL(videoUrl);
            setVideoUrl(null);
        }
        setShowVideoRecorder(false);
        setError(null);
    }, [stopVideoRecording, videoUrl]);

    const sendVideoMessage = useCallback(async () => {
        if (!videoBlob || isUploadingVideo) {
            return;
        }

        if (videoBlob.size === 0) {
            setError('Video clip is empty. Please record again.');
            return;
        }

        setIsUploadingVideo(true);
        setError(null);

        try {
            const file = new File([videoBlob], `video-clip-${Date.now()}.webm`, {
                type: videoBlob.type || 'video/webm',
            });
            
            const formData = new FormData();
            formData.append('file', file);

            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
            const uploadResponse = await http.post('/uploads/tmp', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken, 'X-XSRF-TOKEN': csrfToken } : {}),
                },
            });

            const uploadPayload = uploadResponse.data as UploadPayload;

            if (!uploadPayload?.id) {
                throw new Error('Failed to upload video');
            }

            const response = await http.post(`/api/conversations/${conversationId}/messages`, {
                body: '',
                attachments: [uploadPayload],
                ...(replyTo ? { reply_to_id: replyTo.id } : {}),
            });

            const payload = response.data?.data ?? response.data;

            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
            setVideoBlob(null);
            setVideoUrl(null);
            setVideoRecordingTime(0);
            setBody('');
            resetTypingState();
            setShowVideoRecorder(false);

            if (typeof onMessageSent === 'function' && payload) {
                onMessageSent(payload as Record<string, unknown>);
            }

            onCancelReply?.();
        } catch (caught) {
            console.error('Error sending video message:', caught);
            const defaultMessage = 'We could not send your video clip right now. Please try again.';
            
            if (typeof caught === 'object' && caught !== null && 'response' in caught && typeof caught.response === 'object' && caught.response !== null && 'data' in caught.response) {
                const responseData = (caught as { response?: { data?: { message?: string } } }).response?.data;
                const message = responseData?.message ?? defaultMessage;
                setError(message);
            } else if (caught instanceof Error) {
                setError(caught.message ?? defaultMessage);
            } else {
                setError(defaultMessage);
            }
        } finally {
            setIsUploadingVideo(false);
        }
    }, [videoBlob, videoUrl, conversationId, isUploadingVideo, onMessageSent, onCancelReply, replyTo, resetTypingState]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showEmojiPicker]);

    const handleTipDialogOpenChange = (open: boolean) => {
        setIsTipDialogOpen(open);

        if (!open) {
            resetTipState();
        }
    };

    const handleTipConfirm = async () => {
        if (!viewer?.id) {
            setTipError('We could not determine who is sending this tip.');

            return;
        }

        const parsedAmount = Number.parseFloat(tipAmount);

        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return;
        }

        setTipError(null);
        setIsProcessingTip(true);

        try {
            const payload = {
                type: tipMode === 'send' ? 'tip' : 'tip_request',
                metadata: {
                    amount: parsedAmount,
                    currency: 'USD',
                    mode: tipMode === 'send' ? 'send' : 'request',
                    status: tipMode === 'send' ? 'completed' : 'pending',
                    requester_id: tipMode === 'request' ? viewer.id : undefined,
                    payment_method: tipMode === 'send' ? selectedPaymentMethod : undefined,
                },
            };

            const response = await http.post(`/api/conversations/${conversationId}/messages`, payload);
            const messagePayload = response.data?.data ?? response.data;

            if (messagePayload) {
                onMessageSent?.(messagePayload);
            }

            handleTipDialogOpenChange(false);
        } catch (error) {
            console.error('Unable to create tip message', error);
            setTipError('We could not process this tip right now. Please try again.');
        } finally {
            setIsProcessingTip(false);
        }
    };

    function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        setBody(event.target.value);
        setError(null);

        triggerTyping();
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void submitMessage();

            return;
        }

        triggerTyping();
    }

    async function submitMessage(): Promise<void> {
        if (isSending || isUploadingAudio || isUploadingVideo) {
            return;
        }

        // If we have an audio clip ready, send it
        if (audioBlob && !isRecordingAudio) {
            await sendAudioMessage();
            return;
        }

        // If we have a video clip ready, send it
        if (videoBlob && !isRecordingVideo) {
            await sendVideoMessage();
            return;
        }

        if (body.trim() === '' && uploads.length === 0) {
            setError('Add a message or attachment.');

            return;
        }

        setIsSending(true);
        setError(null);

        try {
            const response = await http.post(`/api/conversations/${conversationId}/messages`, {
                body,
                attachments: uploads,
                ...(replyTo ? { reply_to_id: replyTo.id } : {}),
            });

            const payload = response.data?.data ?? response.data;

            setBody('');
            setUploads([]);
            resetTypingState();

            if (typeof onMessageSent === 'function' && payload) {
                onMessageSent(payload as Record<string, unknown>);
            }

            onCancelReply?.();
        } catch (caught) {
            const defaultMessage = 'We could not send your message right now. Please try again.';

            if (typeof caught === 'object' && caught !== null && 'response' in caught && typeof caught.response === 'object' && caught.response !== null && 'data' in caught.response) {
                const responseData = (caught as { response?: { data?: { message?: string } } }).response?.data;
                const message = responseData?.message ?? defaultMessage;
                setError(message);
            } else if (caught instanceof Error) {
                setError(caught.message ?? defaultMessage);
            } else {
                setError(defaultMessage);
            }
        } finally {
            setIsSending(false);
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await submitMessage();
    }

    return (
        <>
        <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
            <div className="rounded-3xl border border-white/15 bg-black/40 shadow-[0_20px_45px_-30px_rgba(255,255,255,0.45)]">
                <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
                    {replyTo ? (
                        <div className="flex items-start justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs text-white/80 sm:text-sm">
                            <div>
                                <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-amber-200/80 sm:text-xs">
                                    Replying to {replyTo.author?.display_name ?? replyTo.author?.username ?? 'a message'}
                                </p>
                                <p className="whitespace-pre-wrap text-sm text-white/80">
                                    {(replyTo.body ?? '').slice(0, 140)}
                                    {(replyTo.body ?? '').length > 140 ? '…' : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    onCancelReply?.();
                                }}
                                className="rounded-full border border-amber-400/40 bg-black/60 p-1.5 text-amber-200 transition hover:bg-black/80"
                                aria-label="Cancel reply"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : null}

                    {showVideoRecorder ? (
                        <div className="space-y-3">
                            {error && (
                                <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
                                    {error}
                                </p>
                            )}
                            {!isRecordingVideo && !videoBlob && availableCameras.length > 1 && (
                                <div className="flex items-center gap-3">
                                    <Label htmlFor="camera-select" className="text-sm text-white/70">Camera:</Label>
                                    <Select
                                        value={selectedCameraId ?? ''}
                                        onValueChange={(value) => setSelectedCameraId(value)}
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
                                                    {camera.label || `Camera ${availableCameras.indexOf(camera) + 1}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {isRecordingVideo ? (
                                <div className="space-y-3">
                                    <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
                                        <video
                                            ref={videoPreviewRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <div className="size-3 rounded-full bg-rose-500 animate-pulse" />
                                                <span className="text-sm font-mono font-semibold text-white">
                                                    {formatRecordingTime(videoRecordingTime)} / 01:00
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center gap-3">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={cancelVideoRecording}
                                                className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10"
                                                aria-label="Cancel recording"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={stopVideoRecording}
                                                className="flex size-10 items-center justify-center rounded-full border border-rose-500/50 bg-rose-500/20 text-rose-400 transition hover:bg-rose-500/30 hover:border-rose-500/70"
                                                aria-label="Stop recording"
                                            >
                                                <Square className="h-4 w-4 fill-rose-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : videoBlob && videoUrl ? (
                                <div className="space-y-3">
                                    <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
                                        <video src={videoUrl} controls className="h-full w-full object-cover" />
                                    </div>
                                    <div className="flex items-center justify-center gap-3">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={cancelVideoRecording}
                                            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10"
                                            aria-label="Cancel"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : showAudioRecorder ? (
                        <div className="space-y-3">
                            {error && (
                                <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
                                    {error}
                                </p>
                            )}
                            {isRecordingAudio ? (
                                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-center gap-0.5 h-12">
                                            {waveformData.map((value, index) => {
                                                // Increase base height and make it more responsive
                                                const height = Math.max(3, value * 60);
                                                return (
                                                    <div
                                                        key={index}
                                                        className="bg-rose-500 rounded-full transition-all duration-75"
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
                                        <span className="text-xs font-mono font-medium text-white/70 min-w-[3rem] text-right">
                                            {formatRecordingTime(recordingTime)} / 04:00
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={stopRecording}
                                            className="flex size-10 items-center justify-center rounded-full border border-rose-500/50 bg-rose-500/20 text-rose-400 transition hover:bg-rose-500/30 hover:border-rose-500/70"
                                            aria-label="Stop recording"
                                        >
                                            <Square className="h-4 w-4 fill-rose-500" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={cancelRecording}
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
                                        <audio src={audioUrl} controls className="w-full h-10">
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={cancelRecording}
                                            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10"
                                            aria-label="Cancel"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="relative">
                            <textarea
                                ref={textareaRef}
                                value={body}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Write a message your scene partner will remember…"
                                rows={4}
                                className="h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-3 py-3 pr-12 text-sm text-white/90 placeholder:text-white/40 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 sm:px-4 sm:pr-12"
                            />
                            <div className="absolute bottom-3 right-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
                                    aria-label="Add emoji"
                                >
                                    <Smile className="h-4 w-4" />
                                </button>
                                {showEmojiPicker && (
                                    <div ref={emojiPickerRef} className="absolute bottom-12 right-0 z-50">
                                        <EmojiPicker
                                            onEmojiClick={handleEmojiClick}
                                            theme={Theme.DARK}
                                            width={350}
                                            height={400}
                                            previewConfig={{
                                                showPreview: false,
                                            }}
                                            skinTonesDisabled
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {hasAttachments && (
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                            {uploads.map((attachment) => (
                                <div
                                    key={attachment.id}
                                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                                >
                                    {attachment.thumbnail_url ? (
                                        <img
                                            src={attachment.thumbnail_url}
                                            alt={attachment.original_name ?? 'Attachment preview'}
                                            className="h-32 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-32 w-full items-center justify-center text-white/50">
                                            <Paperclip className="h-6 w-6" />
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setUploads((previous) => previous.filter((item) => item.id !== attachment.id))}
                                        className="absolute right-3 top-3 hidden rounded-full bg-black/70 p-2 text-white transition group-hover:flex"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs text-rose-200 sm:text-sm">
                            {error}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-3 border-t border-white/10 bg-black/55 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 sm:size-10"
                            aria-label="Attach photo"
                            onClick={triggerPhotoUpload}
                        >
                            <Image className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 sm:size-10"
                            aria-label="Attach video file"
                            onClick={triggerVideoUpload}
                        >
                            <Film className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 sm:size-10"
                            aria-label="Record video clip"
                            onClick={handleVideoButtonClick}
                        >
                            <Video className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 sm:size-10"
                            aria-label="Send tip"
                            onClick={() => handleTipDialogOpenChange(true)}
                        >
                            <Coins className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 sm:size-10"
                            aria-label="Record audio clip"
                            onClick={handleAudioButtonClick}
                        >
                            <Mic className="h-4 w-4" />
                        </button>
                        <div className="hidden" data-uploader="photos">
                            <FilePondUploader
                                ref={photoUploaderRef}
                                name="photos"
                                allowMultiple
                                maxFiles={6}
                                acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']}
                                instantUpload
                                className="filepond--compact filepond--dark"
                                onprocessfile={(_, file) => handleProcess(file)}
                                onremovefile={(_, file) => handleRemove(file)}
                            />
                        </div>
                        <div className="hidden" data-uploader="videos">
                            <FilePondUploader
                                ref={videoUploaderRef}
                                name="videos"
                                allowMultiple
                                maxFiles={6}
                                acceptedFileTypes={['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']}
                                instantUpload
                                className="filepond--compact filepond--dark"
                                onprocessfile={(_, file) => handleProcess(file)}
                                onremovefile={(_, file) => handleRemove(file)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className="text-[0.65rem] uppercase tracking-[0.25em] text-white/40 sm:text-xs">
                            {bodyCharacterCount} chars
                        </span>
                        <Button
                            type="submit"
                            disabled={isSending || isUploadingAudio || isUploadingVideo || isRecordingAudio || isRecordingVideo}
                            className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-5 text-sm font-semibold text-white shadow-[0_20px_45px_-20px_rgba(249,115,22,0.65)] hover:from-amber-400/90 hover:via-rose-500/90 hover:to-violet-600/90 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6"
                        >
                            {isSending || isUploadingAudio || isUploadingVideo ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending
                                </>
                            ) : (
                                'Send'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
        <Dialog open={isTipDialogOpen} onOpenChange={handleTipDialogOpenChange}>
            <DialogContent className="max-w-md border-white/10 bg-neutral-950/95 text-white">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-white">Support this creator</DialogTitle>
                    <DialogDescription className="mt-2 text-xs text-white/50">
                        Send a quick tip or request one to keep the conversation flowing.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-5">
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
                        {(['send', 'request'] as const).map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setTipMode(mode)}
                                className={cn(
                                    'flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition',
                                    tipMode === mode
                                        ? 'bg-white text-neutral-900 shadow-[0_10px_30px_-15px_rgba(255,255,255,0.75)]'
                                        : 'text-white/55 hover:text-white',
                                )}
                            >
                                {mode === 'send' ? 'Send tip' : 'Request tip'}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tip-amount" className="text-xs uppercase tracking-[0.3em] text-white/50">
                            Amount
                        </Label>
                        <Input
                            id="tip-amount"
                            inputMode="decimal"
                            type="number"
                            min="1"
                            step="1"
                            placeholder="25"
                            value={tipAmount}
                            onChange={(event) => setTipAmount(event.target.value)}
                            className="h-11 rounded-2xl border-white/15 bg-white/5 text-white placeholder:text-white/30 focus:border-amber-400/60 focus:ring-amber-400/40"
                        />
                        <p className="text-xs text-white/35">Creators keep 95% of every tip.</p>
                    </div>

                    {isSendMode ? (
                        <div className="space-y-3">
                            <span className="text-xs uppercase tracking-[0.3em] text-white/50">Pay with</span>
                            <div className="space-y-2">
                                {paymentMethods.map((method) => (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => setSelectedPaymentMethod(method.id)}
                                        className={cn(
                                            'w-full rounded-2xl border px-4 py-3 text-left transition',
                                            selectedPaymentMethod === method.id
                                                ? 'border-amber-400/60 bg-amber-400/10 text-white shadow-[0_15px_35px_-20px_rgba(251,191,36,0.65)]'
                                                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:text-white',
                                        )}
                                    >
                                        <p className="text-sm font-medium text-white">{method.label}</p>
                                        <p className="mt-1 text-xs text-white/50">{method.detail}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
                            They’ll get a notification right away. Once accepted, the request will appear in your chat history.
                        </p>
                    )}
                    {tipError ? (
                        <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
                            {tipError}
                        </p>
                    ) : null}
                </div>
                <DialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-11 rounded-full border border-transparent text-white/70 hover:border-white/10 hover:bg-white/5 sm:px-6"
                        onClick={() => handleTipDialogOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={!canConfirmTip || isProcessingTip}
                        className="h-11 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 font-semibold text-white shadow-[0_18px_40px_-18px_rgba(249,115,22,0.65)] hover:from-amber-400/90 hover:via-rose-500/90 hover:to-violet-600/90 disabled:opacity-50"
                        onClick={handleTipConfirm}
                    >
                        {isProcessingTip ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {tipMode === 'send' ? 'Sending…' : 'Requesting…'}
                            </>
                        ) : (
                            tipMode === 'send' ? 'Send tip' : 'Request tip'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}

