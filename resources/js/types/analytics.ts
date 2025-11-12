import type { FeedPost } from '@/types/feed';

export type AnalyticsRangeOption = {
    value: '7d' | '14d' | '30d';
    label: string;
    active: boolean;
};

export type AnalyticsTimelinePoint = {
    date: string;
    views: number;
    unique_viewers: number;
    unique_authenticated_viewers: number;
    unique_guest_viewers: number;
    purchases: number;
};

export type AnalyticsTotals = {
    views: number;
    unique_viewers: number;
    unique_authenticated_viewers: number;
    unique_guest_viewers: number;
    purchases: number;
    conversion_rate: number;
};

export type AnalyticsTodaySnapshot = {
    views: number;
    unique_viewers: number;
    unique_authenticated_viewers: number;
    unique_guest_viewers: number;
    purchases: number;
};

export type CountryBreakdown = {
    data: Array<{
        country_code: string;
        country: string;
        views: number;
        percentage: number;
    }>;
    total: number;
};

export type RecentViewEvent = {
    occurred_at: string | null;
    country_code: string | null;
    viewer: {
        id: number;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
    } | null;
    context: Record<string, unknown>;
};

export type PostAnalyticsPageProps = {
    post: FeedPost;
    heading: {
        title: string;
        excerpt: string | null;
    };
    range: {
        value: '7d' | '14d' | '30d';
        start: string;
        end: string;
        options: AnalyticsRangeOption[];
    };
    metrics: {
        totals: AnalyticsTotals;
        today: AnalyticsTodaySnapshot;
        live: {
            includes_today: boolean;
            refreshed_at: string;
        };
    };
    timeline: AnalyticsTimelinePoint[];
    countries?: CountryBreakdown;
    recentViews?: RecentViewEvent[];
    can: {
        viewAnalytics: boolean;
    };
};

