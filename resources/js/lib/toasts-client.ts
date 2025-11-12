import { acknowledge, action as resolveRoute } from '@/routes/toasts';
import type { ToastAction, ToastPayload } from '@/types/toasts';
import { getCsrfToken } from '@/lib/csrf';

type ToastActionResponse = {
    toast: ToastPayload;
    action: ToastAction;
    input?: Record<string, unknown>;
};

function buildHeaders(contentType: string | null = 'application/json'): HeadersInit {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    if (contentType) {
        headers['Content-Type'] = contentType;
    }

    const csrf = getCsrfToken();

    if (csrf) {
        headers['X-XSRF-TOKEN'] = csrf;
    }

    return headers;
}

async function handleResponse(response: Response): Promise<unknown> {
    if (response.ok) {
        if (response.status === 204) {
            return null;
        }

        try {
            return await response.json();
        } catch {
            return null;
        }
    }

    let message = `Request failed with status ${response.status}`;

    try {
        const problem = await response.json();

        if (problem && typeof problem === 'object' && 'message' in problem && typeof problem.message === 'string') {
            message = problem.message;
        }
    } catch {
        // ignore
    }

    throw new Error(message);
}

export async function acknowledgeToast(toastId: string): Promise<void> {
    const response = await fetch(acknowledge.url(toastId), {
        method: 'post',
        credentials: 'include',
        headers: buildHeaders(null),
    });

    await handleResponse(response);
}

export async function resolveToastAction(
    toastId: string,
    actionKey: string,
    payload: Record<string, unknown> = {},
): Promise<ToastActionResponse> {
    const response = await fetch(resolveRoute.url(toastId), {
        method: 'post',
        credentials: 'include',
        headers: buildHeaders(),
        body: JSON.stringify({ action: actionKey, payload }),
    });

    const data = await handleResponse(response);

    if (!data || typeof data !== 'object') {
        throw new Error('Unexpected response while resolving toast action.');
    }

    const typed = data as Partial<ToastActionResponse>;

    if (!typed.toast || !typed.action) {
        throw new Error('Incomplete response received from toast action endpoint.');
    }

    return typed as ToastActionResponse;
}

