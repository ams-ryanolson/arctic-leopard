import http from '@/lib/http';
import { Coins, Film, Image, Loader2, Mic, Plus, Video, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';

import MediaUploader from '@/components/media/MediaUploader';
import AudioRecorder from '@/components/media/audio-recorder';
import VideoRecorder from '@/components/media/video-recorder';
import AttachmentPreview from '@/components/messaging/attachment-preview';
import TipDialog from '@/components/messaging/tip-dialog';
import { Button } from '@/components/ui/button';
import CompactTextarea from '@/components/ui/compact-textarea';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

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
    keyboardHeight?: number;
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
    keyboardHeight = 0,
    viewer,
}: MessageComposerProps) {
    const { features: sharedFeatures } = usePage<SharedData>().props;
    const features = (sharedFeatures ?? {}) as Record<string, boolean>;
    const signalsEnabled = features.feature_signals_enabled ?? false;

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
    const [failedMessage, setFailedMessage] = useState<{
        body: string;
        attachments: UploadPayload[];
        replyTo: MessagePreview | null;
    } | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const [showMediaMenu, setShowMediaMenu] = useState(false);
    const mediaMenuRef = useRef<HTMLDivElement>(null);

    const photoUploaderRef = useRef<{ click: () => void } | null>(null);
    const videoUploaderRef = useRef<{ click: () => void } | null>(null);

    const hasAttachments = uploads.length > 0;
    const bodyCharacterCount = body.trim().length;
    const blockedNotice =
        blockedMessage ??
        'This conversation is currently unavailable. One of you has restricted messaging, so new messages cannot be sent.';
    const paymentMethods: Array<{ id: string; label: string; detail: string }> =
        [
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
        ];

    const resetTypingState = useCallback(() => {
        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = undefined;
        }
    }, []);

    const triggerTyping = useCallback(() => {
        onTyping?.();

        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = window.setTimeout(() => {
            typingTimeoutRef.current = undefined;
        }, 2400);
    }, [onTyping]);

    const handlePhotoUploadComplete = useCallback(
        (identifiers: string[]) => {
            identifiers.forEach((identifier) => {
                setUploads((previous) => {
                    // Check if already exists
                    if (previous.some((item) => item.id === identifier)) {
                        return previous;
                    }

                    return [
                        ...previous,
                        {
                            id: identifier,
                            mime_type: 'image/jpeg', // Will be updated by backend
                        },
                    ];
                });
            });
            triggerTyping();
        },
        [triggerTyping],
    );

    const handleVideoUploadComplete = useCallback(
        (identifiers: string[]) => {
            identifiers.forEach((identifier) => {
                setUploads((previous) => {
                    // Check if already exists
                    if (previous.some((item) => item.id === identifier)) {
                        return previous;
                    }

                    return [
                        ...previous,
                        {
                            id: identifier,
                            mime_type: 'video/mp4', // Will be updated by backend
                        },
                    ];
                });
            });
            triggerTyping();
        },
        [triggerTyping],
    );

    const triggerPhotoUpload = useCallback(() => {
        // Trigger the hidden MediaUploader's input click
        const wrapper = document.querySelector<HTMLElement>(
            '[data-uploader="photos"]',
        );
        const input =
            wrapper?.querySelector<HTMLInputElement>('input[type="file"]');
        input?.click();
    }, []);

    const triggerVideoUpload = useCallback(() => {
        // Trigger the hidden MediaUploader's input click
        const wrapper = document.querySelector<HTMLElement>(
            '[data-uploader="videos"]',
        );
        const input =
            wrapper?.querySelector<HTMLInputElement>('input[type="file"]');
        input?.click();
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
            const file = new File(
                [audioBlob],
                `audio-clip-${Date.now()}.webm`,
                {
                    type: audioBlob.type || 'audio/webm',
                },
            );

            const formData = new FormData();
            formData.append('file', file);

            const csrfToken = document.querySelector<HTMLMetaElement>(
                'meta[name="csrf-token"]',
            )?.content;
            const uploadResponse = await http.post('/uploads/tmp', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(csrfToken
                        ? {
                              'X-CSRF-TOKEN': csrfToken,
                              'X-XSRF-TOKEN': csrfToken,
                          }
                        : {}),
                },
            });

            const uploadPayload = uploadResponse.data as UploadPayload;

            if (!uploadPayload?.id) {
                throw new Error('Failed to upload audio');
            }

            const response = await http.post(
                `/api/conversations/${conversationId}/messages`,
                {
                    body: '',
                    attachments: [uploadPayload],
                    ...(replyTo ? { reply_to_id: replyTo.id } : {}),
                },
            );

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
            const defaultMessage =
                'We could not send your audio clip right now. Please try again.';

            if (
                typeof caught === 'object' &&
                caught !== null &&
                'response' in caught &&
                typeof caught.response === 'object' &&
                caught.response !== null &&
                'data' in caught.response
            ) {
                const responseData = (
                    caught as { response?: { data?: { message?: string } } }
                ).response?.data;
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
    }, [
        audioBlob,
        conversationId,
        isUploadingAudio,
        onMessageSent,
        onCancelReply,
        replyTo,
        resetTypingState,
    ]);

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
            const file = new File(
                [videoBlob],
                `video-clip-${Date.now()}.webm`,
                {
                    type: videoBlob.type || 'video/webm',
                },
            );

            const formData = new FormData();
            formData.append('file', file);

            const csrfToken = document.querySelector<HTMLMetaElement>(
                'meta[name="csrf-token"]',
            )?.content;
            const uploadResponse = await http.post('/uploads/tmp', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(csrfToken
                        ? {
                              'X-CSRF-TOKEN': csrfToken,
                              'X-XSRF-TOKEN': csrfToken,
                          }
                        : {}),
                },
            });

            const uploadPayload = uploadResponse.data as UploadPayload;

            if (!uploadPayload?.id) {
                throw new Error('Failed to upload video');
            }

            const response = await http.post(
                `/api/conversations/${conversationId}/messages`,
                {
                    body: '',
                    attachments: [uploadPayload],
                    ...(replyTo ? { reply_to_id: replyTo.id } : {}),
                },
            );

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
            const defaultMessage =
                'We could not send your video clip right now. Please try again.';

            if (
                typeof caught === 'object' &&
                caught !== null &&
                'response' in caught &&
                typeof caught.response === 'object' &&
                caught.response !== null &&
                'data' in caught.response
            ) {
                const responseData = (
                    caught as { response?: { data?: { message?: string } } }
                ).response?.data;
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
    }, [
        videoBlob,
        conversationId,
        isUploadingVideo,
        onMessageSent,
        onCancelReply,
        replyTo,
        resetTypingState,
    ]);

    const handleTipConfirm = useCallback(
        async (
            amount: number,
            mode: 'send' | 'request',
            paymentMethod?: string,
        ) => {
            if (!viewer?.id) {
                throw new Error(
                    'We could not determine who is sending this tip.',
                );
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

            const response = await http.post(
                `/api/conversations/${conversationId}/messages`,
                payload,
            );
            const messagePayload = response.data?.data ?? response.data;

            if (messagePayload) {
                onMessageSent?.(messagePayload);
            }
        },
        [viewer, conversationId, onMessageSent],
    );

    const handleEmojiClick = useCallback((emojiData: EmojiClickData) => {
        const textarea = document.querySelector<HTMLTextAreaElement>('[data-message-textarea]');
        const emoji = emojiData.emoji;

        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const textBefore = body.substring(0, start);
            const textAfter = body.substring(end);
            const newBody = textBefore + emoji + textAfter;
            
            setBody(newBody);
            triggerTyping();
            
            setTimeout(() => {
                textarea.focus();
                const newPosition = start + emoji.length;
                textarea.setSelectionRange(newPosition, newPosition);
            }, 0);
        } else {
            setBody((prev) => prev + emoji);
            triggerTyping();
        }

        setShowEmojiPicker(false);
    }, [body, triggerTyping]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
            if (mediaMenuRef.current && !mediaMenuRef.current.contains(event.target as Node)) {
                setShowMediaMenu(false);
            }
        };

        if (showEmojiPicker || showMediaMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showEmojiPicker, showMediaMenu]);

    function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void submitMessage();

            return;
        }

        triggerTyping();
    }

    const submitMessage = useCallback(async (): Promise<void> => {
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
        setFailedMessage(null);

        const messageData = {
            body,
            attachments: uploads,
            replyTo: replyTo ?? null,
        };

        try {
            const response = await http.post(
                `/api/conversations/${conversationId}/messages`,
                {
                    body,
                    attachments: uploads,
                    ...(replyTo ? { reply_to_id: replyTo.id } : {}),
                },
            );

            const payload = response.data?.data ?? response.data;

            setBody('');
            setUploads([]);
            resetTypingState();
            setFailedMessage(null);

            if (typeof onMessageSent === 'function' && payload) {
                onMessageSent(payload as Record<string, unknown>);
            }

            onCancelReply?.();
        } catch (caught) {
            setFailedMessage(messageData);

            let errorMessage = 'We could not send your message right now. Please try again.';

            if (
                typeof caught === 'object' &&
                caught !== null &&
                'response' in caught &&
                typeof caught.response === 'object' &&
                caught.response !== null
            ) {
                const response = caught.response as { status?: number; data?: { message?: string } };
                
                if (response.status === 403) {
                    errorMessage = 'You do not have permission to send messages in this conversation.';
                } else if (response.status === 404) {
                    errorMessage = 'This conversation no longer exists.';
                } else if (response.status === 422) {
                    errorMessage = response.data?.message ?? 'Your message could not be sent. Please check your input and try again.';
                } else if (response.status === 429) {
                    errorMessage = 'You are sending messages too quickly. Please wait a moment and try again.';
                } else if (response.status === 500) {
                    errorMessage = 'A server error occurred. Please try again in a moment.';
                } else if (response.data?.message) {
                    errorMessage = response.data.message;
                }
            } else if (caught instanceof Error) {
                if (caught.message.includes('Network') || caught.message.includes('fetch')) {
                    errorMessage = 'Network error. Please check your connection and try again.';
                } else {
                    errorMessage = caught.message;
                }
            }

            setError(errorMessage);
        } finally {
            setIsSending(false);
        }
    }, [
        isSending,
        isUploadingAudio,
        isUploadingVideo,
        audioBlob,
        videoBlob,
        body,
        uploads,
        conversationId,
        replyTo,
        onMessageSent,
        onCancelReply,
        resetTypingState,
        sendAudioMessage,
        sendVideoMessage,
    ]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await submitMessage();
    }

    if (isConversationBlocked) {
        return (
            <div
                className={cn(
                    'rounded-3xl border border-white/15 bg-black/40 px-5 py-6 text-sm text-white/70 shadow-[0_20px_45px_-30px_rgba(255,255,255,0.45)] sm:px-6',
                    className,
                )}
            >
                <h3 className="text-base font-semibold text-white">
                    Messaging unavailable
                </h3>
                <p className="mt-2 text-xs text-white/60 sm:text-sm">
                    {blockedNotice}
                </p>
            </div>
        );
    }

    return (
        <>
            <form
                onSubmit={handleSubmit}
                className={cn('border-t border-white/5 bg-neutral-950', className)}
            >
                {/* Reply preview - outside main input */}
                {replyTo && (
                    <div className="border-b border-white/5 px-3 py-1.5 sm:px-4 sm:py-2">
                        <div className="flex items-start justify-between gap-2 rounded-lg border border-amber-400/20 bg-amber-500/5 px-2 py-1 text-xs sm:py-1.5">
                            <div className="min-w-0 flex-1">
                                <p className="text-[0.6rem] font-medium text-amber-300/80 uppercase tracking-wide">
                                    Replying to {replyTo.author?.display_name ?? replyTo.author?.username ?? 'a message'}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-white/70">
                                    {(replyTo.body ?? '').slice(0, 80)}{(replyTo.body ?? '').length > 80 ? '…' : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onCancelReply}
                                className="shrink-0 rounded p-1 text-amber-300/60 transition hover:bg-amber-500/10 hover:text-amber-300"
                                aria-label="Cancel reply"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Attachment preview - outside main input */}
                {hasAttachments && !replyTo && (
                    <div className="border-b border-white/5 px-3 py-1.5 sm:px-4 sm:py-2">
                        <AttachmentPreview
                            attachments={uploads}
                            onRemove={(id) =>
                                setUploads((prev) =>
                                    prev.filter((item) => item.id !== id),
                                )
                            }
                        />
                    </div>
                )}

                {/* Error message - compact */}
                {error && (
                    <div className="border-b border-rose-500/20 bg-rose-500/5 px-3 py-1 text-xs text-rose-300 sm:px-4 sm:py-1.5">
                        <div className="flex items-center justify-between gap-2">
                            <span>{error}</span>
                            {failedMessage && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBody(failedMessage.body);
                                        setUploads(failedMessage.attachments);
                                        setFailedMessage(null);
                                        setError(null);
                                        void submitMessage();
                                    }}
                                    className="text-xs font-medium text-rose-300 underline hover:text-rose-200"
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Recorders - full width when active */}
                {showVideoRecorder ? (
                    <div className="px-3 py-1.5 sm:px-4 sm:py-2">
                        <VideoRecorder
                            onRecorded={handleVideoRecorded}
                            onCancel={handleVideoCancel}
                            onError={setError}
                            maxDuration={60}
                            autoStart
                        />
                    </div>
                ) : showAudioRecorder ? (
                    <div className="px-3 py-1.5 sm:px-4 sm:py-2">
                        <AudioRecorder
                            onRecorded={handleAudioRecorded}
                            onCancel={handleAudioCancel}
                            onError={setError}
                            maxDuration={240}
                            autoStart
                        />
                    </div>
                ) : (
                    /* Main compact input area */
                    <div className="flex items-end gap-2 px-2 py-1 sm:px-3 sm:py-1.5">
                        {/* Plus button with animated menu - LEFT SIDE */}
                        <div className="relative shrink-0" ref={mediaMenuRef}>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMediaMenu(!showMediaMenu);
                                }}
                                className={cn(
                                    "rounded-full p-2 transition",
                                    showMediaMenu
                                        ? "bg-white/20 text-white"
                                        : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                                )}
                                aria-label="Add media"
                                aria-expanded={showMediaMenu}
                            >
                                <Plus className={cn(
                                    "h-5 w-5 transition-transform",
                                    showMediaMenu && "rotate-45"
                                )} />
                            </button>
                            
                            {/* Animated media menu - circles above */}
                            {showMediaMenu && (
                                <div
                                    className="absolute bottom-full left-0 mb-2 flex flex-col gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Upload Photo */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerPhotoUpload();
                                            setShowMediaMenu(false);
                                        }}
                                        className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white/80 shadow-lg transition-all hover:bg-white/20 hover:text-white hover:scale-110"
                                        aria-label="Upload photo"
                                    >
                                        <Image className="h-5 w-5" />
                                    </button>
                                    {/* Upload Video */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerVideoUpload();
                                            setShowMediaMenu(false);
                                        }}
                                        className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white/80 shadow-lg transition-all hover:bg-white/20 hover:text-white hover:scale-110"
                                        aria-label="Upload video file"
                                    >
                                        <Film className="h-5 w-5" />
                                    </button>
                                    {/* Create Audio Clip */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleAudioButtonClick();
                                            setShowMediaMenu(false);
                                        }}
                                        className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white/80 shadow-lg transition-all hover:bg-white/20 hover:text-white hover:scale-110"
                                        aria-label="Create audio clip"
                                    >
                                        <Mic className="h-5 w-5" />
                                    </button>
                                    {/* Create Video Clip */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleVideoButtonClick();
                                            setShowMediaMenu(false);
                                        }}
                                        className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white/80 shadow-lg transition-all hover:bg-white/20 hover:text-white hover:scale-110"
                                        aria-label="Create video clip"
                                    >
                                        <Video className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Compact input with auto-expand */}
                        <div className="relative flex min-h-0 flex-1 items-center rounded-lg border border-white/10 bg-white/5 px-2 py-1 focus-within:border-white/20">
                            <CompactTextarea
                                value={body}
                                onChange={setBody}
                                onKeyDown={handleKeyDown}
                                placeholder="Message"
                                onTyping={triggerTyping}
                                maxRows={6}
                            />
                            {/* Emoji button - inline */}
                            <div className="relative shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="rounded p-1 text-white/50 transition hover:bg-white/10 hover:text-white/80"
                                    aria-label="Add emoji"
                                >
                                    <Smile className="h-4 w-4" />
                                </button>
                                {showEmojiPicker && (
                                    <div ref={emojiPickerRef} className="absolute bottom-full right-0 z-50 mb-2">
                                        <EmojiPicker
                                            onEmojiClick={handleEmojiClick}
                                            theme={Theme.DARK}
                                            width={300}
                                            height={350}
                                            previewConfig={{ showPreview: false }}
                                            skinTonesDisabled
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tip button - RIGHT SIDE (between input and send, only if Signals enabled) */}
                        {signalsEnabled && (
                            <button
                                type="button"
                                onClick={() => setIsTipDialogOpen(true)}
                                className="shrink-0 rounded-full bg-white/10 p-2 text-white/70 transition hover:bg-white/20 hover:text-white"
                                aria-label="Send tip"
                            >
                                <Coins className="h-5 w-5" />
                            </button>
                        )}

                        {/* Send button - FAR RIGHT */}
                        <button
                            type="submit"
                            disabled={isSending || isUploadingAudio || isUploadingVideo || (body.trim() === '' && uploads.length === 0)}
                            className="shrink-0 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-400/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSending || isUploadingAudio || isUploadingVideo ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Send'
                            )}
                        </button>
                    </div>
                )}

                {/* Hidden uploaders */}
                <div className="hidden" data-uploader="photos">
                    <MediaUploader
                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                        maxFiles={6}
                        multiple
                        onUploadComplete={handlePhotoUploadComplete}
                        onError={(error) => setError(error)}
                    />
                </div>
                <div className="hidden" data-uploader="videos">
                    <MediaUploader
                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                        maxFiles={6}
                        multiple
                        onUploadComplete={handleVideoUploadComplete}
                        onError={(error) => setError(error)}
                    />
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
