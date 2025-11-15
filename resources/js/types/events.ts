import { type Paginated } from '@/types/feed';

export type EventStatus = 'draft' | 'pending' | 'published' | 'cancelled' | 'archived';

export type EventModality = 'in_person' | 'virtual' | 'hybrid';

export type EventType =
    | 'party'
    | 'seminar'
    | 'workshop'
    | 'meetup'
    | 'conference'
    | 'social'
    | 'performance'
    | 'other';

export type EventRsvpStatus = 'going' | 'tentative' | 'cancelled';

export type BasicUser = {
    id: number;
    username: string;
    display_name?: string | null;
    name?: string | null;
    avatar_url?: string | null;
};

export type EventTag = {
    id: number;
    name: string;
    slug: string;
    color?: string | null;
    icon?: string | null;
    description?: string | null;
    display_order: number;
    is_active: boolean;
};

export type EventLocation = {
    name: string | null;
    venue: string | null;
    address: string | null;
    city: string | null;
    region: string | null;
    postal_code: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
};

export type EventMedia = {
    id: number;
    disk: string;
    path: string;
    thumbnail_path: string | null;
    media_type: 'image' | 'video' | string;
    title: string | null;
    caption: string | null;
    position: number;
    meta: Record<string, unknown>;
    uploaded_at: string | null;
};

export type EventOccurrence = {
    id: number;
    slug: string;
    title: string;
    starts_at: string | null;
    ends_at: string | null;
    status: EventStatus;
};

export type EventRsvp = {
    id: number;
    status: EventRsvpStatus;
    guest_count: number;
    note: string | null;
    responded_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    user?: BasicUser | null;
};

export type Event = {
    id: number;
    slug: string;
    series_id: string | null;
    parent_event_id: number | null;
    title: string;
    subtitle: string | null;
    description: string;
    status: EventStatus;
    type: EventType;
    modality: EventModality;
    timezone: string;
    starts_at: string | null;
    ends_at: string | null;
    avatar_path: string | null;
    cover_path: string | null;
    virtual_meeting_url: string | null;
    is_recurring: boolean;
    recurrence_rule: string | null;
    rsvp_limit: number | null;
    allow_guests: boolean;
    is_past: boolean;
    requirements: unknown;
    extra_attributes: Record<string, unknown>;
    location: EventLocation;
    manager: BasicUser | null;
    creator: BasicUser | null;
    submitter: BasicUser | null;
    approver: BasicUser | null;
    tags: EventTag[];
    media: EventMedia[];
    occurrences: EventOccurrence[];
    submission_notes: string | null;
    admin_notes: string | null;
    submitted_at: string | null;
    approved_at: string | null;
    published_at: string | null;
    cancelled_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
    rsvp_summary: {
        going: number;
        tentative: number;
        cancelled: number;
        total: number;
    };
    viewer_rsvp: EventRsvp | null;
    can: {
        update: boolean;
        manageRsvps: boolean;
        cancel: boolean;
        publish: boolean;
        approve: boolean;
        rsvp: boolean;
    };
};

export type EventCollection = Paginated<Event>;

export type EventFilters = {
    search?: string | null;
    status?: EventStatus | '';
    modality?: EventModality | '';
    type?: EventType | '';
    tags?: number[] | string[] | null;
    location_city?: string | null;
    location_region?: string | null;
    location_country?: string | null;
    location_latitude?: number | string | null;
    location_longitude?: number | string | null;
};

export type EventMeta = {
    statuses?: EventStatus[];
    modalities: EventModality[];
    types: EventType[];
    tags: EventTag[];
};

const monthDayFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
});

export function formatEventDateRange(event: Pick<Event, 'starts_at' | 'ends_at'>): string {
    if (!event.starts_at) {
        return 'TBA';
    }

    const start = new Date(event.starts_at);
    const end = event.ends_at ? new Date(event.ends_at) : null;

    if (!end) {
        return dateTimeFormatter.format(start);
    }

    if (start.toDateString() === end.toDateString()) {
        return `${dateTimeFormatter.format(start)} — ${timeFormatter.format(end)}`;
    }

    return `${dateTimeFormatter.format(start)} → ${dateTimeFormatter.format(end)}`;
}

export function formatEventDay(event: Pick<Event, 'starts_at'>): string {
    if (!event.starts_at) {
        return 'TBA';
    }

    return monthDayFormatter.format(new Date(event.starts_at));
}

export function formatEventModality(modality: EventModality): string {
    switch (modality) {
        case 'in_person':
            return 'In-person';
        case 'virtual':
            return 'Virtual';
        case 'hybrid':
            return 'Hybrid';
        default:
            return modality;
    }
}

export function formatEventType(type: EventType): string {
    switch (type) {
        case 'party':
            return 'Party';
        case 'seminar':
            return 'Seminar';
        case 'workshop':
            return 'Workshop';
        case 'meetup':
            return 'Meetup';
        case 'conference':
            return 'Conference';
        case 'social':
            return 'Social';
        case 'performance':
            return 'Performance';
        case 'other':
            return 'Other';
        default:
            return type;
    }
}

export function formatEventStatus(status: EventStatus): string {
    switch (status) {
        case 'draft':
            return 'Draft';
        case 'pending':
            return 'Pending';
        case 'published':
            return 'Published';
        case 'cancelled':
            return 'Cancelled';
        case 'archived':
            return 'Archived';
        default:
            return status;
    }
}

export function formatEventLocation(location: EventLocation): string {
    const parts = [location.city, location.region, location.country].filter(Boolean);

    if (parts.length > 0) {
        return parts.join(', ');
    }

    return location.name ?? 'Location TBD';
}

export function eventStatusTone(status: EventStatus): 'success' | 'warning' | 'info' | 'danger' | 'muted' {
    switch (status) {
        case 'published':
            return 'success';
        case 'pending':
            return 'warning';
        case 'draft':
            return 'info';
        case 'cancelled':
            return 'danger';
        case 'archived':
            return 'muted';
        default:
            return 'info';
    }
}

