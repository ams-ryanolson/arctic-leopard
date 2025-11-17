import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
} from '@/components/ui/sidebar';
import { fetchUnreadNotificationCount } from '@/lib/notifications-client';
import { dashboard, radar } from '@/routes';
import admin from '@/routes/admin';
import { index as bookmarksIndex } from '@/routes/bookmarks';
import { index as notificationsIndex } from '@/routes/notifications';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    ArrowRight,
    Banknote,
    BarChart3,
    Bell,
    Bookmark,
    BookOpen,
    CalendarRange,
    Cog,
    Flame,
    Gift,
    LineChart,
    MessageCircle,
    Radar,
    ShieldAlert,
    Shield,
    LayoutDashboard,
    Sparkles,
    Users,
    Video,
    Megaphone,
    Crown,
    FileText,
} from 'lucide-react';

export function AppSidebar() {
    const {
        props: { notifications, messaging, auth, features: sharedFeatures },
    } = usePage<SharedData>();
    const features = (sharedFeatures ?? {}) as Record<string, boolean>;

    const user = auth?.user;
    const userRoles = user?.roles?.map((role) => role.name) ?? [];
    const isAdmin = userRoles.includes('Admin') || userRoles.includes('Super Admin');

    const unreadNotifications =
        (typeof notifications === 'object' && notifications !== null && 'unread_count' in notifications
            ? Number((notifications as { unread_count?: number }).unread_count ?? 0)
            : 0) ?? 0;

    const unreadMessages =
        (typeof messaging === 'object' && messaging !== null && 'unread_count' in messaging
            ? Number((messaging as { unread_count?: number }).unread_count ?? 0)
            : 0) ?? 0;

    const [unreadCount, setUnreadCount] = useState(unreadNotifications);

    useEffect(() => {
        setUnreadCount(unreadNotifications);
    }, [unreadNotifications]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        let isMounted = true;

        const refreshUnread = async () => {
            try {
                const nextCount = await fetchUnreadNotificationCount();

                if (isMounted) {
                    setUnreadCount(nextCount);
                }
            } catch (error) {
                console.error(error);
            }
        };

        const handleRealtimeUpdate = (event: Event) => {
            if (!('detail' in event)) {
                return;
            }

            const detail = (event as CustomEvent<{ unreadCount?: number }>).detail;

            if (detail?.unreadCount !== undefined) {
                setUnreadCount(detail.unreadCount ?? 0);
            }
        };

        window.addEventListener('notifications:updated', handleRealtimeUpdate as EventListener);

        const interval = window.setInterval(refreshUnread, 60_000);

        return () => {
            isMounted = false;
            window.removeEventListener('notifications:updated', handleRealtimeUpdate as EventListener);
            window.clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.dispatchEvent(
            new CustomEvent('messaging:unread-count', {
                detail: { count: unreadMessages, source: 'sidebar' },
            }),
        );
    }, [unreadMessages]);

    const notificationsBadge =
        unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : undefined;

    const mainNavItems: NavItem[] = [
        {
            title: 'Home',
            href: dashboard(),
            icon: Flame,
        },
        {
            title: 'Circles',
            href: '/circles',
            icon: Users,
        },
        ...(features.feature_radar_enabled ? [{
            title: 'Radar',
            href: radar(),
            icon: Radar,
        }] : []),
        ...(features.feature_signals_enabled ? [{
            title: 'Signals',
            href: '/signals',
            icon: Sparkles,
            items: [
                { title: 'Setup', href: '/signals/setup', icon: LayoutDashboard },
                { title: 'Playbooks', href: '/signals/playbooks', icon: BookOpen },
                { title: 'Overview', href: '/signals', icon: Sparkles },
                { title: 'Stats', href: '/signals/stats', icon: BarChart3 },
                { title: 'Subscriptions', href: '/signals/subscriptions', icon: Users },
                { title: 'Monetization', href: '/signals/monetization', icon: LineChart },
                ...(features.feature_wishlist_enabled ? [{ title: 'Wishlist', href: '/signals/wishlist', icon: Gift }] : []),
                { title: 'Payouts', href: '/signals/payouts', icon: Banknote },
                { title: 'Audience', href: '/signals/audience', icon: Radar },
                { title: 'Compliance', href: '/signals/compliance', icon: ShieldAlert },
                { title: 'Settings', href: '/signals/settings', icon: Cog },
                ...(features.feature_ads_enabled ? [{ title: 'Ads', href: '/signals/ads', icon: Megaphone }] : []),
            ],
        }] : []),
        ...(features.feature_events_enabled ? [{
            title: 'Events',
            href: '/events',
            icon: CalendarRange,
        }] : []),
        ...(features.feature_bookmarks_enabled ? [{
            title: 'Bookmarks',
            href: bookmarksIndex(),
            icon: Bookmark,
        }] : []),
        {
            title: 'Notifications',
            href: notificationsIndex(),
            icon: Bell,
            badge: notificationsBadge,
        },
        ...(features.feature_messaging_enabled ? [{
            title: 'Messages',
            href: '/messages',
            icon: MessageCircle,
            badge: unreadMessages > 0 ? unreadMessages : undefined,
        }] : []),
        ...(features.feature_video_chat_enabled ? [{
            title: 'Video Chat',
            href: dashboard({ query: { view: 'video-chat' } }),
            icon: Video,
        }] : []),
        ...(isAdmin
            ? [
                  {
                      title: 'Admin',
                      href: admin.dashboard().url,
                      icon: Shield,
                      items: [
                          {
                              title: 'Dashboard',
                              href: admin.dashboard().url,
                              icon: LayoutDashboard,
                          },
                          {
                              title: 'Users',
                              href: admin.users.index().url,
                              icon: Users,
                          },
                          ...(features.feature_events_enabled ? [{
                              title: 'Events',
                              href: admin.events.index().url,
                              icon: CalendarRange,
                          }] : []),
                          ...(features.feature_ads_enabled ? [{
                              title: 'Ads',
                              href: '/admin/ads',
                              icon: Megaphone,
                          }] : []),
                          {
                              title: 'Roles',
                              href: admin.roles.index().url,
                              icon: ShieldAlert,
                          },
                          {
                              title: 'Memberships',
                              href: admin.memberships.index().url,
                              icon: Crown,
                          },
                          {
                          title: 'Settings',
                          href: admin.settings.index().url,
                          icon: Cog,
                          },
                          {
                              title: 'Activity Log',
                              href: admin.activityLog.index().url,
                              icon: FileText,
                          },
                      ],
                  },
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="px-3 pt-4">
                <SidebarMenu>
                    <SidebarMenuButton
                        size="lg"
                        asChild
                        className="group flex h-auto flex-row items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white shadow-[0_26px_70px_-45px_rgba(249,115,22,0.55)] transition hover:border-amber-400/35 hover:bg-white/10"
                    >
                        <Link href={dashboard()} prefetch className="flex w-full items-center gap-3">
                            <AppLogo />
                            <div className="space-y-0.5">
                                <p className="text-[0.6rem] uppercase tracking-[0.35em] text-white/55">
                                    Real Kink Men
                                </p>
                                <p className="text-sm font-semibold text-white">Live Your Fetish Out Loud</p>
                            </div>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-3 pb-4">
                <div className="space-y-3">
                    <Link
                        href="/upgrade"
                        className="group relative block overflow-hidden rounded-2xl border border-amber-400/35 bg-gradient-to-br from-amber-500/25 via-rose-500/30 to-indigo-500/20 p-[1px] shadow-[0_32px_76px_-52px_rgba(249,115,22,0.65)] transition"
                    >
                        <div className="relative h-full rounded-[1.05rem] bg-neutral-950/90 p-4">
                            <div className="pointer-events-none absolute inset-0 -z-10 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.45),_transparent_70%)]" />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(96,165,250,0.35),_transparent_65%)]" />
                            </div>
                            <p className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
                                Upgrade now
                            </p>
                            <p className="mt-3 text-base font-semibold text-white">
                                Unlock Premium, Elite, or Unlimited access and level up your feed.
                            </p>
                            <div className="mt-4 flex items-center text-sm font-medium text-amber-100">
                                Explore plans
                                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Link>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-2 shadow-[0_28px_72px_-55px_rgba(249,115,22,0.45)]">
                        <NavMain items={mainNavItems} label="Navigation" />
                    </div>
                </div>
            </SidebarContent>

            <SidebarFooter className="px-3 pb-4">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
