export type ToastLevel = 'info' | 'success' | 'warning' | 'danger';

export type ToastCategory = 'notification' | 'cta' | 'modal' | 'messaging';

export type ToastActionMethod =
    | 'client'
    | 'inertia.post'
    | 'inertia.put'
    | 'inertia.delete'
    | 'router.visit'
    | 'http.post'
    | 'http.put'
    | 'http.delete';

export type ToastAction = {
    key: string;
    label: string;
    method?: ToastActionMethod;
    route?: string;
    payload?: Record<string, unknown> | null;
    meta?: Record<string, unknown>;
};

export type ToastPayload = {
    id: string;
    level: ToastLevel;
    category: ToastCategory;
    body: string;
    title?: string | null;
    icon?: string | null;
    actions?: ToastAction[];
    requiresInteraction?: boolean;
    timeoutSeconds?: number | null;
    meta?: Record<string, unknown>;
};
