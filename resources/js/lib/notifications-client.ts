import notificationsRoutes from '@/routes/notifications';
import { getCsrfToken } from '@/lib/csrf';
import { FeedRequestError } from '@/lib/feed-client';
import type { NotificationPage } from '@/types/notifications';

type FetchNotificationsOptions = {
    page?: number;
    filter?: string;
    pageName?: string;
    signal?: AbortSignal;
};

type MarkReadResponse = {
    id: string;
    read_at: string | null;
    unread_count: number;
};

type UnreadCountResponse = {
    count: number;
};

type MarkAllReadResponse = {
    unread_count: number;
};

type DeleteResponse = {
    id: string;
    unread_count: number;
};

type DeleteAllResponse = {
    unread_count: number;
};

type HeadersMap = Record<string, string>;

function buildHeaders(additional: HeadersMap = {}): HeadersMap {
    const headers: HeadersMap = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...additional,
    };

    if (!headers['X-XSRF-TOKEN']) {
        const csrfToken = getCsrfToken();

        if (csrfToken) {
            headers['X-XSRF-TOKEN'] = csrfToken;
        }
    }

    return headers;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let problem: unknown = null;

        try {
            problem = await response.json();
        } catch {
            problem = await response.text();
        }

        const message =
            (typeof problem === 'object' &&
                problem !== null &&
                'message' in problem &&
                typeof (problem as { message: unknown }).message === 'string'
                ? (problem as { message: string }).message
                : undefined) ??
            `Request failed with status ${response.status}`;

        throw new FeedRequestError(message, response.status, problem);
    }

    return (await response.json()) as T;
}

export async function fetchNotificationsPage(
    options: FetchNotificationsOptions = {},
): Promise<NotificationPage> {
    const {
        page = 1,
        filter,
        pageName = 'notifications',
        signal,
    } = options;

    const query: Record<string, unknown> = {
        [pageName]: page,
    };

    if (filter) {
        query.filter = filter;
    }

    const response = await fetch(
        notificationsRoutes.index.url({
            query,
        }),
        {
            method: 'get',
            headers: buildHeaders(),
            credentials: 'include',
            signal,
        },
    );

    return parseJsonResponse<NotificationPage>(response);
}

export async function markNotificationRead(notificationId: string): Promise<MarkReadResponse> {
    const formData = new URLSearchParams({
        _method: 'PATCH',
    });

    const response = await fetch(
        notificationsRoutes.markRead.url({
            notification: notificationId,
        }),
        {
            method: 'post',
            headers: buildHeaders(),
            credentials: 'include',
            body: formData,
        },
    );

    return parseJsonResponse<MarkReadResponse>(response);
}

export async function markAllNotificationsRead(): Promise<MarkAllReadResponse> {
    const response = await fetch(notificationsRoutes.markAllRead.url(), {
        method: 'post',
        headers: buildHeaders({
            'Content-Type': 'application/json',
        }),
        credentials: 'include',
        body: JSON.stringify({}),
    });

    return parseJsonResponse<MarkAllReadResponse>(response);
}

export async function fetchUnreadNotificationCount(): Promise<number> {
    const response = await fetch(notificationsRoutes.unreadCount.url(), {
        method: 'get',
        headers: buildHeaders(),
        credentials: 'include',
    });

    const payload = await parseJsonResponse<UnreadCountResponse>(response);

    return payload.count;
}

export async function deleteNotification(notificationId: string): Promise<DeleteResponse> {
    const response = await fetch(
        notificationsRoutes.destroy.url({
            notification: notificationId,
        }),
        {
            method: 'delete',
            headers: buildHeaders(),
            credentials: 'include',
        },
    );

    return parseJsonResponse<DeleteResponse>(response);
}

export async function deleteAllNotifications(): Promise<DeleteAllResponse> {
    const response = await fetch(notificationsRoutes.destroyAll.url(), {
        method: 'delete',
        headers: buildHeaders(),
        credentials: 'include',
    });

    return parseJsonResponse<DeleteAllResponse>(response);
}

