import { index as followingFeedIndex } from '@/actions/App/Http/Controllers/Feed/FollowingFeedController';
import { show as circleFeedShow } from '@/actions/App/Http/Controllers/Feed/CircleFeedController';
import { index as userFeedIndex } from '@/actions/App/Http/Controllers/Feed/UserFeedController';
import { index as bookmarkIndex } from '@/actions/App/Http/Controllers/Bookmarks/BookmarkController';
import { store as likeStore, destroy as unlikeRoute } from '@/actions/App/Http/Controllers/Posts/PostLikeController';
import {
    store as bookmarkStore,
    destroy as bookmarkDestroyRoute,
} from '@/actions/App/Http/Controllers/Posts/PostBookmarkController';
import { store as purchaseStore } from '@/actions/App/Http/Controllers/Posts/PurchaseController';
import { store as viewStore } from '@/actions/App/Http/Controllers/Posts/PostViewController';
import type { FeedPost, PostCollectionPayload, TimelinePayload } from '@/types/feed';
import { getCsrfToken } from '@/lib/csrf';

type FetchFeedOptions = {
    page?: number;
    signal?: AbortSignal;
    query?: Record<string, unknown>;
    mergeQuery?: boolean | Record<string, unknown>;
    pageName?: string;
};

type PurchasePayload = {
    amount: number;
    currency: string;
    provider?: string | null;
    provider_reference?: string | null;
    expires_at?: string | null;
    meta?: Record<string, unknown>;
};

type HeaderMap = Record<string, string>;

function buildHeaders(additional: HeaderMap = {}): HeaderMap {
    const headers: HeaderMap = {
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

export class FeedRequestError extends Error {
    public readonly status: number;

    public readonly payload: unknown;

    public constructor(message: string, status: number, payload: unknown) {
        super(message);
        this.status = status;
        this.payload = payload;
    }
}

function extractLocationQuery(): Record<string, string> {
    if (typeof window === 'undefined') {
        return {};
    }

    return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

function normalizeQueryValue(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (Array.isArray(value)) {
        return value.map((entry) => String(entry)).join(',');
    }

    return String(value);
}

function resolveQueryParameters(
    page: number,
    query: Record<string, unknown>,
    mergeQuery: FetchFeedOptions['mergeQuery'],
    pageName = 'page',
): Record<string, string> {
    let resolved: Record<string, unknown> = {};

    if (mergeQuery) {
        resolved =
            mergeQuery === true
                ? { ...extractLocationQuery() }
                : { ...mergeQuery };
    }

    resolved = {
        ...resolved,
        ...query,
        [pageName]: page,
    };

    return Object.entries(resolved).reduce<Record<string, string>>((accumulator, [key, value]) => {
        const normalized = normalizeQueryValue(value);

        if (normalized !== undefined && normalized !== '') {
            accumulator[key] = normalized;
        }

        return accumulator;
    }, {});
}

async function parseResponse<T>(response: Response): Promise<T> {
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
            (typeof problem === 'object' &&
            problem !== null &&
            'error' in problem &&
            typeof (problem as { error: unknown }).error === 'string'
                ? (problem as { error: string }).error
                : undefined) ??
            `Request failed with status ${response.status}`;

        throw new FeedRequestError(message, response.status, problem);
    }

    return (await response.json()) as T;
}

export async function fetchFollowingFeedPage(
    options: FetchFeedOptions = {},
): Promise<TimelinePayload> {
    const { page = 1, signal, query = {}, mergeQuery } = options;

    const resolvedQuery = resolveQueryParameters(page, query, mergeQuery);

    const url = followingFeedIndex.url({
        query: resolvedQuery,
    });

    const response = await fetch(url, {
        method: 'get',
        headers: buildHeaders(),
        credentials: 'include',
        signal,
    });

    return parseResponse<TimelinePayload>(response);
}

export async function fetchProfileFeedPage(
    user: number | string,
    options: FetchFeedOptions = {},
): Promise<PostCollectionPayload> {
    const { page = 1, signal, query = {}, mergeQuery, pageName } = options;

    const resolvedQuery = resolveQueryParameters(page, query, mergeQuery, pageName);

    const url = userFeedIndex.url({
        user,
        query: resolvedQuery,
    });

    const response = await fetch(url, {
        method: 'get',
        headers: buildHeaders(),
        credentials: 'include',
        signal,
    });

    return parseResponse<PostCollectionPayload>(response);
}

export async function fetchCircleFeedPage(
    circle: string,
    options: FetchFeedOptions = {},
): Promise<PostCollectionPayload> {
    const { page = 1, signal, query = {}, mergeQuery, pageName } = options;

    const resolvedQuery = resolveQueryParameters(page, query, mergeQuery, pageName);

    const url = circleFeedShow.url(circle, {
        query: resolvedQuery,
    });

    const response = await fetch(url, {
        method: 'get',
        headers: buildHeaders(),
        credentials: 'include',
        signal,
    });

    return parseResponse<PostCollectionPayload>(response);
}

export async function fetchBookmarksPage(
    options: FetchFeedOptions = {},
): Promise<TimelinePayload> {
    const {
        page = 1,
        signal,
        query = {},
        mergeQuery,
        pageName = 'bookmarks',
    } = options;

    const resolvedQuery = resolveQueryParameters(page, query, mergeQuery, pageName);

    const url = bookmarkIndex.url({
        query: resolvedQuery,
    });

    const response = await fetch(url, {
        method: 'get',
        headers: buildHeaders(),
        credentials: 'include',
        signal,
    });

    return parseResponse<TimelinePayload>(response);
}

export async function likePost(
    postId: number,
    options: { signal?: AbortSignal } = {},
): Promise<FeedPost> {
    const response = await fetch(likeStore.url(postId), {
        method: 'post',
        headers: buildHeaders(),
        credentials: 'include',
        signal: options.signal,
    });

    const payload = await parseResponse<{ data: FeedPost }>(response);

    return payload.data;
}

export async function unlikePost(
    postId: number,
    options: { signal?: AbortSignal } = {},
): Promise<FeedPost> {
    const response = await fetch(unlikeRoute.url(postId), {
        method: 'delete',
        headers: buildHeaders(),
        credentials: 'include',
        signal: options.signal,
    });

    const payload = await parseResponse<{ data: FeedPost }>(response);

    return payload.data;
}

export async function bookmarkPost(
    postId: number,
    options: { signal?: AbortSignal } = {},
): Promise<FeedPost> {
    const response = await fetch(bookmarkStore.url(postId), {
        method: 'post',
        headers: buildHeaders(),
        credentials: 'include',
        signal: options.signal,
    });

    const payload = await parseResponse<{ data: FeedPost }>(response);

    return payload.data;
}

export async function unbookmarkPost(
    postId: number,
    options: { signal?: AbortSignal } = {},
): Promise<FeedPost> {
    const response = await fetch(bookmarkDestroyRoute.url(postId), {
        method: 'delete',
        headers: buildHeaders(),
        credentials: 'include',
        signal: options.signal,
    });

    const payload = await parseResponse<{ data: FeedPost }>(response);

    return payload.data;
}

type RecordPostViewPayload = {
    sessionUuid?: string;
    context?: Record<string, unknown>;
};

export async function recordPostView(
    postId: number,
    payload: RecordPostViewPayload = {},
    options: { signal?: AbortSignal } = {},
): Promise<void> {
    const body: Record<string, unknown> = {};

    if (payload.sessionUuid) {
        body.session_uuid = payload.sessionUuid;
    }

    if (payload.context) {
        const filteredContext = Object.fromEntries(
            Object.entries(payload.context).filter(([, value]) => value !== undefined && value !== null),
        );

        if (Object.keys(filteredContext).length > 0) {
            body.context = filteredContext;
        }
    }

    const response = await fetch(viewStore.url(postId), {
        method: 'post',
        headers: buildHeaders({
            'Content-Type': 'application/json',
        }),
        credentials: 'include',
        signal: options.signal,
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });

    await parseResponse<unknown>(response);
}

export async function purchasePost(
    postId: number,
    payload: PurchasePayload,
    options: { signal?: AbortSignal } = {},
): Promise<FeedPost> {
    const response = await fetch(purchaseStore.url(postId), {
        method: 'post',
        headers: buildHeaders({
            'Content-Type': 'application/json',
        }),
        credentials: 'include',
        body: JSON.stringify(payload),
        signal: options.signal,
    });

    const body = await parseResponse<{ data: { post?: FeedPost } }>(response);

    if (!body.data.post) {
        throw new FeedRequestError('Purchase completed but post payload was missing.', response.status, body);
    }

    return body.data.post;
}

