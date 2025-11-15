import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import {
    type BreadcrumbItem,
    type HeaderAction,
    type HeaderFilter,
    type HeaderQuickAction,
    type HeaderSupportLink,
} from '@/types';
import { cn } from '@/lib/utils';
import { type PropsWithChildren, type ReactNode } from 'react';

interface AppSidebarLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
    headerActions?: HeaderAction[];
    headerQuickActions?: HeaderQuickAction[];
    headerFilters?: HeaderFilter[];
    headerSupportLinks?: HeaderSupportLink[];
    headerToolbar?: ReactNode;
    hideHeader?: boolean;
    contentClassName?: string;
}

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    headerActions,
    headerQuickActions,
    headerFilters,
    headerSupportLinks,
    headerToolbar,
    hideHeader = false,
    contentClassName,
}: PropsWithChildren<AppSidebarLayoutProps>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="relative overflow-x-hidden bg-neutral-950 text-white"
            >
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_60%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(96,165,250,0.18),_transparent_60%)]" />
                    <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-amber-500/15 via-transparent to-transparent blur-3xl" />
                </div>

                <div
                    className={cn(
                        'relative flex min-h-screen flex-col',
                        hideHeader && 'h-[calc(100svh-16px)] min-h-0 overflow-hidden',
                    )}
                >
                    {!hideHeader ? (
                        <AppSidebarHeader
                            breadcrumbs={breadcrumbs}
                            actions={headerActions}
                            quickActions={headerQuickActions}
                            filters={headerFilters}
                            supportLinks={headerSupportLinks}
                            toolbar={headerToolbar}
                        />
                    ) : (
                        <div className="sticky top-0 z-40 border-b border-white/10 bg-black/45 px-3 py-3 text-sm uppercase tracking-[0.35em] text-white/60 backdrop-blur-2xl sm:px-4 md:px-8">
                            Messages
                        </div>
                    )}

                    <main
                        className={cn(
                            'flex-1 overflow-hidden',
                            hideHeader && 'min-h-0',
                        )}
                    >
                        <div
                            className={cn(
                                'mx-auto w-full max-w-6xl px-3 pb-24 pt-4 sm:px-4 sm:pb-16 sm:pt-6 md:px-8 md:pt-8',
                                hideHeader && 'flex h-full min-h-0 flex-col pb-24 sm:pb-16',
                                contentClassName,
                            )}
                        >
                            {children}
                        </div>
                    </main>
                </div>
            </AppContent>
            <MobileBottomNav />
        </AppShell>
    );
}

