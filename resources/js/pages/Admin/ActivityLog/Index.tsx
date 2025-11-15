import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppLayout from '@/layouts/app-layout';
import adminRoutes from '@/routes/admin';
import { type Paginated } from '@/types/feed';
import { router, Head } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp, Search, Calendar } from 'lucide-react';
import { type FormEvent, useCallback, useMemo, useState } from 'react';

type ActivityCauser = {
    id: number;
    name: string;
    username?: string | null;
    email: string;
    avatar_url?: string | null;
} | null;

type Activity = {
    id: number;
    log_name: string;
    description: string;
    causer: ActivityCauser;
    subject_type: string | null;
    subject_id: number | null;
    properties: Record<string, unknown>;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
};

type LegacyPaginator<T> = {
    data: T[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
};

type AdminActivityLogIndexProps = {
    activities: Paginated<Activity> | LegacyPaginator<Activity>;
    filters: {
        search?: string | null;
        type?: string | null;
        user_id?: number | null;
        date_from?: string | null;
        date_to?: string | null;
    };
    users: Array<{
        id: number;
        name: string;
        username?: string | null;
        email: string;
    }>;
    activityTypes: Array<{
        value: string;
        label: string;
    }>;
};

const TYPE_ALL = 'all';
const USER_ALL = 'all';

const getActivityTypeBadgeColor = (logName: string): string => {
    if (logName.startsWith('user.')) {
        return 'border-blue-400/30 bg-blue-400/10 text-blue-300';
    }
    if (logName.startsWith('security.')) {
        return 'border-amber-400/30 bg-amber-400/10 text-amber-300';
    }
    if (logName.startsWith('membership.')) {
        return 'border-purple-400/30 bg-purple-400/10 text-purple-300';
    }
    if (logName.startsWith('admin.')) {
        return 'border-red-400/30 bg-red-400/10 text-red-300';
    }
    if (logName.startsWith('payment.')) {
        return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300';
    }
    return 'border-white/15 bg-white/10 text-white/60';
};

export default function AdminActivityLogIndex({
    activities,
    filters,
    users,
    activityTypes,
}: AdminActivityLogIndexProps) {
    const normalizedActivities = useMemo(() => {
        const raw = activities as unknown as Paginated<Activity> | LegacyPaginator<Activity>;
        
        // Backend now returns explicit { data, meta, links } structure
        if (raw && typeof raw === 'object' && 'data' in raw && 'meta' in raw) {
            const metaData = raw.meta as { current_page?: number; per_page?: number; total?: number; last_page?: number } | undefined;
            return {
                data: Array.isArray(raw.data) ? raw.data : [],
                meta: {
                    current_page: metaData?.current_page ?? 1,
                    per_page: metaData?.per_page ?? 15,
                    total: metaData?.total ?? 0,
                    last_page: metaData?.last_page ?? 1,
                },
            };
        }
        
        // Fallback for legacy format (top-level fields)
        const rawAny = raw as Record<string, unknown>;
        const data = Array.isArray(rawAny?.data) ? rawAny.data : [];
        const meta = {
            current_page: (rawAny?.current_page as number) ?? 1,
            per_page: (rawAny?.per_page as number) ?? data.length,
            total: (rawAny?.total as number) ?? data.length,
            last_page: (rawAny?.last_page as number) ?? 1,
        };

        return { data, meta };
    }, [activities]);

    const [search, setSearch] = useState(filters.search ?? '');
    const [typeFilter, setTypeFilter] = useState(filters.type ?? '');
    const [userIdFilter, setUserIdFilter] = useState(filters.user_id?.toString() ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());

    const paginationMeta = useMemo(
        () => ({
            currentPage: normalizedActivities.meta.current_page,
            perPage: normalizedActivities.meta.per_page,
            total: normalizedActivities.meta.total,
            hasMorePages: normalizedActivities.meta.current_page < normalizedActivities.meta.last_page,
        }),
        [
            normalizedActivities.meta.current_page,
            normalizedActivities.meta.last_page,
            normalizedActivities.meta.per_page,
            normalizedActivities.meta.total,
        ],
    );

    const applyFilters = useCallback(() => {
        const query: Record<string, string> = {};

        if (search.trim() !== '') {
            query.search = search.trim();
        }

        if (typeFilter && typeFilter !== '' && typeFilter !== TYPE_ALL) {
            query.type = typeFilter;
        }

        if (userIdFilter && userIdFilter !== '' && userIdFilter !== USER_ALL) {
            query.user_id = userIdFilter;
        }

        if (dateFrom !== '') {
            query.date_from = dateFrom;
        }

        if (dateTo !== '') {
            query.date_to = dateTo;
        }

        router.visit(adminRoutes.activityLog.index({ query }).url, {
            preserveScroll: true,
            replace: true,
            only: ['activities', 'filters'],
        });
    }, [typeFilter, search, userIdFilter, dateFrom, dateTo]);

    const resetFilters = useCallback(() => {
        setSearch('');
        setTypeFilter('');
        setUserIdFilter('');
        setDateFrom('');
        setDateTo('');

        router.visit(adminRoutes.activityLog.index().url, {
            preserveScroll: true,
            replace: true,
            only: ['activities', 'filters'],
        });
    }, []);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        applyFilters();
    };

    const handlePageChange = (page: number) => {
        const query: Record<string, string> = {};

        if (filters.search) {
            query.search = String(filters.search ?? '');
        }

        if (filters.type) {
            query.type = String(filters.type ?? '');
        }

        if (filters.user_id) {
            query.user_id = String(filters.user_id ?? '');
        }

        if (filters.date_from) {
            query.date_from = String(filters.date_from ?? '');
        }

        if (filters.date_to) {
            query.date_to = String(filters.date_to ?? '');
        }

        query.page = String(page);

        router.visit(adminRoutes.activityLog.index({ query }).url, {
            preserveScroll: true,
            replace: true,
            only: ['activities'],
        });
    };

    const toggleExpand = (activityId: number) => {
        setExpandedActivities((prev) => {
            const next = new Set(prev);
            if (next.has(activityId)) {
                next.delete(activityId);
            } else {
                next.add(activityId);
            }
            return next;
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Admin', href: adminRoutes.dashboard().url },
                { title: 'Activity Log', href: adminRoutes.activityLog.index().url },
            ]}
        >
            <Head title="Activity Log · Admin" />

            <div className="space-y-8 text-white">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Activity Log</h1>
                        <p className="text-sm text-white/70">
                            Monitor user actions, security events, and system activities with full audit trail.
                        </p>
                    </div>
                </header>

                <section className="grid gap-4 sm:grid-cols-3">
                    <Card className="border-white/10 bg-white/5">
                        <CardContent className="space-y-1 p-5">
                            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Total activities</p>
                            <p className="text-2xl font-semibold text-white">
                                {normalizedActivities.meta.total.toLocaleString()}
                            </p>
                            <p className="text-xs text-white/60">All logged activities in the system.</p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-white/5">
                        <CardContent className="space-y-1 p-5">
                            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Showing now</p>
                            <p className="text-2xl font-semibold text-white">
                                {normalizedActivities.data.length}
                            </p>
                            <p className="text-xs text-white/60">Use filters to focus on specific activities.</p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-white/5">
                        <CardContent className="space-y-1 p-5">
                            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Last activity</p>
                            <p className="text-2xl font-semibold text-white">
                                {normalizedActivities.data[0]?.created_at
                                    ? formatDistanceToNow(new Date(normalizedActivities.data[0].created_at), {
                                          addSuffix: true,
                                      })
                                    : 'Moments ago'}
                            </p>
                            <p className="text-xs text-white/60">Most recent activity in this view.</p>
                        </CardContent>
                    </Card>
                </section>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5"
                >
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <div className="relative w-full">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search description"
                                className="w-full rounded-full border-white/15 bg-black/30 pl-10 text-sm text-white placeholder:text-white/40 focus-visible:ring-amber-400/40"
                            />
                        </div>
                        <Select
                            value={typeFilter === '' ? TYPE_ALL : typeFilter}
                            onValueChange={(nextValue) => setTypeFilter(nextValue === TYPE_ALL ? '' : nextValue)}
                        >
                            <SelectTrigger className="w-full rounded-full border-white/15 bg-black/30 text-sm text-white focus-visible:ring-amber-400/40">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border border-white/10 bg-black/80 text-white shadow-[0_30px_70px_-50px_rgba(0,0,0,0.75)] backdrop-blur-xl">
                                <SelectItem value={TYPE_ALL} className="text-sm text-white/75 hover:bg-white/10 hover:text-white">
                                    All types
                                </SelectItem>
                                {activityTypes.map((type) => (
                                    <SelectItem
                                        key={type.value}
                                        value={type.value}
                                        className="text-sm text-white/80 hover:bg-white/10 hover:text-white"
                                    >
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={userIdFilter === '' ? USER_ALL : userIdFilter}
                            onValueChange={(nextValue) => setUserIdFilter(nextValue === USER_ALL ? '' : nextValue)}
                        >
                            <SelectTrigger className="w-full rounded-full border-white/15 bg-black/30 text-sm text-white focus-visible:ring-amber-400/40">
                                <SelectValue placeholder="Filter by user" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border border-white/10 bg-black/80 text-white shadow-[0_30px_70px_-50px_rgba(0,0,0,0.75)] backdrop-blur-xl">
                                <SelectItem value={USER_ALL} className="text-sm text-white/75 hover:bg-white/10 hover:text-white">
                                    All users
                                </SelectItem>
                                {users.map((user) => (
                                    <SelectItem
                                        key={user.id}
                                        value={String(user.id)}
                                        className="text-sm text-white/80 hover:bg-white/10 hover:text-white"
                                    >
                                        {user.name} ({user.username ?? user.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="relative">
                            <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(event) => setDateFrom(event.target.value)}
                                placeholder="Date from"
                                className="w-full rounded-full border-white/15 bg-black/30 pl-10 text-sm text-white placeholder:text-white/40 focus-visible:ring-amber-400/40"
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(event) => setDateTo(event.target.value)}
                                placeholder="Date to"
                                className="w-full rounded-full border-white/15 bg-black/30 pl-10 text-sm text-white placeholder:text-white/40 focus-visible:ring-amber-400/40"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            type="submit"
                            className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-5 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_20px_55px_-30px_rgba(249,115,22,0.55)] transition hover:scale-[1.02]"
                        >
                            Apply filters
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={resetFilters}
                            className="rounded-full border border-white/15 bg-white/5 px-5 text-xs uppercase tracking-[0.3em] text-white/75 hover:border-white/35 hover:bg-white/10 hover:text-white"
                        >
                            Reset
                        </Button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 ring-1 ring-white/5">
                    <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
                        <thead className="bg-black/35 text-xs uppercase tracking-[0.35em] text-white/50">
                            <tr>
                                <th className="px-5 py-3 text-left">User</th>
                                <th className="px-5 py-3 text-left">Type</th>
                                <th className="px-5 py-3 text-left">Description</th>
                                <th className="px-5 py-3 text-left">IP Address</th>
                                <th className="px-5 py-3 text-left">Timestamp</th>
                                <th className="px-5 py-3 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {normalizedActivities.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-white/55">
                                        No activities matched your filters. Try adjusting your search or filters.
                                    </td>
                                </tr>
                            ) : (
                                normalizedActivities.data.map((activity) => {
                                    const isExpanded = expandedActivities.has(activity.id);
                                    const initials = activity.causer
                                        ? (activity.causer.name ?? activity.causer.username ?? 'U')
                                              .split(' ')
                                              .map((part: string) => part[0])
                                              .join('')
                                              .toUpperCase()
                                              .slice(0, 2)
                                        : 'SY';

                                    return (
                                        <>
                                            <tr key={activity.id} className="bg-black/15 transition hover:bg-white/5">
                                                <td className="px-5 py-4">
                                                    {activity.causer ? (
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="size-10 border border-white/10 bg-white/10">
                                                                <AvatarImage
                                                                    src={activity.causer.avatar_url ?? undefined}
                                                                    alt={activity.causer.name}
                                                                />
                                                                <AvatarFallback className="bg-white/10 text-white/70">
                                                                    {initials}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="space-y-1">
                                                                <p className="font-semibold text-white">
                                                                    {activity.causer.name}
                                                                </p>
                                                                <div className="text-xs text-white/55">
                                                                    @{activity.causer.username ?? `user-${activity.causer.id}`} ·{' '}
                                                                    {activity.causer.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-white/40">System</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <Badge
                                                        className={`rounded-full border text-xs uppercase tracking-[0.25em] ${getActivityTypeBadgeColor(
                                                            activity.log_name,
                                                        )}`}
                                                    >
                                                        {activity.log_name.split('.').pop()?.replace(/_/g, ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-white">{activity.description}</p>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-white/60">
                                                    {activity.ip_address ?? '—'}
                                                </td>
                                                <td className="px-5 py-4 text-sm text-white/60">
                                                    {formatDistanceToNow(new Date(activity.created_at), {
                                                        addSuffix: true,
                                                    })}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleExpand(activity.id)}
                                                        className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-4 text-xs uppercase tracking-[0.3em] text-white/75 hover:border-white/35 hover:bg-white/10 hover:text-white"
                                                    >
                                                        {isExpanded ? (
                                                            <>
                                                                <ChevronUp className="h-3.5 w-3.5" />
                                                                Hide
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronDown className="h-3.5 w-3.5" />
                                                                Show
                                                            </>
                                                        )}
                                                    </Button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={6} className="px-5 py-4 bg-black/25">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                                                                    Properties
                                                                </h4>
                                                                <pre className="overflow-auto rounded-lg border border-white/10 bg-black/50 p-4 text-xs text-white/80">
                                                                    {JSON.stringify(activity.properties, null, 2)}
                                                                </pre>
                                                            </div>
                                                            {activity.user_agent && (
                                                                <div>
                                                                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                                                                        User Agent
                                                                    </h4>
                                                                    <p className="text-xs text-white/70">{activity.user_agent}</p>
                                                                </div>
                                                            )}
                                                            {activity.subject_type && (
                                                                <div>
                                                                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                                                                        Subject
                                                                    </h4>
                                                                    <p className="text-xs text-white/70">
                                                                        {activity.subject_type} (ID: {activity.subject_id})
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination meta={paginationMeta} onPageChange={handlePageChange} />
            </div>
        </AppLayout>
    );
}

