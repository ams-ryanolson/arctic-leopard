import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    AlertTriangle,
    CheckCircle2,
    Info,
    X,
    XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToastAutoDismiss } from '@/components/toasts/toast-provider';
import { useToasts, type ToastInstance } from '@/components/toasts/toast-context';
import { cn } from '@/lib/utils';
import http from '@/lib/http';
import type { ToastAction } from '@/types/toasts';

const themes = {
    info: {
        wrapper: 'border-white/10 bg-gradient-to-br from-sky-900/80 via-indigo-900/60 to-slate-950/90 text-sky-50',
        accent: 'from-sky-400/90 via-sky-500/70 to-indigo-500/70',
        iconColor: 'text-sky-100',
        icon: Info,
    },
    success: {
        wrapper: 'border-emerald-400/25 bg-gradient-to-br from-emerald-950/85 via-emerald-900/60 to-slate-950/90 text-emerald-50',
        accent: 'from-emerald-400/90 via-emerald-500/70 to-teal-500/70',
        iconColor: 'text-emerald-100',
        icon: CheckCircle2,
    },
    warning: {
        wrapper: 'border-amber-400/30 bg-gradient-to-br from-amber-950/90 via-amber-900/60 to-stone-950/90 text-amber-50',
        accent: 'from-amber-400/90 via-orange-500/70 to-rose-500/70',
        iconColor: 'text-amber-100',
        icon: AlertTriangle,
    },
    danger: {
        wrapper: 'border-rose-400/30 bg-gradient-to-br from-rose-950/90 via-rose-900/60 to-stone-950/90 text-rose-50',
        accent: 'from-rose-400/95 via-fuchsia-500/70 to-purple-500/70',
        iconColor: 'text-rose-100',
        icon: XCircle,
    },
} satisfies Record<string, { wrapper: string; accent: string; iconColor: string; icon: typeof Info }>;

function ToastCard({
    toast,
    onAcknowledge,
    onResolve,
}: {
    toast: ToastInstance;
    onAcknowledge: (toastId: string) => Promise<void>;
    onResolve: (toastId: string, action: ToastAction) => Promise<void>;
}) {
    const theme = useMemo(() => themes[toast.level] ?? themes.info, [toast.level]);
    const ThemeIcon = theme.icon;

    const isProcessing = toast.status === 'processing';
    const rawConversationMeta =
        toast.meta?.conversation_id ?? toast.meta?.conversationId ?? toast.meta?.conversation;
    const parsedConversationId =
        typeof rawConversationMeta === 'number'
            ? rawConversationMeta
            : typeof rawConversationMeta === 'string'
              ? Number.parseInt(rawConversationMeta, 10)
              : null;
    const conversationId =
        parsedConversationId !== null && Number.isFinite(parsedConversationId) ? parsedConversationId : null;
    const canQuickReply = conversationId !== null;
    const [replyOpen, setReplyOpen] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const [replyError, setReplyError] = useState<string | null>(null);

    const autoDismissToast = useMemo(
        () => (replyOpen ? { ...toast, requiresInteraction: true } : toast),
        [replyOpen, toast],
    );
    useToastAutoDismiss(autoDismissToast, onAcknowledge);

    const handleDismiss = () => {
        void onAcknowledge(toast.id);
    };

    const handleQuickReply = async () => {
        if (!conversationId) {
            return;
        }

        if (replyBody.trim() === '') {
            setReplyError('Add a message.');

            return;
        }

        try {
            setIsReplying(true);
            setReplyError(null);

            await http.post(`/api/conversations/${conversationId}/messages`, {
                body: replyBody,
            });

            setReplyBody('');
            setReplyOpen(false);
            setIsReplying(false);
            await onAcknowledge(toast.id);
        } catch (error) {
            setIsReplying(false);
            const message =
                typeof error === 'object' &&
                error !== null &&
                'response' in error &&
                typeof (error as { response?: { data?: { message?: string } } }).response === 'object'
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message ??
                      'Unable to send reply right now.'
                    : 'Unable to send reply right now.';
            setReplyError(message);
        }
    };

    return (
        <div
            className={cn(
                'pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border bg-opacity-90 backdrop-blur-xl transition duration-200',
                'animate-in slide-in-from-top-4 fade-in shadow-[0_40px_80px_-48px_rgba(0,0,0,0.85)]',
                isProcessing ? 'opacity-80' : 'opacity-100',
                theme.wrapper,
            )}
        >
            <div
                aria-hidden="true"
                className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-25',
                    theme.accent,
                )}
            />
            <div
                aria-hidden="true"
                className={cn(
                    'absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b',
                    theme.accent,
                )}
            />
            <button
                type="button"
                onClick={handleDismiss}
                className="absolute right-3 top-3 rounded-full p-1 text-white/75 transition hover:bg-white/10 hover:text-white"
                aria-label="Dismiss"
                disabled={isProcessing}
            >
                <X className="size-4" aria-hidden="true" />
            </button>

            <div className="relative flex flex-col gap-3 px-5 py-4 pr-11 text-sm leading-relaxed">
                <div className="flex items-start gap-3">
                    <div
                        className={cn(
                            'mt-0.5 flex items-center justify-center rounded-full bg-white/10 p-2 backdrop-blur-sm',
                            theme.iconColor,
                        )}
                    >
                        <ThemeIcon className="size-4" />
                    </div>
                    <div className="space-y-1">
                        {toast.title ? (
                            <p className="text-sm font-semibold tracking-tight text-white">{toast.title}</p>
                        ) : null}
                        <p className="text-sm text-white/80">{toast.body}</p>
                    </div>
                </div>

                {toast.error ? (
                    <div className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-100/90 backdrop-blur-sm">
                        {toast.error}
                    </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                    {toast.actions?.map((action) => (
                        <Button
                            key={action.key}
                            variant="ghost"
                            className={cn(
                                'rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/75 transition hover:border-white hover:bg-white/20 hover:text-white',
                                action.key === toast.activeActionKey && isProcessing ? 'border-white/30 bg-white/20 text-white' : null,
                            )}
                            disabled={isProcessing}
                            onClick={() => {
                                void onResolve(toast.id, action);
                            }}
                        >
                            {toast.activeActionKey === action.key && isProcessing ? 'Working…' : action.label}
                        </Button>
                    ))}

                    {canQuickReply && !replyOpen ? (
                        <Button
                            variant="ghost"
                            className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/75 transition hover:border-white hover:bg-white/20 hover:text-white"
                            disabled={isProcessing}
                            onClick={() => {
                                setReplyError(null);
                                setReplyOpen(true);
                            }}
                        >
                            Reply
                        </Button>
                    ) : null}

                    <Button
                        variant="ghost"
                        className="ml-auto rounded-full border border-white/15 bg-white/10 px-4 text-xs font-semibold uppercase tracking-[0.25em] text-white/75 transition hover:border-white hover:bg-white/20 hover:text-white"
                        disabled={isProcessing}
                        onClick={handleDismiss}
                    >
                        {isProcessing ? 'Closing…' : 'Dismiss'}
                    </Button>
                </div>

                {canQuickReply && replyOpen ? (
                    <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                        <textarea
                            value={replyBody}
                            onChange={(event) => {
                                setReplyBody(event.target.value);
                                setReplyError(null);
                            }}
                            placeholder="Send a quick reply…"
                            className="h-20 w-full resize-none rounded-2xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/90 placeholder:text-white/40 focus:border-amber-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                        />
                        {replyError ? (
                            <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100/90">{replyError}</div>
                        ) : null}
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                className="rounded-full border border-white/15 bg-white/10 px-4 text-xs uppercase tracking-[0.25em] text-white/70 transition hover:border-white/30 hover:bg-white/20 hover:text-white"
                                onClick={() => {
                                    setReplyOpen(false);
                                    setReplyBody('');
                                    setReplyError(null);
                                }}
                                disabled={isReplying}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-5 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_20px_45px_-18px_rgba(249,115,22,0.55)] transition hover:from-amber-400/90 hover:via-rose-500/90 hover:to-violet-600/90 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={isReplying || replyBody.trim() === ''}
                                onClick={() => {
                                    void handleQuickReply();
                                }}
                            >
                                {isReplying ? 'Sending…' : 'Send'}
                            </Button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default function ToastViewport(): JSX.Element | null {
    const { toasts, acknowledge, resolveAction } = useToasts();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        setMounted(true);

        return () => {
            setMounted(false);
        };
    }, []);

    if (!mounted || typeof document === 'undefined') {
        return null;
    }

    if (!toasts.length) {
        return null;
    }

    return createPortal(
        <div className="pointer-events-none fixed inset-0 z-[200] flex flex-col items-end gap-3 px-4 py-6 sm:px-6">
            <div className="flex w-full flex-col items-end gap-3 sm:max-w-sm">
                {toasts.map((toast) => (
                    <ToastCard
                        key={toast.id}
                        toast={toast}
                        onAcknowledge={(id) =>
                            acknowledge(id).catch((error) => {
                                console.error('Failed to dismiss toast.', error);
                            })
                        }
                        onResolve={(id, action) =>
                            resolveAction(id, action.key, action.payload ?? {}).catch((error) => {
                                console.error('Failed to resolve toast action.', error);
                            })
                        }
                    />
                ))}
            </div>
        </div>,
        document.body,
    );
}

