import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import AppLayout from '@/layouts/app-layout';
import adminRoutes from '@/routes/admin';
import { type Paginated } from '@/types/feed';
import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { Crown, Search, Users } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type UserMembership = {
    id: number;
    uuid: string;
    user: {
        id: number;
        name: string;
        username: string;
        email: string;
    };
    plan: {
        id: number;
        name: string;
        slug: string;
    };
    status: string;
    billing_type: string;
    starts_at: string;
    ends_at: string | null;
    next_billing_at: string | null;
    original_price: number;
    discount_amount: number;
};

type MembershipPlan = {
    id: number;
    name: string;
    slug: string;
};

type AdminMembershipsUsersIndexProps = {
    memberships: Paginated<UserMembership>;
    filters: {
        search?: string | null;
        status?: string | null;
        plan?: string | null;
    };
    plans: MembershipPlan[];
};

export default function AdminMembershipsUsersIndex({
    memberships,
    filters,
    plans,
}: AdminMembershipsUsersIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');
    const [planFilter, setPlanFilter] = useState(filters.plan ?? '');

    const formatPrice = (cents: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(cents / 100);
    };

    const handleFilter = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            adminRoutes.memberships.users.index().url,
            {
                search: search || undefined,
                status: statusFilter || undefined,
                plan: planFilter || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const normalizedMemberships = useMemo(() => {
        const raw = memberships as unknown as Partial<
            Paginated<UserMembership>
        > & {
            data?: UserMembership[];
            current_page?: number;
            per_page?: number;
            total?: number;
            last_page?: number;
        };
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
    }, [memberships]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Admin', href: adminRoutes.dashboard().url },
                {
                    title: 'Memberships',
                    href: adminRoutes.memberships.index().url,
                },
                {
                    title: 'User Memberships',
                    href: adminRoutes.memberships.users.index().url,
                },
            ]}
        >
            <Head title="User Memberships" />

            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        User Memberships
                    </h1>
                    <p className="mt-2 text-sm text-white/70">
                        View and manage all user membership subscriptions
                    </p>
                </div>

                <Card className="border-white/10 bg-white/5">
                    <CardContent className="p-6">
                        <form onSubmit={handleFilter} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="search"
                                        className="text-white"
                                    >
                                        Search Users
                                    </Label>
                                    <div className="relative">
                                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
                                        <Input
                                            id="search"
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                            placeholder="Name, username, or email..."
                                            className="border-white/10 bg-white/5 pl-10 text-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="status"
                                        className="text-white"
                                    >
                                        Status
                                    </Label>
                                    <Select
                                        value={statusFilter}
                                        onValueChange={setStatusFilter}
                                    >
                                        <SelectTrigger className="border-white/10 bg-white/5 text-white">
                                            <SelectValue placeholder="All statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">
                                                All statuses
                                            </SelectItem>
                                            <SelectItem value="active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="expired">
                                                Expired
                                            </SelectItem>
                                            <SelectItem value="cancelled">
                                                Cancelled
                                            </SelectItem>
                                            <SelectItem value="pending">
                                                Pending
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="plan"
                                        className="text-white"
                                    >
                                        Plan
                                    </Label>
                                    <Select
                                        value={planFilter}
                                        onValueChange={setPlanFilter}
                                    >
                                        <SelectTrigger className="border-white/10 bg-white/5 text-white">
                                            <SelectValue placeholder="All plans" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">
                                                All plans
                                            </SelectItem>
                                            {plans.map((plan) => (
                                                <SelectItem
                                                    key={plan.id}
                                                    value={plan.slug}
                                                >
                                                    {plan.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button type="submit" size="sm">
                                    Apply Filters
                                </Button>
                                {(search || statusFilter || planFilter) && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSearch('');
                                            setStatusFilter('');
                                            setPlanFilter('');
                                            router.get(
                                                adminRoutes.memberships.users.index()
                                                    .url,
                                            );
                                        }}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/5">
                    <CardContent className="p-0">
                        {normalizedMemberships.data.length === 0 ? (
                            <div className="py-12 text-center">
                                <Users className="mx-auto size-12 text-white/20" />
                                <h3 className="mt-4 text-lg font-semibold text-white">
                                    No memberships found
                                </h3>
                                <p className="mt-2 text-sm text-white/60">
                                    {search || statusFilter || planFilter
                                        ? 'Try adjusting your filters'
                                        : 'No user memberships have been created yet'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/10">
                                {normalizedMemberships.data.map(
                                    (membership) => (
                                        <div
                                            key={membership.id}
                                            className="p-6 transition-colors hover:bg-white/5"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <Crown className="size-5 text-amber-400" />
                                                        <div>
                                                            <Link
                                                                href={
                                                                    adminRoutes.memberships.users.show(
                                                                        membership
                                                                            .user
                                                                            .id,
                                                                    ).url
                                                                }
                                                                className="font-semibold text-white hover:text-amber-400"
                                                            >
                                                                {
                                                                    membership
                                                                        .user
                                                                        .name
                                                                }
                                                            </Link>
                                                            <p className="text-sm text-white/60">
                                                                @
                                                                {
                                                                    membership
                                                                        .user
                                                                        .username
                                                                }{' '}
                                                                •{' '}
                                                                {
                                                                    membership
                                                                        .user
                                                                        .email
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="ml-8 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                                                        <div>
                                                            <p className="text-xs text-white/50">
                                                                Plan
                                                            </p>
                                                            <p className="text-sm font-medium text-white">
                                                                {
                                                                    membership
                                                                        .plan
                                                                        .name
                                                                }
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-white/50">
                                                                Status
                                                            </p>
                                                            <Badge
                                                                variant={
                                                                    membership.status ===
                                                                    'active'
                                                                        ? 'default'
                                                                        : membership.status ===
                                                                            'expired'
                                                                          ? 'secondary'
                                                                          : 'outline'
                                                                }
                                                                className={
                                                                    membership.status ===
                                                                    'active'
                                                                        ? 'bg-green-500/20 text-green-400'
                                                                        : ''
                                                                }
                                                            >
                                                                {
                                                                    membership.status
                                                                }
                                                            </Badge>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-white/50">
                                                                Billing Type
                                                            </p>
                                                            <p className="text-sm font-medium text-white">
                                                                {membership.billing_type ===
                                                                'recurring'
                                                                    ? 'Recurring'
                                                                    : 'One-Time'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-white/50">
                                                                Price
                                                            </p>
                                                            <p className="text-sm font-medium text-white">
                                                                {formatPrice(
                                                                    membership.original_price,
                                                                )}
                                                                {membership.discount_amount >
                                                                    0 && (
                                                                    <span className="ml-1 text-xs text-white/50">
                                                                        (-
                                                                        {formatPrice(
                                                                            membership.discount_amount,
                                                                        )}
                                                                        )
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="ml-8 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                                        <div>
                                                            <p className="text-xs text-white/50">
                                                                Started
                                                            </p>
                                                            <p className="text-sm text-white/70">
                                                                {formatDistanceToNow(
                                                                    new Date(
                                                                        membership.starts_at,
                                                                    ),
                                                                    {
                                                                        addSuffix: true,
                                                                    },
                                                                )}
                                                            </p>
                                                        </div>
                                                        {membership.ends_at && (
                                                            <div>
                                                                <p className="text-xs text-white/50">
                                                                    Ends
                                                                </p>
                                                                <p className="text-sm text-white/70">
                                                                    {formatDistanceToNow(
                                                                        new Date(
                                                                            membership.ends_at,
                                                                        ),
                                                                        {
                                                                            addSuffix: true,
                                                                        },
                                                                    )}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {membership.next_billing_at && (
                                                            <div>
                                                                <p className="text-xs text-white/50">
                                                                    Next Billing
                                                                </p>
                                                                <p className="text-sm text-white/70">
                                                                    {formatDistanceToNow(
                                                                        new Date(
                                                                            membership.next_billing_at,
                                                                        ),
                                                                        {
                                                                            addSuffix: true,
                                                                        },
                                                                    )}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {normalizedMemberships.meta.last_page > 1 && (
                    <Pagination
                        currentPage={normalizedMemberships.meta.current_page}
                        totalPages={normalizedMemberships.meta.last_page}
                        onPageChange={(page) => {
                            router.get(
                                adminRoutes.memberships.users.index().url,
                                {
                                    page,
                                    search: search || undefined,
                                    status: statusFilter || undefined,
                                    plan: planFilter || undefined,
                                },
                            );
                        }}
                    />
                )}
            </div>
        </AppLayout>
    );
}
