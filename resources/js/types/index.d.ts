import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    description?: string;
    badge?: string | number;
    items?: NavItem[];
}

export interface HeaderAction {
    id: string;
    label: string;
    icon?: LucideIcon | null;
    href?: NonNullable<InertiaLinkProps['href']>;
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    tooltip?: string;
}

export interface HeaderQuickAction {
    id: string;
    title: string;
    description?: string;
    href?: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    badge?: string;
}

export interface HeaderSupportLink {
    id: string;
    label: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
}

export interface HeaderFilterOption {
    label: string;
    value: string;
}

export interface HeaderFilter {
    id: string;
    label: string;
    value: string;
    options: HeaderFilterOption[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    notifications?: {
        unread_count: number;
    };
    messaging?: {
        unread_count: number;
    };
    features?: Record<string, boolean>;
    support?: {
        email?: string;
        contact_url?: string;
    };
    [key: string]: unknown;
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
}

export interface User {
    id: number;
    name: string;
    display_name?: string | null;
    username?: string | null;
    email: string;
    avatar?: string | null;
    avatar_url?: string | null;
    cover_url?: string | null;
    pronouns?: string | null;
    bio?: string | null;
    birthdate?: string | null;
    location_city?: string | null;
    location_region?: string | null;
    location_country?: string | null;
    profile_completed_at?: string | null;
    is_traveling?: boolean | null;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    interests?: string[];
    hashtags?: string[];
    roles?: Role[];
    [key: string]: unknown; // This allows for additional properties...
}
