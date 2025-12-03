import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import adminRoutes from '@/routes/admin';
import adminUsersRoutes from '@/routes/admin/users';
import { type SharedData } from '@/types';
import { type Paginated } from '@/types/feed';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { format, formatDistanceToNow } from 'date-fns';
import {
    AlertCircle,
    Ban,
    Clock,
    Search,
    ShieldOff,
    UserX,
} from 'lucide-react';
import { type FormEvent, useCallback, useMemo, useState } from 'react';

type SuspendedBy = {
    id: number;
    name: string;
    username?: string | null;
} | null;

type BannedBy = {
    id: number;
    name: string;
    username?: string | null;
} | null;

type SuspendedUser = {
    id: number;
    name: string;
    display_name?: string | null;
    username?: string | null;
    email: string;
    avatar_url?: string | null;
    created_at?: string | null;
    roles: string[];
    is_suspended?: boolean;
    is_banned?: boolean;
    suspended_at?: string | null;
    suspended_until?: string | null;
    suspended_reason?: string | null;
    suspended_by?: SuspendedBy;
    banned_at?: string | null;
    banned_reason?: string | null;
    banned_by?: BannedBy;
    warning_count?: number;
    last_warned_at?: string | null;
};

type LegacyPaginator<T> = {
    data: T[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
};

type AdminSuspensionsProps = {
    users: Paginated<SuspendedUser> | LegacyPaginator<SuspendedUser>;
    filters: {
        search?: string | null;
        status?: string | null;
    };
};

export default function AdminSuspensions() {
    const { auth } = usePage<SharedData>().props;
    const props = usePage<AdminSuspensionsProps>().props;

    const normalizedUsers = useMemo(() => {
        const raw = props.users as unknown as Partial<
            Paginated<SuspendedUser>
        > &
            LegacyPaginator<SuspendedUser>;
        const data = Array.isArray(raw.data) ? raw.data : [];
        const metaSource = raw.meta ?? {
            current_page: raw.current_page ?? 1,
            per_page: raw.per_page ?? data.length,
            total: raw.total ?? data.length,
            last_page: raw.last_page ?? 1,
        };

        return {
            data,
            meta: {
                current_page: metaSource.current_page ?? 1,
                per_page: metaSource.per_page ?? data.length,
                total: metaSource.total ?? data.length,
                last_page: metaSource.last_page ?? 1,
            },
        };
    }, [props.users]);

    const [search, setSearch] = useState(props.filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(
        props.filters.status ?? 'all',
    );

    const handleFilter = useCallback(
        (e?: FormEvent) => {
            if (e) {
                e.preventDefault();
            }

            const params = new URLSearchParams();
            if (search && search.trim() !== '') {
                params.set('search', search.trim());
            }
            if (statusFilter && statusFilter !== 'all') {
                params.set('status', statusFilter);
            }

            router.visit(
                adminUsersRoutes.suspensions().url +
                    (params.toString() ? `?${params.toString()}` : ''),
                { preserveState: true, preserveScroll: true },
            );
        },
        [search, statusFilter],
    );

    const breadcrumbs = [
        {
            title: 'Admin',
            href: adminRoutes.dashboard().url,
        },
        {
            title: 'Users',
            href: adminUsersRoutes.index().url,
        },
        {
            title: 'Suspensions & Bans',
            href: adminUsersRoutes.suspensions().url,
            current: true,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin · Suspensions & Bans" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            Suspensions & Bans
                        </h1>
                        <p className="mt-1 text-sm text-white/60">
                            View and manage all suspended and banned users
                        </p>
                    </div>
                    <Link
                        href={adminUsersRoutes.index().url}
                        className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.35em] text-white/75 uppercase transition-all hover:border-white/30 hover:bg-white/10 hover:text-white"
                    >
                        All Users
                    </Link>
                </div>

                <Card className="border-white/10 bg-white/5">
                    <CardContent className="p-6">
                        <form
                            onSubmit={handleFilter}
                            className="flex flex-col gap-4 sm:flex-row sm:items-center"
                        >
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
                                    <Input
                                        placeholder="Search by name, username, or email..."
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleFilter(e);
                                            }
                                        }}
                                        className="rounded-full border-white/20 bg-black/25 pl-10 text-sm text-white transition-all placeholder:text-white/40 focus-visible:border-amber-400/50 focus-visible:ring-amber-400/40"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 sm:max-w-[200px]">
                                <Select
                                    value={statusFilter}
                                    onValueChange={setStatusFilter}
                                >
                                    <SelectTrigger className="border-white/10 bg-white/5 text-white">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Statuses
                                        </SelectItem>
                                        <SelectItem value="suspended">
                                            Suspended
                                        </SelectItem>
                                        <SelectItem value="banned">
                                            Banned
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                type="submit"
                                variant="default"
                                className="rounded-full"
                            >
                                Apply Filters
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    {normalizedUsers.data.length === 0 ? (
                        <Card className="border-white/10 bg-white/5">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <UserX className="size-12 text-white/40" />
                                <p className="mt-4 text-sm text-white/60">
                                    No suspended or banned users found
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        normalizedUsers.data.map((user) => (
                            <Card
                                key={user.id}
                                className="border-white/10 bg-white/5 transition hover:border-white/20"
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-12">
                                                    <AvatarImage
                                                        src={
                                                            user.avatar_url ??
                                                            undefined
                                                        }
                                                    />
                                                    <AvatarFallback>
                                                        {user.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-white">
                                                            {user.display_name ||
                                                                user.name}
                                                        </p>
                                                        {user.is_banned ? (
                                                            <Badge className="border-red-400/30 bg-red-400/10 text-red-300">
                                                                Banned
                                                            </Badge>
                                                        ) : user.is_suspended ? (
                                                            <Badge className="border-amber-400/30 bg-amber-400/10 text-amber-300">
                                                                Suspended
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2 text-sm text-white/60">
                                                        {user.username && (
                                                            <span>
                                                                @{user.username}
                                                            </span>
                                                        )}
                                                        {user.email && (
                                                            <>
                                                                <span>·</span>
                                                                <span>
                                                                    {user.email}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4 sm:grid-cols-2">
                                                {user.is_banned && (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Ban className="size-4 text-red-400" />
                                                            <span className="text-xs font-semibold tracking-wider text-white/50 uppercase">
                                                                Banned
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-white/80">
                                                            {user.banned_at
                                                                ? formatDistanceToNow(
                                                                      new Date(
                                                                          user.banned_at,
                                                                      ),
                                                                      {
                                                                          addSuffix: true,
                                                                      },
                                                                  )
                                                                : 'Unknown'}
                                                        </p>
                                                        {user.banned_reason && (
                                                            <p className="text-xs text-white/60">
                                                                {
                                                                    user.banned_reason
                                                                }
                                                            </p>
                                                        )}
                                                        {user.banned_by && (
                                                            <p className="text-xs text-white/50">
                                                                by{' '}
                                                                {
                                                                    user
                                                                        .banned_by
                                                                        .name
                                                                }
                                                                {user.banned_by
                                                                    .username &&
                                                                    ` (@${user.banned_by.username})`}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {user.is_suspended && (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <ShieldOff className="size-4 text-amber-400" />
                                                            <span className="text-xs font-semibold tracking-wider text-white/50 uppercase">
                                                                Suspended
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-white/80">
                                                            {user.suspended_at
                                                                ? formatDistanceToNow(
                                                                      new Date(
                                                                          user.suspended_at,
                                                                      ),
                                                                      {
                                                                          addSuffix: true,
                                                                      },
                                                                  )
                                                                : 'Unknown'}
                                                        </p>
                                                        {user.suspended_until && (
                                                            <div className="flex items-center gap-1 text-xs text-white/60">
                                                                <Clock className="size-3" />
                                                                <span>
                                                                    Until{' '}
                                                                    {format(
                                                                        new Date(
                                                                            user.suspended_until,
                                                                        ),
                                                                        'MMM d, yyyy',
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {user.suspended_reason && (
                                                            <p className="text-xs text-white/60">
                                                                {
                                                                    user.suspended_reason
                                                                }
                                                            </p>
                                                        )}
                                                        {user.suspended_by && (
                                                            <p className="text-xs text-white/50">
                                                                by{' '}
                                                                {
                                                                    user
                                                                        .suspended_by
                                                                        .name
                                                                }
                                                                {user
                                                                    .suspended_by
                                                                    .username &&
                                                                    ` (@${user.suspended_by.username})`}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {user.warning_count !==
                                                    undefined &&
                                                    user.warning_count > 0 && (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <AlertCircle className="size-4 text-amber-400" />
                                                                <span className="text-xs font-semibold tracking-wider text-white/50 uppercase">
                                                                    Warnings
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-white/80">
                                                                {
                                                                    user.warning_count
                                                                }{' '}
                                                                active warning
                                                                {user.warning_count !==
                                                                    1 && 's'}
                                                            </p>
                                                            {user.last_warned_at && (
                                                                <p className="text-xs text-white/60">
                                                                    Last:{' '}
                                                                    {formatDistanceToNow(
                                                                        new Date(
                                                                            user.last_warned_at,
                                                                        ),
                                                                        {
                                                                            addSuffix: true,
                                                                        },
                                                                    )}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Link
                                                href={
                                                    adminUsersRoutes.index().url
                                                }
                                                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.35em] text-white/75 uppercase transition-all hover:border-white/30 hover:bg-white/10 hover:text-white"
                                            >
                                                View Profile
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {normalizedUsers.meta.last_page > 1 && (
                    <Pagination
                        currentPage={normalizedUsers.meta.current_page}
                        totalPages={normalizedUsers.meta.last_page}
                        onPageChange={(page) => {
                            const params = new URLSearchParams(
                                window.location.search,
                            );
                            params.set('page', String(page));
                            router.visit(
                                adminUsersRoutes.suspensions().url +
                                    `?${params.toString()}`,
                                {
                                    preserveState: true,
                                    preserveScroll: true,
                                },
                            );
                        }}
                    />
                )}
            </div>
        </AppLayout>
    );
}
