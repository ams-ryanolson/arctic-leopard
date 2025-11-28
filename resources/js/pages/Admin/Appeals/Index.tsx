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
import { type Paginated } from '@/types/feed';
import { type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Ban, Search, ShieldOff } from 'lucide-react';
import { type FormEvent, useCallback, useMemo, useState } from 'react';

type AppealUser = {
    id: number;
    name: string;
    username?: string | null;
    email: string;
};

type AppealReviewedBy = {
    id: number;
    name: string;
    username: string;
} | null;

type Appeal = {
    id: number;
    user: AppealUser;
    appeal_type: string;
    reason: string;
    status: string;
    reviewed_at?: string | null;
    review_notes?: string | null;
    reviewed_by?: AppealReviewedBy;
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

type AdminAppealsIndexProps = {
    appeals: Paginated<Appeal> | LegacyPaginator<Appeal>;
    filters: {
        status?: string | null;
        type?: string | null;
    };
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'pending':
            return <Badge className="border-amber-400/30 bg-amber-400/10 text-amber-300">Pending</Badge>;
        case 'approved':
            return <Badge className="border-green-400/30 bg-green-400/10 text-green-300">Approved</Badge>;
        case 'rejected':
            return <Badge className="border-red-400/30 bg-red-400/10 text-red-300">Rejected</Badge>;
        case 'dismissed':
            return <Badge className="border-gray-400/30 bg-gray-400/10 text-gray-300">Dismissed</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

export default function AdminAppealsIndex() {
    const { auth } = usePage<SharedData>().props;
    const props = usePage<AdminAppealsIndexProps>().props;

    const normalizedAppeals = useMemo(() => {
        const raw = props.appeals as unknown as Partial<Paginated<Appeal>> & LegacyPaginator<Appeal>;
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
    }, [props.appeals]);

    const [statusFilter, setStatusFilter] = useState(props.filters.status ?? 'all');
    const [typeFilter, setTypeFilter] = useState(props.filters.type ?? 'all');

    const handleFilter = useCallback(() => {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
        if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);

        router.visit(
            adminRoutes.appeals.index().url + (params.toString() ? `?${params.toString()}` : ''),
            { preserveState: true, preserveScroll: true },
        );
    }, [statusFilter, typeFilter]);

    return (
        <AppLayout>
            <Head title="User Appeals" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">User Appeals</h1>
                        <p className="mt-1 text-sm text-white/60">
                            Review and manage user appeals for bans and suspensions
                        </p>
                    </div>
                </div>

                <Card className="border-white/10 bg-white/5">
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-1 flex-col gap-4 sm:flex-row">
                                <div className="flex-1">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="border-white/10 bg-white/5 text-white">
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                            <SelectItem value="dismissed">Dismissed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1">
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="border-white/10 bg-white/5 text-white">
                                            <SelectValue placeholder="Filter by type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="suspension">Suspension</SelectItem>
                                            <SelectItem value="ban">Ban</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleFilter} variant="default">
                                    Apply Filters
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    {normalizedAppeals.data.length === 0 ? (
                        <Card className="border-white/10 bg-white/5">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <AlertCircle className="size-12 text-white/40" />
                                <p className="mt-4 text-sm text-white/60">No appeals found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        normalizedAppeals.data.map((appeal) => (
                            <Card
                                key={appeal.id}
                                className="border-white/10 bg-white/5 transition hover:border-white/20"
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-10">
                                                    <AvatarImage src={appeal.user.avatar_url ?? undefined} />
                                                    <AvatarFallback>
                                                        {appeal.user.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold text-white">
                                                        {appeal.user.name}
                                                        {appeal.user.username && (
                                                            <span className="ml-2 text-sm text-white/60">
                                                                @{appeal.user.username}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-white/50">{appeal.user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {appeal.appeal_type === 'ban' ? (
                                                    <Ban className="size-4 text-red-400" />
                                                ) : (
                                                    <ShieldOff className="size-4 text-amber-400" />
                                                )}
                                                <span className="text-sm capitalize text-white/70">
                                                    {appeal.appeal_type} appeal
                                                </span>
                                                {getStatusBadge(appeal.status)}
                                            </div>
                                            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                                <p className="text-sm text-white/80 line-clamp-2">{appeal.reason}</p>
                                            </div>
                                            <p className="text-xs text-white/50">
                                                Submitted {formatDistanceToNow(new Date(appeal.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                                        >
                                            <a href={adminRoutes.appeals.show(appeal.id).url}>
                                                Review
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {normalizedAppeals.meta.last_page > 1 && (
                    <Pagination
                        currentPage={normalizedAppeals.meta.current_page}
                        totalPages={normalizedAppeals.meta.last_page}
                        onPageChange={(page) => {
                            router.visit(adminRoutes.appeals.index().url + `?page=${page}`, {
                                preserveState: true,
                                preserveScroll: true,
                            });
                        }}
                    />
                )}
            </div>
        </AppLayout>
    );
}

