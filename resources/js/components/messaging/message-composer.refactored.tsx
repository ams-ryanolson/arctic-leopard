import http from '@/lib/http';
import type { FilePondFile } from 'filepond';
import { useRef, useState, useCallback } from 'react';
import { Coins, Film, Image, Loader2, Mic, Video, X } from 'lucide-react';

import FilePondUploader from '@/components/filepond-uploader';
import type FilePond from 'react-filepond';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AudioRecorder from '@/components/media/audio-recorder';
import VideoRecorder from '@/components/media/video-recorder';
import EmojiPickerInput from '@/components/ui/emoji-picker-input';
import TipDialog from '@/components/messaging/tip-dialog';
import AttachmentPreview from '@/components/messaging/attachment-preview';

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
    const [isTipDialogOpen, setIsTipDialogOpen] = useState(false);
    const [showAudioRecorder, setShowAudioRecorder] = useState(false);
    const [showVideoRecorder, setShowVideoRecorder] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [isUploadingAudio, setIsUploadingAudio] = useState(false);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);

    const photoUploaderRef = useRef<FilePond>(null);
    const videoUploaderRef = useRef<FilePond>(null);

    const hasAttachments = uploads.length > 0;
    const bodyCharacterCount = body.trim().length;
    const blockedNotice =
        blockedMessage ??
        'This conversation is currently unavailable. One of you has restricted messaging, so new messages can't be sent.';
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

        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = window.setTimeout(() => {
            typingTimeoutRef.current = undefined;
        }, 2400);
    }, [onTyping]);

    function handleProcess(file?: FilePondFile | null) {
        const payload = (file?.getMetadata?.('uploadPayload') ??
            file?.getMetadata?.('upload')) as UploadPayload | undefined;

        if (!payload?.id) {
            return;
        }

        setUploads((previous) => [...previous.filter((item) => item.id !== payload.id), payload]);
        triggerTyping();
    }

    function handleRemove(file?: FilePondFile | null) {
        const payload = (file?.getMetadata?.('uploadPayload') ??
            file?.getMetadata?.('upload')) as UploadPayload | undefined;

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
    };

    const triggerPhotoUpload = useCallback(() => {
        const pond = photoUploaderRef.current;
        if (pond && typeof (pond as { browse?: () => void }).browse === 'function') {
            (pond as { browse: () => void }).browse();
        } else {
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
            const wrapper = document.querySelector<HTMLElement>('[data-uploader="videos"]');
            const input = wrapper?.querySelector<HTMLInputElement>('input[type="file"]');
            input?.click();
        }
    }, []);

    const handleAudioRecorded = useCallback((blob: Blob) => {
        setAudioBlob(blob);
    }, []);

    const handleAudioCancel = useCallback(() => {
        setAudioBlob(null);
        setShowAudioRecorder(false);
        setBody('');
    }, []);

    const handleVideoRecorded = useCallback((blob: Blob) => {
        setVideoBlob(blob);
    }, []);

    const handleVideoCancel = useCallback(() => {
        setVideoBlob(null);
        setShowVideoRecorder(false);
        setBody('');
    }, []);

    const handleAudioButtonClick = useCallback(() => {
        setShowVideoRecorder(false);
        setVideoBlob(null);
        setShowAudioRecorder(true);
        setBody('');
        setError(null);
    }, []);

    const handleVideoButtonClick = useCallback(() => {
        setShowAudioRecorder(false);
        setAudioBlob(null);
        setShowVideoRecorder(true);
        setBody('');
        setError(null);
    }, []);

    const sendAudioMessage = useCallback(async () => {
        if (!audioBlob || isUploadingAudio) {
            return;
        }

        if (audioBlob.size === 0) {
            setError('Audio clip is empty. Please record again.');
            return;
        }

        setIsUploadingAudio(true);
        setError(null);

        try {
            const file = new File([audioBlob], `audio-clip-${Date.now()}.webm`, {
                type: audioBlob.type || 'audio/webm',
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
                throw new Error('Failed to upload audio');
            }

            const response = await http.post(`/api/conversations/${conversationId}/messages`, {
                body: '',
                attachments: [uploadPayload],
                ...(replyTo ? { reply_to_id: replyTo.id } : {}),
            });

            const payload = response.data?.data ?? response.data;

            setAudioBlob(null);
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

            if (
                typeof caught === 'object' &&
                caught !== null &&
                'response' in caught &&
                typeof caught.response === 'object' &&
                caught.response !== null &&
                'data' in caught.response
            ) {
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
    }, [audioBlob, conversationId, isUploadingAudio, onMessageSent, onCancelReply, replyTo, resetTypingState]);

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

            setVideoBlob(null);
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

            if (
                typeof caught === 'object' &&
                caught !== null &&
                'response' in caught &&
                typeof caught.response === 'object' &&
                caught.response !== null &&
                'data' in caught.response
            ) {
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
    }, [videoBlob, conversationId, isUploadingVideo, onMessageSent, onCancelReply, replyTo, resetTypingState]);

    const handleTipConfirm = useCallback(
        async (amount: number, mode: 'send' | 'request', paymentMethod?: string) => {
            if (!viewer?.id) {
                throw new Error('We could not determine who is sending this tip.');
            }

            const payload = {
                type: mode === 'send' ? 'tip' : 'tip_request',
                metadata: {
                    amount,
                    currency: 'USD',
                    mode,
                    status: mode === 'send' ? 'completed' : 'pending',
                    requester_id: mode === 'request' ? viewer.id : undefined,
                    payment_method: mode === 'send' ? paymentMethod : undefined,
                },
            };

            const response = await http.post(`/api/conversations/${conversationId}/messages`, payload);
            const messagePayload = response.data?.data ?? response.data;

            if (messagePayload) {
                onMessageSent?.(messagePayload);
            }
        },
        [viewer, conversationId, onMessageSent],
    );

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

        if (audioBlob) {
            await sendAudioMessage();
            return;
        }

        if (videoBlob) {
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

            if (
                typeof caught === 'object' &&
                caught !== null &&
                'response' in caught &&
                typeof caught.response === 'object' &&
                caught.response !== null &&
                'data' in caught.response
            ) {
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
                                        Replying to{' '}
                                        {replyTo.author?.display_name ?? replyTo.author?.username ?? 'a message'}
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
                            <VideoRecorder
                                onRecorded={handleVideoRecorded}
                                onCancel={handleVideoCancel}
                                onError={setError}
                                maxDuration={60}
                                autoStart
                            />
                        ) : showAudioRecorder ? (
                            <AudioRecorder
                                onRecorded={handleAudioRecorded}
                                onCancel={handleAudioCancel}
                                onError={setError}
                                maxDuration={240}
                                autoStart
                            />
                        ) : (
                            <EmojiPickerInput
                                value={body}
                                onChange={setBody}
                                onKeyDown={handleKeyDown}
                                placeholder="Write a message your scene partner will remember…"
                                onTyping={triggerTyping}
                            />
                        )}

                        {hasAttachments && (
                            <AttachmentPreview attachments={uploads} onRemove={(id) => setUploads((prev) => prev.filter((item) => item.id !== id))} />
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
                                onClick={() => setIsTipDialogOpen(true)}
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
                                    acceptedFileTypes={[
                                        'image/jpeg',
                                        'image/png',
                                        'image/webp',
                                        'image/gif',
                                        'image/avif',
                                    ]}
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
                                disabled={isSending || isUploadingAudio || isUploadingVideo}
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
            <TipDialog
                open={isTipDialogOpen}
                onOpenChange={setIsTipDialogOpen}
                onConfirm={handleTipConfirm}
                paymentMethods={paymentMethods}
                defaultPaymentMethod="card-1"
            />
        </>
    );
}




