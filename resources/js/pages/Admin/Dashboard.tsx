import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowDownRight,
    ArrowUpRight,
    DollarSign,
    FileText,
    Image,
    MessageSquare,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useMemo } from 'react';
import {
    Area,
    AreaChart,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface WelcomeMessage {
    name?: string | null;
    message: string;
}

interface OverviewStat {
    label: string;
    value: number;
    trend: string;
}

interface ActivityItem {
    id: number;
    title: string;
    timestamp: string;
    summary: string;
}

interface QuickLink {
    label: string;
    description: string;
    url: string;
    disabled?: boolean;
}

interface MoneyAmount {
    amount: number;
    formatted: string;
    currency: string;
}

interface MonthlyRevenuePoint {
    period: string;
    gross: number;
    net: number;
    currency: string;
}

interface FinancialMetrics {
    today: {
        revenue: MoneyAmount;
        net_revenue: MoneyAmount;
        memberships_sold: number;
        transactions: number;
    };
    this_week: {
        revenue: MoneyAmount;
        net_revenue: MoneyAmount;
        memberships_sold: number;
        transactions: number;
        trend: string;
    };
    this_month: {
        revenue: MoneyAmount;
        net_revenue: MoneyAmount;
        memberships_sold: number;
        transactions: number;
        trend: string;
    };
    subscriptions: {
        active_count: number;
        mrr: MoneyAmount;
    };
    breakdown: {
        memberships: MoneyAmount;
        tips: MoneyAmount;
        post_unlocks: MoneyAmount;
        wishlist: MoneyAmount;
    };
    monthly_revenue_chart?: MonthlyRevenuePoint[];
}

interface GlobalStats {
    total_users: number;
    total_posts: number;
    total_comments: number;
    total_stories: number;
}

interface AdminDashboardProps {
    welcome: WelcomeMessage;
    globalStats?: GlobalStats;
    overview: OverviewStat[];
    financial?: FinancialMetrics;
    recentActivity: ActivityItem[];
    quickLinks: QuickLink[];
}

// Chart colors
const CHART_COLORS = {
    primary: 'rgba(249, 115, 22, 0.85)',
    secondary: 'rgba(56, 189, 248, 0.85)',
    success: 'rgba(190, 242, 100, 0.85)',
    warning: 'rgba(251, 191, 36, 0.85)',
    danger: 'rgba(239, 68, 68, 0.85)',
};

const PIE_COLORS = [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.success,
    CHART_COLORS.warning,
];

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
        },
    },
};

const formatTrend = (trend: string) => {
    if (!trend || trend === 'No change') {
        return null;
    }

    const isPositive = trend.includes('+');
    const isNegative = trend.includes('-') && !trend.startsWith('-');

    if (isPositive) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-200">
                <ArrowUpRight className="h-3 w-3" />
                {trend.replace('+', '').trim()}
            </span>
        );
    }

    if (isNegative) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-red-200">
                <ArrowDownRight className="h-3 w-3" />
                {trend}
            </span>
        );
    }

    return <span className="text-xs text-white/60">{trend}</span>;
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-white/20 bg-black/90 p-3 shadow-lg backdrop-blur-sm">
                <p className="mb-2 text-sm font-semibold text-white">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p
                        key={index}
                        className="text-xs"
                        style={{ color: entry.color }}
                    >
                        {entry.name}:{' '}
                        {entry.value?.toLocaleString('en-US', {
                            style: 'currency',
                            currency: entry.payload?.currency || 'USD',
                        })}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Custom label for pie chart
const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
}: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) {
        return null; // Don't show labels for slices < 5%
    }

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            className="text-xs font-semibold"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export default function AdminDashboard({
    welcome,
    globalStats,
    overview,
    financial,
    recentActivity,
    quickLinks,
}: AdminDashboardProps) {
    const breadcrumbs = [
        {
            title: 'Admin',
            href: admin.dashboard().url,
        },
        {
            title: 'Dashboard',
            href: admin.dashboard().url,
            current: true,
        },
    ];

    // Prepare revenue breakdown pie chart data
    const revenueBreakdownData = useMemo(() => {
        if (!financial?.breakdown) {
            return [];
        }

        return [
            {
                name: 'Memberships',
                value: financial.breakdown.memberships.amount / 100,
                formatted: financial.breakdown.memberships.formatted,
            },
            {
                name: 'Tips',
                value: financial.breakdown.tips.amount / 100,
                formatted: financial.breakdown.tips.formatted,
            },
            {
                name: 'Post Unlocks',
                value: financial.breakdown.post_unlocks.amount / 100,
                formatted: financial.breakdown.post_unlocks.formatted,
            },
            {
                name: 'Wishlist',
                value: financial.breakdown.wishlist.amount / 100,
                formatted: financial.breakdown.wishlist.formatted,
            },
        ].filter((item) => item.value > 0);
    }, [financial?.breakdown]);

    // Format monthly revenue chart data
    const monthlyRevenueData = useMemo(() => {
        if (!financial?.monthly_revenue_chart) {
            return [];
        }

        return financial.monthly_revenue_chart.map((point) => ({
            ...point,
            period: new Date(point.period + '-01').toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
            }),
        }));
    }, [financial?.monthly_revenue_chart]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin · Dashboard" />

            <motion.div
                className="space-y-8 text-white"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.section
                    variants={cardVariants}
                    className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_-45px_rgba(249,115,22,0.35)]"
                >
                    <p className="text-xs tracking-[0.35em] text-white/50 uppercase">
                        Admin Control Center
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold">
                        {welcome?.name
                            ? `Welcome back, ${welcome.name}`
                            : 'Welcome back'}
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm text-white/70">
                        {welcome.message}
                    </p>
                </motion.section>

                {/* Global Stats Section */}
                {globalStats && (
                    <motion.section
                        variants={cardVariants}
                        className="space-y-4"
                    >
                        <h2 className="text-xl font-semibold text-white">
                            Platform Overview
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <motion.div
                                variants={cardVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex"
                            >
                                <Card className="flex w-full flex-col border-white/10 bg-white/5 text-white shadow-[0_24px_65px_-45px_rgba(14,116,144,0.35)] transition-all hover:border-amber-400/40 hover:shadow-[0_24px_65px_-45px_rgba(249,115,22,0.5)]">
                                    <CardHeader className="flex-shrink-0">
                                        <CardDescription className="text-xs tracking-[0.35em] text-white/55 uppercase">
                                            Total Users
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-semibold text-white">
                                            {globalStats.total_users.toLocaleString()}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <Users className="h-8 w-8 text-white/20" />
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                variants={cardVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex"
                            >
                                <Card className="flex w-full flex-col border-white/10 bg-white/5 text-white shadow-[0_24px_65px_-45px_rgba(14,116,144,0.35)] transition-all hover:border-amber-400/40 hover:shadow-[0_24px_65px_-45px_rgba(249,115,22,0.5)]">
                                    <CardHeader className="flex-shrink-0">
                                        <CardDescription className="text-xs tracking-[0.35em] text-white/55 uppercase">
                                            Total Posts
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-semibold text-white">
                                            {globalStats.total_posts.toLocaleString()}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <FileText className="h-8 w-8 text-white/20" />
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                variants={cardVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex"
                            >
                                <Card className="flex w-full flex-col border-white/10 bg-white/5 text-white shadow-[0_24px_65px_-45px_rgba(14,116,144,0.35)] transition-all hover:border-amber-400/40 hover:shadow-[0_24px_65px_-45px_rgba(249,115,22,0.5)]">
                                    <CardHeader className="flex-shrink-0">
                                        <CardDescription className="text-xs tracking-[0.35em] text-white/55 uppercase">
                                            Total Comments
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-semibold text-white">
                                            {globalStats.total_comments.toLocaleString()}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <MessageSquare className="h-8 w-8 text-white/20" />
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                variants={cardVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex"
                            >
                                <Card className="flex w-full flex-col border-white/10 bg-white/5 text-white shadow-[0_24px_65px_-45px_rgba(14,116,144,0.35)] transition-all hover:border-amber-400/40 hover:shadow-[0_24px_65px_-45px_rgba(249,115,22,0.5)]">
                                    <CardHeader className="flex-shrink-0">
                                        <CardDescription className="text-xs tracking-[0.35em] text-white/55 uppercase">
                                            Total Stories
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-semibold text-white">
                                            {globalStats.total_stories.toLocaleString()}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <Image className="h-8 w-8 text-white/20" />
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </motion.section>
                )}

                {/* Financial Overview Section */}
                {financial && (
                    <motion.section
                        variants={cardVariants}
                        className="space-y-4"
                    >
                        <h2 className="text-xl font-semibold text-white">
                            Financial Overview
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <motion.div
                                variants={cardVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex"
                            >
                                <Card className="flex w-full flex-col border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] text-white shadow-[0_24px_65px_-45px_rgba(14,116,144,0.35)] transition-all hover:border-amber-400/40 hover:shadow-[0_24px_65px_-45px_rgba(249,115,22,0.5)]">
                                    <CardHeader className="flex-shrink-0">
                                        <CardDescription className="text-xs tracking-[0.35em] text-white/55 uppercase">
                                            Revenue Today
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-semibold text-white">
                                            {financial.today.revenue.formatted}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-xs text-white/60">
                                            {financial.today.transactions}{' '}
                                            transactions
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                variants={cardVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex"
                            >
                                <Card className="flex w-full flex-col border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] text-white shadow-[0_24px_65px_-45px_rgba(14,116,144,0.35)] transition-all hover:border-amber-400/40 hover:shadow-[0_24px_65px_-45px_rgba(249,115,22,0.5)]">
                                    <CardHeader className="flex-shrink-0">
                                        <CardDescription className="line-clamp-2 text-xs tracking-[0.35em] text-white/55 uppercase">
                                            Memberships Sold (Month)
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-semibold text-white">
                                            {
                                                financial.this_month
                                                    .memberships_sold
                                            }
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        {formatTrend(
                                            financial.this_month.trend,
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                variants={cardVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex"
                            >
                                <Card className="flex w-full flex-col border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] text-white shadow-[0_24px_65px_-45px_rgba(14,116,144,0.35)] transition-all hover:border-amber-400/40 hover:shadow-[0_24px_65px_-45px_rgba(249,115,22,0.5)]">
                                    <CardHeader className="flex-shrink-0">
                                        <CardDescription className="text-xs tracking-[0.35em] text-white/55 uppercase">
                                            Active Subscriptions
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-semibold text-white">
                                            {
                                                financial.subscriptions
                                                    .active_count
                                            }
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-amber-200" />
                                            <p className="text-xs text-amber-200">
                                                MRR:{' '}
                                                {
                                                    financial.subscriptions.mrr
                                                        .formatted
                                                }
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                variants={cardVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex"
                            >
                                <Card className="flex w-full flex-col border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] text-white shadow-[0_24px_65px_-45px_rgba(14,116,144,0.35)] transition-all hover:border-amber-400/40 hover:shadow-[0_24px_65px_-45px_rgba(249,115,22,0.5)]">
                                    <CardHeader className="flex-shrink-0">
                                        <CardDescription className="text-xs tracking-[0.35em] text-white/55 uppercase">
                                            Net Revenue (Month)
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-semibold text-white">
                                            {
                                                financial.this_month.net_revenue
                                                    .formatted
                                            }
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        {formatTrend(
                                            financial.this_month.trend,
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </motion.section>
                )}

                {/* Charts Section */}
                {financial && (
                    <motion.section
                        variants={cardVariants}
                        className="grid gap-6 lg:grid-cols-4"
                    >
                        {/* Revenue Trend Chart */}
                        <motion.div
                            variants={cardVariants}
                            className="lg:col-span-3"
                        >
                            <Card className="border-white/10 bg-white/5 text-white">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">
                                        Revenue Trend (Last 6 Months)
                                    </CardTitle>
                                    <CardDescription className="text-white/65">
                                        Gross and net revenue over time
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {monthlyRevenueData.length > 0 ? (
                                        <ResponsiveContainer
                                            width="100%"
                                            height={300}
                                        >
                                            <AreaChart
                                                data={monthlyRevenueData}
                                            >
                                                <defs>
                                                    <linearGradient
                                                        id="colorGross"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1"
                                                    >
                                                        <stop
                                                            offset="5%"
                                                            stopColor={
                                                                CHART_COLORS.primary
                                                            }
                                                            stopOpacity={0.8}
                                                        />
                                                        <stop
                                                            offset="95%"
                                                            stopColor={
                                                                CHART_COLORS.primary
                                                            }
                                                            stopOpacity={0.1}
                                                        />
                                                    </linearGradient>
                                                    <linearGradient
                                                        id="colorNet"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1"
                                                    >
                                                        <stop
                                                            offset="5%"
                                                            stopColor={
                                                                CHART_COLORS.secondary
                                                            }
                                                            stopOpacity={0.8}
                                                        />
                                                        <stop
                                                            offset="95%"
                                                            stopColor={
                                                                CHART_COLORS.secondary
                                                            }
                                                            stopOpacity={0.1}
                                                        />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis
                                                    dataKey="period"
                                                    stroke="rgba(255,255,255,0.5)"
                                                    style={{
                                                        fontSize: '12px',
                                                    }}
                                                />
                                                <YAxis
                                                    stroke="rgba(255,255,255,0.5)"
                                                    style={{
                                                        fontSize: '12px',
                                                    }}
                                                    tickFormatter={(value) =>
                                                        `$${(
                                                            value / 1000
                                                        ).toFixed(0)}k`
                                                    }
                                                />
                                                <Tooltip
                                                    content={<CustomTooltip />}
                                                />
                                                <Legend
                                                    wrapperStyle={{
                                                        color: 'rgba(255,255,255,0.8)',
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="gross"
                                                    stroke={
                                                        CHART_COLORS.primary
                                                    }
                                                    strokeWidth={2}
                                                    fill="url(#colorGross)"
                                                    name="Gross Revenue"
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="net"
                                                    stroke={
                                                        CHART_COLORS.secondary
                                                    }
                                                    strokeWidth={2}
                                                    fill="url(#colorNet)"
                                                    name="Net Revenue"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-white/10 bg-black/20">
                                            <div className="rounded-full border border-white/15 bg-white/10 p-4">
                                                <DollarSign className="h-8 w-8 text-white/40" />
                                            </div>
                                            <p className="mt-4 text-sm font-medium text-white/60">
                                                No revenue data available
                                            </p>
                                            <p className="mt-1 text-xs text-white/40">
                                                Revenue data will appear here
                                                once payments are processed
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Revenue Breakdown Pie Chart */}
                        <motion.div
                            variants={cardVariants}
                            className="lg:col-span-1"
                        >
                            <Card className="border-white/10 bg-white/5 text-white">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">
                                        Revenue Breakdown
                                    </CardTitle>
                                    <CardDescription className="text-white/65">
                                        This month's revenue by source
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {revenueBreakdownData.length > 0 ? (
                                        <ResponsiveContainer
                                            width="100%"
                                            height={300}
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={revenueBreakdownData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={renderCustomLabel}
                                                    outerRadius={100}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {revenueBreakdownData.map(
                                                        (entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={
                                                                    PIE_COLORS[
                                                                        index %
                                                                            PIE_COLORS.length
                                                                    ]
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Pie>
                                                <Tooltip
                                                    content={({
                                                        active,
                                                        payload,
                                                    }) => {
                                                        if (
                                                            active &&
                                                            payload &&
                                                            payload.length
                                                        ) {
                                                            const data =
                                                                payload[0]
                                                                    .payload;
                                                            return (
                                                                <div className="rounded-lg border border-white/20 bg-black/90 p-3 shadow-lg backdrop-blur-sm">
                                                                    <p className="text-sm font-semibold text-white">
                                                                        {
                                                                            data.name
                                                                        }
                                                                    </p>
                                                                    <p className="text-xs text-white/70">
                                                                        {
                                                                            data.formatted
                                                                        }
                                                                    </p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Legend
                                                    wrapperStyle={{
                                                        color: 'rgba(255,255,255,0.8)',
                                                        fontSize: '12px',
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-[300px] items-center justify-center">
                                            <p className="text-sm text-white/50">
                                                No revenue breakdown data
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.section>
                )}

                {/* Content Moderation Section */}
                <motion.section variants={cardVariants} className="space-y-4">
                    <h2 className="text-xl font-semibold text-white">
                        Content Moderation
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {overview.map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                variants={cardVariants}
                                custom={index}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex"
                            >
                                <Card className="flex w-full flex-col border-white/10 bg-white/5 text-white shadow-[0_24px_65px_-45px_rgba(14,116,144,0.35)] transition-all hover:border-amber-400/40 hover:shadow-[0_24px_65px_-45px_rgba(249,115,22,0.5)]">
                                    <CardHeader className="flex-shrink-0">
                                        <CardDescription className="line-clamp-2 text-xs tracking-[0.35em] text-white/55 uppercase">
                                            {stat.label}
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-semibold text-white">
                                            {stat.value}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        {formatTrend(stat.trend) || (
                                            <p className="text-xs text-white/60">
                                                {stat.trend}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                <motion.div variants={cardVariants}>
                    <Card className="border-white/10 bg-white/5 text-white">
                        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <CardTitle className="text-lg font-semibold">
                                    Recent activity
                                </CardTitle>
                                <CardDescription className="text-white/65">
                                    What moderators and systems surfaced in the
                                    last day.
                                </CardDescription>
                            </div>
                            <Link href={admin.activityLog.index().url}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full border border-white/15 bg-white/5 px-4 text-xs text-white/75 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white"
                                >
                                    View full activity log
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        variants={itemVariants}
                                        custom={index}
                                        whileHover={{
                                            scale: 1.01,
                                            x: 4,
                                        }}
                                        className="rounded-2xl border border-white/10 bg-black/35 px-5 py-4 transition-all hover:border-amber-400/40 hover:bg-white/10"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h3 className="text-base font-semibold text-white">
                                                {item.title}
                                            </h3>
                                            <span className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                                {item.timestamp}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm text-white/70">
                                            {item.summary}
                                        </p>
                                    </motion.div>
                                ))
                            ) : (
                                <p className="py-8 text-center text-sm text-white/50">
                                    No recent activity
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                    <Card className="border-white/10 bg-white/5 text-white">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">
                                Quick links
                            </CardTitle>
                            <CardDescription className="text-white/65">
                                Jump straight into the queues that need eyes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-3">
                                {quickLinks.map((link, index) => (
                                    <motion.div
                                        key={link.label}
                                        variants={itemVariants}
                                        custom={index}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Link
                                            href={
                                                link.disabled ? '#' : link.url
                                            }
                                            prefetch={!link.disabled}
                                            className="group flex h-full flex-col rounded-2xl border border-white/10 bg-black/30 p-4 transition-all hover:border-amber-400/40 hover:bg-white/10"
                                            aria-disabled={link.disabled}
                                        >
                                            <p className="text-sm font-semibold text-white group-aria-disabled:text-white/40">
                                                {link.label}
                                            </p>
                                            <p className="mt-2 text-xs text-white/65 group-aria-disabled:text-white/40">
                                                {link.description}
                                            </p>
                                            {link.disabled ? (
                                                <span className="mt-auto inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 pt-3 text-[0.65rem] tracking-[0.3em] text-white/40 uppercase">
                                                    Coming soon
                                                </span>
                                            ) : (
                                                <span className="mt-auto inline-flex items-center gap-2 pt-3 text-xs text-amber-200 transition-transform group-hover:translate-x-1">
                                                    Go to section
                                                    <span aria-hidden>→</span>
                                                </span>
                                            )}
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}
