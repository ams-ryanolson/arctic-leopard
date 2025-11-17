import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { resolveUrl } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function NavMain({
    items = [],
    label = 'Platform',
}: {
    items: NavItem[];
    label?: string;
}) {
    const page = usePage();
    const storageKey = 'rk:sidebar:nav:expanded';
    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
        if (typeof window === 'undefined') {
            return {};
        }

        try {
            const value = window.localStorage.getItem(storageKey);
            return value ? (JSON.parse(value) as Record<string, boolean>) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            window.localStorage.setItem(storageKey, JSON.stringify(expanded));
        } catch {
            // ignore storage errors
        }
    }, [expanded, storageKey]);

    const initialMessagesBadge = useMemo(() => {
        const candidate = items.find(
            (item) => item.title === 'Messages',
        )?.badge;
        if (typeof candidate === 'number') {
            return candidate;
        }

        if (typeof candidate === 'string') {
            const numeric = Number.parseInt(candidate, 10);
            return Number.isFinite(numeric) ? numeric : null;
        }

        return null;
    }, [items]);

    const [messageBadge, setMessageBadge] = useState<number | null>(
        initialMessagesBadge,
    );

    useEffect(() => {
        setMessageBadge(initialMessagesBadge);
    }, [initialMessagesBadge]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const handler = (event: Event) => {
            const detail = (event as CustomEvent<{ count?: number }>).detail;
            if (!detail || typeof detail.count !== 'number') {
                return;
            }

            setMessageBadge(detail.count > 0 ? detail.count : null);
        };

        window.addEventListener(
            'messaging:unread-count',
            handler as EventListener,
        );

        return () => {
            window.removeEventListener(
                'messaging:unread-count',
                handler as EventListener,
            );
        };
    }, []);

    const toggleItem = useCallback((id: string) => {
        setExpanded((prev) => ({
            ...prev,
            [id]: !(prev[id] ?? false),
        }));
    }, []);

    const normalizePath = (value: string): string => {
        if (!value) {
            return '/';
        }

        const [path] = value.split('?');
        if (!path || path === '') {
            return '/';
        }

        if (path !== '/' && path.endsWith('/')) {
            return path.slice(0, -1);
        }

        return path;
    };

    const currentPath = normalizePath(page.url);

    const pathDepth = (value: string): number =>
        normalizePath(value).split('/').filter(Boolean).length;

    const matchesTarget = (target: string, allowNested = false): boolean => {
        const normalizedTarget = normalizePath(target);

        if (currentPath === normalizedTarget) {
            return true;
        }

        if (allowNested && currentPath.startsWith(`${normalizedTarget}/`)) {
            return true;
        }

        if (page.url.startsWith(`${normalizedTarget}?`)) {
            return true;
        }

        return false;
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const resolvedHref = resolveUrl(item.href);
                    const allowNestedForItem = item.items?.length
                        ? false
                        : pathDepth(resolvedHref) >= 1;
                    const childMatch =
                        item.items?.some((child) => {
                            const childHref = resolveUrl(child.href);
                            return matchesTarget(
                                childHref,
                                pathDepth(childHref) > 1,
                            );
                        }) ?? false;
                    const isActive =
                        matchesTarget(resolvedHref, allowNestedForItem) ||
                        childMatch;
                    const isExpanded = expanded[item.title] === true;
                    const dynamicBadge =
                        item.title === 'Messages'
                            ? (messageBadge ?? item.badge)
                            : item.badge;

                    return (
                        <SidebarMenuItem key={item.title}>
                            {item.items?.length ? (
                                <>
                                    <SidebarMenuButton
                                        isActive={isActive}
                                        tooltip={{ children: item.title }}
                                        onClick={() => toggleItem(item.title)}
                                    >
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        <ChevronDown
                                            className={`ml-auto transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                                        />
                                    </SidebarMenuButton>
                                    {dynamicBadge ? (
                                        <SidebarMenuBadge className="bg-white/10 text-white/70">
                                            {dynamicBadge}
                                        </SidebarMenuBadge>
                                    ) : null}
                                    {isExpanded ? (
                                        <SidebarMenuSub>
                                            {item.items.map((child) => (
                                                <SidebarMenuSubItem
                                                    key={child.title}
                                                >
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={matchesTarget(
                                                            resolveUrl(
                                                                child.href,
                                                            ),
                                                            pathDepth(
                                                                child.href,
                                                            ) > 1,
                                                        )}
                                                    >
                                                        <Link
                                                            href={child.href}
                                                            prefetch
                                                        >
                                                            {child.icon && (
                                                                <child.icon />
                                                            )}
                                                            <span>
                                                                {child.title}
                                                            </span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    ) : null}
                                </>
                            ) : (
                                <>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                    {dynamicBadge ? (
                                        <SidebarMenuBadge className="bg-white/10 text-white/70">
                                            {dynamicBadge}
                                        </SidebarMenuBadge>
                                    ) : null}
                                </>
                            )}
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
