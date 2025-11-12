import { router } from '@inertiajs/react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ToastContext, {
    type ToastClientHandler,
    type ToastContextValue,
    type ToastInstance,
} from '@/components/toasts/toast-context';
import { acknowledgeToast, resolveToastAction } from '@/lib/toasts-client';
import { useNotificationSubscription } from '@/hooks/use-notification-subscription';
import { useToastSubscription } from '@/hooks/use-toast-subscription';
import type { ToastPayload } from '@/types/toasts';

type ToastProviderProps = PropsWithChildren<{
    initialToasts?: ToastPayload[];
    authUserId?: number | null;
    initialUnreadCount?: number | string | null;
    initialMessagingUnreadCount?: number | string | null;
}>;

const DEFAULT_TIMEOUT_SECONDS = 6;

function normalizeToast(payload: ToastPayload): ToastInstance {
    return {
        ...payload,
        actions: payload.actions ?? [],
        requiresInteraction: payload.requiresInteraction ?? false,
        timeoutSeconds: payload.timeoutSeconds ?? null,
        status: 'idle',
        activeActionKey: null,
        error: null,
    };
}

function extractMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === 'string' && error.length > 0) {
        return error;
    }

    return fallback;
}

function normalizeCount(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.max(0, value);
    }

    if (typeof value === 'string' && value.trim() !== '') {
        const numeric = Number.parseInt(value, 10);

        if (Number.isFinite(numeric)) {
            return Math.max(0, numeric);
        }
    }

    return 0;
}

function emitUnreadCount(count: number): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(
        new CustomEvent('notifications:updated', {
            detail: { unreadCount: count },
        }),
    );
}

function emitNotificationReceived(notification: unknown): void {
    if (typeof window === 'undefined' || notification === undefined || notification === null) {
        return;
    }

    window.dispatchEvent(
        new CustomEvent('notifications:received', {
            detail: notification,
        }),
    );
}

export default function ToastProvider({
    initialToasts = [],
    authUserId = null,
    initialUnreadCount = 0,
    initialMessagingUnreadCount = 0,
    children,
}: ToastProviderProps) {
    const [toasts, setToasts] = useState<ToastInstance[]>(() =>
        initialToasts.map((toast) => normalizeToast(toast)),
    );
    const [unreadCount, setUnreadCount] = useState<number>(() => normalizeCount(initialUnreadCount));
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const messageUnreadCountRef = useRef<number>(normalizeCount(initialMessagingUnreadCount));
    const handlers = useRef<Map<string, ToastClientHandler>>(new Map());
    const toastsRef = useRef<ToastInstance[]>(toasts);

    useEffect(() => {
        toastsRef.current = toasts;
    }, [toasts]);

    useEffect(() => {
        setUnreadCount(normalizeCount(initialUnreadCount));
    }, [initialUnreadCount]);

    useEffect(() => {
        emitUnreadCount(unreadCount);
    }, [unreadCount]);

    const emitMessagingUnread = useCallback((count: number, source: 'provider' | 'page' | 'sidebar' = 'provider') => {
        messageUnreadCountRef.current = count;

        if (typeof window === 'undefined') {
            return;
        }

        window.dispatchEvent(
            new CustomEvent('messaging:unread-count', {
                detail: { count, source },
            }),
        );
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        emitMessagingUnread(messageUnreadCountRef.current, 'provider');

        const handler = (event: Event) => {
            const detail = (event as CustomEvent<{ count?: number; source?: string }>).detail;

            if (!detail || detail.source === 'provider' || typeof detail.count !== 'number') {
                return;
            }

            messageUnreadCountRef.current = detail.count;
        };

        window.addEventListener('messaging:unread-count', handler as EventListener);

        return () => {
            window.removeEventListener('messaging:unread-count', handler as EventListener);
        };
    }, [emitMessagingUnread]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const handler = (event: Event) => {
            const detail = (event as CustomEvent<{ id?: number | null }>).detail;
            const candidate = detail?.id ?? null;
            setActiveConversationId(
                typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : null,
            );
        };

        window.addEventListener('messaging:active-conversation', handler as EventListener);

        return () => {
            window.removeEventListener('messaging:active-conversation', handler as EventListener);
        };
    }, []);

    const upsertToast = useCallback((payload: ToastPayload) => {
        setToasts((current) => {
            const candidate = normalizeToast(payload);
            const existingIndex = current.findIndex((toast) => toast.id === candidate.id);

            if (existingIndex === -1) {
                return [...current, candidate];
            }

            const next = [...current];
            const existing = next[existingIndex];

            next[existingIndex] = {
                ...existing,
                ...candidate,
                status: existing.status,
                activeActionKey: existing.activeActionKey,
                error: null,
            };

            return next;
        });
    }, []);

    const shouldSuppressToast = useCallback(
        (payload: ToastPayload): boolean => {
            if (!payload.meta) {
                return false;
            }

            const rawConversation =
                payload.meta.conversation_id ?? payload.meta.conversationId ?? payload.meta.conversation;

            const parsedConversationId =
                typeof rawConversation === 'number'
                    ? rawConversation
                    : typeof rawConversation === 'string'
                      ? Number.parseInt(rawConversation, 10)
                      : null;

            if (parsedConversationId === null || !Number.isFinite(parsedConversationId)) {
                return false;
            }

            return payload.category === 'messaging' && parsedConversationId === activeConversationId;
        },
        [activeConversationId],
    );

    const ingest = useCallback(
        (payloads: ToastPayload[], options: { suppressMessagingIncrement?: boolean } = {}) => {
            const { suppressMessagingIncrement = false } = options;

            if (!payloads?.length) {
                return;
            }

            payloads.forEach((payload) => {
                if (shouldSuppressToast(payload)) {
                    void acknowledgeToast(payload.id).catch(() => {});

                    return;
                }

                upsertToast(payload);
                if (payload.category === 'messaging' && !suppressMessagingIncrement) {
                    emitMessagingUnread(messageUnreadCountRef.current + 1);
                }
            });
        },
        [emitMessagingUnread, shouldSuppressToast, upsertToast],
    );

    useEffect(() => {
        if (initialToasts.length) {
            ingest(initialToasts, { suppressMessagingIncrement: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        return router.on('success', (event) => {
            const pageProps = event.detail.page.props as {
                toasts?: ToastPayload[];
                notifications?: { unread_count?: number | string | null };
            };
            const pageToasts = pageProps.toasts ?? [];
            const nextUnread = pageProps.notifications?.unread_count;

            if (pageToasts.length) {
                ingest(pageToasts);
            }

            if (nextUnread !== undefined) {
                setUnreadCount(normalizeCount(nextUnread));
            }
        });
    }, [ingest]);

    useToastSubscription(authUserId, (toast) => {
        if (shouldSuppressToast(toast)) {
            void acknowledgeToast(toast.id).catch(() => {});

            return;
        }

        upsertToast(toast);
        if (toast.category === 'messaging') {
            emitMessagingUnread(messageUnreadCountRef.current + 1);
        }
    });

    useNotificationSubscription(authUserId, {
        onNotification: (payload) => {
            if (payload.unread_count !== undefined) {
                setUnreadCount(normalizeCount(payload.unread_count));
            }

            if (payload.notification) {
                emitNotificationReceived(payload.notification);
            }
        },
    });

    const acknowledge = useCallback(async (toastId: string) => {
        setToasts((current) =>
            current.map((toast) =>
                toast.id === toastId
                    ? { ...toast, status: 'processing', activeActionKey: null, error: null }
                    : toast,
            ),
        );

        try {
            await acknowledgeToast(toastId);
            setToasts((current) => current.filter((toast) => toast.id !== toastId));
        } catch (error) {
            const message = extractMessage(error, 'Unable to dismiss notification.');
            setToasts((current) =>
                current.map((toast) =>
                    toast.id === toastId
                        ? { ...toast, status: 'idle', activeActionKey: null, error: message }
                        : toast,
                ),
            );
        }
    }, []);

    const resolveAction = useCallback(
        async (toastId: string, actionKey: string, input: Record<string, unknown> = {}) => {
            const toast = toastsRef.current.find((entry) => entry.id === toastId);

            if (!toast) {
                return;
            }

            const action = toast.actions?.find((candidate) => candidate.key === actionKey);

            if (!action) {
                console.warn('Attempted to resolve unknown toast action.', { toastId, actionKey });
                return;
            }

            const method = action.method ?? 'http.post';
            const resolvedInput =
                input && Object.keys(input).length > 0 ? input : (action.payload ?? {});

            if (method === 'client') {
                const handler = handlers.current.get(action.key);

                if (!handler) {
                    console.warn('No client handler registered for toast action.', { toastId, actionKey });
                    return;
                }

                try {
                    await handler(toast, action, resolvedInput);
                    await acknowledge(toastId);
                } catch (error) {
                    const message = extractMessage(error, 'Unable to complete action.');
                    setToasts((current) =>
                        current.map((candidate) =>
                            candidate.id === toastId
                                ? {
                                      ...candidate,
                                      status: 'idle',
                                      activeActionKey: null,
                                      error: message,
                                  }
                                : candidate,
                        ),
                    );
                }

                return;
            }

            if (method === 'router.visit') {
                if (!action.route) {
                    console.warn('Toast action is missing a route target.', { toastId, actionKey });
                    return;
                }

                try {
                    await acknowledge(toastId);
                } catch (error) {
                    const message = extractMessage(error, 'Unable to dismiss notification.');
                    setToasts((current) =>
                        current.map((candidate) =>
                            candidate.id === toastId
                                ? {
                                      ...candidate,
                                      status: 'idle',
                                      activeActionKey: null,
                                      error: message,
                                  }
                                : candidate,
                        ),
                    );

                    return;
                }

                router.visit(action.route, {
                    preserveScroll: true,
                    preserveState: true,
                });

                return;
            }

            if (method.startsWith('inertia.')) {
                if (!action.route) {
                    console.warn('Toast action is missing a route target.', { toastId, actionKey });
                    return;
                }

                const requestMethod = method.split('.')[1] ?? 'post';

                try {
                    await acknowledge(toastId);
                } catch (error) {
                    const message = extractMessage(error, 'Unable to dismiss notification.');
                    setToasts((current) =>
                        current.map((candidate) =>
                            candidate.id === toastId
                                ? {
                                      ...candidate,
                                      status: 'idle',
                                      activeActionKey: null,
                                      error: message,
                                  }
                                : candidate,
                        ),
                    );

                    return;
                }

                router.visit(
                    action.route,
                    {
                        method: requestMethod as 'get' | 'post' | 'put' | 'patch' | 'delete',
                        data: resolvedInput,
                        preserveScroll: true,
                        preserveState: true,
                    } as Parameters<typeof router.visit>[1],
                );

                return;
            }

            setToasts((current) =>
                current.map((candidate) =>
                    candidate.id === toastId
                        ? {
                              ...candidate,
                              status: 'processing',
                              activeActionKey: actionKey,
                              error: null,
                          }
                        : candidate,
                ),
            );

            try {
                await resolveToastAction(toastId, actionKey, resolvedInput);
                setToasts((current) => current.filter((candidate) => candidate.id !== toastId));
            } catch (error) {
                const message = extractMessage(error, 'Unable to complete action.');
                setToasts((current) =>
                    current.map((candidate) =>
                        candidate.id === toastId
                            ? {
                                  ...candidate,
                                  status: 'idle',
                                  activeActionKey: null,
                                  error: message,
                              }
                            : candidate,
                    ),
                );
            }
        },
        [acknowledge],
    );

    const registerClientAction = useCallback((actionKey: string, handler: ToastClientHandler) => {
        handlers.current.set(actionKey, handler);

        return () => {
            handlers.current.delete(actionKey);
        };
    }, []);

    const contextValue = useMemo<ToastContextValue>(
        () => ({
            toasts,
            show: upsertToast,
            ingest,
            acknowledge,
            resolveAction,
            registerClientAction,
        }),
        [acknowledge, ingest, resolveAction, registerClientAction, toasts, upsertToast],
    );

    return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>;
}

export function useToastAutoDismiss(
    toast: ToastInstance,
    acknowledge: ToastContextValue['acknowledge'],
): void {
    useEffect(() => {
        if (toast.requiresInteraction) {
            return undefined;
        }

        const timeout =
            toast.timeoutSeconds !== null && toast.timeoutSeconds !== undefined
                ? toast.timeoutSeconds
                : DEFAULT_TIMEOUT_SECONDS;

        if (timeout <= 0) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            acknowledge(toast.id).catch((error) => {
                console.error('Failed to auto-dismiss toast.', error);
            });
        }, timeout * 1_000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [acknowledge, toast]);
}

