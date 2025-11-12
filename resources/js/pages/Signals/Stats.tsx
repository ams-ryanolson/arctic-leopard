import { DualLineChart } from '@/components/signals/dual-line-chart';
import { MiniSparkline } from '@/components/signals/mini-sparkline';
import { RadialGauge } from '@/components/signals/radial-gauge';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type HeaderAction, type HeaderFilter, type HeaderQuickAction, type HeaderSupportLink } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowUpRight,
    BarChart3,
    Check,
    ShieldAlert,
    Sparkles,
    TimerReset,
} from 'lucide-react';

type AlertSeverity = 'hot' | 'urgent' | 'info';

type AlertItem = {
    id: string;
    title: string;
    body: string;
    timestamp: string;
    severity: AlertSeverity;
    type: string;
};

type MetricIntent = 'positive' | 'negative' | 'neutral';

type MetricCard = {
    id: string;
    label: string;
    value: string;
    delta: string;
    trend: number[];
    intent: MetricIntent;
};

type TimelineSeriesPoint = {
    label: string;
    value: number;
};

type TimelineSeries = {
    name: string;
    values: TimelineSeriesPoint[];
};

type TimelineAnnotation = {
    label: string;
    timestamp: string;
    body: string;
};

type ConsentTicket = {
    id: string;
    circle: string;
    submittedBy: string;
    submittedAt: string;
    status: 'awaiting-review' | 'investigating' | 'resolved';
    severity: 'low' | 'medium' | 'high';
};

type PayoutTransfer = {
    label: string;
    amount: number;
    status: 'scheduled' | 'requires-action';
};

type PayoutSummary = {
    nextPayoutDate: string;
    nextPayoutAmount: number;
    pendingTransfers: PayoutTransfer[];
    accountHealth: {
        status: 'attention' | 'healthy';
        messages: string[];
    };
};

type AutomationSuggestion = {
    id: string;
    title: string;
    description: string;
    impact: string;
};

interface SignalsStatsProps {
    alerts: AlertItem[];
    metrics: MetricCard[];
    monetizationTimeline: {
        series: TimelineSeries[];
        annotations: TimelineAnnotation[];
    };
    consentQueue: ConsentTicket[];
    payoutSummary: PayoutSummary;
    recommendedAutomations: AutomationSuggestion[];
}

const severityStyles: Record<AlertSeverity, string> = {
    urgent: 'border-rose-500/50 bg-rose-500/10 text-rose-100',
    hot: 'border-amber-400/60 bg-amber-500/10 text-amber-200',
    info: 'border-sky-500/50 bg-sky-500/10 text-sky-100',
};

const metricStroke: Record<MetricIntent, string> = {
    positive: 'rgba(134, 239, 172, 0.85)',
    negative: 'rgba(248, 113, 113, 0.8)',
    neutral: 'rgba(244, 244, 245, 0.85)',
};

const metricFill: Record<MetricIntent, string> = {
    positive: 'rgba(34, 197, 94, 0.25)',
    negative: 'rgba(248, 113, 113, 0.22)',
    neutral: 'rgba(244, 244, 245, 0.18)',
};

const consentSeverityBadge: Record<ConsentTicket['severity'], string> = {
    high: 'border-rose-500/50 bg-rose-500/10 text-rose-100',
    medium: 'border-amber-400/50 bg-amber-400/10 text-amber-200',
    low: 'border-sky-500/50 bg-sky-500/10 text-sky-100',
};

const statusCopy: Record<ConsentTicket['status'], string> = {
    'awaiting-review': 'Awaiting review',
    investigating: 'Investigating',
    resolved: 'Resolved',
};

function formatRelativeTime(timestamp: string): string {
    const now = Date.now();
    const value = new Date(timestamp).getTime();
    const diff = Math.max(now - value, 0);
    const minutes = Math.round(diff / 60000);

    if (minutes < 1) {
        return 'Just now';
    }

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.round(hours / 24);
    return `${days}d ago`;
}

function formatCurrency(value: number): string {
    return Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
}

export default function SignalsStatsPage({
    alerts,
    metrics,
    monetizationTimeline,
    consentQueue,
    payoutSummary,
    recommendedAutomations,
}: SignalsStatsProps) {
    const requiresActionShare =
        payoutSummary.pendingTransfers.filter((transfer) => transfer.status === 'requires-action').length /
        Math.max(payoutSummary.pendingTransfers.length, 1);
    const payoutHealthScore = Math.max(
        35,
        Math.round(100 - requiresActionShare * 40 - (payoutSummary.accountHealth.status === 'attention' ? 20 : 0)),
    );
    const headerActions: HeaderAction[] = [
        {
            id: 'launch-automation',
            label: 'Launch automation',
            icon: Sparkles,
            href: '/signals/settings',
            variant: 'primary',
        },
        {
            id: 'open-safety-ops',
            label: 'Safety operations',
            icon: ShieldAlert,
            href: '/signals/compliance',
            variant: 'secondary',
        },
        {
            id: 'review-playbooks',
            label: 'Playbooks',
            icon: BarChart3,
            href: '/signals/settings?tab=playbooks',
            variant: 'ghost',
        },
    ];

    const headerFilters: HeaderFilter[] = [
        {
            id: 'timeframe',
            label: 'Window',
            value: 'Last 24 hours',
            options: [
                { label: '4 hours', value: '4h' },
                { label: '24 hours', value: '24h' },
                { label: '7 days', value: '7d' },
            ],
        },
        {
            id: 'segment',
            label: 'Segment',
            value: 'All circles',
            options: [
                { label: 'All circles', value: 'all' },
                { label: 'Edge Guardians', value: 'edge-guardians' },
                { label: 'Wax Alchemy', value: 'wax-alchemy' },
            ],
        },
    ];

    const headerQuickActions: HeaderQuickAction[] = recommendedAutomations.slice(0, 3).map((automation) => ({
        id: automation.id,
        title: automation.title,
        description: automation.description,
        badge: automation.impact,
        href: '/signals/settings',
        icon: Sparkles,
    }));

    const headerSupportLinks: HeaderSupportLink[] = [
        {
            id: 'support-consent',
            label: 'Consent guides',
            href: '/signals/compliance?view=guides',
            icon: ShieldAlert,
        },
        {
            id: 'support-automations',
            label: 'Automation studio',
            href: '/signals/settings?view=automations',
            icon: Sparkles,
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Signals', href: '/signals' },
                { title: 'Stats', href: '/signals/stats' },
            ]}
            headerActions={headerActions}
            headerFilters={headerFilters}
            headerQuickActions={headerQuickActions}
            headerSupportLinks={headerSupportLinks}
        >
            <Head title="Signals · Stats" />

            <div className="space-y-8 text-white">
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((metric) => (
                        <Card
                            key={metric.id}
                            className={cn(
                                'relative overflow-hidden border-white/10 bg-white/5 backdrop-blur',
                                metric.intent === 'negative' && 'border-rose-500/35 bg-rose-500/5',
                                metric.intent === 'positive' && 'border-emerald-400/35 bg-emerald-400/5',
                            )}
                        >
                            <CardHeader className="space-y-2">
                                <CardDescription className="text-xs uppercase tracking-[0.35em] text-white/50">
                                    {metric.label}
                                </CardDescription>
                                <div className="flex items-baseline gap-3">
                                    <CardTitle className="text-3xl font-semibold">{metric.value}</CardTitle>
                                    <Badge className="rounded-full border-white/15 bg-white/10 text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
                                        {metric.delta}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="-mt-2">
                                <MiniSparkline
                                    values={metric.trend}
                                    stroke={metricStroke[metric.intent]}
                                    fill={metricFill[metric.intent]}
                                    className="h-16 w-full"
                                />
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div className="space-y-6">
                        <Card className="border-white/10 bg-white/5">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-2xl font-semibold">Live signals</CardTitle>
                                <CardDescription className="text-white/60">
                                    Priority alerts from monetization, moderation, and compliance pipelines.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {alerts.map((alert) => (
                                    <article
                                        key={alert.id}
                                        className={cn(
                                            'rounded-2xl border px-4 py-4 transition',
                                            severityStyles[alert.severity],
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2 text-[0.6rem] uppercase tracking-[0.35em]">
                                            <span>{formatRelativeTime(alert.timestamp)}</span>
                                            <span className="flex items-center gap-1">
                                                {alert.severity === 'urgent' ? <AlertTriangle className="size-3" /> : null}
                                                {alert.type}
                                            </span>
                                        </div>
                                        <h2 className="mt-3 text-lg font-semibold">{alert.title}</h2>
                                        <p className="mt-2 text-sm text-white/80">{alert.body}</p>
                                    </article>
                                ))}
                            </CardContent>
                            <CardFooter className="flex items-center justify-between text-xs text-white/50">
                                <span className="flex items-center gap-2">
                                    <span className="inline-flex size-2 rounded-full bg-rose-400/80" />
                                    Urgent
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="inline-flex size-2 rounded-full bg-amber-300/80" />
                                    Hot
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="inline-flex size-2 rounded-full bg-sky-300/80" />
                                    Info
                                </span>
                            </CardFooter>
                        </Card>

                        <Card className="border-white/10 bg-white/5">
                            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <CardTitle className="text-xl font-semibold">Monetization timeline</CardTitle>
                                    <CardDescription className="text-white/60">
                                        Real-time conversion velocity across tips and subscriptions.
                                    </CardDescription>
                                </div>
                                {monetizationTimeline.annotations.map((annotation) => (
                                    <Badge
                                        key={annotation.label}
                                        className="rounded-full border-amber-400/40 bg-amber-400/10 text-[0.65rem] uppercase tracking-[0.3em] text-amber-100"
                                    >
                                        {annotation.label}
                                    </Badge>
                                ))}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                                    <DualLineChart series={monetizationTimeline.series} />
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-white/65">
                                    {monetizationTimeline.series.map((series, index) => (
                                        <span key={series.name} className="inline-flex items-center gap-2">
                                            <span
                                                className={cn('inline-flex size-2 rounded-full', {
                                                    'bg-amber-400': index === 0,
                                                    'bg-sky-300': index === 1,
                                                    'bg-emerald-300': index === 2,
                                                })}
                                            />
                                            {series.name}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-white/10 bg-white/5">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-semibold">Consent & safety queue</CardTitle>
                                <CardDescription className="text-white/60">
                                    Every flag with time-sensitive follow-up and assigned owner.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {consentQueue.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="rounded-2xl border border-white/10 bg-black/30 p-4 shadow-[0_18px_38px_-30px_rgba(250,113,182,0.4)]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                                                    {ticket.circle}
                                                </p>
                                                <h3 className="mt-2 text-base font-semibold text-white">
                                                    {statusCopy[ticket.status]}
                                                </h3>
                                                <p className="mt-1 text-sm text-white/70">
                                                    Submitted by {ticket.submittedBy} · {formatRelativeTime(ticket.submittedAt)}
                                                </p>
                                            </div>
                                            <Badge className={cn('rounded-full px-3 py-1 text-xs font-medium', consentSeverityBadge[ticket.severity])}>
                                                {ticket.severity.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                            <CardFooter className="justify-end">
                                <Link
                                    className="flex items-center gap-2 text-sm text-amber-200 hover:text-amber-100"
                                    href="/signals/compliance"
                                    prefetch
                                >
                                    Open safety console
                                    <ArrowUpRight className="size-4" />
                                </Link>
                            </CardFooter>
                        </Card>

                        <Card className="border-white/10 bg-white/5">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-semibold">Payout pipeline</CardTitle>
                                <CardDescription className="text-white/60">
                                    Upcoming transfers, treasury tasks, and account health indicators.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Next payout</p>
                                        <h3 className="mt-2 text-2xl font-semibold text-white">
                                            {formatCurrency(payoutSummary.nextPayoutAmount)}
                                        </h3>
                                        <p className="text-sm text-white/70">
                                            Scheduled for{' '}
                                            {new Date(payoutSummary.nextPayoutDate).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    <div className="mx-auto">
                                        <RadialGauge value={payoutHealthScore} label="Health" size={110} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Pending transfers</p>
                                    <div className="space-y-2">
                                        {payoutSummary.pendingTransfers.map((transfer) => (
                                            <div
                                                key={transfer.label}
                                                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm"
                                            >
                                                <div>
                                                    <p className="font-medium text-white">{transfer.label}</p>
                                                    <p className="text-xs text-white/60">
                                                        {transfer.status === 'requires-action' ? 'Requires confirmation' : 'Scheduled'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-white/80">{formatCurrency(transfer.amount)}</span>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'rounded-full border-white/15 bg-white/5 text-[0.65rem] uppercase tracking-[0.3em]',
                                                            transfer.status === 'requires-action'
                                                                ? 'border-rose-500/50 bg-rose-500/10 text-rose-100'
                                                                : 'border-emerald-400/35 bg-emerald-400/10 text-emerald-100',
                                                        )}
                                                    >
                                                        {transfer.status === 'requires-action' ? 'Action' : 'Ready'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Account health</p>
                                    <ul className="space-y-2 text-sm text-white/70">
                                        {payoutSummary.accountHealth.messages.map((message) => (
                                            <li key={message} className="flex items-start gap-2">
                                                <Check className="mt-0.5 size-4 text-emerald-300" />
                                                <span>{message}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end">
                                <Link
                                    className="flex items-center gap-2 text-sm text-sky-200 hover:text-sky-100"
                                    href="/signals/payouts"
                                    prefetch
                                >
                                    Open treasury view
                                    <ArrowUpRight className="size-4" />
                                </Link>
                            </CardFooter>
                        </Card>
                    </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_35px_85px_-50px_rgba(249,115,22,0.6)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-white">Recommended automations</h2>
                            <p className="text-sm text-white/70">
                                Queue high-impact flows to capitalize on the live signals before momentum cools.
                            </p>
                        </div>
                        <Badge className="flex items-center gap-2 rounded-full border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70">
                            <TimerReset className="size-4" />
                            Generated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Badge>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {recommendedAutomations.map((automation) => (
                            <div
                                key={automation.id}
                                className="group relative flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-black/25 p-5 transition hover:border-amber-400/45 hover:bg-white/5"
                            >
                                <div className="space-y-3">
                                    <Badge className="rounded-full border-white/10 bg-white/10 text-[0.65rem] uppercase tracking-[0.3em] text-white/60">
                                        {automation.impact}
                                    </Badge>
                                    <h3 className="text-lg font-semibold text-white">{automation.title}</h3>
                                    <p className="text-sm text-white/70">{automation.description}</p>
                                </div>
                                <Link
                                    href="/signals/settings"
                                    prefetch
                                    className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-amber-200 transition group-hover:text-amber-100"
                                >
                                    Launch playbook
                                    <ArrowUpRight className="size-4" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <h2 className="text-lg font-semibold text-white">Demo storyline</h2>
                    <p className="mt-2 text-sm text-white/70">
                        Walk stakeholders through the live operations arc without leaving Signals.
                    </p>
                    <ol className="mt-4 space-y-3 text-sm text-white/75">
                        <li className="flex items-start gap-2">
                            <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-semibold">
                                1
                            </span>
                            Start in the alert rail to acknowledge the Breath Control Lab escalation and open the compliance console.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-semibold">
                                2
                            </span>
                            Pivot into Monetization → tip train surge and launch the suggested thank-you loop automation.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-semibold">
                                3
                            </span>
                            Wrap in Tasks & Playbooks to assign the moderator follow-up and confirm payout readiness on treasury.
                        </li>
                    </ol>
                </section>
            </div>
        </AppLayout>
    );
}


