export type Participant = {
    id: number;
    display_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    is_viewer: boolean;
};

export type ReactionSummary = {
    emoji: string;
    variant?: string | null;
    count: number;
    reacted: boolean;
};

export type Attachment = {
    id: number;
    type: string;
    url: string | null;
    filename: string;
    thumbnail_url?: string | null;
    optimized_path?: string | null;
    optimized_url?: string | null;
    blur_url?: string | null;
    disk?: string | null;
    mime_type?: string | null;
    size?: number | null;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
    ordering?: number | null;
    is_inline?: boolean;
    is_primary?: boolean;
    meta?: Record<string, unknown> | null;
};

export type Message = {
    id: number;
    conversation_id: number;
    sequence: number;
    reply_to_id?: number | null;
    author: {
        id: number | null;
        username?: string | null;
        display_name?: string | null;
        avatar_url?: string | null;
    } | null;
    type: string;
    body: string | null;
    fragments?: unknown;
    metadata?: Record<string, unknown> | null;
    attachments?: Attachment[];
    reaction_summary?: ReactionSummary[];
    viewer_reactions?: { emoji: string; variant?: string | null }[];
    created_at?: string | null;
    updated_at?: string | null;
    deleted_at?: string | null;
};

export type TipMessageMetadata = {
    amount?: number;
    currency?: string;
    status?: 'pending' | 'completed' | 'accepted' | 'declined';
    mode?: 'send' | 'request';
    payment_method?: string;
    requester_id?: number;
    responder_id?: number;
    responded_at?: string;
    mock?: boolean;
    originating_request_id?: number;
};

export type Thread = {
    id: number;
    ulid: string;
    title: string;
    subject?: string | null;
    is_group: boolean;
    last_message: Message | null;
    last_message_at?: string | null;
    unread_count: number;
    participants: Participant[];
};

export type ActiveConversation = {
    id: number;
    ulid: string;
    title: string;
    subject?: string | null;
    is_group: boolean;
    participants: Participant[];
};

export type PresenceMember = {
    id: number;
    name: string;
    avatar?: string | null;
    role?: string | null;
};

export type MessagingPreferences = {
    message_request_mode: 'no-one' | 'verified' | 'following' | 'verified-and-following' | 'everyone';
    allow_subscriber_messages: boolean;
    filter_low_quality: boolean;
};
