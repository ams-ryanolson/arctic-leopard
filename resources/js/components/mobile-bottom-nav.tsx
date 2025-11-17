import { useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn, isSameUrl } from '@/lib/utils';
import { dashboard, radar } from '@/routes';
import { index as notificationsIndex } from '@/routes/notifications';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    Flame,
    MessageCircle,
    Radar,
    Users,
    type LucideIcon,
} from 'lucide-react';

interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
    badge?: string | number;
}

export function MobileBottomNav() {
    const isMobile = useIsMobile();
    const page = usePage<SharedData>();
    const { notifications, messaging } = page.props;
    const { setOpenMobile } = useSidebar();

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

    const navItems: NavItem[] = [
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
        {
            title: 'Radar',
            href: radar(),
            icon: Radar,
        },
        {
            title: 'Notifications',
            href: notificationsIndex(),
            icon: Bell,
            badge:
                unreadNotifications > 0
                    ? unreadNotifications > 99
                        ? '99+'
                        : String(unreadNotifications)
                    : undefined,
        },
        {
            title: 'Messages',
            href: '/messages',
            icon: MessageCircle,
            badge: unreadMessages > 0 ? String(unreadMessages) : undefined,
        },
    ];

    if (!isMobile) {
        return null;
    }

    return (
        <nav className="safe-area-inset-bottom fixed right-0 bottom-0 left-0 z-50 border-t border-white/10 bg-black/95 backdrop-blur-xl">
            <div className="pb-safe flex h-16 items-center justify-around">
                {navItems.map((item) => {
                    const isActive = isSameUrl(page.url, item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.title}
                            href={item.href}
                            prefetch
                            onClick={() => setOpenMobile(false)}
                            className={cn(
                                'relative flex flex-1 flex-col items-center justify-center gap-1 px-2 py-2 transition-colors',
                                isActive
                                    ? 'text-amber-400'
                                    : 'text-white/60 hover:text-white/80',
                            )}
                        >
                            <div className="relative">
                                <Icon className="h-5 w-5" />
                                {item.badge && (
                                    <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[0.65rem] font-semibold text-white">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[0.65rem] font-medium">
                                {item.title}
                            </span>
                            {isActive && (
                                <div className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-amber-400" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
