import type { ToastAction, ToastPayload } from '@/types/toasts';
import { createContext, useContext } from 'react';

export type ToastInstance = ToastPayload & {
    status: 'idle' | 'processing';
    activeActionKey: string | null;
    error?: string | null;
};

export type ToastClientHandler = (
    toast: ToastPayload,
    action: ToastAction,
    input?: Record<string, unknown>,
) => Promise<void> | void;

export type ToastContextValue = {
    toasts: ToastInstance[];
    show: (toast: ToastPayload) => void;
    ingest: (toasts: ToastPayload[]) => void;
    acknowledge: (toastId: string) => Promise<void>;
    resolveAction: (
        toastId: string,
        actionKey: string,
        input?: Record<string, unknown>,
    ) => Promise<void>;
    registerClientAction: (
        actionKey: string,
        handler: ToastClientHandler,
    ) => () => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToasts(): ToastContextValue {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToasts must be used within a ToastProvider.');
    }

    return context;
}

export default ToastContext;


