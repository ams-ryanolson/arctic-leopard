import { Separator } from '@/components/ui/separator';
import { cn, isSameUrl, resolveUrl } from '@/lib/utils';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Bell, CreditCard, Crown, Database, Lock, Share2, Shield, User } from 'lucide-react';
import { type PropsWithChildren, useMemo } from 'react';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: '/settings/profile',
        icon: User,
    },
    {
        title: 'Privacy',
        href: '/settings/privacy',
        icon: Shield,
    },
    {
        title: 'Security',
        href: '/settings/security',
        icon: Lock,
    },
    {
        title: 'Notifications',
        href: '/settings/notifications',
        icon: Bell,
    },
    {
        title: 'Social',
        href: '/settings/social',
        icon: Share2,
    },
    {
        title: 'Membership',
        href: '/settings/membership',
        icon: Crown,
    },
    {
        title: 'Payment Methods',
        href: '/settings/payment-methods',
        icon: CreditCard,
    },
    {
        title: 'Data & Account',
        href: '/settings/account',
        icon: Database,
    },
];

type SettingsLayoutProps = PropsWithChildren;

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    const { features } = usePage<SharedData>().props;
    const navItems = useMemo(() => {
        return sidebarNavItems.filter(() => {
            // Filter based on feature flags if needed
            return true;
        });
    }, [features]);

    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;

    return (
        <div className="space-y-8 text-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_60px_120px_-70px_rgba(249,115,22,0.6)]">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-amber-500/25 via-amber-400/10 to-transparent blur-3xl" />
                    <div className="absolute top-1/2 -left-32 size-[520px] -translate-y-1/2 rounded-full bg-violet-500/20 blur-3xl" />
                    <div className="absolute top-16 -right-36 size-[460px] rounded-full bg-rose-600/20 blur-3xl" />
                </div>

                <div className="relative p-8 sm:p-10 md:p-12">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                                Account{' '}
                                <span className="bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 bg-clip-text text-transparent">
                                    Settings
                                </span>
                            </h1>
                            <p className="max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
                                Manage your profile, privacy, security, and
                                account preferences. Keep your information up to
                                date and control how others see you.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-8 lg:flex-row lg:gap-8">
                <aside className="w-full lg:w-64 lg:shrink-0">
                    <nav className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 p-2 shadow-[0_20px_60px_-45px_rgba(59,130,246,0.35)]">
                        {navItems.map((item, index) => {
                            const isActive = isSameUrl(currentPath, item.href);
                            return (
                                <Link
                                    key={`${resolveUrl(item.href)}-${index}`}
                                    href={item.href}
                                    className={cn(
                                        'group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'border border-amber-400/30 bg-gradient-to-r from-amber-400/20 via-amber-400/10 to-transparent text-white shadow-[0_12px_30px_-18px_rgba(249,115,22,0.65)]'
                                            : 'text-white/70 hover:border hover:border-white/20 hover:bg-white/10 hover:text-white',
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-amber-400/10 via-transparent to-transparent opacity-50" />
                                    )}
                                    {item.icon && (
                                        <div
                                            className={cn(
                                                'flex items-center justify-center rounded-xl p-2 transition-all',
                                                isActive
                                                    ? 'border border-amber-400/40 bg-gradient-to-br from-amber-400/30 to-amber-500/20'
                                                    : 'border border-white/10 bg-white/5 group-hover:border-white/20 group-hover:bg-white/10',
                                            )}
                                        >
                                            <item.icon
                                                className={cn(
                                                    'h-4 w-4 transition-colors',
                                                    isActive
                                                        ? 'text-amber-300'
                                                        : 'text-white/60 group-hover:text-white',
                                                )}
                                            />
                                        </div>
                                    )}
                                    <span>{item.title}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <Separator className="my-6 border-white/10 lg:hidden" />

                <div className="min-w-0 flex-1">
                    <div className="space-y-8">{children}</div>
                </div>
            </div>
        </div>
    );
}
