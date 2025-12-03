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
    useSidebar,
} from '@/components/ui/sidebar';
import { fetchUnreadNotificationCount } from '@/lib/notifications-client';
import { cn } from '@/lib/utils';
import { dashboard, radar } from '@/routes';
import admin from '@/routes/admin';
import { index as bookmarksIndex } from '@/routes/bookmarks';
import { index as notificationsIndex } from '@/routes/notifications';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Ban,
    Banknote,
    BarChart3,
    Bell,
    Bookmark,
    BookOpen,
    CalendarRange,
    Cog,
    Crown,
    FileText,
    Flame,
    Gift,
    LayoutDashboard,
    LineChart,
    Megaphone,
    MessageCircle,
    Radar,
    Scale,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    ToggleLeft,
    Users,
    Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export function AppSidebar() {
    const {
        props: { notifications, messaging, auth, features: sharedFeatures },
    } = usePage<SharedData>();
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';
    const features = (sharedFeatures ?? {}) as Record<string, boolean>;
    
    const user = auth?.user;
    const membership = auth?.membership;
    const userRoles = user?.roles?.map((role) => role.name) ?? [];
    const isAdmin =
        userRoles.includes('Admin') || userRoles.includes('Super Admin');
    const isModerator = userRoles.includes('Moderator');
    const isStaff = isAdmin || isModerator;

    const unreadNotifications =
        (typeof notifications === 'object' &&
        notifications !== null &&
        'unread_count' in notifications
            ? Number(
                  (notifications as { unread_count?: number }).unread_count ??
                      0,
              )
            : 0) ?? 0;

    const unreadMessages =
        (typeof messaging === 'object' &&
        messaging !== null &&
        'unread_count' in messaging
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

            const detail = (event as CustomEvent<{ unreadCount?: number }>)
                .detail;

            if (detail?.unreadCount !== undefined) {
                setUnreadCount(detail.unreadCount ?? 0);
            }
        };

        window.addEventListener(
            'notifications:updated',
            handleRealtimeUpdate as EventListener,
        );

        const interval = window.setInterval(refreshUnread, 60_000);

        return () => {
            isMounted = false;
            window.removeEventListener(
                'notifications:updated',
                handleRealtimeUpdate as EventListener,
            );
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
        unreadCount > 99
            ? '99+'
            : unreadCount > 0
              ? String(unreadCount)
              : undefined;

    const mainNavItems: NavItem[] = [
        {
            title: 'Home',
            href: dashboard(),
            icon: Flame,
        },
        ...(features.feature_circles_enabled
            ? [
                  {
                      title: 'Circles',
                      href: '/circles',
                      icon: Users,
                  },
              ]
            : []),
        ...(features.feature_radar_enabled
            ? [
                  {
                      title: 'Radar',
                      href: radar(),
                      icon: Radar,
                  },
              ]
            : []),
        ...(features.feature_signals_enabled
            ? [
                  {
                      title: 'Signals',
                      href: '/signals',
                      icon: Sparkles,
                      items: [
                          {
                              title: 'Setup',
                              href: '/signals/setup',
                              icon: LayoutDashboard,
                          },
                          {
                              title: 'Playbooks',
                              href: '/signals/playbooks',
                              icon: BookOpen,
                          },
                          {
                              title: 'Overview',
                              href: '/signals',
                              icon: Sparkles,
                          },
                          {
                              title: 'Stats',
                              href: '/signals/stats',
                              icon: BarChart3,
                          },
                          {
                              title: 'Subscriptions',
                              href: '/signals/subscriptions',
                              icon: Users,
                          },
                          {
                              title: 'Monetization',
                              href: '/signals/monetization',
                              icon: LineChart,
                          },
                          ...(features.feature_wishlist_enabled
                              ? [
                                    {
                                        title: 'Wishlist',
                                        href: '/signals/wishlist',
                                        icon: Gift,
                                    },
                                ]
                              : []),
                          {
                              title: 'Payouts',
                              href: '/signals/payouts',
                              icon: Banknote,
                          },
                          {
                              title: 'Audience',
                              href: '/signals/audience',
                              icon: Radar,
                          },
                          {
                              title: 'Compliance',
                              href: '/signals/compliance',
                              icon: ShieldAlert,
                          },
                          {
                              title: 'Settings',
                              href: '/signals/settings',
                              icon: Cog,
                          },
                          ...(features.feature_ads_enabled
                              ? [
                                    {
                                        title: 'Ads',
                                        href: '/signals/ads',
                                        icon: Megaphone,
                                    },
                                ]
                              : []),
                      ],
                  },
              ]
            : []),
        ...(features.feature_events_enabled
            ? [
                  {
                      title: 'Events',
                      href: '/events',
                      icon: CalendarRange,
                  },
              ]
            : []),
        ...(features.feature_bookmarks_enabled
            ? [
                  {
                      title: 'Bookmarks',
                      href: bookmarksIndex(),
                      icon: Bookmark,
                  },
              ]
            : []),
        {
            title: 'Notifications',
            href: notificationsIndex(),
            icon: Bell,
            badge: notificationsBadge,
        },
        ...(features.feature_messaging_enabled
            ? [
                  {
                      title: 'Messages',
                      href: '/messages',
                      icon: MessageCircle,
                      badge: unreadMessages > 0 ? unreadMessages : undefined,
                  },
              ]
            : []),
        ...(features.feature_video_chat_enabled
            ? [
                  {
                      title: 'Video Chat',
                      href: dashboard({ query: { view: 'video-chat' } }),
                      icon: Video,
                  },
              ]
            : []),
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
                          {
                              title: 'Suspensions & Bans',
                              href: admin.users.suspensions().url,
                              icon: Ban,
                          },
                          ...(features.feature_events_enabled
                              ? [
                                    {
                                        title: 'Events',
                                        href: admin.events.index().url,
                                        icon: CalendarRange,
                                    },
                                ]
                              : []),
                          ...(features.feature_ads_enabled
                              ? [
                                    {
                                        title: 'Ads',
                                        href: '/admin/ads',
                                        icon: Megaphone,
                                    },
                                ]
                              : []),
                          {
                              title: 'Roles',
                              href: admin.roles.index().url,
                              icon: ShieldAlert,
                          },
                          {
                              title: 'Appeals',
                              href: admin.appeals.index().url,
                              icon: Scale,
                          },
                          {
                              title: 'Content Moderation',
                              href: admin.moderation.index().url,
                              icon: ShieldCheck,
                          },
                          {
                              title: 'Memberships',
                              href: admin.memberships.index().url,
                              icon: Crown,
                          },
                          {
                              title: 'Feature Flags',
                              href: '/admin/features',
                              icon: ToggleLeft,
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
            <SidebarHeader className={cn("px-2 pt-3", isCollapsed && "px-0 pt-2")}>
                <SidebarMenu>
                    <SidebarMenuButton
                        size="lg"
                        asChild
                        className={cn(
                            "group flex h-auto flex-row items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white shadow-[0_26px_70px_-45px_rgba(249,115,22,0.55)] transition hover:border-amber-400/35 hover:bg-white/10",
                            isCollapsed && "px-0 py-2 justify-center"
                        )}
                    >
                        <Link
                            href={dashboard()}
                            prefetch
                            className={cn("flex w-full items-center", isCollapsed ? "justify-center" : "gap-3")}
                        >
                            <AppLogo />
                            {!isCollapsed && (
                                <div className="space-y-0.5">
                                    <p className="text-[0.6rem] tracking-[0.35em] text-white/55 uppercase">
                                        Real Kink Men
                                    </p>
                                    <p className="text-sm font-semibold text-white">
                                        Live Your Fetish Out Loud
                                    </p>
                                </div>
                            )}
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className={cn("px-2 pb-3", isCollapsed && "px-1 pb-2")}>
                <div className={cn("space-y-2", isCollapsed && "space-y-1")}>
                    {!isCollapsed && (
                        membership ? (
                            <Link
                                href="/settings/membership"
                                className="group relative block overflow-hidden rounded-2xl border border-emerald-400/35 bg-gradient-to-br from-emerald-500/20 via-teal-500/25 to-cyan-500/15 p-[1px] shadow-[0_32px_76px_-52px_rgba(16,185,129,0.55)] transition"
                            >
                                <div className="relative h-full rounded-[1.05rem] bg-neutral-950/90 p-4">
                                    <div className="pointer-events-none absolute inset-0 -z-10 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.45),_transparent_70%)]" />
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(6,182,212,0.35),_transparent_65%)]" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Crown className="size-4 text-emerald-400" />
                                        <p className="text-[0.55rem] font-semibold tracking-[0.35em] text-emerald-200/80 uppercase">
                                            {membership.plan_name} Member
                                        </p>
                                    </div>
                                    {membership.ends_at && (
                                        <p className={cn(
                                            "mt-2 text-sm",
                                            membership.is_expiring_soon 
                                                ? "text-amber-300" 
                                                : "text-white/70"
                                        )}>
                                            {membership.is_expiring_soon ? (
                                                <>
                                                    <span className="font-medium text-amber-300">
                                                        {membership.days_remaining} days left
                                                    </span>
                                                    <span className="block text-xs text-amber-300/70 mt-0.5">
                                                        Expires {new Date(membership.ends_at).toLocaleDateString()}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    Valid until {new Date(membership.ends_at).toLocaleDateString()}
                                                </>
                                            )}
                                        </p>
                                    )}
                                    {membership.billing_type === 'recurring' && !membership.ends_at && (
                                        <p className="mt-2 text-sm text-white/70">
                                            Auto-renewing subscription
                                        </p>
                                    )}
                                    <div className="mt-3 flex items-center text-sm font-medium text-emerald-100">
                                        Manage membership
                                        <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            <Link
                                href="/upgrade"
                                className="group relative block overflow-hidden rounded-2xl border border-amber-400/35 bg-gradient-to-br from-amber-500/25 via-rose-500/30 to-indigo-500/20 p-[1px] shadow-[0_32px_76px_-52px_rgba(249,115,22,0.65)] transition"
                            >
                                <div className="relative h-full rounded-[1.05rem] bg-neutral-950/90 p-4">
                                    <div className="pointer-events-none absolute inset-0 -z-10 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.45),_transparent_70%)]" />
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(96,165,250,0.35),_transparent_65%)]" />
                                    </div>
                                    <p className="text-[0.55rem] font-semibold tracking-[0.35em] text-amber-200/80 uppercase">
                                        Upgrade now
                                    </p>
                                    <p className="mt-3 text-base font-semibold text-white">
                                        Unlock Premium, Elite, or Unlimited access and
                                        level up your feed.
                                    </p>
                                    <div className="mt-4 flex items-center text-sm font-medium text-amber-100">
                                        Explore plans
                                        <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </Link>
                        )
                    )}

                    <div className={cn(
                        "rounded-2xl border border-white/10 bg-black/25 p-2 shadow-[0_28px_72px_-55px_rgba(249,115,22,0.45)]",
                        isCollapsed && "p-1 rounded-lg"
                    )}>
                        <NavMain items={mainNavItems} label="Navigation" />
                    </div>
                </div>
            </SidebarContent>

            <SidebarFooter className={cn("px-2 pb-3", isCollapsed && "px-1 pb-2")}>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
