import { ChartWithAxes } from '@/components/ads/chart-with-axes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import type { SharedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    BarChart3,
    ChevronDown,
    ChevronUp,
    DollarSign,
    Edit,
    Eye,
    MoreVertical,
    MousePointerClick,
    Search,
    Trash2,
    TrendingDown,
    TrendingUp,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';

type Ad = {
    id: number;
    uuid: string;
    name: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    budget_amount: number | null;
    budget_currency: string | null;
    spent_amount: number;
    pricing_model: string | null;
    impressions_count: number;
    clicks_count: number;
    advertiser: {
        id: number;
        username: string;
        display_name: string | null;
    };
    campaign: {
        id: number;
        name: string;
    } | null;
    can: {
        update: boolean;
        delete: boolean;
        approve: boolean;
        reject: boolean;
        pause: boolean;
        resume: boolean;
    };
};

type AdCollection = {
    data: Ad[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
};

type AnalyticsData = {
    overview: {
        total_ads: number;
        active_ads: number;
        pending_ads: number;
        total_impressions: number;
        total_clicks: number;
        total_revenue: number;
        average_ctr: number;
    };
    status_breakdown: Record<string, number>;
    placement_breakdown: Record<string, number>;
    timeline: Array<{
        date: string;
        label: string;
        impressions: number;
        clicks: number;
        revenue: number;
    }>;
    top_ads: Array<{
        id: number;
        name: string;
        advertiser: string;
        impressions_count: number;
        clicks_count: number;
        ctr: number;
    }>;
};

type AdminAdsIndexProps = SharedData & {
    ads: AdCollection;
    filters: {
        status: string | null;
        advertiser_id: number | null;
        placement: string | null;
        search: string | null;
    };
    meta: {
        statuses: string[];
    };
    analytics: AnalyticsData;
};

export default function AdminAdsIndex({
    ads,
    filters,
    meta,
    analytics,
}: AdminAdsIndexProps) {
    const ALL_OPTION = 'all';
    const [searchQuery, setSearchQuery] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? ALL_OPTION);
    const [showAnalytics, setShowAnalytics] = useState(true);
    const isInitialMount = useRef(true);

    // Sync state with props when they change (but not on initial mount)
    // Only update if state doesn't match props to prevent unnecessary updates
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        
        const newSearch = filters.search ?? '';
        const newStatus = filters.status ?? ALL_OPTION;
        
        // Only update state if it's different from current state
        // Use functional updates to avoid stale closure issues
        setSearchQuery((prev) => {
            if (prev !== newSearch) {
                return newSearch;
            }
            return prev;
        });
        setStatusFilter((prev) => {
            if (prev !== newStatus) {
                return newStatus;
            }
            return prev;
        });
    }, [filters.search, filters.status]);

    const paginationMeta = {
        currentPage: ads.meta.current_page,
        perPage: ads.meta.per_page,
        total: ads.meta.total,
        hasMorePages: ads.meta.current_page < ads.meta.last_page,
    };

    // Memoize applyFilters with useCallback
    const applyFilters = useCallback(() => {
        const query: Record<string, string> = {};

        if (searchQuery.trim()) query.search = searchQuery.trim();
        if (statusFilter && statusFilter !== ALL_OPTION) query.status = statusFilter;

        // Only call router.visit if query actually changed
        const currentQuery = new URLSearchParams(window.location.search);
        const hasChanged =
            (query.search || '') !== (currentQuery.get('search') || '') ||
            (query.status || '') !== (currentQuery.get('status') || '');

        if (!hasChanged) return;

        router.visit('/admin/ads', {
            data: query,
            preserveScroll: true,
            only: ['ads', 'filters'],
        });
    }, [searchQuery, statusFilter]);

    // Debounced search - skip on initial mount
    useEffect(() => {
        // Skip on initial mount
        if (isInitialMount.current) return;

        const timer = setTimeout(() => {
            applyFilters();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, statusFilter, applyFilters]);

    const clearSearch = () => {
        setSearchQuery('');
        setStatusFilter(ALL_OPTION);
        router.visit('/admin/ads', {
            preserveScroll: true,
            only: ['ads', 'filters'],
        });
    };

    const handlePageChange = (page: number) => {
        const query: Record<string, string> = {};

        if (searchQuery.trim()) query.search = searchQuery.trim();
        if (statusFilter && statusFilter !== ALL_OPTION) query.status = statusFilter;
        query.page = page.toString();

        router.visit('/admin/ads', {
            data: query,
            preserveScroll: true,
            only: ['ads'],
        });
    };

    const statusOptions = meta.statuses ?? [
        'draft',
        'pending_review',
        'active',
        'paused',
        'expired',
        'rejected',
    ];

    // Prepare chart data
    const chartSeries = useMemo(() => {
        return [
            {
                name: 'Impressions',
                values: analytics.timeline.map((point) => ({
                    label: point.label,
                    value: point.impressions,
                })),
                color: 'rgba(249, 115, 22, 0.85)',
            },
            {
                name: 'Clicks',
                values: analytics.timeline.map((point) => ({
                    label: point.label,
                    value: point.clicks,
                })),
                color: 'rgba(56, 189, 248, 0.85)',
            },
        ];
    }, [analytics.timeline]);

    const revenueChartSeries = useMemo(() => {
        return [
            {
                name: 'Revenue',
                values: analytics.timeline.map((point) => ({
                    label: point.label,
                    value: point.revenue / 100,
                })),
                color: 'rgba(190, 242, 100, 0.85)',
            },
        ];
    }, [analytics.timeline]);

    const hasActiveFilters = searchQuery.trim() || (statusFilter && statusFilter !== ALL_OPTION);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Admin', href: '/admin' },
                { title: 'Ads', href: '/admin/ads' },
            ]}
        >
            <Head title="Ads · Admin" />

            <div className="space-y-6 text-white">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Ads
                        </h1>
                        <p className="mt-1 text-sm text-white/60">
                            Manage advertising campaigns and track performance
                        </p>
                    </div>
                    <Link
                        href="/admin/ads/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90"
                    >
                        Create Ad
                    </Link>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Total Ads"
                        value={analytics.overview.total_ads}
                        icon={BarChart3}
                    />
                    <MetricCard
                        title="Active"
                        value={analytics.overview.active_ads}
                        icon={TrendingUp}
                        highlight={analytics.overview.active_ads > 0}
                    />
                    <MetricCard
                        title="Pending"
                        value={analytics.overview.pending_ads}
                        icon={AlertCircle}
                        highlight={analytics.overview.pending_ads > 0}
                    />
                    <MetricCard
                        title="Revenue"
                        value={`$${((analytics.overview.total_revenue || 0) / 100).toFixed(2)}`}
                        icon={DollarSign}
                    />
                </div>

                {/* Collapsible Analytics */}
                <Card className="border-white/10 bg-white/5">
                    <CardHeader className="pb-3">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowAnalytics((prev) => !prev);
                            }}
                            className="flex w-full items-center justify-between cursor-pointer select-none hover:opacity-80 transition-opacity focus:outline-none"
                            aria-expanded={showAnalytics}
                        >
                            <CardTitle className="text-base font-semibold">
                                Analytics & Insights
                            </CardTitle>
                            {showAnalytics ? (
                                <ChevronUp className="size-4 text-white/60" />
                            ) : (
                                <ChevronDown className="size-4 text-white/60" />
                            )}
                        </button>
                    </CardHeader>
                    {showAnalytics && (
                        <CardContent className="space-y-6 pt-0">
                            {/* Performance Metrics */}
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                                    <div className="text-xs font-medium text-white/60 uppercase tracking-wide">
                                        Impressions
                                    </div>
                                    <div className="mt-1 text-2xl font-semibold">
                                        {analytics.overview.total_impressions.toLocaleString()}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                                    <div className="text-xs font-medium text-white/60 uppercase tracking-wide">
                                        Clicks
                                    </div>
                                    <div className="mt-1 text-2xl font-semibold">
                                        {analytics.overview.total_clicks.toLocaleString()}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                                    <div className="text-xs font-medium text-white/60 uppercase tracking-wide">
                                        Avg CTR
                                    </div>
                                    <div className="mt-1 text-2xl font-semibold">
                                        {analytics.overview.average_ctr}%
                                    </div>
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-white/90">
                                        Impressions & Clicks
                                    </h3>
                                    <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                                        <ChartWithAxes
                                            series={chartSeries}
                                            width={480}
                                            height={200}
                                            xAxisLabel="Date"
                                            yAxisLabel="Count"
                                            formatYValue={(v) => v.toLocaleString()}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-white/90">
                                        Revenue
                                    </h3>
                                    <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                                        <ChartWithAxes
                                            series={revenueChartSeries}
                                            width={480}
                                            height={200}
                                            xAxisLabel="Date"
                                            yAxisLabel="Revenue ($)"
                                            formatYValue={(v) => `$${v.toFixed(2)}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Breakdowns */}
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-white/90">
                                        Status Breakdown
                                    </h3>
                                    <div className="space-y-1.5">
                                        {Object.entries(analytics.status_breakdown).map(
                                            ([status, count]) => (
                                                <div
                                                    key={status}
                                                    className="flex items-center justify-between rounded border border-white/10 bg-black/20 px-3 py-1.5 text-sm"
                                                >
                                                    <span className="capitalize text-white/80">
                                                        {status.replace('_', ' ')}
                                                    </span>
                                                    <Badge className="bg-white/10 text-white text-xs">
                                                        {count}
                                                    </Badge>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-white/90">
                                        Placement Breakdown
                                    </h3>
                                    <div className="space-y-1.5">
                                        {Object.entries(analytics.placement_breakdown).map(
                                            ([placement, count]) => (
                                                <div
                                                    key={placement}
                                                    className="flex items-center justify-between rounded border border-white/10 bg-black/20 px-3 py-1.5 text-sm"
                                                >
                                                    <span className="capitalize text-white/80">
                                                        {placement
                                                            .replace('_', ' ')
                                                            .replace('dashboard', 'sidebar')}
                                                    </span>
                                                    <Badge className="bg-white/10 text-white text-xs">
                                                        {count}
                                                    </Badge>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-white/90">
                                        Top Ads
                                    </h3>
                                    <div className="space-y-1.5">
                                        {analytics.top_ads.slice(0, 5).map((ad, index) => (
                                            <div
                                                key={ad.id}
                                                className="rounded border border-white/10 bg-black/20 p-2 text-sm"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <Link
                                                        href={`/admin/ads/${ad.id}`}
                                                        className="flex-1 truncate font-medium text-white hover:text-amber-300 hover:underline"
                                                    >
                                                        {ad.name}
                                                    </Link>
                                                    <Badge className="bg-emerald-500/20 text-emerald-300 text-xs">
                                                        {ad.ctr}%
                                                    </Badge>
                                                </div>
                                                <div className="mt-1 flex gap-3 text-xs text-white/60">
                                                    <span>
                                                        {ad.impressions_count.toLocaleString()}{' '}
                                                        views
                                                    </span>
                                                    <span>
                                                        {ad.clicks_count.toLocaleString()} clicks
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Filters & Ad List */}
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                            <Input
                                placeholder="Search ads..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-9 border-white/10 bg-black/30 text-white placeholder:text-white/40"
                            />
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                        <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger className="w-[180px] border-white/10 bg-black/30 text-white">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent className="bg-black/95 text-white">
                                <SelectItem value={ALL_OPTION}>All statuses</SelectItem>
                                {statusOptions.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {status
                                            .replace('_', ' ')
                                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearSearch}
                                className="text-white/60 hover:text-white"
                            >
                                Clear
                            </Button>
                        )}
                    </div>

                    {/* Ad List */}
                    {ads.data.length === 0 ? (
                        <Card className="border-white/10 bg-white/5">
                            <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
                                <p className="text-white/70">
                                    {hasActiveFilters
                                        ? 'No ads match your filters'
                                        : 'No ads yet'}
                                </p>
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearSearch}
                                        className="text-white/60 hover:text-white"
                                    >
                                        Clear filters
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {ads.data.map((ad) => (
                                <AdminAdRow key={ad.id} ad={ad} />
                            ))}
                        </div>
                    )}

                    {ads.data.length > 0 && (
                        <Pagination
                            meta={paginationMeta}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

type MetricCardProps = {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    highlight?: boolean;
};

function MetricCard({
    title,
    value,
    icon: Icon,
    highlight,
}: MetricCardProps) {
    return (
        <Card
            className={`border transition-colors ${
                highlight
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : 'border-white/10 bg-white/5'
            }`}
        >
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-white/60 uppercase tracking-wide">
                            {title}
                        </p>
                        <p
                            className={`mt-1 text-xl font-semibold ${
                                highlight ? 'text-amber-300' : 'text-white'
                            }`}
                        >
                            {value}
                        </p>
                    </div>
                    <div
                        className={`rounded-lg p-2 ${
                            highlight ? 'bg-amber-500/20' : 'bg-white/10'
                        }`}
                    >
                        <Icon
                            className={`size-5 ${
                                highlight ? 'text-amber-300' : 'text-white/70'
                            }`}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

type AdminAdRowProps = {
    ad: Ad;
};

function AdminAdRow({ ad }: AdminAdRowProps) {
    const [processing, setProcessing] = useState(false);

    const handleAction = async (
        action: 'approve' | 'reject' | 'pause' | 'resume' | 'delete',
    ) => {
        setProcessing(true);

        const options = {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        };

        switch (action) {
            case 'approve':
                router.post(`/admin/ads/${ad.id}/approve`, {}, options);
                break;
            case 'reject':
                router.post(
                    `/admin/ads/${ad.id}/reject`,
                    { reason: 'Rejected by admin' },
                    options,
                );
                break;
            case 'pause':
                router.post(`/admin/ads/${ad.id}/pause`, {}, options);
                break;
            case 'resume':
                router.post(`/admin/ads/${ad.id}/resume`, {}, options);
                break;
            case 'delete':
                if (confirm('Are you sure you want to delete this ad?')) {
                    router.delete(`/admin/ads/${ad.id}`, options);
                }
                break;
        }
    };

    const statusColors: Record<string, string> = {
        draft: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
        pending_review: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        paused: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        expired: 'bg-red-500/20 text-red-300 border-red-500/30',
        rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
    };

    const ctr =
        ad.impressions_count > 0
            ? ((ad.clicks_count / ad.impressions_count) * 100).toFixed(2)
            : '0.00';

    return (
        <Card className="border-white/10 bg-white/5">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link
                                href={`/admin/ads/${ad.id}`}
                                className="text-base font-semibold text-white hover:text-amber-300 hover:underline truncate"
                            >
                                {ad.name}
                            </Link>
                            <Badge
                                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                                    statusColors[ad.status] ??
                                    'bg-gray-500/20 text-gray-300 border-gray-500/30'
                                }`}
                            >
                                {ad.status.replace('_', ' ')}
                            </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
                            <span className="flex items-center gap-1.5">
                                <Users className="size-3.5" />
                                {ad.advertiser.display_name ?? ad.advertiser.username}
                            </span>
                            {ad.budget_amount !== null && (
                                <>
                                    <span>·</span>
                                    <span>
                                        Budget: ${(ad.budget_amount / 100).toFixed(2)}
                                        {ad.budget_currency && ` ${ad.budget_currency}`}
                                    </span>
                                </>
                            )}
                            {ad.budget_amount === null && (
                                <>
                                    <span>·</span>
                                    <span className="text-amber-300">Admin/Promotional</span>
                                </>
                            )}
                            <span>·</span>
                            <span>Spent: ${(ad.spent_amount / 100).toFixed(2)}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Badge className="rounded border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white">
                                <Eye className="mr-1 inline size-3" />
                                {(ad.impressions_count ?? 0).toLocaleString()}
                            </Badge>
                            <Badge className="rounded border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white">
                                <MousePointerClick className="mr-1 inline size-3" />
                                {(ad.clicks_count ?? 0).toLocaleString()}
                            </Badge>
                            <Badge className="rounded border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white">
                                {ctr}% CTR
                            </Badge>
                            {ad.pricing_model && (
                                <Badge className="rounded border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white">
                                    {ad.pricing_model.toUpperCase()}
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={`/admin/ads/${ad.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 active:bg-white/30"
                        >
                            <Edit className="size-3.5" />
                            Edit
                        </Link>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={processing}
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="bg-black/95 border-white/10 text-white"
                            >
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={`/admin/ads/${ad.id}`}
                                        className="cursor-pointer"
                                    >
                                        <Eye className="mr-2 size-4" />
                                        View Details
                                    </Link>
                                </DropdownMenuItem>
                                {ad.status === 'pending_review' && ad.can.approve && (
                                    <DropdownMenuItem
                                        onClick={() => handleAction('approve')}
                                        className="cursor-pointer text-emerald-300"
                                    >
                                        Approve
                                    </DropdownMenuItem>
                                )}
                                {ad.status === 'pending_review' && ad.can.reject && (
                                    <DropdownMenuItem
                                        onClick={() => handleAction('reject')}
                                        className="cursor-pointer text-red-300"
                                    >
                                        Reject
                                    </DropdownMenuItem>
                                )}
                                {ad.status === 'active' && ad.can.pause && (
                                    <DropdownMenuItem
                                        onClick={() => handleAction('pause')}
                                        className="cursor-pointer"
                                    >
                                        Pause
                                    </DropdownMenuItem>
                                )}
                                {ad.status === 'paused' && ad.can.resume && (
                                    <DropdownMenuItem
                                        onClick={() => handleAction('resume')}
                                        className="cursor-pointer text-emerald-300"
                                    >
                                        Resume
                                    </DropdownMenuItem>
                                )}
                                {ad.can.delete && (
                                    <>
                                        <DropdownMenuSeparator className="bg-white/10" />
                                        <DropdownMenuItem
                                            onClick={() => handleAction('delete')}
                                            className="cursor-pointer text-red-300"
                                        >
                                            <Trash2 className="mr-2 size-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
