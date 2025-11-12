import http from '@/lib/http';
import type { FilePondFile } from 'filepond';
import { useRef, useState } from 'react';
import { Coins, Film, Loader2, Mic, Paperclip, Smile, X } from 'lucide-react';
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

    function triggerTyping() {
        onTyping?.();

        if (!isTyping) {
            setIsTyping(true);
        }

        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = window.setTimeout(() => {
            setIsTyping(false);
            typingTimeoutRef.current = undefined;
        }, 2400);
    }

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
            // eslint-disable-next-line no-console
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
        if (isSending) {
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

                    <textarea
                        value={body}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Write a message your scene partner will remember…"
                        rows={4}
                        className="h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/90 placeholder:text-white/40 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 sm:px-4"
                    />

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
                            aria-label="Attach media"
                            onClick={() => {
                                const input = document.querySelector<HTMLInputElement>(`.filepond--browser input[type="file"]`);
                                input?.click();
                            }}
                        >
                            <Paperclip className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 sm:size-10"
                            aria-label="Add emoji"
                        >
                            <Smile className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 sm:size-10"
                            aria-label="Add GIF"
                        >
                            <Film className="h-4 w-4" />
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
                            className="hidden size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 sm:flex"
                            aria-label="Record audio note"
                        >
                            <Mic className="h-4 w-4" />
                        </button>
                        <div className="hidden">
                            <FilePondUploader
                                name="attachments"
                                allowMultiple
                                maxFiles={6}
                                acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']}
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
                            disabled={isSending}
                            className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-5 text-sm font-semibold text-white shadow-[0_20px_45px_-20px_rgba(249,115,22,0.65)] hover:from-amber-400/90 hover:via-rose-500/90 hover:to-violet-600/90 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6"
                        >
                            {isSending ? (
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

