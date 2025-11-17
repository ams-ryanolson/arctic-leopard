import { stories } from '@/routes';
import { router } from '@inertiajs/react';

export type StoryItem = {
    id: number;
    username: string;
    display_name: string;
    avatar_url: string | null;
    latest_story_preview: string | null;
    story_count: number;
    has_new_stories: boolean;
};

export type StoriesResponse = {
    data: StoryItem[];
};

export type StoryMedia = {
    id: number;
    url: string | null;
    optimized_url: string | null;
    thumbnail_url: string | null;
    blur_url: string | null;
    is_blurred: boolean;
    mime_type: string;
    width: number | null;
    height: number | null;
    duration: number | null;
};

export type StoryReaction = {
    emoji: string;
    count: number;
    reacted: boolean;
};

export type StoryResponse = {
    id: number;
    user_id: number;
    position: number;
    audience: string;
    is_subscriber_only: boolean;
    scheduled_at: string | null;
    published_at: string | null;
    expires_at: string | null;
    views_count: number;
    reactions_count: number;
    has_viewed: boolean;
    is_expired: boolean;
    author: {
        id: number;
        username: string;
        display_name: string;
        name: string;
        avatar_url: string | null;
        is_verified: boolean;
    } | null;
    media: StoryMedia | null;
    reactions: StoryReaction[];
    viewer_reactions: string[];
    created_at: string | null;
    updated_at: string | null;
    can: {
        viewAnalytics: boolean;
        delete: boolean;
    };
};

export type CreateStoryData = {
    media: Array<{
        disk: string;
        path: string;
        thumbnail_path?: string | null;
        blur_path?: string | null;
        mime_type: string;
        width?: number | null;
        height?: number | null;
        duration?: number | null;
        size?: number | null;
        meta?: Record<string, unknown>;
    }>;
    audience: string;
    is_subscriber_only?: boolean;
    scheduled_at?: string | null;
    position?: number;
};

export type ReactionResponse = {
    reactions: StoryReaction[];
    reactions_count: number;
};

export type AnalyticsResponse = {
    views_count: number;
    reactions_count: number;
    reactions: StoryReaction[];
    published_at: string | null;
    expires_at: string | null;
    is_expired: boolean;
};

/**
 * Fetch stories for dashboard.
 */
export async function fetchStories(): Promise<StoriesResponse> {
    return new Promise((resolve, reject) => {
        router.get(
            stories().url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['stories'],
                onSuccess: (page) => {
                    resolve({
                        data:
                            (page.props as { stories?: StoryItem[] }).stories ??
                            [],
                    });
                },
                onError: (errors) => {
                    reject(errors);
                },
            },
        );
    });
}

/**
 * Create a new story.
 */
export async function createStory(
    data: CreateStoryData,
): Promise<StoryResponse> {
    return new Promise((resolve, reject) => {
        router.post(stories().url, data, {
            preserveState: false,
            preserveScroll: false,
            onSuccess: (page) => {
                // The response should contain the created story
                resolve(page.props as unknown as StoryResponse);
            },
            onError: (errors) => {
                reject(errors);
            },
        });
    });
}

/**
 * View a story (marks it as viewed).
 */
export async function viewStory(storyId: number): Promise<void> {
    return new Promise((resolve, reject) => {
        router.post(
            stories(storyId).url + '/view',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    resolve();
                },
                onError: (errors) => {
                    reject(errors);
                },
            },
        );
    });
}

/**
 * Delete a story.
 */
export async function deleteStory(storyId: number): Promise<void> {
    return new Promise((resolve, reject) => {
        router.delete(
            stories(storyId).url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    resolve();
                },
                onError: (errors) => {
                    reject(errors);
                },
            },
        );
    });
}

/**
 * Toggle a reaction on a story.
 */
export async function toggleReaction(
    storyId: number,
    emoji: string,
): Promise<ReactionResponse> {
    return new Promise((resolve, reject) => {
        router.post(
            stories(storyId).url + '/reactions',
            { emoji },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    resolve(page.props as unknown as ReactionResponse);
                },
                onError: (errors) => {
                    reject(errors);
                },
            },
        );
    });
}

/**
 * Get story analytics.
 */
export async function getStoryAnalytics(
    storyId: number,
): Promise<AnalyticsResponse> {
    return new Promise((resolve, reject) => {
        router.get(
            stories(storyId).url + '/analytics',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    resolve(page.props as unknown as AnalyticsResponse);
                },
                onError: (errors) => {
                    reject(errors);
                },
            },
        );
    });
}
