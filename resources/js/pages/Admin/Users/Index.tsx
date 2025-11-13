import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppLayout from '@/layouts/app-layout';
import adminRoutes from '@/routes/admin';
import adminUsersRoutes from '@/routes/admin/users';
import { type Paginated } from '@/types/feed';
import { type SharedData } from '@/types';
import { router, Head, usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { Check, ChevronDown, Loader2, Search } from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type AdminUser = {
    id: number;
    name: string;
    display_name?: string | null;
    username?: string | null;
    email: string;
    avatar_url?: string | null;
    created_at?: string | null;
    roles: string[];
};

type LegacyPaginator<T> = {
    data: T[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
};

type AdminUsersIndexProps = {
    users: Paginated<AdminUser> | LegacyPaginator<AdminUser>;
    filters: {
        search?: string | null;
        role?: string | null;
    };
    availableRoles: Array<{
        id: number;
        name: string;
    }>;
};

type RoleAssignments = Record<number, string[]>;

const ROLE_ALL = 'all';

export default function AdminUsersIndex({ users, filters, availableRoles }: AdminUsersIndexProps) {
    const { auth, status } = usePage<SharedData>().props;

    const normalizedUsers = useMemo(() => {
        const raw = users as unknown as Partial<Paginated<AdminUser>> & LegacyPaginator<AdminUser>;
        const data = Array.isArray(raw.data) ? raw.data : [];
        const metaSource = raw.meta ?? {
            current_page: raw.current_page ?? 1,
            per_page: raw.per_page ?? data.length,
            total: raw.total ?? data.length,
            last_page: raw.last_page ?? 1,
        };

        const meta = {
            current_page: metaSource.current_page ?? 1,
            per_page: metaSource.per_page ?? data.length,
            total: metaSource.total ?? data.length,
            last_page: metaSource.last_page ?? 1,
        };

        return { data, meta };
    }, [users]);

    const [search, setSearch] = useState(filters.search ?? '');
    const [roleFilter, setRoleFilter] = useState(filters.role ?? '');
    const [assignments, setAssignments] = useState<RoleAssignments>(() =>
        Object.fromEntries(normalizedUsers.data.map((user) => [user.id, [...user.roles]])),
    );
    const [pendingAssignments, setPendingAssignments] = useState<Record<number, boolean>>({});
    const [flashMessage, setFlashMessage] = useState<string | null>(null);

    useEffect(() => {
        setAssignments(Object.fromEntries(normalizedUsers.data.map((user) => [user.id, [...user.roles]])));
    }, [normalizedUsers.data]);

    useEffect(() => {
        if (status && typeof status === 'object' && status !== null && 'message' in status) {
            setFlashMessage(String((status as { message?: string }).message ?? 'Changes saved.'));
        }
    }, [status]);

    const paginationMeta = useMemo(
        () => ({
            currentPage: normalizedUsers.meta.current_page,
            perPage: normalizedUsers.meta.per_page,
            total: normalizedUsers.meta.total,
            hasMorePages: normalizedUsers.meta.current_page < normalizedUsers.meta.last_page,
        }),
        [
            normalizedUsers.meta.current_page,
            normalizedUsers.meta.last_page,
            normalizedUsers.meta.per_page,
            normalizedUsers.meta.total,
        ],
    );

    const applyFilters = useCallback(() => {
        const query: Record<string, string> = {};

        if (search.trim() !== '') {
            query.search = search.trim();
        }

        if (roleFilter && roleFilter !== '' && roleFilter !== ROLE_ALL) {
            query.role = roleFilter;
        }

        router.visit(adminUsersRoutes.index({ query }).url, {
            preserveScroll: true,
            replace: true,
            only: ['users', 'filters'],
        });
    }, [roleFilter, search]);

    const resetFilters = useCallback(() => {
        setSearch('');
        setRoleFilter('');

        router.visit(adminUsersRoutes.index().url, {
            preserveScroll: true,
            replace: true,
            only: ['users', 'filters'],
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

        if (filters.role) {
            query.role = String(filters.role ?? '');
        }

        query.page = String(page);

        router.visit(adminUsersRoutes.index({ query }).url, {
            preserveScroll: true,
            replace: true,
            only: ['users'],
        });
    };

    const toggleRole = (userId: number, roleName: string, checked: boolean) => {
        const previousRoles =
            assignments[userId] ??
            normalizedUsers.data.find((candidate) => candidate.id === userId)?.roles ??
            [];

        setAssignments((previous) => {
            const nextRoles = new Set(previous[userId] ?? []);

            if (checked) {
                nextRoles.add(roleName);
            } else {
                nextRoles.delete(roleName);
            }

            const resolved = Array.from(nextRoles.values()).sort((a, b) => a.localeCompare(b));

            void persistRoles(userId, resolved, previousRoles);

            return {
                ...previous,
                [userId]: resolved,
            };
        });
    };

    const persistRoles = async (userId: number, nextRoles: string[], previousRoles: string[]) => {
        setPendingAssignments((previous) => ({ ...previous, [userId]: true }));
        setFlashMessage(null);

        router.visit(
            adminUsersRoutes.roles.update({ user: userId }).url,
            {
                method: 'patch',
                data: { roles: nextRoles },
                preserveScroll: true,
                only: ['users', 'status'],
                onError: () => {
                    setAssignments((prev) => ({
                        ...prev,
                        [userId]: previousRoles,
                    }));
                },
                onFinish: () => {
                    setPendingAssignments((prev) => ({ ...prev, [userId]: false }));
                },
            },
        );
    };

    const currentUserId = auth?.user?.id ?? null;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Admin', href: adminRoutes.dashboard().url },
                { title: 'Users', href: adminUsersRoutes.index().url },
            ]}
        >
            <Head title="User Directory · Admin" />

            <div className="space-y-8 text-white">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">User directory</h1>
                        <p className="text-sm text-white/70">
                            Search the community, review roles, and keep access aligned with responsibilities.
                        </p>
                    </div>
                    {flashMessage ? (
                        <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-emerald-200 shadow-[0_18px_50px_-30px_rgba(16,185,129,0.5)]">
                            {flashMessage}
                        </div>
                    ) : null}
                </header>

                <section className="grid gap-4 sm:grid-cols-3">
                    <Card className="border-white/10 bg-white/5">
                        <CardContent className="space-y-1 p-5">
                            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Total accounts</p>
                            <p className="text-2xl font-semibold text-white">
                                {normalizedUsers.meta.total.toLocaleString()}
                            </p>
                            <p className="text-xs text-white/60">
                                {availableRoles.length} roles available · stay intentional.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-white/5">
                        <CardContent className="space-y-1 p-5">
                            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Showing now</p>
                            <p className="text-2xl font-semibold text-white">
                                {normalizedUsers.data.length}
                            </p>
                            <p className="text-xs text-white/60">Use filters to focus on the humans you need.</p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-white/5">
                        <CardContent className="space-y-1 p-5">
                            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Last update</p>
                            <p className="text-2xl font-semibold text-white">
                                {normalizedUsers.data[0]?.created_at
                                    ? formatDistanceToNow(new Date(normalizedUsers.data[0].created_at), {
                                          addSuffix: true,
                                      })
                                    : 'Moments ago'}
                            </p>
                            <p className="text-xs text-white/60">Newest account in this view.</p>
                        </CardContent>
                    </Card>
                </section>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 lg:flex-row lg:items-center"
                >
                    <div className="relative w-full lg:max-w-md">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by name, username, or email"
                            className="w-full rounded-full border-white/15 bg-black/30 pl-10 text-sm text-white placeholder:text-white/40 focus-visible:ring-amber-400/40"
                        />
                    </div>
                    <Select
                        value={roleFilter === '' ? ROLE_ALL : roleFilter}
                        onValueChange={(nextValue) => setRoleFilter(nextValue === ROLE_ALL ? '' : nextValue)}
                    >
                        <SelectTrigger className="w-full rounded-full border-white/15 bg-black/30 text-sm text-white focus-visible:ring-amber-400/40 lg:w-56">
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border border-white/10 bg-black/80 text-white shadow-[0_30px_70px_-50px_rgba(0,0,0,0.75)] backdrop-blur-xl">
                            <SelectItem value={ROLE_ALL} className="text-sm text-white/75 hover:bg-white/10 hover:text-white">
                                All roles
                            </SelectItem>
                            {availableRoles.map((role) => (
                                <SelectItem
                                    key={role.id}
                                    value={role.name}
                                    className="text-sm text-white/80 hover:bg-white/10 hover:text-white"
                                >
                                    {role.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                                <th className="px-5 py-3 text-left">Roles</th>
                                <th className="px-5 py-3 text-left">Joined</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {normalizedUsers.data.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-10 text-center text-white/55">
                                        No users matched your filters. Try adjusting your search or role selection.
                                    </td>
                                </tr>
                            ) : (
                                normalizedUsers.data.map((user) => {
                                    const userRoles = assignments[user.id] ?? user.roles;
                                    const isSaving = pendingAssignments[user.id] ?? false;
                                    const initials = (user.display_name ?? user.name ?? user.username ?? 'U')
                                        .split(' ')
                                        .map((part) => part[0])
                                        .join('')
                                        .toUpperCase()
                                        .slice(0, 2);

                                    return (
                                        <tr key={user.id} className="bg-black/15 transition hover:bg-white/5">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-10 border border-white/10 bg-white/10">
                                                        <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
                                                        <AvatarFallback className="bg-white/10 text-white/70">
                                                            {initials}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-white">
                                                                {user.display_name ?? user.name}
                                                            </p>
                                                            {currentUserId === user.id ? (
                                                                <Badge className="rounded-full border-white/15 bg-white/10 text-[0.6rem] uppercase tracking-[0.35em] text-white/65">
                                                                    You
                                                                </Badge>
                                                            ) : null}
                                                        </div>
                                                        <div className="text-xs text-white/55">
                                                            @{user.username ?? `user-${user.id}`} · {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {userRoles.length === 0 ? (
                                                        <Badge className="rounded-full border-white/15 bg-white/10 text-xs text-white/60">
                                                            No roles assigned
                                                        </Badge>
                                                    ) : (
                                                        userRoles.map((role) => (
                                                            <Badge
                                                                key={`${user.id}-${role}`}
                                                                className="rounded-full border-white/15 bg-white/10 text-xs uppercase tracking-[0.25em] text-white/70"
                                                            >
                                                                {role}
                                                            </Badge>
                                                        ))
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-white/60">
                                                {user.created_at
                                                    ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true })
                                                    : '—'}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-4 text-xs uppercase tracking-[0.3em] text-white/75 hover:border-white/35 hover:bg-white/10 hover:text-white"
                                                        >
                                                            {isSaving ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <ChevronDown className="h-3.5 w-3.5" />
                                                            )}
                                                            Manage
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-60 rounded-2xl border border-white/10 bg-black/85 text-white shadow-[0_30px_70px_-45px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
                                                    >
                                                        <DropdownMenuLabel className="text-xs uppercase tracking-[0.3em] text-white/60">
                                                            Assign roles
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="bg-white/10" />
                                                        {availableRoles.map((role) => {
                                                            const checked = userRoles.includes(role.name);

                                                            return (
                                                                <DropdownMenuCheckboxItem
                                                                    key={role.id}
                                                                    checked={checked}
                                                                    onCheckedChange={(next) =>
                                                                        toggleRole(user.id, role.name, Boolean(next))
                                                                    }
                                                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/85 focus:bg-white/10 focus:text-white"
                                                                >
                                                                    <span className="flex-1">{role.name}</span>
                                                                    {checked ? (
                                                                        <Check className="h-4 w-4 text-emerald-300" />
                                                                    ) : null}
                                                                </DropdownMenuCheckboxItem>
                                                            );
                                                        })}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
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

