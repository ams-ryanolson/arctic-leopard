export type ProfileUser = {
    id: number;
    username: string;
    display_name: string | null;
    pronouns: string | null;
    bio: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    age: number | null;
    location_city: string | null;
    location_region: string | null;
    location_country: string | null;
    location: string | null;
    interests: string[];
    hashtags: string[];
    is_following?: boolean;
    can_follow?: boolean;
};

export type ProfileStat = {
    label: string;
    value: string;
};

export type Availability = {
    status: string;
    window: string;
    note: string;
};

export type SubscriptionTier = {
    name: string;
    price: string;
    description: string;
    perks: string[];
};

export type TipOption = {
    amount: string;
    label: string;
};

export type WishlistItem = {
    title: string;
    price: string;
    link: string;
};

export type FeedItem = {
    id: number;
    timestamp: string;
    title: string;
    content: string;
    media: string[];
};

export type ProfilePayload = {
    display_name: string;
    handle: string;
    location: string;
    pronouns: string;
    role: string;
    cover_image: string;
    avatar_url: string;
    bio: string;
    badges: string[];
    tags: string[];
    stats: ProfileStat[];
    availability: Availability;
    subscription_tiers: SubscriptionTier[];
    tip_options: TipOption[];
    wishlist: WishlistItem[];
    feed: FeedItem[];
};
