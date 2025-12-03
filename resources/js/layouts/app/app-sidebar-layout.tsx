import AgeConsentModal from '@/components/age-consent-modal';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import CookiesBanner from '@/components/cookies-banner';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { cn } from '@/lib/utils';
import {
    type BreadcrumbItem,
    type HeaderAction,
    type HeaderFilter,
    type HeaderQuickAction,
    type HeaderSupportLink,
} from '@/types';
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
                className={cn(
                    'relative overflow-x-hidden bg-neutral-950 text-white',
                    hideHeader &&
                        'h-[calc(100svh-68px)] !min-h-0 overflow-hidden sm:h-svh md:!m-0 md:!rounded-none',
                )}
            >
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_60%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(96,165,250,0.18),_transparent_60%)]" />
                    <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-amber-500/15 via-transparent to-transparent blur-3xl" />
                </div>

                <div
                    className={cn(
                        'relative flex min-h-screen flex-col',
                        hideHeader && 'h-full min-h-0 overflow-hidden',
                    )}
                >
                    {!hideHeader && (
                        <AppSidebarHeader
                            breadcrumbs={breadcrumbs}
                            actions={headerActions}
                            quickActions={headerQuickActions}
                            filters={headerFilters}
                            supportLinks={headerSupportLinks}
                            toolbar={headerToolbar}
                        />
                    )}

                    <main
                        className={cn(
                            'flex-1 overflow-hidden',
                            hideHeader && 'min-h-0',
                        )}
                    >
                        <div
                            className={cn(
                                !hideHeader && 'mx-auto w-full max-w-6xl px-3 pt-4 pb-24 sm:px-4 sm:pt-6 sm:pb-16 md:px-8 md:pt-8',
                                hideHeader &&
                                    'flex h-full min-h-0 flex-col !p-0',
                                contentClassName,
                            )}
                        >
                            {children}
                        </div>
                    </main>
                </div>
                <AgeConsentModal />
                <CookiesBanner />
            </AppContent>
            <MobileBottomNav />
        </AppShell>
    );
}
