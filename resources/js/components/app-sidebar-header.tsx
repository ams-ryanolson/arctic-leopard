import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useInitials } from '@/hooks/use-initials';
import {
    type BreadcrumbItem as BreadcrumbItemType,
    type HeaderAction,
    type HeaderFilter,
    type HeaderQuickAction,
    type HeaderSupportLink,
    type SharedData,
} from '@/types';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, ChevronDown, Clapperboard, Radio, Search, Sparkles } from 'lucide-react';
import { type ReactNode } from 'react';

const defaultActions: HeaderAction[] = [
    {
        id: 'new-scene',
        label: 'New Scene',
        icon: Sparkles,
        variant: 'primary',
    },
    {
        id: 'go-live',
        label: 'Go Live',
        icon: Radio,
        variant: 'secondary',
    },
    {
        id: 'drop-media',
        label: 'Drop Media',
        icon: Clapperboard,
        variant: 'ghost',
    },
];

interface AppSidebarHeaderProps {
    breadcrumbs?: BreadcrumbItemType[];
    actions?: HeaderAction[];
    quickActions?: HeaderQuickAction[];
    filters?: HeaderFilter[];
    supportLinks?: HeaderSupportLink[];
    toolbar?: ReactNode;
}

function renderActionButton(action: HeaderAction) {
    const variantStyles: Record<NonNullable<HeaderAction['variant']>, string> = {
        primary:
            'bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-[1.02]',
        secondary: 'border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/20',
        ghost: 'text-white/80 hover:bg-white/10 hover:text-white',
        outline: 'border-white/25 bg-transparent text-white/80 hover:border-white/40',
    };

    const Icon = action.icon;
    const button = (
        <Button
            key={action.id}
            size="lg"
            variant={action.variant === 'ghost' ? 'ghost' : action.variant === 'outline' ? 'outline' : 'default'}
            className={cn(
                'rounded-full transition',
                action.variant ? variantStyles[action.variant] : variantStyles.primary,
            )}
        >
            {Icon ? <Icon className="size-4" /> : null}
            {action.label}
        </Button>
    );

    if (action.href) {
        return (
            <Link key={action.id} href={action.href} prefetch className="contents">
                {button}
            </Link>
        );
    }

    return button;
}

export function AppSidebarHeader({
    breadcrumbs = [],
    actions,
    quickActions,
    filters,
    supportLinks,
    toolbar,
}: AppSidebarHeaderProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;
    const getInitials = useInitials();
    const displayName = user?.display_name ?? user?.name ?? 'Scene Member';
    const initials = getInitials(displayName);

    const joinedDisplay = user?.created_at
        ? new Date(user.created_at).toLocaleDateString(undefined, {
              month: 'short',
              year: 'numeric',
          })
        : 'Recently joined';

    const sceneIdentifier = user?.id
        ? `Scene ID #${String(user.id).padStart(4, '0')}`
        : 'Scene ID pending';

    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/45 backdrop-blur-2xl">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:px-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <SidebarTrigger className="rounded-full border border-white/15 text-white hover:bg-white/10" />
                        <Avatar className="size-12 border border-white/10 bg-white/10">
                            {user?.avatar ? (
                                <AvatarImage src={user.avatar} alt={displayName} />
                            ) : (
                                <AvatarFallback className="bg-gradient-to-br from-amber-400/70 via-rose-500/70 to-violet-600/70 text-sm font-semibold text-white">
                                    {initials || 'RK'}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <div className="min-w-0 text-white">
                            <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                                Welcome back
                            </p>
                            <h1 className="truncate text-xl font-semibold sm:text-2xl">
                                {displayName}
                            </h1>
                            <p className="text-xs text-white/60">
                                {sceneIdentifier} · Joined {joinedDisplay}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {(actions?.length ? actions : defaultActions).map((action) => renderActionButton(action))}
                    </div>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex w-full flex-1 items-center gap-3 lg:max-w-xl">
                        <div className="relative w-full">
                            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                            <Input
                                type="search"
                                placeholder="Search kinks, circles, creators, locations..."
                                className="h-11 rounded-full border-white/15 bg-white/10 pl-11 text-sm text-white placeholder:text-white/40"
                            />
                        </div>
                        <Badge className="rounded-full border-white/20 bg-white/10 px-3 py-1 text-white/70">
                            <Sparkles className="size-3 text-amber-400" />
                            Beta access
                        </Badge>
                    </div>

                    <div className="flex w-full flex-1 flex-wrap items-center justify-start gap-2 lg:w-auto lg:justify-end">
                        {toolbar}
                        {filters?.map((filter) => (
                            <Button
                                key={filter.id}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 rounded-full border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:border-white/40 hover:bg-white/20 hover:text-white"
                            >
                                <span className="text-[0.65rem] uppercase tracking-[0.2em] text-white/50">
                                    {filter.label}
                                </span>
                                <span className="text-sm text-white">{filter.value}</span>
                                <ChevronDown className="size-3 text-white/40" />
                            </Button>
                        ))}
                        {supportLinks?.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.id}
                                    href={link.href}
                                    prefetch
                                    className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                                >
                                    {Icon ? <Icon className="size-3 text-white/50" /> : null}
                                    <span>{link.label}</span>
                                    <ArrowUpRight className="size-3 text-white/40" />
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {quickActions?.length ? (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            const content = (
                                <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-amber-400/40 hover:bg-white/10">
                                    <div className="flex items-center gap-3">
                                        {Icon ? (
                                            <span className="rounded-full border border-white/15 bg-white/10 p-2 text-white/70 transition group-hover:border-amber-400/50 group-hover:text-white">
                                                <Icon className="size-4" />
                                            </span>
                                        ) : null}
                                        <div>
                                            <p className="text-sm font-semibold text-white">{action.title}</p>
                                            {action.description ? (
                                                <p className="text-xs text-white/60">{action.description}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                    {action.badge ? (
                                        <span className="mt-3 inline-flex rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.25em] text-white/50">
                                            {action.badge}
                                        </span>
                                    ) : null}
                                </div>
                            );

                            if (action.href) {
                                return (
                                    <Link key={action.id} href={action.href} prefetch className="block">
                                        {content}
                                    </Link>
                                );
                            }

                            return (
                                <div key={action.id} className="block">
                                    {content}
                                </div>
                            );
                        })}
                    </div>
                ) : null}
            </div>
            {breadcrumbs.length > 0 && (
                <div className="border-t border-white/10 bg-black/35">
                    <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-3 md:px-8">
                        <Breadcrumbs
                            breadcrumbs={[
                                { title: 'Home', href: '/' },
                                ...breadcrumbs.map((breadcrumb, index) => {
                                    if (
                                        index === breadcrumbs.length - 1 &&
                                        breadcrumb.title.toLowerCase() === 'dashboard'
                                    ) {
                                        return { ...breadcrumb, title: 'Home' };
                                    }

                                    return breadcrumb;
                                }),
                            ]}
                        />
                    </div>
                </div>
            )}
        </header>
    );
}

