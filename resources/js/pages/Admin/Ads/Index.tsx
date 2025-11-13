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
import { Badge } from '@/components/ui/badge';
import { ChartWithAxes } from '@/components/ads/chart-with-axes';
import AppLayout from '@/layouts/app-layout';
import { router, Head, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import type { SharedData } from '@/types';
import { TrendingUp, TrendingDown, Eye, MousePointerClick, DollarSign, BarChart3, Users, AlertCircle } from 'lucide-react';

type Ad = {
    id: number;
    uuid: string;
    name: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    budget_amount: number;
    budget_currency: string;
    spent_amount: number;
    pricing_model: string;
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

type FilterFormState = {
    search: string;
    status: string;
};

export default function AdminAdsIndex({ ads, filters, meta, analytics }: AdminAdsIndexProps) {
    const ALL_OPTION = 'all';

    const [formState, setFormState] = useState<FilterFormState>({
        search: filters.search ?? '',
        status: filters.status ?? '',
    });

    const paginationMeta = {
        currentPage: ads.meta.current_page,
        perPage: ads.meta.per_page,
        total: ads.meta.total,
        hasMorePages: ads.meta.current_page < ads.meta.last_page,
    };

    const applyFilters = () => {
        const query: Record<string, string> = {};

        if (formState.search) query.search = formState.search;
        if (formState.status) query.status = formState.status;

        router.visit('/admin/ads', {
            data: query,
            preserveScroll: true,
            only: ['ads', 'filters'],
        });
    };

    const resetFilters = () => {
        setFormState({
            search: '',
            status: '',
        });

        router.visit('/admin/ads', {
            preserveScroll: true,
            only: ['ads', 'filters'],
        });
    };

    const handlePageChange = (page: number) => {
        const query: Record<string, string> = {};

        if (filters.search) query.search = filters.search;
        if (filters.status) query.status = filters.status;

        query.page = page.toString();

        router.visit('/admin/ads', {
            data: query,
            preserveScroll: true,
            only: ['ads'],
        });
    };

    const statusOptions = meta.statuses ?? ['draft', 'pending_review', 'active', 'paused', 'expired', 'rejected'];

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
                    value: point.revenue / 100, // Convert to dollars
                })),
                color: 'rgba(190, 242, 100, 0.85)',
            },
        ];
    }, [analytics.timeline]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Admin', href: '/admin' },
                { title: 'Ads', href: '/admin/ads' },
            ]}
        >
            <Head title="Ads Dashboard · Admin" />

            <div className="space-y-6 text-white">
                <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Ads Dashboard</h1>
                        <p className="mt-1 text-sm text-white/60">
                            Comprehensive analytics, insights, and ad management.
                        </p>
                    </div>
                    <Link
                        href="/admin/ads/create"
                        className="rounded-full bg-white px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.35em] text-black shadow-[0_30px_70px_-45px_rgba(255,255,255,0.55)] transition-transform hover:scale-[1.02]"
                    >
                        Create Ad
                    </Link>
                </header>

                {/* Overview Metrics */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold text-white/90">Overview</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title="Total Ads"
                            value={analytics.overview.total_ads}
                            icon={BarChart3}
                            trend={null}
                        />
                        <MetricCard
                            title="Active Ads"
                            value={analytics.overview.active_ads}
                            icon={TrendingUp}
                            trend={null}
                        />
                        <MetricCard
                            title="Pending Review"
                            value={analytics.overview.pending_ads}
                            icon={AlertCircle}
                            trend={null}
                            highlight={analytics.overview.pending_ads > 0}
                        />
                        <MetricCard
                            title="Total Revenue"
                            value={`$${((analytics.overview.total_revenue || 0) / 100).toFixed(2)}`}
                            icon={DollarSign}
                            trend={null}
                        />
                    </div>
                </div>

                {/* Performance Metrics */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold text-white/90">Performance (Last 30 Days)</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <MetricCard
                            title="Impressions"
                            value={analytics.overview.total_impressions.toLocaleString()}
                            icon={Eye}
                            trend={null}
                        />
                        <MetricCard
                            title="Clicks"
                            value={analytics.overview.total_clicks.toLocaleString()}
                            icon={MousePointerClick}
                            trend={null}
                        />
                        <MetricCard
                            title="Average CTR"
                            value={`${analytics.overview.average_ctr}%`}
                            icon={TrendingUp}
                            trend={null}
                        />
                    </div>
                </div>

                {/* Charts */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold text-white/90">Analytics</h2>
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="border-white/10 bg-white/5">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">Impressions & Clicks</CardTitle>
                                <p className="mt-1 text-xs text-white/50">Daily performance over the last 30 days</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                                    <ChartWithAxes
                                        series={chartSeries}
                                        width={520}
                                        height={260}
                                        xAxisLabel="Date"
                                        yAxisLabel="Count"
                                        formatYValue={(v) => v.toLocaleString()}
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-white/65">
                                    {chartSeries.map((series, index) => (
                                        <span key={series.name} className="inline-flex items-center gap-2">
                                            <span
                                                className={`inline-flex size-2.5 rounded-full ${
                                                    index === 0 ? 'bg-amber-400' : 'bg-sky-300'
                                                }`}
                                            />
                                            <span className="font-medium">{series.name}</span>
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">Revenue</CardTitle>
                                <p className="mt-1 text-xs text-white/50">Daily revenue generated over the last 30 days</p>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                                    <ChartWithAxes
                                        series={revenueChartSeries}
                                        width={520}
                                        height={260}
                                        xAxisLabel="Date"
                                        yAxisLabel="Revenue ($)"
                                        formatYValue={(v) => `$${v.toFixed(2)}`}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Breakdowns & Top Ads */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold text-white/90">Insights</h2>
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="border-white/10 bg-white/5">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">Status Breakdown</CardTitle>
                                <p className="mt-1 text-xs text-white/50">Distribution of ads by status</p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {Object.entries(analytics.status_breakdown).length === 0 ? (
                                    <p className="text-sm text-white/50">No data available</p>
                                ) : (
                                    Object.entries(analytics.status_breakdown).map(([status, count]) => (
                                        <div
                                            key={status}
                                            className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                                        >
                                            <span className="text-sm font-medium text-white/80 capitalize">
                                                {status.replace('_', ' ')}
                                            </span>
                                            <Badge className="rounded-full border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-semibold">
                                                {count}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">Placement Breakdown</CardTitle>
                                <p className="mt-1 text-xs text-white/50">Number of creatives by placement</p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {Object.entries(analytics.placement_breakdown).length === 0 ? (
                                    <p className="text-sm text-white/50">No data available</p>
                                ) : (
                                    Object.entries(analytics.placement_breakdown).map(([placement, count]) => (
                                        <div
                                            key={placement}
                                            className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                                        >
                                            <span className="text-sm font-medium text-white/80 capitalize">
                                                {placement.replace('_', ' ').replace('dashboard', 'sidebar')}
                                            </span>
                                            <Badge className="rounded-full border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-semibold">
                                                {count}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">Top Performing Ads</CardTitle>
                                <p className="mt-1 text-xs text-white/50">Highest impression ads (last 30 days)</p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {analytics.top_ads.length === 0 ? (
                                    <p className="text-sm text-white/50">No performance data yet</p>
                                ) : (
                                    analytics.top_ads.map((ad, index) => (
                                        <div
                                            key={ad.id}
                                            className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex size-5 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">
                                                            {index + 1}
                                                        </span>
                                                        <Link
                                                            href={`/admin/ads/${ad.id}`}
                                                            className="text-sm font-semibold text-white hover:text-amber-300 hover:underline truncate"
                                                        >
                                                            {ad.name}
                                                        </Link>
                                                    </div>
                                                    <p className="mt-1 text-xs text-white/50">{ad.advertiser}</p>
                                                </div>
                                                <Badge className="rounded-full border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                                    {ad.ctr}% CTR
                                                </Badge>
                                            </div>
                                            <div className="flex gap-3 text-xs text-white/60">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="size-3" />
                                                    {ad.impressions_count.toLocaleString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MousePointerClick className="size-3" />
                                                    {ad.clicks_count.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Ad Management Section */}
                <section className="space-y-4 border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-white/90">Ad Management</h2>
                            <p className="mt-1 text-sm text-white/50">Search, filter, and manage all ads</p>
                        </div>
                    </div>

                    <Card className="border-white/10 bg-white/5">
                        <CardContent className="space-y-4 p-6">
                            <div className="grid gap-3 lg:grid-cols-[minmax(0,280px)_minmax(0,200px)_minmax(0,200px)] lg:items-center">
                                <Input
                                    placeholder="Search ads by name or advertiser..."
                                    value={formState.search}
                                    onChange={(event) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            search: event.target.value,
                                        }))
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            applyFilters();
                                        }
                                    }}
                                    className="rounded-full border-white/20 bg-black/25 text-sm text-white placeholder:text-white/40 transition-all focus-visible:border-amber-400/50 focus-visible:ring-amber-400/40"
                                />

                                <Select
                                    value={formState.status === '' ? ALL_OPTION : formState.status}
                                    onValueChange={(value) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            status: value === ALL_OPTION ? '' : value,
                                        }))
                                    }
                                >
                                    <SelectTrigger className="rounded-full border-white/20 bg-black/25 text-sm text-white transition-all focus-visible:border-amber-400/50 focus-visible:ring-amber-400/40">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border border-white/10 bg-black/85 text-white shadow-[0_30px_70px_-50px_rgba(0,0,0,0.70)] backdrop-blur-xl">
                                        <SelectItem value={ALL_OPTION} className="text-sm text-white/75">
                                            All statuses
                                        </SelectItem>
                                        {statusOptions.map((status) => (
                                            <SelectItem
                                                key={status}
                                                value={status}
                                                className="text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                                            >
                                                {status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    type="button"
                                    onClick={applyFilters}
                                    className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-[0_25px_65px_-35px_rgba(249,115,22,0.6)] transition-all hover:scale-[1.02]"
                                >
                                    Apply Filters
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={resetFilters}
                                    className="rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.35em] text-white/70 transition-all hover:border-white/30 hover:bg-white/15 hover:text-white"
                                >
                                    Reset
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {ads.data.length === 0 ? (
                        <Card className="border-white/10 bg-white/5">
                            <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
                                <div className="rounded-full border border-white/15 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                                    Nothing Found
                                </div>
                                <p className="text-white/70">No ads match the current filters.</p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={resetFilters}
                                    className="mt-2 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70 transition-all hover:border-white/30 hover:bg-white/15 hover:text-white"
                                >
                                    Clear Filters
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {ads.data.map((ad) => (
                                <AdminAdRow key={ad.id} ad={ad} />
                            ))}
                        </div>
                    )}

                    <Pagination
                        meta={paginationMeta}
                        onPageChange={handlePageChange}
                        className="border-white/10 bg-white/5"
                    />
                </section>
            </div>
        </AppLayout>
    );
}

type MetricCardProps = {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    trend: number | null;
    highlight?: boolean;
};

function MetricCard({ title, value, icon: Icon, trend, highlight }: MetricCardProps) {
    return (
        <Card
            className={`border transition-all hover:border-white/20 ${
                highlight ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/10 bg-white/5'
            }`}
        >
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                        <p className="text-xs font-medium uppercase tracking-[0.35em] text-white/50">{title}</p>
                        <p
                            className={`text-3xl font-bold tracking-tight ${
                                highlight ? 'text-amber-300' : 'text-white'
                            }`}
                        >
                            {value}
                        </p>
                    </div>
                    <div
                        className={`rounded-xl p-3 transition-colors ${
                            highlight ? 'bg-amber-500/20' : 'bg-white/10'
                        }`}
                    >
                        <Icon className={`size-6 ${highlight ? 'text-amber-300' : 'text-white/70'}`} />
                    </div>
                </div>
                {trend !== null && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs">
                        {trend > 0 ? (
                            <>
                                <TrendingUp className="size-3.5 text-emerald-400" />
                                <span className="font-semibold text-emerald-400">+{trend}%</span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="size-3.5 text-red-400" />
                                <span className="font-semibold text-red-400">{trend}%</span>
                            </>
                        )}
                        <span className="text-white/50">vs last period</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

type AdminAdRowProps = {
    ad: Ad;
};

function AdminAdRow({ ad }: AdminAdRowProps) {
    const [processing, setProcessing] = useState(false);

    const handleAction = async (action: 'approve' | 'reject' | 'pause' | 'resume') => {
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
                router.post(`/admin/ads/${ad.id}/reject`, { reason: 'Rejected by admin' }, options);
                break;
            case 'pause':
                router.post(`/admin/ads/${ad.id}/pause`, {}, options);
                break;
            case 'resume':
                router.post(`/admin/ads/${ad.id}/resume`, {}, options);
                break;
        }
    };

    const statusColors: Record<string, string> = {
        draft: 'bg-gray-500/20 text-gray-300',
        pending_review: 'bg-yellow-500/20 text-yellow-300',
        active: 'bg-green-500/20 text-green-300',
        paused: 'bg-orange-500/20 text-orange-300',
        expired: 'bg-red-500/20 text-red-300',
        rejected: 'bg-red-500/20 text-red-300',
    };

    return (
        <Card className="border-white/10 bg-white/5 text-white transition-all hover:border-white/20 hover:bg-white/[0.07]">
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                            href={`/admin/ads/${ad.id}`}
                            className="text-lg font-semibold text-white hover:text-amber-300 hover:underline transition-colors"
                        >
                            {ad.name}
                        </Link>
                        <Badge
                            className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold ${
                                statusColors[ad.status] ?? 'bg-gray-500/20 text-gray-300'
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
                        <span>·</span>
                        <span>Budget: ${(ad.budget_amount / 100).toFixed(2)}</span>
                        <span>·</span>
                        <span>Spent: ${(ad.spent_amount / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Badge className="rounded-full border-white/20 bg-white/10 px-2.5 py-0.5 text-[0.65rem] font-medium">
                            <Eye className="mr-1.5 inline size-3" />
                            {(ad.impressions_count ?? 0).toLocaleString()} impressions
                        </Badge>
                        <Badge className="rounded-full border-white/20 bg-white/10 px-2.5 py-0.5 text-[0.65rem] font-medium">
                            <MousePointerClick className="mr-1.5 inline size-3" />
                            {(ad.clicks_count ?? 0).toLocaleString()} clicks
                        </Badge>
                        <Badge className="rounded-full border-white/20 bg-white/10 px-2.5 py-0.5 text-[0.65rem] font-medium">
                            {ad.pricing_model.toUpperCase()}
                        </Badge>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:ml-4">
                    {ad.status === 'pending_review' && ad.can.approve && (
                        <Button
                            size="sm"
                            disabled={processing}
                            onClick={() => handleAction('approve')}
                            className="rounded-full bg-emerald-500/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-[0_20px_50px_-30px_rgba(16,185,129,0.5)] transition-all hover:scale-[1.02] hover:bg-emerald-500"
                        >
                            Approve
                        </Button>
                    )}
                    {ad.status === 'pending_review' && ad.can.reject && (
                        <Button
                            size="sm"
                            disabled={processing}
                            onClick={() => handleAction('reject')}
                            className="rounded-full bg-red-500/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-[0_20px_50px_-30px_rgba(239,68,68,0.5)] transition-all hover:scale-[1.02] hover:bg-red-500"
                        >
                            Reject
                        </Button>
                    )}
                    {ad.status === 'active' && ad.can.pause && (
                        <Button
                            size="sm"
                            disabled={processing}
                            onClick={() => handleAction('pause')}
                            className="rounded-full border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/75 transition-all hover:border-white/40 hover:bg-white/20 hover:text-white"
                        >
                            Pause
                        </Button>
                    )}
                    {ad.status === 'paused' && ad.can.resume && (
                        <Button
                            size="sm"
                            disabled={processing}
                            onClick={() => handleAction('resume')}
                            className="rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-[0_20px_50px_-30px_rgba(16,185,129,0.5)] transition-all hover:scale-[1.02]"
                        >
                            Resume
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
