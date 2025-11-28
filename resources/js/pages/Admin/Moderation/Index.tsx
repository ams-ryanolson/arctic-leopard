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
import { AlertCircle, CheckCircle2, Clock, FileText, MessageSquare, Search, XCircle } from 'lucide-react';
import { type FormEvent, useCallback, useMemo, useState } from 'react';

type QueueEntry = {
    id: number;
    content_type: string;
    content_id: number;
    status: string;
    moderated_at?: string | null;
    moderated_by?: {
        id: number;
        name: string;
        username: string;
    } | null;
    created_at: string;
    content: {
        type: string;
        id: number;
        body?: string | null;
        user?: {
            id: number;
            name: string;
            username?: string | null;
        };
        created_at: string;
        moderation_status?: string | null;
        media?: Array<{
            id: number;
            url: string;
            type: string;
        }>;
    };
    author?: {
        id: number;
        name: string;
        username?: string | null;
    } | null;
};

type LegacyPaginator<T> = {
    data: T[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
};

type AdminModerationIndexProps = {
    queue: Paginated<QueueEntry> | LegacyPaginator<QueueEntry>;
    filters: {
        search?: string | null;
        type?: string | null;
        status?: string | null;
    };
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'pending':
            return <Badge className="border-amber-400/30 bg-amber-400/10 text-amber-300"><Clock className="mr-1 size-3" />Pending</Badge>;
        case 'approved':
            return <Badge className="border-green-400/30 bg-green-400/10 text-green-300"><CheckCircle2 className="mr-1 size-3" />Approved</Badge>;
        case 'rejected':
            return <Badge className="border-red-400/30 bg-red-400/10 text-red-300"><XCircle className="mr-1 size-3" />Rejected</Badge>;
        case 'dismissed':
            return <Badge className="border-gray-400/30 bg-gray-400/10 text-gray-300"><XCircle className="mr-1 size-3" />Dismissed</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

const getContentIcon = (type: string) => {
    switch (type.toLowerCase()) {
        case 'post':
            return <FileText className="size-4 text-blue-400" />;
        case 'story':
            return <Clock className="size-4 text-purple-400" />;
        case 'comment':
            return <MessageSquare className="size-4 text-green-400" />;
        default:
            return <FileText className="size-4" />;
    }
};

export default function AdminModerationIndex() {
    const { auth } = usePage<SharedData>().props;
    const props = usePage<AdminModerationIndexProps>().props;

    const normalizedQueue = useMemo(() => {
        const raw = props.queue as unknown as Partial<Paginated<QueueEntry>> & LegacyPaginator<QueueEntry>;
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
    }, [props.queue]);

    const [search, setSearch] = useState(props.filters.search ?? '');
    const [typeFilter, setTypeFilter] = useState(props.filters.type ?? 'all');
    const [statusFilter, setStatusFilter] = useState(props.filters.status ?? 'all');

    const handleFilter = useCallback(() => {
        const params = new URLSearchParams();
        if (search.trim()) params.set('search', search.trim());
        if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);
        if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

        router.visit(
            adminRoutes.moderation.index().url + (params.toString() ? `?${params.toString()}` : ''),
            { preserveState: true, preserveScroll: true },
        );
    }, [search, typeFilter, statusFilter]);

    const handlePageChange = useCallback((page: number) => {
        const params = new URLSearchParams();
        if (props.filters.search) params.set('search', props.filters.search);
        if (props.filters.type && props.filters.type !== 'all') params.set('type', props.filters.type);
        if (props.filters.status && props.filters.status !== 'all') params.set('status', props.filters.status);
        params.set('page', page.toString());

        router.visit(
            adminRoutes.moderation.index().url + `?${params.toString()}`,
            { preserveState: true, preserveScroll: true },
        );
    }, [props.filters]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Admin', href: adminRoutes.dashboard().url },
                { title: 'Content Moderation', href: adminRoutes.moderation.index().url },
            ]}
        >
            <Head title="Content Moderation · Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Content Moderation Queue</h1>
                        <p className="mt-1 text-sm text-white/60">
                            Review and moderate user-generated content
                        </p>
                    </div>
                </div>

                <Card className="border-white/10 bg-white/5">
                    <CardContent className="p-6">
                        <form onSubmit={(e: FormEvent) => { e.preventDefault(); handleFilter(); }} className="flex flex-col gap-4 sm:flex-row">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search content..."
                                    className="w-full pl-10 border-white/10 bg-white/5 text-white"
                                />
                            </div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full sm:w-48 border-white/10 bg-white/5 text-white">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="post">Posts</SelectItem>
                                    <SelectItem value="story">Stories</SelectItem>
                                    <SelectItem value="comment">Comments</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-48 border-white/10 bg-white/5 text-white">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="dismissed">Dismissed</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button type="submit" variant="default">
                                Apply Filters
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    {normalizedQueue.data.length === 0 ? (
                        <Card className="border-white/10 bg-white/5">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <AlertCircle className="size-12 text-white/40" />
                                <p className="mt-4 text-sm text-white/60">No content in moderation queue</p>
                            </CardContent>
                        </Card>
                    ) : (
                        normalizedQueue.data.map((entry) => (
                            <Card
                                key={`${entry.content_type}-${entry.content_id}`}
                                className="border-white/10 bg-white/5 transition hover:border-white/20"
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                {getContentIcon(entry.content_type)}
                                                <span className="text-sm capitalize text-white/70">
                                                    {entry.content_type}
                                                </span>
                                                {getStatusBadge(entry.status)}
                                            </div>
                                            {entry.content && (
                                                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                                    {entry.author && (
                                                        <p className="text-xs text-white/50 mb-1">
                                                            By @{entry.author.username || `user-${entry.author.id}`}
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-white/80 line-clamp-2">
                                                        {entry.content.body || 'No content preview available'}
                                                    </p>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-white/50">
                                                <span>
                                                    Queued {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                                                </span>
                                                {entry.moderated_by && (
                                                    <span>
                                                        Moderated by @{entry.moderated_by.username}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                                        >
                                            <a href={adminRoutes.moderation.show({ type: entry.content_type.toLowerCase(), id: entry.content_id }).url}>
                                                Review
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {normalizedQueue.meta.last_page > 1 && (
                    <Pagination
                        currentPage={normalizedQueue.meta.current_page}
                        totalPages={normalizedQueue.meta.last_page}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>
        </AppLayout>
    );
}

