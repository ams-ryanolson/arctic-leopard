import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getCsrfToken } from '@/lib/csrf';
import {
    deleteAllNotifications,
    deleteNotification,
    fetchNotificationsPage,
    fetchUnreadNotificationCount,
    markAllNotificationsRead,
    markNotificationRead,
} from '@/lib/notifications-client';
import profileRoutes from '@/routes/profile';
import notificationsRoutes from '@/routes/notifications';
import usersRoutes from '@/routes/users';
import type {
    NotificationFilter,
    NotificationItem,
    NotificationPage,
    NotificationSubject,
} from '@/types/notifications';
import type { SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import {
    Ban,
    Bell,
    Bookmark,
    Check,
    CircleCheck,
    Heart,
    Loader2,
    MailOpen,
    Sparkles,
    UserPlus,
    type LucideIcon,
    Trash2,
} from 'lucide-react';

type NotificationsPageProps = SharedData & {
    notifications: NotificationPage;
    notificationsPageName: string;
    notificationsPerPage: number;
    activeFilter: string;
    unreadCount: number;
};

type NotificationPresentation = {
    icon: LucideIcon;
    title: string;
    description?: string | null;
    actionLabel?: string;
    actionHref?: string;
    accent: 'rose' | 'violet' | 'sky' | 'stone' | 'emerald';
};

const accentStyles: Record<NotificationPresentation['accent'], string> = {
    rose: 'border-rose-500/35 bg-rose-500/10',
    violet: 'border-violet-500/35 bg-violet-500/10',
    sky: 'border-sky-500/35 bg-sky-500/10',
    stone: 'border-white/15 bg-white/5',
    emerald: 'border-emerald-500/35 bg-emerald-500/10',
};

function isPostSubject(subject: NotificationSubject): subject is Extract<NotificationSubject, { type: 'post' }> {
    return typeof subject === 'object' && subject !== null && 'type' in subject && subject.type === 'post';
}

function isUserSubject(subject: NotificationSubject): subject is Extract<NotificationSubject, { type: 'user' }> {
    return typeof subject === 'object' && subject !== null && 'type' in subject && subject.type === 'user';
}

function resolveActorName(notification: NotificationItem): string {
    return (
        notification.actor?.display_name ??
        (notification.actor?.username ? `@${notification.actor.username}` : 'Someone')
    );
}

function resolveNotificationPresentation(notification: NotificationItem): NotificationPresentation {
    const actorName = resolveActorName(notification);
    const subject = notification.subject;
    const postMeta =
        notification.meta && typeof notification.meta === 'object'
            ? (notification.meta['post'] as Record<string, unknown> | undefined)
            : undefined;
    const postExcerpt =
        postMeta && typeof postMeta === 'object' && 'excerpt' in postMeta && typeof postMeta.excerpt === 'string'
            ? postMeta.excerpt
            : null;

    if (notification.type === 'post-liked') {
        const authorUsername = isPostSubject(subject)
            ? subject.author?.username ?? notification.actor?.username ?? null
            : notification.actor?.username ?? null;

        return {
            icon: Heart,
            title: `${actorName} liked your post`,
            description: postExcerpt,
            actionLabel: authorUsername ? 'View profile' : undefined,
            actionHref: authorUsername ? profileRoutes.show.url({ username: authorUsername }) : undefined,
            accent: 'rose',
        };
    }

    if (notification.type === 'post-bookmarked') {
        const authorUsername = isPostSubject(subject)
            ? subject.author?.username ?? notification.actor?.username ?? null
            : notification.actor?.username ?? null;

        return {
            icon: Bookmark,
            title: `${actorName} saved your post`,
            description: postExcerpt,
            actionLabel: authorUsername ? 'Go to profile' : undefined,
            actionHref: authorUsername ? profileRoutes.show.url({ username: authorUsername }) : undefined,
            accent: 'violet',
        };
    }

    if (notification.type === 'user-follow-requested') {
        const followerUsername = notification.actor?.username ?? (isUserSubject(subject) ? subject.id ?? null : null);

        return {
            icon: UserPlus,
            title: `${actorName} requested to follow you`,
            description: 'Approve the request to let them see your follower-only updates.',
            actionLabel: followerUsername ? 'Review profile' : undefined,
            actionHref: followerUsername
                ? profileRoutes.show.url({
                      username: followerUsername,
                  })
                : undefined,
            accent: 'violet',
        };
    }

    if (notification.type === 'user-followed') {
        const followerUsername = notification.actor?.username ?? (isUserSubject(subject) ? subject.id ?? null : null);

        return {
            icon: UserPlus,
            title: `${actorName} is following you`,
            description: 'Welcome them to your circle with a quick hello or share your latest drop.',
            actionLabel: followerUsername ? 'View profile' : undefined,
            actionHref: followerUsername
                ? profileRoutes.show.url({
                      username: followerUsername,
                  })
                : undefined,
            accent: 'sky',
        };
    }

    if (notification.type === 'user-follow-request-approved') {
        const creatorUsername = notification.actor?.username ?? (isUserSubject(subject) ? subject.id ?? null : null);

        return {
            icon: CircleCheck,
            title: `${actorName} approved your follow request`,
            description: 'You can now see everything they share with followers.',
            actionLabel: creatorUsername ? 'View profile' : undefined,
            actionHref: creatorUsername
                ? profileRoutes.show.url({
                      username: creatorUsername,
                  })
                : undefined,
            accent: 'emerald',
        };
    }

    return {
        icon: Bell,
        title: actorName,
        description: 'You have a new activity update.',
        accent: 'stone',
    };
}

const EmptyState = ({ filter }: { filter: NotificationFilter }) => (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/30 px-10 py-16 text-center text-white/70">
        {filter === 'unread' ? <MailOpen className="size-12 text-amber-300/60" /> : <Sparkles className="size-12 text-amber-300/60" />}
        <h2 className="mt-6 text-2xl font-semibold text-white">
            {filter === 'unread' ? 'You are all caught up' : 'Keep connecting'}
        </h2>
        <p className="mt-3 max-w-xl text-sm text-white/60">
            {filter === 'unread'
                ? 'You have read every notification. New activity will land here first.'
                : 'Likes, bookmarks, follows, and more will show up here as your network reacts to your work.'}
        </p>
    </div>
);

const filterOptions: NotificationFilter[] = ['all', 'unread'];

function emitUnreadCount(count: number) {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(
        new CustomEvent('notifications:updated', {
            detail: { unreadCount: count },
        }),
    );
}

export default function NotificationsIndex() {
    const {
        notifications,
        notificationsPageName,
        activeFilter,
        unreadCount,
        auth,
    } = usePage<NotificationsPageProps>().props;

    const initialFilter: NotificationFilter = activeFilter === 'unread' ? 'unread' : 'all';
    const [filter, setFilter] = useState<NotificationFilter>(initialFilter);
    const [pages, setPages] = useState<NotificationPage[]>([notifications]);
    const [hasMore, setHasMore] = useState(
        notifications.meta.current_page < notifications.meta.last_page,
    );
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const [isClearingAll, setIsClearingAll] = useState(false);
    const [pendingReadIds, setPendingReadIds] = useState<string[]>([]);
    const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
    const itemIdsRef = useRef<Set<string>>(new Set());
    const pendingReloadRef = useRef(false);
    const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const [pendingFollowRequestIds, setPendingFollowRequestIds] = useState<string[]>([]);

    const items = useMemo(() => pages.flatMap((page) => page.data), [pages]);
    const authUserId = auth?.user?.id ?? null;

    useEffect(() => {
        setPages([notifications]);
        setHasMore(notifications.meta.current_page < notifications.meta.last_page);
        setIsLoadingMore(false);
        setErrorMessage(null);
        setPendingDeleteIds([]);
    }, [notifications]);

    useEffect(() => {
        const ids = new Set<string>();
        items.forEach((item) => ids.add(item.id));
        itemIdsRef.current = ids;
    }, [items]);

    useEffect(() => {
        setFilter(initialFilter);
    }, [initialFilter]);

    useEffect(() => {
        setLocalUnreadCount(unreadCount);
        emitUnreadCount(unreadCount);
    }, [unreadCount]);

    const updatePendingState = useCallback((notificationId: string, pending: boolean) => {
        setPendingReadIds((previous) => {
            if (pending) {
                return previous.includes(notificationId) ? previous : [...previous, notificationId];
            }

            return previous.filter((id) => id !== notificationId);
        });
    }, []);

    const applyReadState = useCallback((notificationId: string, readAt: string | null) => {
        setPages((previous) =>
            previous.map((page) => ({
                ...page,
                data: page.data.map((notification) =>
                    notification.id === notificationId && notification.read_at === null
                        ? {
                              ...notification,
                              read_at: readAt ?? new Date().toISOString(),
                          }
                        : notification,
                ),
            })),
        );
    }, []);

    const handleMarkNotificationRead = useCallback(
        async (notificationId: string) => {
            const target = items.find((item) => item.id === notificationId);

            if (!target || target.read_at !== null) {
                return;
            }

            updatePendingState(notificationId, true);
            setErrorMessage(null);

            try {
                const response = await markNotificationRead(notificationId);
                applyReadState(notificationId, response.read_at);
                setLocalUnreadCount(response.unread_count);
                emitUnreadCount(response.unread_count);
            } catch (error) {
                console.error(error);
                setErrorMessage('We could not mark that notification as read. Please try again.');
            } finally {
                updatePendingState(notificationId, false);
            }
        },
        [applyReadState, items, updatePendingState],
    );

    const handleFollowRequestAction = useCallback(
        async (notification: NotificationItem, action: 'accept' | 'decline') => {
            if (authUserId === null || !notification.actor?.id) {
                setErrorMessage('We could not process that follow request right now.');
                return;
            }

            const followerId =
                typeof notification.actor.id === 'number'
                    ? notification.actor.id
                    : Number.parseInt(String(notification.actor.id), 10);

            if (!Number.isFinite(followerId)) {
                setErrorMessage('We could not process that follow request right now.');
                return;
            }

            const wasUnread = notification.read_at === null;
            const endpoint =
                action === 'accept'
                    ? usersRoutes.followRequests.accept.url([authUserId, followerId])
                    : usersRoutes.followRequests.destroy.url([authUserId, followerId]);
            const method = action === 'accept' ? 'POST' : 'DELETE';
            const csrfToken = getCsrfToken();

            setPendingFollowRequestIds((previous) =>
                previous.includes(notification.id) ? previous : [...previous, notification.id],
            );
            setErrorMessage(null);

            try {
                const response = await fetch(endpoint, {
                    method,
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
                    },
                    credentials: 'include',
                });

                const payload = (await response.json().catch(() => null)) as
                    | { message?: string }
                    | null;

                if (!response.ok) {
                    const message =
                        payload?.message ??
                        (action === 'accept'
                            ? 'We could not approve that follow request. Please try again.'
                            : 'We could not decline that follow request. Please try again.');

                    throw new Error(message);
                }

                setPages((previous) =>
                    previous.map((page) => ({
                        ...page,
                        data: page.data.filter((item) => item.id !== notification.id),
                    })),
                );

                if (wasUnread) {
                    setLocalUnreadCount((previous) => {
                        const next = Math.max(previous - 1, 0);
                        emitUnreadCount(next);

                        return next;
                    });
                }
            } catch (error) {
                console.error(error);
                setErrorMessage(
                    action === 'accept'
                        ? 'We could not approve that follow request. Please try again.'
                        : 'We could not decline that follow request. Please try again.',
                );
            } finally {
                setPendingFollowRequestIds((previous) =>
                    previous.filter((id) => id !== notification.id),
                );
            }
        },
        [authUserId],
    );

    const handleMarkAllRead = useCallback(async () => {
        if (localUnreadCount === 0 || isMarkingAll) {
            return;
        }

        setIsMarkingAll(true);
        setErrorMessage(null);

        try {
            const response = await markAllNotificationsRead();
            const resolvedReadAt = new Date().toISOString();

            setPages((previous) =>
                previous.map((page) => ({
                    ...page,
                    data: page.data.map((notification) =>
                        notification.read_at === null
                            ? {
                                  ...notification,
                                  read_at: resolvedReadAt,
                              }
                            : notification,
                    ),
                })),
            );

            setLocalUnreadCount(response.unread_count);
            setPendingReadIds([]);
            emitUnreadCount(response.unread_count);
        } catch (error) {
            console.error(error);
            setErrorMessage('We could not mark notifications as read. Please try again.');
        } finally {
            setIsMarkingAll(false);
        }
    }, [isMarkingAll, localUnreadCount]);

    const handleDeleteNotification = useCallback(
        async (notificationId: string) => {
            const target = items.find((item) => item.id === notificationId);

            if (!target) {
                return;
            }

            setPendingDeleteIds((previous) =>
                previous.includes(notificationId) ? previous : [...previous, notificationId],
            );
            setErrorMessage(null);

            try {
                const response = await deleteNotification(notificationId);
                setPages((previous) =>
                    previous
                        .map((page) => ({
                            ...page,
                            data: page.data.filter((notification) => notification.id !== notificationId),
                        }))
                        .filter((page) => page.data.length > 0),
                );
                setLocalUnreadCount(response.unread_count);
                emitUnreadCount(response.unread_count);
            } catch (error) {
                console.error(error);
                setErrorMessage('We could not delete that notification. Please try again.');
            } finally {
                setPendingDeleteIds((previous) => previous.filter((id) => id !== notificationId));
            }
        },
        [items],
    );

    const handleDeleteAllNotifications = useCallback(async () => {
        if (items.length === 0 || isClearingAll) {
            return;
        }

        setIsClearingAll(true);
        setErrorMessage(null);

        try {
            const response = await deleteAllNotifications();
            setPages([]);
            setHasMore(false);
            setLocalUnreadCount(response.unread_count);
            setPendingReadIds([]);
            setPendingDeleteIds([]);
            emitUnreadCount(response.unread_count);
        } catch (error) {
            console.error(error);
            setErrorMessage('We could not clear your notifications. Please try again.');
        } finally {
            setIsClearingAll(false);
        }
    }, [items.length, isClearingAll]);

    const handleFilterChange = useCallback(
        (nextFilter: NotificationFilter) => {
            if (filter === nextFilter) {
                return;
            }

            setFilter(nextFilter);
            router.get(
                notificationsRoutes.index.url({
                    query: nextFilter === 'unread' ? { filter: 'unread' } : {},
                }),
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                    only: ['notifications', 'activeFilter', 'unreadCount'],
                    onError: (errors) => {
                        console.error(errors);
                        setErrorMessage('We could not switch filters right now. Try again shortly.');
                    },
                },
            );
        },
        [filter],
    );

    const loadMore = useCallback(
        async (signal?: AbortSignal) => {
            if (isLoadingMore || !hasMore) {
                return;
            }

            const lastPage = pages[pages.length - 1];
            const nextPageNumber = lastPage ? lastPage.meta.current_page + 1 : 1;

            setIsLoadingMore(true);
            setErrorMessage(null);

            try {
                const nextPage = await fetchNotificationsPage({
                    page: nextPageNumber,
                    filter: filter === 'unread' ? 'unread' : undefined,
                    pageName: notificationsPageName,
                    signal,
                });

                setPages((previous) => [...previous, nextPage]);
                setHasMore(nextPage.meta.current_page < nextPage.meta.last_page);
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return;
                }

                console.error(error);
                setErrorMessage('We could not load additional notifications. Please retry.');
            } finally {
                setIsLoadingMore(false);
            }
        },
        [filter, hasMore, isLoadingMore, notificationsPageName, pages],
    );

    useEffect(() => {
        if (!hasMore) {
            return;
        }

        const sentinel = sentinelRef.current;

        if (!sentinel) {
            return;
        }

        const controller = new AbortController();
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    void loadMore(controller.signal);
                }
            },
            { rootMargin: '200px' },
        );

        observer.observe(sentinel);

        return () => {
            controller.abort();
            observer.disconnect();
        };
    }, [hasMore, loadMore]);

    useEffect(() => {
        let isMounted = true;

    if (typeof window === 'undefined') {
        return () => {};
    }

        const updateUnreadCount = async () => {
            try {
                const count = await fetchUnreadNotificationCount();

                if (isMounted) {
                    setLocalUnreadCount(count);
                    emitUnreadCount(count);
                }
            } catch (error) {
                console.error(error);
            }
        };

        const interval = window.setInterval(updateUnreadCount, 60_000);

        return () => {
            isMounted = false;
            window.clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const handleReceived: EventListener = (event) => {
            const custom = event as CustomEvent<{ id?: string | number } | undefined>;
            const detail = custom.detail ?? {};
            const notificationId =
                typeof detail?.id === 'string'
                    ? detail.id
                    : typeof detail?.id === 'number'
                        ? detail.id.toString()
                        : undefined;

            if (notificationId && itemIdsRef.current.has(notificationId)) {
                return;
            }

            if (pendingReloadRef.current) {
                return;
            }

            pendingReloadRef.current = true;

            const query = filter === 'unread' ? { filter: 'unread' } : {};

            router.get(
                notificationsRoutes.index.url({
                    query,
                }),
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                    only: ['notifications', 'activeFilter', 'unreadCount'],
                    onFinish: () => {
                        pendingReloadRef.current = false;
                    },
                    onError: () => {
                        pendingReloadRef.current = false;
                    },
                },
            );
        };

        window.addEventListener('notifications:received', handleReceived);

        return () => {
            window.removeEventListener('notifications:received', handleReceived);
        };
    }, [filter]);

    const handleNotificationClick = useCallback(
        (notification: NotificationItem, actionHref?: string) => {
            if (notification.read_at === null) {
                void handleMarkNotificationRead(notification.id);
            }

            if (actionHref) {
                router.visit(actionHref, {
                    preserveScroll: true,
                });
            }
        },
        [handleMarkNotificationRead],
    );

    const isEmpty = items.length === 0;

    return (
        <AppLayout>
            <Head title="Notifications" />

            <div className="space-y-8">
                <header className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-white/45">Activity feed</p>
                        <h1 className="mt-2 text-3xl font-semibold text-white">Notifications</h1>
                        <p className="mt-2 max-w-2xl text-sm text-white/60">
                            Track the momentum around your posts and relationships. Likes, bookmarks, and follows surface
                            here instantly.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                            {localUnreadCount} unread
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllRead}
                            disabled={localUnreadCount === 0 || isMarkingAll}
                            className="flex items-center gap-2 rounded-full border-white/20 bg-white/10 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white/40 hover:bg-white/20 hover:text-white"
                        >
                            {isMarkingAll ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                            Mark all
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteAllNotifications}
                        disabled={items.length === 0 || isClearingAll}
                        className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 text-xs font-semibold uppercase tracking-[0.3em] text-white/60 transition hover:border-white/40 hover:bg-white/20 hover:text-white disabled:opacity-40"
                    >
                        {isClearingAll ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                        Clear all
                    </Button>
                </header>

                <div className="flex flex-wrap items-center gap-3">
                    {filterOptions.map((option) => {
                        const isActive = filter === option;
                        return (
                            <Button
                                key={option}
                                size="sm"
                                onClick={() => handleFilterChange(option)}
                                variant={isActive ? 'default' : 'ghost'}
                                className={cn(
                                    'rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition',
                                    isActive
                                        ? 'border-amber-400/50 bg-gradient-to-r from-amber-400/90 via-rose-500/80 to-violet-500/80 text-white shadow-[0_20px_50px_-20px_rgba(249,115,22,0.65)]'
                                        : 'bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white',
                                )}
                            >
                                {option === 'all' ? 'All' : 'Unread'}
                            </Button>
                        );
                    })}
                </div>

                {errorMessage ? (
                    <Alert className="border-rose-500/40 bg-rose-500/10 text-rose-50">
                        <AlertTitle>Heads up</AlertTitle>
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                ) : null}

                {isEmpty ? (
                    <EmptyState filter={filter} />
                ) : (
                    <div className="space-y-3">
                        {items.map((notification) => {
                        const presentation = resolveNotificationPresentation(notification);
                        const followRequestPending = pendingFollowRequestIds.includes(notification.id);
                            const Icon = presentation.icon;
                            const isUnread = notification.read_at === null;
                            const pending = pendingReadIds.includes(notification.id);
                            const deleting = pendingDeleteIds.includes(notification.id);
                            const createdAt = notification.created_at ? new Date(notification.created_at) : null;
                            const timestamp = createdAt
                                ? formatDistanceToNow(createdAt, { addSuffix: true })
                                : 'Just now';

                            return (
                                <Card
                                    key={notification.id}
                                    className={cn(
                                        'border bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10',
                                        isUnread ? 'border-amber-400/45 bg-amber-400/10' : 'border-white/10',
                                    )}
                                >
                                    <div className="flex flex-wrap items-start gap-4">
                                        <div
                                            className={cn(
                                                'flex size-12 items-center justify-center rounded-full border',
                                                accentStyles[presentation.accent],
                                            )}
                                        >
                                            <Icon className="size-5 text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            className={cn(
                                                                'rounded-full border-white/20 bg-white/10 text-[0.65rem] uppercase tracking-[0.25em] text-white/60',
                                                                presentation.accent !== 'stone'
                                                                    ? 'border-white/25 bg-white/15 text-white/80'
                                                                    : null,
                                                            )}
                                                        >
                                                            {notification.type.replace('-', ' ')}
                                                        </Badge>
                                                        {isUnread ? (
                                                            <span className="text-[0.65rem] uppercase tracking-[0.3em] text-amber-200">
                                                                New
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <h3 className="mt-1 text-sm font-semibold text-white">
                                                        {presentation.title}
                                                    </h3>
                                                    {presentation.description ? (
                                                        <p className="mt-1 text-sm text-white/70">
                                                            {presentation.description}
                                                        </p>
                                                    ) : null}
                                                </div>

                                                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/45">
                                                    <span>{timestamp}</span>
                                                    {isUnread ? <span className="size-1.5 rounded-full bg-amber-300" /> : null}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3">
                                                {notification.type === 'user-follow-requested' ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 hover:border-emerald-400/40 hover:bg-emerald-400/25 hover:text-white"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                void handleFollowRequestAction(notification, 'accept');
                                                            }}
                                                            disabled={followRequestPending}
                                                        >
                                                            {followRequestPending ? (
                                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                            ) : (
                                                                <Check className="mr-2 size-4" />
                                                            )}
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white/30 hover:bg-white/15 hover:text-white"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                void handleFollowRequestAction(notification, 'decline');
                                                            }}
                                                            disabled={followRequestPending}
                                                        >
                                                            {followRequestPending ? (
                                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                            ) : (
                                                                <Ban className="mr-2 size-4" />
                                                            )}
                                                            Decline
                                                        </Button>
                                                    </>
                                                ) : null}
                                                {presentation.actionHref ? (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white/30 hover:bg-white/15 hover:text-white"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            handleNotificationClick(notification, presentation.actionHref);
                                                        }}
                                                    >
                                                        {presentation.actionLabel ?? 'Open'}
                                                    </Button>
                                                ) : null}
                                                {isUnread ? (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/60 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            void handleMarkNotificationRead(notification.id);
                                                        }}
                                                        disabled={pending}
                                                    >
                                                        {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
                                                        Mark read
                                                    </Button>
                                                ) : null}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-rose-100/80 transition hover:border-rose-400/40 hover:bg-rose-500/20 hover:text-white"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        void handleDeleteNotification(notification.id);
                                                    }}
                                                    disabled={deleting}
                                                >
                                                    {deleting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}

                        <div ref={sentinelRef} className="h-1 w-full" />

                        {isLoadingMore ? (
                            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/10 bg-black/20 px-6 py-8 text-white/60">
                                <Loader2 className="size-6 animate-spin text-white/70" />
                                <span className="text-xs uppercase tracking-[0.3em]">Loading more</span>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

