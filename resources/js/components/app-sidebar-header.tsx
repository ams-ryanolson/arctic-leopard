import { Breadcrumbs } from '@/components/breadcrumbs';
import { SearchDropdown } from '@/components/search/search-dropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import {
    type BreadcrumbItem as BreadcrumbItemType,
    type HeaderAction,
    type HeaderFilter,
    type HeaderQuickAction,
    type HeaderSupportLink,
    type SharedData,
} from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    ChevronDown,
    Clapperboard,
    Radio,
    Search,
    Sparkles,
} from 'lucide-react';
import { type ReactNode, useState, useCallback } from 'react';

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
    const variantStyles: Record<
        NonNullable<HeaderAction['variant']>,
        string
    > = {
        primary:
            'bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-[1.02]',
        secondary:
            'border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/20',
        ghost: 'text-white/80 hover:bg-white/10 hover:text-white',
        outline:
            'border-white/25 bg-transparent text-white/80 hover:border-white/40',
    };

    const Icon = action.icon;
    const button = (
        <Button
            key={action.id}
            size="lg"
            variant={
                action.variant === 'ghost'
                    ? 'ghost'
                    : action.variant === 'outline'
                      ? 'outline'
                      : 'default'
            }
            className={cn(
                'rounded-full transition',
                action.variant
                    ? variantStyles[action.variant]
                    : variantStyles.primary,
            )}
        >
            {Icon ? <Icon className="size-4" /> : null}
            {action.label}
        </Button>
    );

    if (action.href) {
        return (
            <Link
                key={action.id}
                href={action.href}
                prefetch
                className="contents"
            >
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

    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const joinedDisplay = user?.created_at
        ? new Date(user.created_at).toLocaleDateString(undefined, {
              month: 'short',
              year: 'numeric',
          })
        : 'Recently joined';

    const sceneIdentifier = user?.id
        ? `Scene ID #${String(user.id).padStart(4, '0')}`
        : 'Scene ID pending';

    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
        setIsDropdownOpen(value.length >= 2);
    }, []);

    const handleSearchKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter' && searchQuery.trim()) {
                router.visit(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                setIsDropdownOpen(false);
            }
        },
        [searchQuery],
    );

    const handleSearchFocus = useCallback(() => {
        if (searchQuery.length >= 2) {
            setIsDropdownOpen(true);
        }
    }, [searchQuery.length]);

    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/45 backdrop-blur-2xl">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 md:px-8">
                {/* Mobile: Compact Header */}
                <div className="flex items-center justify-between gap-2 sm:hidden">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <SidebarTrigger className="h-9 w-9 rounded-full border border-white/15 text-white hover:bg-white/10" />
                        <Avatar className="size-9 border border-white/10 bg-white/10">
                            {user?.avatar_url ? (
                                <AvatarImage
                                    src={user.avatar_url}
                                    alt={displayName}
                                />
                            ) : (
                                <AvatarFallback className="bg-gradient-to-br from-amber-400/70 via-rose-500/70 to-violet-600/70 text-xs font-semibold text-white">
                                    {initials || 'RK'}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <div className="min-w-0 text-white">
                            <h1 className="truncate text-sm font-semibold">
                                {displayName}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {(actions?.length ? actions : defaultActions)
                            .slice(0, 1)
                            .map((action) => {
                                const Icon = action.icon;
                                return (
                                    <Button
                                        key={action.id}
                                        size="sm"
                                        variant={
                                            action.variant === 'ghost'
                                                ? 'ghost'
                                                : action.variant === 'outline'
                                                  ? 'outline'
                                                  : 'default'
                                        }
                                        className={cn(
                                            'h-9 rounded-full text-xs font-semibold transition',
                                            action.variant === 'primary'
                                                ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-4 text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-[1.02]'
                                                : action.variant === 'secondary'
                                                  ? 'border-white/25 bg-white/10 px-3 text-white hover:border-white/40 hover:bg-white/20'
                                                  : 'text-white/80 hover:bg-white/10 hover:text-white',
                                        )}
                                    >
                                        {Icon && (
                                            <Icon className="mr-1.5 size-3.5" />
                                        )}
                                        <span className="hidden min-[375px]:inline">
                                            {action.label}
                                        </span>
                                    </Button>
                                );
                            })}
                    </div>
                </div>

                {/* Desktop: Full Header */}
                <div className="hidden flex-wrap items-center justify-between gap-4 sm:flex">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <SidebarTrigger className="rounded-full border border-white/15 text-white hover:bg-white/10" />
                        <Avatar className="size-12 border border-white/10 bg-white/10">
                            {user?.avatar_url ? (
                                <AvatarImage
                                    src={user.avatar_url}
                                    alt={displayName}
                                />
                            ) : (
                                <AvatarFallback className="bg-gradient-to-br from-amber-400/70 via-rose-500/70 to-violet-600/70 text-sm font-semibold text-white">
                                    {initials || 'RK'}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <div className="min-w-0 text-white">
                            <p className="text-xs tracking-[0.35em] text-white/50 uppercase">
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
                        {(actions?.length ? actions : defaultActions).map(
                            (action) => renderActionButton(action),
                        )}
                    </div>
                </div>

                {/* Search Bar - Mobile Optimized */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex w-full flex-1 items-center gap-2 sm:max-w-xl">
                        <div className="relative w-full">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40 sm:left-4" />
                            <Input
                                type="search"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                onFocus={handleSearchFocus}
                                onKeyDown={handleSearchKeyDown}
                                className="h-9 rounded-full border-white/15 bg-white/10 pl-9 text-sm text-white placeholder:text-white/40 sm:h-11 sm:pl-11"
                            />
                            <SearchDropdown
                                query={searchQuery}
                                isOpen={isDropdownOpen}
                                onClose={() => setIsDropdownOpen(false)}
                            />
                        </div>
                        <Badge className="hidden rounded-full border-white/20 bg-white/10 px-2.5 py-1 text-xs text-white/70 sm:flex">
                            <Sparkles className="size-3 text-amber-400" />
                            Beta
                        </Badge>
                    </div>

                    {/* Filters - Hidden on Mobile */}
                    <div className="hidden flex-wrap items-center justify-start gap-2 lg:flex lg:w-auto lg:justify-end">
                        {toolbar}
                        {filters?.map((filter) => (
                            <Button
                                key={filter.id}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 rounded-full border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:border-white/40 hover:bg-white/20 hover:text-white"
                            >
                                <span className="text-[0.65rem] tracking-[0.2em] text-white/50 uppercase">
                                    {filter.label}
                                </span>
                                <span className="text-sm text-white">
                                    {filter.value}
                                </span>
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
                                    className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-[0.25em] text-white/60 uppercase transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                                >
                                    {Icon ? (
                                        <Icon className="size-3 text-white/50" />
                                    ) : null}
                                    <span>{link.label}</span>
                                    <ArrowUpRight className="size-3 text-white/40" />
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Actions - Hidden on Mobile */}
                {quickActions?.length ? (
                    <div className="hidden grid-cols-2 gap-2 sm:grid lg:grid-cols-3">
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
                                            <p className="text-sm font-semibold text-white">
                                                {action.title}
                                            </p>
                                            {action.description ? (
                                                <p className="text-xs text-white/60">
                                                    {action.description}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                    {action.badge ? (
                                        <span className="mt-3 inline-flex rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[0.65rem] tracking-[0.25em] text-white/50 uppercase">
                                            {action.badge}
                                        </span>
                                    ) : null}
                                </div>
                            );

                            if (action.href) {
                                return (
                                    <Link
                                        key={action.id}
                                        href={action.href}
                                        prefetch
                                        className="block"
                                    >
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
                    <div className="mx-auto flex w-full max-w-6xl items-center px-3 py-2 sm:px-4 md:px-8">
                        <Breadcrumbs
                            breadcrumbs={[
                                { title: 'Home', href: '/' },
                                ...breadcrumbs.map((breadcrumb, index) => {
                                    if (
                                        index === breadcrumbs.length - 1 &&
                                        breadcrumb.title.toLowerCase() ===
                                            'dashboard'
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
