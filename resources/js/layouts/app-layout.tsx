import AnnouncementBar from '@/components/announcement-bar';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import {
    type BreadcrumbItem,
    type HeaderAction,
    type HeaderFilter,
    type HeaderQuickAction,
    type HeaderSupportLink,
} from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    headerActions?: HeaderAction[];
    headerQuickActions?: HeaderQuickAction[];
    headerFilters?: HeaderFilter[];
    headerSupportLinks?: HeaderSupportLink[];
    headerToolbar?: ReactNode;
    contentClassName?: string;
    hideHeader?: boolean;
}

export default function AppLayout({
    children,
    breadcrumbs,
    headerActions,
    headerQuickActions,
    headerFilters,
    headerSupportLinks,
    headerToolbar,
    contentClassName,
    ...props
}: AppLayoutProps) {
    return (
        <AppLayoutTemplate
            breadcrumbs={breadcrumbs}
            headerActions={headerActions}
            headerQuickActions={headerQuickActions}
            headerFilters={headerFilters}
            headerSupportLinks={headerSupportLinks}
            headerToolbar={headerToolbar}
            contentClassName={contentClassName}
            {...props}
        >
            <AnnouncementBar />
            {children}
        </AppLayoutTemplate>
    );
}
