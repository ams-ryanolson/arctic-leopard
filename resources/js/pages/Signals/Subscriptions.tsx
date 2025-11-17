import { ActionBanner } from '@/components/signals/action-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import {
    type HeaderAction,
    type HeaderFilter,
    type HeaderQuickAction,
} from '@/types';
import { Head } from '@inertiajs/react';
import {
    Calendar,
    FileSpreadsheet,
    Plus,
    ShieldAlert,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';

type CohortStat = {
    month: string;
    newSubscribers: number;
    retention: number;
    arpu: number;
};

type FunnelStage = {
    stage: string;
    value: number;
    delta: string;
};

type SubscriptionEvent = {
    id: string;
    type: 'upgrade' | 'downgrade' | 'new';
    member: string;
    plan: string;
    value: number;
    occurredAt: string;
};

type QuickAction = {
    id: string;
    label: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
};

type SubscriptionPlan = {
    id: string;
    name: string;
    price: string;
    members: number;
    status: 'active' | 'draft' | 'archived';
    visibility: string;
};

type PlanFormDefinition = {
    defaults: {
        name: string;
        price: number;
        currency: string;
        billingCadence: string;
        visibility: string;
        description: string;
        perks: string[];
    };
    cadenceOptions: string[];
    visibilityOptions: Array<{ label: string; value: string }>;
};

interface SubscriptionsPageProps {
    plans: SubscriptionPlan[];
    planForm: PlanFormDefinition;
    cohorts: CohortStat[];
    churnFunnel: FunnelStage[];
    recentEvents: SubscriptionEvent[];
    quickActions: QuickAction[];
}

const actionSeverityStyles: Record<QuickAction['severity'], string> = {
    high: 'rose',
    medium: 'amber',
    low: 'sky',
};

const planStatusStyles: Record<SubscriptionPlan['status'], string> = {
    active: 'bg-emerald-400/10 border-emerald-400/30 text-emerald-200',
    draft: 'bg-amber-300/10 border-amber-300/30 text-amber-200',
    archived: 'bg-white/5 border-white/10 text-white/60',
};

const eventCopy: Record<
    SubscriptionEvent['type'],
    { label: string; tone: string }
> = {
    upgrade: { label: 'Upgrade', tone: 'text-emerald-300' },
    downgrade: { label: 'Downgrade', tone: 'text-rose-300' },
    new: { label: 'New subscriber', tone: 'text-sky-200' },
};

function formatCurrency(value: number): string {
    return Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value);
}

export default function SubscriptionsPage({
    plans,
    planForm,
    cohorts,
    churnFunnel,
    recentEvents,
    quickActions,
}: SubscriptionsPageProps) {
    const headerActions: HeaderAction[] = [
        {
            id: 'create-plan',
            label: 'Create plan',
            icon: Plus,
            href: '/signals/settings?view=plans',
            variant: 'primary',
        },
        {
            id: 'build-drip',
            label: 'Build drip',
            icon: Calendar,
            href: '/signals/settings?lane=inbox',
            variant: 'secondary',
        },
    ];

    const headerFilters: HeaderFilter[] = [
        {
            id: 'plan',
            label: 'Plan',
            value: 'All tiers',
            options: [
                { label: 'All tiers', value: 'all' },
                { label: 'Founders Circle', value: 'founders' },
                { label: 'Edge Guardians', value: 'edge' },
            ],
        },
    ];

    const headerQuickActions: HeaderQuickAction[] = quickActions
        .slice(0, 2)
        .map((action) => ({
            id: action.id,
            title: action.label,
            description: action.description,
            icon:
                action.severity === 'high'
                    ? TrendingDown
                    : action.severity === 'medium'
                      ? TrendingUp
                      : FileSpreadsheet,
            badge: action.severity.toUpperCase(),
            href: '/signals/settings',
        }));

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Signals', href: '/signals' },
                { title: 'Subscriptions', href: '/signals/subscriptions' },
            ]}
            headerActions={headerActions}
            headerFilters={headerFilters}
            headerQuickActions={headerQuickActions}
        >
            <Head title="Signals · Subscriptions" />

            <div className="space-y-8 text-white">
                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader className="flex items-start justify-between gap-4">
                            <div>
                                <CardTitle className="text-2xl font-semibold">
                                    Plan catalog
                                </CardTitle>
                                <CardDescription className="text-white/60">
                                    Manage active tiers, invite-only rituals,
                                    and draft offerings.
                                </CardDescription>
                            </div>
                            <Button
                                size="sm"
                                className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-white"
                            >
                                <Plus className="mr-2 size-4" />
                                New tier
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-hidden rounded-2xl border border-white/10">
                                <table className="min-w-full divide-y divide-white/10 text-sm">
                                    <thead className="bg-black/30 text-xs tracking-[0.3em] text-white/50 uppercase">
                                        <tr>
                                            <th className="px-4 py-3 text-left">
                                                Plan
                                            </th>
                                            <th className="px-4 py-3 text-left">
                                                Price
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Members
                                            </th>
                                            <th className="px-4 py-3 text-left">
                                                Visibility
                                            </th>
                                            <th className="px-4 py-3 text-left">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10 bg-black/20">
                                        {plans.map((plan) => (
                                            <tr key={plan.id}>
                                                <td className="px-4 py-3 font-medium text-white">
                                                    {plan.name}
                                                </td>
                                                <td className="px-4 py-3 text-white/70">
                                                    {plan.price}
                                                </td>
                                                <td className="px-4 py-3 text-right text-white/70">
                                                    {plan.members.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-white/60">
                                                    {plan.visibility}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center rounded-full border px-2.5 py-1 text-[0.65rem] tracking-[0.3em] uppercase',
                                                            planStatusStyles[
                                                                plan.status
                                                            ],
                                                        )}
                                                    >
                                                        {plan.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-white/20 text-white/70"
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-white/60 hover:text-rose-200"
                                                        >
                                                            Archive
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">
                                Plan builder
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Preview the fields we’ll ask for when you create
                                or update a tier.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4 text-sm">
                                <div className="grid gap-3">
                                    <Label
                                        htmlFor="plan-name"
                                        className="text-xs tracking-[0.3em] text-white/50 uppercase"
                                    >
                                        Tier name
                                    </Label>
                                    <Input
                                        id="plan-name"
                                        defaultValue={planForm.defaults.name}
                                        className="border-white/15 bg-black/30 text-white placeholder:text-white/40"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-3">
                                        <Label
                                            htmlFor="plan-price"
                                            className="text-xs tracking-[0.3em] text-white/50 uppercase"
                                        >
                                            Price ({planForm.defaults.currency})
                                        </Label>
                                        <Input
                                            id="plan-price"
                                            type="number"
                                            defaultValue={
                                                planForm.defaults.price
                                            }
                                            className="border-white/15 bg-black/30 text-white placeholder:text-white/40"
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label
                                            htmlFor="plan-cadence"
                                            className="text-xs tracking-[0.3em] text-white/50 uppercase"
                                        >
                                            Billing cadence
                                        </Label>
                                        <select
                                            id="plan-cadence"
                                            defaultValue={
                                                planForm.defaults.billingCadence
                                            }
                                            className="h-10 rounded-md border border-white/15 bg-black/30 px-3 text-sm text-white"
                                        >
                                            {planForm.cadenceOptions.map(
                                                (option) => (
                                                    <option
                                                        key={option}
                                                        value={option}
                                                    >
                                                        {option}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    <Label
                                        htmlFor="plan-visibility"
                                        className="text-xs tracking-[0.3em] text-white/50 uppercase"
                                    >
                                        Visibility
                                    </Label>
                                    <select
                                        id="plan-visibility"
                                        defaultValue={
                                            planForm.defaults.visibility
                                        }
                                        className="h-10 rounded-md border border-white/15 bg-black/30 px-3 text-sm text-white"
                                    >
                                        {planForm.visibilityOptions.map(
                                            (option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>
                                <div className="grid gap-3">
                                    <Label
                                        htmlFor="plan-description"
                                        className="text-xs tracking-[0.3em] text-white/50 uppercase"
                                    >
                                        Description
                                    </Label>
                                    <textarea
                                        id="plan-description"
                                        defaultValue={
                                            planForm.defaults.description
                                        }
                                        className="min-h-28 rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40"
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                        Perks preview
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {planForm.defaults.perks.map((perk) => (
                                            <span
                                                key={perk}
                                                className="rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs text-white/70"
                                            >
                                                {perk}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full rounded-full border-white/20 text-white/80 hover:border-white/40 hover:text-white"
                                >
                                    Save draft (mock)
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-2xl font-semibold">
                                Cohort compasses
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Track new joins, retention, and ARPU uplift per
                                monthly cohort.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            {cohorts.map((cohort) => (
                                <div
                                    key={cohort.month}
                                    className="rounded-2xl border border-white/10 bg-black/30 p-4 shadow-[0_18px_60px_-45px_rgba(59,130,246,0.65)]"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs tracking-[0.35em] text-white/50 uppercase">
                                            {cohort.month}
                                        </p>
                                        <Badge className="rounded-full border-emerald-400/35 bg-emerald-400/10 text-[0.65rem] tracking-[0.3em] text-emerald-100 uppercase">
                                            {Math.round(cohort.retention * 100)}
                                            % retention
                                        </Badge>
                                    </div>
                                    <h3 className="mt-3 text-3xl font-semibold text-white">
                                        {cohort.newSubscribers.toLocaleString()}
                                    </h3>
                                    <p className="text-sm text-white/70">
                                        New subscribers
                                    </p>
                                    <div className="mt-4 flex items-center justify-between text-sm">
                                        <span className="text-white/70">
                                            ARPU
                                        </span>
                                        <span className="font-semibold text-white">
                                            {formatCurrency(cohort.arpu)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">
                                Churn funnel
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Current journey to drop-off with real-time delta
                                indicators.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {churnFunnel.map((stage, index) => (
                                <div key={stage.stage}>
                                    <div className="flex items-center justify-between text-sm text-white/60">
                                        <span className="tracking-[0.25em] text-white/50 uppercase">
                                            {stage.stage}
                                        </span>
                                        <span className="flex items-center gap-2 text-white">
                                            <span className="text-lg font-semibold">
                                                {stage.value}%
                                            </span>
                                            <Badge className="rounded-full border-white/15 bg-white/10 text-[0.65rem] tracking-[0.3em] text-white/70 uppercase">
                                                {stage.delta}
                                            </Badge>
                                        </span>
                                    </div>
                                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className={cn(
                                                'h-full rounded-full transition',
                                                index === 0 &&
                                                    'bg-emerald-400/80',
                                                index === 1 &&
                                                    'bg-amber-400/80',
                                                index === 2 && 'bg-rose-400/80',
                                            )}
                                            style={{ width: `${stage.value}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">
                                Recent subscription activity
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Latest upgrades, downgrades, and new conversions
                                flowing in.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                                >
                                    <div>
                                        <p
                                            className={cn(
                                                'font-semibold text-white',
                                                eventCopy[event.type].tone,
                                            )}
                                        >
                                            {eventCopy[event.type].label}
                                        </p>
                                        <p className="text-white/70">
                                            {event.member} · {event.plan}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-white">
                                            {formatCurrency(event.value)}
                                        </p>
                                        <p className="text-xs text-white/60">
                                            {new Date(
                                                event.occurredAt,
                                            ).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">
                                Quick actions
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                High-leverage nudges generated from churn and
                                cohort insights.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {quickActions.map((action) => (
                                <ActionBanner
                                    key={action.id}
                                    title={action.label}
                                    description={action.description}
                                    tone={
                                        actionSeverityStyles[
                                            action.severity
                                        ] as 'rose' | 'amber' | 'sky'
                                    }
                                    icon={
                                        action.severity === 'high'
                                            ? ShieldAlert
                                            : action.severity === 'medium'
                                              ? TrendingUp
                                              : FileSpreadsheet
                                    }
                                    href="/signals/settings"
                                    actionLabel="Queue follow-up"
                                />
                            ))}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
