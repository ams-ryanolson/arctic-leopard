import { getCsrfToken } from '@/lib/csrf';
import { FeedRequestError } from '@/lib/feed-client';
import {
    destroy as commentsDestroy,
    index as commentsIndex,
    store as commentsStore,
} from '@/routes/posts/comments';
import {
    destroy as commentLikeDestroy,
    store as commentLikeStore,
} from '@/routes/posts/comments/like';
import type { Comment, CommentCollectionPayload } from '@/types/feed';

type HeaderMap = Record<string, string>;

type FetchCommentsOptions = {
    page?: number;
    signal?: AbortSignal;
};

type CreateCommentPayload = {
    body: string;
    parentId?: number | null;
};

type RequestOptions = {
    signal?: AbortSignal;
};

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

export async function fetchComments(
    postId: number | string,
    options: FetchCommentsOptions = {},
): Promise<CommentCollectionPayload> {
    const { page = 1, signal } = options;

    const url = commentsIndex.url(postId, {
        query: { page },
    });

    const response = await fetch(url, {
        method: 'get',
        credentials: 'include',
        headers: buildHeaders(),
        signal,
    });

    return parseResponse<CommentCollectionPayload>(response);
}

export async function createComment(
    postId: number | string,
    payload: CreateCommentPayload,
    options: RequestOptions = {},
): Promise<Comment> {
    const response = await fetch(commentsStore.url(postId), {
        method: 'post',
        credentials: 'include',
        headers: buildHeaders({
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
            body: payload.body,
            parent_id: payload.parentId ?? null,
        }),
        signal: options.signal,
    });

    const body = await parseResponse<{ data: Comment }>(response);

    return body.data;
}

export async function deleteComment(
    postId: number | string,
    commentId: number,
    options: RequestOptions = {},
): Promise<Comment> {
    const response = await fetch(commentsDestroy.url([postId, commentId]), {
        method: 'delete',
        credentials: 'include',
        headers: buildHeaders(),
        signal: options.signal,
    });

    const body = await parseResponse<{ data: Comment }>(response);

    return body.data;
}

export async function likeComment(
    postId: number | string,
    commentId: number,
    options: RequestOptions = {},
): Promise<Comment> {
    const response = await fetch(commentLikeStore.url([postId, commentId]), {
        method: 'post',
        credentials: 'include',
        headers: buildHeaders(),
        signal: options.signal,
    });

    const body = await parseResponse<{ data: Comment }>(response);

    return body.data;
}

export async function unlikeComment(
    postId: number | string,
    commentId: number,
    options: RequestOptions = {},
): Promise<Comment> {
    const response = await fetch(commentLikeDestroy.url([postId, commentId]), {
        method: 'delete',
        credentials: 'include',
        headers: buildHeaders(),
        signal: options.signal,
    });

    const body = await parseResponse<{ data: Comment }>(response);

    return body.data;
}
