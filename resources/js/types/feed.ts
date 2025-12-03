export type FeedMedia = {
    id: number;
    url: string;
    type: string | null;
    alt: string | null;
    thumbnail_url: string | null;
    optimized_url: string | null;
    blur_url: string | null;
};

export type FeedPollOption = {
    id: number;
    title: string;
    vote_count: number;
    position: number;
};

export type FeedPoll = {
    id: number;
    question: string;
    allow_multiple: boolean;
    max_choices: number | null;
    closes_at: string | null;
    options: FeedPollOption[];
};

export type FeedAuthor = {
    id: number;
    username: string;
    name?: string | null;
    display_name: string | null;
    avatar_url: string | null;
    is_verified?: boolean;
};

export type FeedPost = {
    id: number;
    ulid?: string;
    type: string;
    audience: string;
    is_system: boolean;
    is_pinned: boolean;
    body: string | null;
    extra_attributes: Record<string, unknown> | unknown[] | null;
    likes_count: number;
    has_liked: boolean;
    bookmark_count: number;
    is_bookmarked: boolean;
    bookmark_id: number | null;
    comments_count: number;
    reposts_count: number;
    has_amplified?: boolean;
    reposted_post_id?: number | null;
    original_post?: FeedPost | null;
    amplified_by?: FeedAuthor[];
    poll_votes_count: number;
    views_count: number;
    paywall_price: number | null;
    paywall_currency: string | null;
    scheduled_at: string | null;
    published_at: string | null;
    expires_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    locked: boolean;
    author: FeedAuthor | null;
    media: FeedMedia[];
    poll?: FeedPoll | null;
    hashtags?: string[];
    can?: {
        viewAnalytics: boolean;
        bookmark?: boolean;
    };
};

export type AdCreative = {
    id: number;
    ad_id: number;
    placement: string;
    size: string;
    asset_type: string;
    asset_path: string | null;
    asset_url: string | null;
    headline: string | null;
    body_text: string | null;
    cta_text: string | null;
    cta_url: string;
    display_order: number;
    is_active: boolean;
};

export type TimelineEntry = {
    id?: number;
    type?: 'ad';
    visibility_source?: string;
    context?: Record<string, unknown>;
    visible_at?: string | null;
    created_at?: string | null;
    post: FeedPost | null;
    ad?: AdCreative;
};

export type PaginationLinks = {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
};

export type PaginationLinkItem = {
    url: string | null;
    label: string;
    active: boolean;
};

export type PaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
    path?: string;
    links?: PaginationLinkItem[];
};

export type Paginated<T> = {
    data: T[];
    links: PaginationLinks;
    meta: PaginationMeta;
};

export type TimelinePayload = Paginated<TimelineEntry>;

export type PostCollectionPayload = Paginated<FeedPost>;

export type CommentCollectionPayload = Paginated<Comment>;

export type FeedComposerConfig = {
    can_post: boolean;
    post_types: FeedFilterOption[];
    audiences: FeedFilterOption[];
    media: {
        max_file_size_kb: number;
        accepted_mime_types: string[];
    };
};

export type ViewerContext = {
    id: number | null;
    name: string | null;
    has_completed_profile: boolean;
};

export type FeedPulseMetric = {
    title: string;
    value: string;
    description: string;
};

export type TrendingTag = {
    id: number;
    tag: string;
    usage_count: number;
};

export type FeedFilterOption = {
    value: string;
    label: string;
};

export type FeedFiltersGroup = {
    types: FeedFilterOption[];
    audiences: FeedFilterOption[];
    time_ranges: FeedFilterOption[];
    sort: FeedFilterOption[];
    media: FeedFilterOption[];
};

export type CommentAuthor = {
    id: number;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
};

export type Comment = {
    id: number;
    body: string | null;
    parent_id: number | null;
    depth: number;
    is_pinned: boolean;
    likes_count: number;
    replies_count: number;
    created_at: string | null;
    edited_at: string | null;
    deleted_at: string | null;
    is_deleted: boolean;
    is_hidden?: boolean;
    placeholder?: string | null;
    has_liked: boolean;
    can_delete: boolean;
    can_reply: boolean;
    can_like: boolean;
    author: CommentAuthor | null;
    replies: Comment[];
};

export type ScrollMetadataPayload = {
    pageName: string;
    previousPage: number | null;
    nextPage: number | null;
    currentPage: number;
};
