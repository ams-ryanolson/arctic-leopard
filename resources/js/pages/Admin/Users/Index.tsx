import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import adminRoutes from '@/routes/admin';
import adminUsersRoutes from '@/routes/admin/users';
import { type SharedData } from '@/types';
import { type Paginated } from '@/types/feed';
import { Head, router, usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import {
    AlertCircle,
    Ban,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    Loader2,
    Search,
    ShieldCheck,
    ShieldOff,
    Gift,
} from 'lucide-react';
import {
    type FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

type VerificationStatus = {
    status: string;
    verified_at?: string | null;
    expires_at?: string | null;
    renewal_required_at?: string | null;
    is_expired?: boolean;
    is_in_grace_period?: boolean;
    needs_renewal?: boolean;
} | null;

type AdminUser = {
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
    suspended_until?: string | null;
    verification?: VerificationStatus;
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
    membershipPlans?: Array<{
        id: number;
        name: string;
        slug: string;
    }>;
};

type RoleAssignments = Record<number, string[]>;

const ROLE_ALL = 'all';

export default function AdminUsersIndex({
    users,
    filters,
    availableRoles,
    membershipPlans = [],
}: AdminUsersIndexProps) {
    const { auth, status } = usePage<SharedData>().props;

    const normalizedUsers = useMemo(() => {
        const raw = users as unknown as Partial<Paginated<AdminUser>> &
            LegacyPaginator<AdminUser>;
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
        Object.fromEntries(
            normalizedUsers.data.map((user) => [user.id, [...user.roles]]),
        ),
    );
    const [pendingAssignments, setPendingAssignments] = useState<
        Record<number, boolean>
    >({});
    const [flashMessage, setFlashMessage] = useState<string | null>(null);
    const [reverificationDialogOpen, setReverificationDialogOpen] = useState<
        number | null
    >(null);
    const [reverificationNote, setReverificationNote] = useState<string>('');
    const [processingReverification, setProcessingReverification] = useState<
        number | null
    >(null);
    const [suspendDialogOpen, setSuspendDialogOpen] = useState<number | null>(null);
    const [suspendReason, setSuspendReason] = useState<string>('');
    const [suspendUntil, setSuspendUntil] = useState<string>('');
    const [banDialogOpen, setBanDialogOpen] = useState<number | null>(null);
    const [banReason, setBanReason] = useState<string>('');
    const [warnDialogOpen, setWarnDialogOpen] = useState<number | null>(null);
    const [warnReason, setWarnReason] = useState<string>('');
    const [warnNotes, setWarnNotes] = useState<string>('');
    const [membershipDialogOpen, setMembershipDialogOpen] = useState<number | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [membershipExpiresAt, setMembershipExpiresAt] = useState<string>('');
    const [membershipReason, setMembershipReason] = useState<string>('');
    const [processingAction, setProcessingAction] = useState<string | null>(null);

    useEffect(() => {
        setAssignments(
            Object.fromEntries(
                normalizedUsers.data.map((user) => [user.id, [...user.roles]]),
            ),
        );
    }, [normalizedUsers.data]);

    useEffect(() => {
        if (
            status &&
            typeof status === 'object' &&
            status !== null &&
            'message' in status
        ) {
            setFlashMessage(
                String(
                    (status as { message?: string }).message ??
                        'Changes saved.',
                ),
            );
        }
    }, [status]);

    const paginationMeta = useMemo(
        () => ({
            currentPage: normalizedUsers.meta.current_page,
            perPage: normalizedUsers.meta.per_page,
            total: normalizedUsers.meta.total,
            hasMorePages:
                normalizedUsers.meta.current_page <
                normalizedUsers.meta.last_page,
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
            normalizedUsers.data.find((candidate) => candidate.id === userId)
                ?.roles ??
            [];

        setAssignments((previous) => {
            const nextRoles = new Set(previous[userId] ?? []);

            if (checked) {
                nextRoles.add(roleName);
            } else {
                nextRoles.delete(roleName);
            }

            const resolved = Array.from(nextRoles.values()).sort((a, b) =>
                a.localeCompare(b),
            );

            void persistRoles(userId, resolved, previousRoles);

            return {
                ...previous,
                [userId]: resolved,
            };
        });
    };

    const persistRoles = async (
        userId: number,
        nextRoles: string[],
        previousRoles: string[],
    ) => {
        setPendingAssignments((previous) => ({ ...previous, [userId]: true }));
        setFlashMessage(null);

        router.visit(adminUsersRoutes.roles.update({ user: userId }).url, {
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
        });
    };

    const currentUserId = auth?.user?.id ?? null;

    const handleRequireReverification = useCallback(
        (userId: number) => {
            if (processingReverification === userId) {
                return;
            }

            setProcessingReverification(userId);

            router.post(
                adminUsersRoutes.requireReverification.url(userId),
                {
                    compliance_note: reverificationNote,
                },
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setProcessingReverification(null);
                        setReverificationDialogOpen(null);
                        setReverificationNote('');
                    },
                },
            );
        },
        [processingReverification, reverificationNote],
    );

    const handleSuspend = useCallback(
        (userId: number) => {
            if (processingAction === `suspend-${userId}`) {
                return;
            }

            setProcessingAction(`suspend-${userId}`);

            router.post(
                `/admin/users/${userId}/suspend`,
                {
                    reason: suspendReason,
                    suspended_until: suspendUntil || null,
                },
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setProcessingAction(null);
                        setSuspendDialogOpen(null);
                        setSuspendReason('');
                        setSuspendUntil('');
                    },
                },
            );
        },
        [processingAction, suspendReason, suspendUntil],
    );

    const handleUnsuspend = useCallback(
        (userId: number) => {
            if (processingAction === `unsuspend-${userId}`) {
                return;
            }

            setProcessingAction(`unsuspend-${userId}`);

            router.post(
                `/admin/users/${userId}/unsuspend`,
                {},
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setProcessingAction(null);
                    },
                },
            );
        },
        [processingAction],
    );

    const handleBan = useCallback(
        (userId: number) => {
            if (processingAction === `ban-${userId}`) {
                return;
            }

            setProcessingAction(`ban-${userId}`);

            router.post(
                `/admin/users/${userId}/ban`,
                {
                    reason: banReason,
                },
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setProcessingAction(null);
                        setBanDialogOpen(null);
                        setBanReason('');
                    },
                },
            );
        },
        [processingAction, banReason],
    );

    const handleUnban = useCallback(
        (userId: number) => {
            if (processingAction === `unban-${userId}`) {
                return;
            }

            setProcessingAction(`unban-${userId}`);

            router.post(
                `/admin/users/${userId}/unban`,
                {},
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setProcessingAction(null);
                    },
                },
            );
        },
        [processingAction],
    );

    const handleWarn = useCallback(
        (userId: number) => {
            if (processingAction === `warn-${userId}`) {
                return;
            }

            setProcessingAction(`warn-${userId}`);

            router.post(
                `/admin/users/${userId}/warn`,
                {
                    reason: warnReason,
                    notes: warnNotes || null,
                },
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setProcessingAction(null);
                        setWarnDialogOpen(null);
                        setWarnReason('');
                        setWarnNotes('');
                    },
                },
            );
        },
        [processingAction, warnReason, warnNotes],
    );

    const handleGrantFreeMembership = useCallback(
        (userId: number) => {
            if (processingAction === `membership-${userId}` || !selectedPlanId || !membershipExpiresAt) {
                return;
            }

            setProcessingAction(`membership-${userId}`);

            router.post(
                `/admin/users/${userId}/grant-free-membership`,
                {
                    membership_plan_id: selectedPlanId,
                    expires_at: membershipExpiresAt,
                    reason: membershipReason || null,
                },
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setProcessingAction(null);
                        setMembershipDialogOpen(null);
                        setSelectedPlanId(null);
                        setMembershipExpiresAt('');
                        setMembershipReason('');
                    },
                },
            );
        },
        [processingAction, selectedPlanId, membershipExpiresAt, membershipReason],
    );

    const getVerificationBadge = (
        verification: VerificationStatus | null | undefined,
    ) => {
        if (!verification) {
            return (
                <Badge className="rounded-full border-white/15 bg-white/10 text-xs text-white/60">
                    Not Verified
                </Badge>
            );
        }

        if (verification.status === 'approved' && !verification.is_expired) {
            return (
                <Badge className="rounded-full border-emerald-400/30 bg-emerald-400/10 text-xs text-emerald-300">
                    <CheckCircle2 className="mr-1 size-3" />
                    Verified
                </Badge>
            );
        }

        if (
            verification.status === 'renewal_required' ||
            verification.needs_renewal
        ) {
            return (
                <Badge className="rounded-full border-amber-400/30 bg-amber-400/10 text-xs text-amber-300">
                    <Clock className="mr-1 size-3" />
                    Renewal Required
                </Badge>
            );
        }

        if (verification.status === 'rejected') {
            return (
                <Badge className="rounded-full border-red-400/30 bg-red-400/10 text-xs text-red-300">
                    <AlertCircle className="mr-1 size-3" />
                    Rejected
                </Badge>
            );
        }

        if (verification.status === 'pending') {
            return (
                <Badge className="rounded-full border-blue-400/30 bg-blue-400/10 text-xs text-blue-300">
                    <Loader2 className="mr-1 size-3 animate-spin" />
                    Pending
                </Badge>
            );
        }

        return (
            <Badge className="rounded-full border-white/15 bg-white/10 text-xs text-white/60">
                {verification.status}
            </Badge>
        );
    };

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
                        <h1 className="text-2xl font-semibold tracking-tight">
                            User directory
                        </h1>
                        <p className="text-sm text-white/70">
                            Search the community, review roles, and keep access
                            aligned with responsibilities.
                        </p>
                    </div>
                    {flashMessage ? (
                        <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs tracking-[0.35em] text-emerald-200 uppercase shadow-[0_18px_50px_-30px_rgba(16,185,129,0.5)]">
                            {flashMessage}
                        </div>
                    ) : null}
                </header>

                <section className="grid gap-4 sm:grid-cols-3">
                    <Card className="border-white/10 bg-white/5">
                        <CardContent className="space-y-1 p-5">
                            <p className="text-xs tracking-[0.35em] text-white/50 uppercase">
                                Total accounts
                            </p>
                            <p className="text-2xl font-semibold text-white">
                                {normalizedUsers.meta.total.toLocaleString()}
                            </p>
                            <p className="text-xs text-white/60">
                                {availableRoles.length} roles available · stay
                                intentional.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-white/5">
                        <CardContent className="space-y-1 p-5">
                            <p className="text-xs tracking-[0.35em] text-white/50 uppercase">
                                Showing now
                            </p>
                            <p className="text-2xl font-semibold text-white">
                                {normalizedUsers.data.length}
                            </p>
                            <p className="text-xs text-white/60">
                                Use filters to focus on the humans you need.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-white/5">
                        <CardContent className="space-y-1 p-5">
                            <p className="text-xs tracking-[0.35em] text-white/50 uppercase">
                                Last update
                            </p>
                            <p className="text-2xl font-semibold text-white">
                                {normalizedUsers.data[0]?.created_at
                                    ? formatDistanceToNow(
                                          new Date(
                                              normalizedUsers.data[0].created_at,
                                          ),
                                          {
                                              addSuffix: true,
                                          },
                                      )
                                    : 'Moments ago'}
                            </p>
                            <p className="text-xs text-white/60">
                                Newest account in this view.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 lg:flex-row lg:items-center"
                >
                    <div className="relative w-full lg:max-w-md">
                        <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-white/40" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by name, username, or email"
                            className="w-full rounded-full border-white/15 bg-black/30 pl-10 text-sm text-white placeholder:text-white/40 focus-visible:ring-amber-400/40"
                        />
                    </div>
                    <Select
                        value={roleFilter === '' ? ROLE_ALL : roleFilter}
                        onValueChange={(nextValue) =>
                            setRoleFilter(
                                nextValue === ROLE_ALL ? '' : nextValue,
                            )
                        }
                    >
                        <SelectTrigger className="w-full rounded-full border-white/15 bg-black/30 text-sm text-white focus-visible:ring-amber-400/40 lg:w-56">
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border border-white/10 bg-black/80 text-white shadow-[0_30px_70px_-50px_rgba(0,0,0,0.75)] backdrop-blur-xl">
                            <SelectItem
                                value={ROLE_ALL}
                                className="text-sm text-white/75 hover:bg-white/10 hover:text-white"
                            >
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
                            className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-5 text-xs font-semibold tracking-[0.3em] text-white uppercase shadow-[0_20px_55px_-30px_rgba(249,115,22,0.55)] transition hover:scale-[1.02]"
                        >
                            Apply filters
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={resetFilters}
                            className="rounded-full border border-white/15 bg-white/5 px-5 text-xs tracking-[0.3em] text-white/75 uppercase hover:border-white/35 hover:bg-white/10 hover:text-white"
                        >
                            Reset
                        </Button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 ring-1 ring-white/5">
                    <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
                        <thead className="bg-black/35 text-xs tracking-[0.35em] text-white/50 uppercase">
                            <tr>
                                <th className="px-5 py-3 text-left">User</th>
                                <th className="px-5 py-3 text-left">Roles</th>
                                <th className="px-5 py-3 text-left">
                                    Verification
                                </th>
                                <th className="px-5 py-3 text-left">Joined</th>
                                <th className="px-5 py-3 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {normalizedUsers.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-5 py-10 text-center text-white/55"
                                    >
                                        No users matched your filters. Try
                                        adjusting your search or role selection.
                                    </td>
                                </tr>
                            ) : (
                                normalizedUsers.data.map((user) => {
                                    const userRoles =
                                        assignments[user.id] ?? user.roles;
                                    const isSaving =
                                        pendingAssignments[user.id] ?? false;
                                    const initials = (
                                        user.display_name ??
                                        user.name ??
                                        user.username ??
                                        'U'
                                    )
                                        .split(' ')
                                        .map((part) => part[0])
                                        .join('')
                                        .toUpperCase()
                                        .slice(0, 2);

                                    return (
                                        <tr
                                            key={user.id}
                                            className="bg-black/15 transition hover:bg-white/5"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-10 border border-white/10 bg-white/10">
                                                        <AvatarImage
                                                            src={
                                                                user.avatar_url ??
                                                                undefined
                                                            }
                                                            alt={user.name}
                                                        />
                                                        <AvatarFallback className="bg-white/10 text-white/70">
                                                            {initials}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-semibold text-white">
                                                                {user.display_name ??
                                                                    user.name}
                                                            </p>
                                                            {currentUserId ===
                                                            user.id ? (
                                                                <Badge className="rounded-full border-white/15 bg-white/10 text-[0.6rem] tracking-[0.35em] text-white/65 uppercase">
                                                                    You
                                                                </Badge>
                                                            ) : null}
                                                            {user.is_banned && (
                                                                <Badge className="rounded-full border-red-400/30 bg-red-400/10 text-xs text-red-300">
                                                                    <Ban className="mr-1 size-3" />
                                                                    Banned
                                                                </Badge>
                                                            )}
                                                            {user.is_suspended && !user.is_banned && (
                                                                <Badge className="rounded-full border-amber-400/30 bg-amber-400/10 text-xs text-amber-300">
                                                                    <ShieldOff className="mr-1 size-3" />
                                                                    Suspended
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-white/55">
                                                            @
                                                            {user.username ??
                                                                `user-${user.id}`}{' '}
                                                            · {user.email}
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
                                                        userRoles.map(
                                                            (role) => (
                                                                <Badge
                                                                    key={`${user.id}-${role}`}
                                                                    className="rounded-full border-white/15 bg-white/10 text-xs tracking-[0.25em] text-white/70 uppercase"
                                                                >
                                                                    {role}
                                                                </Badge>
                                                            ),
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="space-y-1">
                                                    {getVerificationBadge(
                                                        user.verification,
                                                    )}
                                                    {user.verification
                                                        ?.expires_at && (
                                                        <p className="text-xs text-white/50">
                                                            Expires:{' '}
                                                            {new Date(
                                                                user.verification.expires_at,
                                                            ).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-white/60">
                                                {user.created_at
                                                    ? formatDistanceToNow(
                                                          new Date(
                                                              user.created_at,
                                                          ),
                                                          { addSuffix: true },
                                                      )
                                                    : '—'}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-4 text-xs tracking-[0.3em] text-white/75 uppercase hover:border-white/35 hover:bg-white/10 hover:text-white"
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
                                                        <DropdownMenuLabel className="text-xs tracking-[0.3em] text-white/60 uppercase">
                                                            Assign roles
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="bg-white/10" />
                                                        {availableRoles.map(
                                                            (role) => {
                                                                const checked =
                                                                    userRoles.includes(
                                                                        role.name,
                                                                    );

                                                                return (
                                                                    <DropdownMenuCheckboxItem
                                                                        key={
                                                                            role.id
                                                                        }
                                                                        checked={
                                                                            checked
                                                                        }
                                                                        onCheckedChange={(
                                                                            next,
                                                                        ) =>
                                                                            toggleRole(
                                                                                user.id,
                                                                                role.name,
                                                                                Boolean(
                                                                                    next,
                                                                                ),
                                                                            )
                                                                        }
                                                                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/85 focus:bg-white/10 focus:text-white"
                                                                    >
                                                                        <span className="flex-1">
                                                                            {
                                                                                role.name
                                                                            }
                                                                        </span>
                                                                        {checked ? (
                                                                            <Check className="h-4 w-4 text-emerald-300" />
                                                                        ) : null}
                                                                    </DropdownMenuCheckboxItem>
                                                                );
                                                            },
                                                        )}
                                                        <DropdownMenuSeparator className="bg-white/10" />
                                                        <DropdownMenuLabel className="text-xs tracking-[0.3em] text-white/60 uppercase">
                                                            Verification
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            onSelect={() =>
                                                                setReverificationDialogOpen(
                                                                    user.id,
                                                                )
                                                            }
                                                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/85 focus:bg-white/10 focus:text-white"
                                                        >
                                                            <ShieldCheck className="size-4" />
                                                            <span>
                                                                Require
                                                                Re-verification
                                                            </span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-white/10" />
                                                        <DropdownMenuLabel className="text-xs tracking-[0.3em] text-white/60 uppercase">
                                                            Moderation
                                                        </DropdownMenuLabel>
                                                        {user.is_suspended ? (
                                                            <DropdownMenuItem
                                                                onSelect={() => handleUnsuspend(user.id)}
                                                                disabled={processingAction === `unsuspend-${user.id}`}
                                                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/85 focus:bg-white/10 focus:text-white"
                                                            >
                                                                <CheckCircle2 className="size-4 text-green-400" />
                                                                <span>Unsuspend User</span>
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                onSelect={() => setSuspendDialogOpen(user.id)}
                                                                disabled={currentUserId === user.id}
                                                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/85 focus:bg-white/10 focus:text-white"
                                                            >
                                                                <AlertCircle className="size-4 text-amber-400" />
                                                                <span>Suspend User</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {user.is_banned ? (
                                                            <DropdownMenuItem
                                                                onSelect={() => handleUnban(user.id)}
                                                                disabled={processingAction === `unban-${user.id}`}
                                                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/85 focus:bg-white/10 focus:text-white"
                                                            >
                                                                <CheckCircle2 className="size-4 text-green-400" />
                                                                <span>Unban User</span>
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                onSelect={() => setBanDialogOpen(user.id)}
                                                                disabled={currentUserId === user.id}
                                                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 focus:bg-white/10 focus:text-white"
                                                            >
                                                                <AlertCircle className="size-4 text-red-400" />
                                                                <span>Ban User</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onSelect={() => setWarnDialogOpen(user.id)}
                                                            disabled={currentUserId === user.id}
                                                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/85 focus:bg-white/10 focus:text-white"
                                                        >
                                                            <AlertCircle className="size-4 text-amber-400" />
                                                            <span>Warn User</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onSelect={() => setMembershipDialogOpen(user.id)}
                                                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/85 focus:bg-white/10 focus:text-white"
                                                        >
                                                            <CheckCircle2 className="size-4 text-violet-400" />
                                                            <span>Grant Free Membership</span>
                                                        </DropdownMenuItem>
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

                <Pagination
                    meta={paginationMeta}
                    onPageChange={handlePageChange}
                />

                <Dialog
                    open={reverificationDialogOpen !== null}
                    onOpenChange={(open) => {
                        if (!open && !processingReverification) {
                            setReverificationDialogOpen(null);
                            setReverificationNote('');
                        }
                    }}
                >
                    <DialogContent className="border-white/10 bg-neutral-950 text-white sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">
                                Require ID Verification Renewal
                            </DialogTitle>
                            <DialogDescription className="text-white/60">
                                This will require the user to complete a new ID
                                verification. Please provide a compliance note
                                explaining the reason.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="compliance-note"
                                    className="text-white"
                                >
                                    Compliance Note{' '}
                                    <span className="text-red-400">*</span>
                                </Label>
                                <Textarea
                                    id="compliance-note"
                                    value={reverificationNote}
                                    onChange={(e) =>
                                        setReverificationNote(e.target.value)
                                    }
                                    placeholder="Explain why this user needs to re-verify their ID..."
                                    className="min-h-[100px] border-white/10 bg-white/5 text-white placeholder:text-white/40"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    if (!processingReverification) {
                                        setReverificationDialogOpen(null);
                                        setReverificationNote('');
                                    }
                                }}
                                disabled={processingReverification !== null}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    if (
                                        reverificationDialogOpen !== null &&
                                        reverificationNote.trim()
                                    ) {
                                        handleRequireReverification(
                                            reverificationDialogOpen,
                                        );
                                    }
                                }}
                                disabled={
                                    !reverificationNote.trim() ||
                                    processingReverification !== null
                                }
                            >
                                {processingReverification !== null ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="mr-2 size-4" />
                                        Require Renewal
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Suspend User Dialog */}
                <Dialog
                    open={suspendDialogOpen !== null}
                    onOpenChange={(open) => {
                        if (!open && !processingAction?.startsWith('suspend-')) {
                            setSuspendDialogOpen(null);
                            setSuspendReason('');
                            setSuspendUntil('');
                        }
                    }}
                >
                    <DialogContent className="border-white/10 bg-neutral-950 text-white sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">
                                Suspend User
                            </DialogTitle>
                            <DialogDescription className="text-white/60">
                                Temporarily restrict user access. You can set an expiry date for automatic restoration.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="suspend-reason" className="text-white">
                                    Reason <span className="text-red-400">*</span>
                                </Label>
                                <Textarea
                                    id="suspend-reason"
                                    value={suspendReason}
                                    onChange={(e) => setSuspendReason(e.target.value)}
                                    placeholder="Explain why this user is being suspended..."
                                    className="min-h-[100px] border-white/10 bg-white/5 text-white placeholder:text-white/40"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="suspend-until" className="text-white">
                                    Suspend Until (Optional)
                                </Label>
                                <Input
                                    id="suspend-until"
                                    type="datetime-local"
                                    value={suspendUntil}
                                    onChange={(e) => setSuspendUntil(e.target.value)}
                                    className="border-white/10 bg-white/5 text-white"
                                />
                                <p className="text-xs text-white/50">
                                    Leave empty for indefinite suspension. User will be automatically restored on this date.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    if (!processingAction?.startsWith('suspend-')) {
                                        setSuspendDialogOpen(null);
                                        setSuspendReason('');
                                        setSuspendUntil('');
                                    }
                                }}
                                disabled={processingAction?.startsWith('suspend-')}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    if (suspendDialogOpen !== null && suspendReason.trim()) {
                                        handleSuspend(suspendDialogOpen);
                                    }
                                }}
                                disabled={!suspendReason.trim() || processingAction?.startsWith('suspend-')}
                                className="bg-amber-600 hover:bg-amber-700"
                            >
                                {processingAction?.startsWith('suspend-') ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Suspending...
                                    </>
                                ) : (
                                    <>
                                        <ShieldOff className="mr-2 size-4" />
                                        Suspend User
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Ban User Dialog */}
                <Dialog
                    open={banDialogOpen !== null}
                    onOpenChange={(open) => {
                        if (!open && !processingAction?.startsWith('ban-')) {
                            setBanDialogOpen(null);
                            setBanReason('');
                        }
                    }}
                >
                    <DialogContent className="border-white/10 bg-neutral-950 text-white sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-red-400">
                                Ban User
                            </DialogTitle>
                            <DialogDescription className="text-white/60">
                                Permanently restrict user access. This action can be reversed if needed.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="ban-reason" className="text-white">
                                    Reason <span className="text-red-400">*</span>
                                </Label>
                                <Textarea
                                    id="ban-reason"
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    placeholder="Explain why this user is being banned..."
                                    className="min-h-[100px] border-white/10 bg-white/5 text-white placeholder:text-white/40"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    if (!processingAction?.startsWith('ban-')) {
                                        setBanDialogOpen(null);
                                        setBanReason('');
                                    }
                                }}
                                disabled={processingAction?.startsWith('ban-')}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    if (banDialogOpen !== null && banReason.trim()) {
                                        handleBan(banDialogOpen);
                                    }
                                }}
                                disabled={!banReason.trim() || processingAction?.startsWith('ban-')}
                                variant="destructive"
                            >
                                {processingAction?.startsWith('ban-') ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Banning...
                                    </>
                                ) : (
                                    <>
                                        <Ban className="mr-2 size-4" />
                                        Ban User
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Warn User Dialog */}
                <Dialog
                    open={warnDialogOpen !== null}
                    onOpenChange={(open) => {
                        if (!open && !processingAction?.startsWith('warn-')) {
                            setWarnDialogOpen(null);
                            setWarnReason('');
                            setWarnNotes('');
                        }
                    }}
                >
                    <DialogContent className="border-white/10 bg-neutral-950 text-white sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">
                                Warn User
                            </DialogTitle>
                            <DialogDescription className="text-white/60">
                                Issue a warning to the user. Warnings expire after 90 days.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="warn-reason" className="text-white">
                                    Reason <span className="text-red-400">*</span>
                                </Label>
                                <Textarea
                                    id="warn-reason"
                                    value={warnReason}
                                    onChange={(e) => setWarnReason(e.target.value)}
                                    placeholder="Reason for warning (visible to user)..."
                                    className="min-h-[100px] border-white/10 bg-white/5 text-white placeholder:text-white/40"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="warn-notes" className="text-white">
                                    Internal Notes (Optional)
                                </Label>
                                <Textarea
                                    id="warn-notes"
                                    value={warnNotes}
                                    onChange={(e) => setWarnNotes(e.target.value)}
                                    placeholder="Internal notes (not visible to user)..."
                                    className="min-h-[80px] border-white/10 bg-white/5 text-white placeholder:text-white/40"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    if (!processingAction?.startsWith('warn-')) {
                                        setWarnDialogOpen(null);
                                        setWarnReason('');
                                        setWarnNotes('');
                                    }
                                }}
                                disabled={processingAction?.startsWith('warn-')}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    if (warnDialogOpen !== null && warnReason.trim()) {
                                        handleWarn(warnDialogOpen);
                                    }
                                }}
                                disabled={!warnReason.trim() || processingAction?.startsWith('warn-')}
                                className="bg-amber-600 hover:bg-amber-700"
                            >
                                {processingAction?.startsWith('warn-') ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Warning...
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="mr-2 size-4" />
                                        Issue Warning
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Grant Free Membership Dialog */}
                <Dialog
                    open={membershipDialogOpen !== null}
                    onOpenChange={(open) => {
                        if (!open && !processingAction?.startsWith('membership-')) {
                            setMembershipDialogOpen(null);
                            setSelectedPlanId(null);
                            setMembershipExpiresAt('');
                            setMembershipReason('');
                        }
                    }}
                >
                    <DialogContent className="border-white/10 bg-neutral-950 text-white sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">
                                Grant Free Membership
                            </DialogTitle>
                            <DialogDescription className="text-white/60">
                                Award a free membership to the user with an expiry date.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="membership-plan" className="text-white">
                                    Membership Plan <span className="text-red-400">*</span>
                                </Label>
                                <Select value={selectedPlanId?.toString() ?? ''} onValueChange={(value) => setSelectedPlanId(parseInt(value, 10))}>
                                    <SelectTrigger className="border-white/10 bg-white/5 text-white">
                                        <SelectValue placeholder="Select a membership plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {membershipPlans.map((plan) => (
                                            <SelectItem key={plan.id} value={plan.id.toString()}>
                                                {plan.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="membership-expires" className="text-white">
                                    Expires At <span className="text-red-400">*</span>
                                </Label>
                                <Input
                                    id="membership-expires"
                                    type="datetime-local"
                                    value={membershipExpiresAt}
                                    onChange={(e) => setMembershipExpiresAt(e.target.value)}
                                    className="border-white/10 bg-white/5 text-white"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="membership-reason" className="text-white">
                                    Reason (Optional)
                                </Label>
                                <Textarea
                                    id="membership-reason"
                                    value={membershipReason}
                                    onChange={(e) => setMembershipReason(e.target.value)}
                                    placeholder="Reason for granting free membership..."
                                    className="min-h-[80px] border-white/10 bg-white/5 text-white placeholder:text-white/40"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    if (!processingAction?.startsWith('membership-')) {
                                        setMembershipDialogOpen(null);
                                        setSelectedPlanId(null);
                                        setMembershipExpiresAt('');
                                        setMembershipReason('');
                                    }
                                }}
                                disabled={processingAction?.startsWith('membership-')}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    if (membershipDialogOpen !== null && selectedPlanId && membershipExpiresAt) {
                                        handleGrantFreeMembership(membershipDialogOpen);
                                    }
                                }}
                                disabled={!selectedPlanId || !membershipExpiresAt || processingAction?.startsWith('membership-')}
                                className="bg-violet-600 hover:bg-violet-700"
                            >
                                {processingAction?.startsWith('membership-') ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Granting...
                                    </>
                                ) : (
                                    <>
                                        <Gift className="mr-2 size-4" />
                                        Grant Membership
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
