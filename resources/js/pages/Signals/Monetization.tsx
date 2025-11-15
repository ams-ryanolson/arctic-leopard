import { SegmentedControl } from '@/components/signals/segmented-control';
import { ActionBanner } from '@/components/signals/action-banner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type HeaderAction, type HeaderFilter, type HeaderQuickAction } from '@/types';
import { Head } from '@inertiajs/react';
import { Flame, Gauge, LineChart, ListPlus, Rocket, ShoppingBag, Target, Trophy } from 'lucide-react';
import { Fragment, useState } from 'react';

type TipTrain = {
    id: string;
    name: string;
    status: 'live' | 'peaking' | 'scheduled';
    goal: string;
    progress: number;
    match: string;
    contributors: number;
    lift: string;
};

type WishlistItem = {
    id: string;
    title: string;
    goal: string;
    progress: number;
    status: string;
    description: string;
};

type RevenueHeatmap = {
    days: string[];
    hours: string[];
    values: number[][];
};

type Supporter = {
    name: string;
    avatar: string;
    lifetimeValue: number;
    lastContribution: string;
};

type ProductSlice = {
    product: string;
    share: number;
    mrr: number;
};

type TipActivity = {
    summary: {
        dailyTotal: string;
        averageTip: string;
        largestTip: string;
    };
    recent: Array<{
        supporter: string;
        amount: string;
        message: string;
        occurredAt: string;
    }>;
};

type CampaignFormDefinition = {
    defaults: {
        name: string;
        goal: number;
        startAt: string;
        duration: string;
        match: string;
        benefits: string[];
    };
};

interface MonetizationPageProps {
    tipTrains: TipTrain[];
    wishlist: WishlistItem[];
    tipActivity: TipActivity;
    revenueHeatmap: RevenueHeatmap;
    topSupporters: Supporter[];
    productBreakdown: ProductSlice[];
    campaignForm: CampaignFormDefinition;
}

const trainStatusStyles: Record<TipTrain['status'], string> = {
    live: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-100',
    peaking: 'border-amber-400/40 bg-amber-400/10 text-amber-100',
    scheduled: 'border-sky-400/40 bg-sky-400/10 text-sky-100',
};

function formatCurrency(value: number): string {
    return Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value);
}

export default function MonetizationPage({
    tipTrains,
    wishlist,
    tipActivity,
    revenueHeatmap,
    topSupporters,
    productBreakdown,
    campaignForm,
}: MonetizationPageProps) {
    const [selectedView, setSelectedView] = useState<'velocity' | 'conversion'>('velocity');

    const headerActions: HeaderAction[] = [
        {
            id: 'launch-train',
            label: 'Launch tip train',
            icon: Flame,
            href: '/signals/monetization',
            variant: 'primary',
        },
        {
            id: 'optimize-pricing',
            label: 'Tune pricing',
            icon: Gauge,
            href: '/signals/subscriptions',
            variant: 'secondary',
        },
    ];

    const headerFilters: HeaderFilter[] = [
        {
            id: 'window',
            label: 'Window',
            value: 'Today',
            options: [
                { label: 'Today', value: 'today' },
                { label: 'This week', value: 'week' },
                { label: 'This month', value: 'month' },
            ],
        },
    ];

    const headerQuickActions: HeaderQuickAction[] = [
        {
            id: 'reward-supporters',
            title: 'Reward top supporters',
            description: 'Queue custom gratitude drop for this week’s highest spenders.',
            icon: Trophy,
            badge: 'Retention',
            href: '/signals/settings?view=automations',
        },
        {
            id: 'wishlist-tutorial',
            title: 'Wishlist playbook',
            description: 'Learn how to stage limited wishlist drops with urgency.',
            icon: ShoppingBag,
            badge: 'Guide',
            href: '/signals/overview',
        },
    ];

    const maxHeatmapValue = Math.max(...revenueHeatmap.values.flat());

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Signals', href: '/signals' },
                { title: 'Monetization', href: '/signals/monetization' },
            ]}
            headerActions={headerActions}
            headerFilters={headerFilters}
            headerQuickActions={headerQuickActions}
        >
            <Head title="Signals · Monetization" />

            <div className="space-y-8 text-white">
                <section className="grid gap-6 xl:grid-cols-3">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader className="flex items-start justify-between gap-4">
                            <div>
                                <CardTitle className="text-2xl font-semibold">Tip trains</CardTitle>
                                <CardDescription className="text-white/60">
                                    Live velocity and match structure for each burst campaign.
                                </CardDescription>
                            </div>
                            <Button size="sm" className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-white">
                                <Rocket className="mr-2 size-4" />
                                New train
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {tipTrains.map((train) => (
                                <div key={train.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="text-lg font-semibold text-white">{train.name}</h3>
                                        <span
                                            className={cn(
                                                'rounded-full border px-3 py-1 text-xs uppercase tracking-[0.3em]',
                                                trainStatusStyles[train.status],
                                            )}
                                        >
                                            {train.status}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
                                        <span>
                                            Goal <strong className="text-white">{train.goal}</strong>
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <LineChart className="size-4 text-emerald-300" />
                                            {train.lift}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs uppercase tracking-[0.3em] text-white/50">
                                        {train.match}
                                    </div>
                                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500"
                                            style={{ width: `${Math.min(train.progress * 100, 100)}%` }}
                                        />
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                                        <span>{train.contributors.toLocaleString()} contributors</span>
                                        <Button variant="outline" size="sm" className="border-white/20 text-white/70">
                                            Edit
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader className="flex items-start justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-semibold">Wishlist manager</CardTitle>
                                <CardDescription className="text-white/60">
                                    Track funding progress and stage the next drop.
                                </CardDescription>
                            </div>
                            <Button size="sm" variant="outline" className="rounded-full border-white/25 text-white/80 hover:border-white/40">
                                <ListPlus className="mr-2 size-4" />
                                Add item
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {wishlist.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{item.title}</p>
                                            <p className="text-xs text-white/60">{item.description}</p>
                                        </div>
                                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                                        <span>Goal {item.goal}</span>
                                        <span>{Math.round(item.progress * 100)}% funded</span>
                                    </div>
                                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-amber-300 to-rose-400"
                                            style={{ width: `${Math.min(item.progress * 100, 100)}%` }}
                                        />
                                    </div>
                                    <div className="mt-3 flex items-center justify-end gap-2">
                                        <Button variant="outline" size="sm" className="border-white/20 text-white/70">
                                            Edit
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-white/60 hover:text-rose-200">
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <ActionBanner
                                title="Wishlist launch tutorial"
                                description="Walk through pacing, messaging, and fulfillment best practices before your next drop."
                                icon={ShoppingBag}
                                tone="sky"
                                href="/signals/overview"
                                actionLabel="View guide"
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Supporter spotlight</CardTitle>
                            <CardDescription className="text-white/60">
                                Lifetime contribution leaders and last engagement timestamp.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {topSupporters.map((supporter) => (
                                <div
                                    key={supporter.name}
                                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex size-12 overflow-hidden rounded-full border border-white/10 bg-white/10">
                                            <img src={supporter.avatar} alt={supporter.name} className="size-full object-cover" />
                                        </span>
                                        <div>
                                            <p className="font-semibold text-white">{supporter.name}</p>
                                            <p className="text-xs text-white/60">
                                                Last gift{' '}
                                                {new Date(supporter.lastContribution).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold text-emerald-200">
                                        {formatCurrency(supporter.lifetimeValue)}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Velocity vs conversion</CardTitle>
                            <CardDescription className="text-white/60">
                                Toggle between hourly heatmap and offer performance mix.
                            </CardDescription>
                            <SegmentedControl
                                options={[
                                    { id: 'velocity', label: 'Velocity', description: 'Live tips & subs' },
                                    { id: 'conversion', label: 'Conversion', description: 'Offers & MRR' },
                                ]}
                                selectedId={selectedView}
                                onSelect={(value) => setSelectedView(value as 'velocity' | 'conversion')}
                                className="mt-4"
                            />
                        </CardHeader>
                        <CardContent>
                            {selectedView === 'velocity' ? (
                                <div className="grid grid-cols-[auto_repeat(6,minmax(0,1fr))] gap-2 text-xs text-white/60">
                                    <div />
                                    {revenueHeatmap.hours.map((hour) => (
                                        <span key={hour} className="text-center uppercase tracking-[0.25em]">
                                            {hour}
                                        </span>
                                    ))}
                                    {revenueHeatmap.days.map((day, rowIndex) => (
                                        <Fragment key={day}>
                                            <span className="flex items-center justify-end pr-2 text-xs uppercase tracking-[0.2em]">
                                                {day}
                                            </span>
                                            {revenueHeatmap.values[rowIndex].map((value, columnIndex) => {
                                                const intensity = Math.round((value / maxHeatmapValue) * 100);
                                                return (
                                                    <span
                                                        key={`${day}-${columnIndex}`}
                                                        className="relative flex h-12 items-center justify-center rounded-lg border border-white/5 text-[0.65rem] text-white/70 transition"
                                                        style={{
                                                            backgroundColor: `rgba(249,115,22,${0.15 + intensity / 120})`,
                                                            backdropFilter: 'blur(24px)',
                                                        }}
                                                    >
                                                        {value}
                                                    </span>
                                                );
                                            })}
                                        </Fragment>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {productBreakdown.map((product) => (
                                        <div key={product.product}>
                                            <div className="flex items-center justify-between text-sm">
                                                <p className="font-medium text-white">{product.product}</p>
                                                <span className="text-white/70">{Math.round(product.share * 100)}%</span>
                                            </div>
                                            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-sky-400 via-amber-300 to-rose-400"
                                                    style={{ width: `${product.share * 100}%` }}
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-white/60">{formatCurrency(product.mrr)} MRR</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Tip activity</CardTitle>
                            <CardDescription className="text-white/60">
                                Snapshot of today’s momentum and latest contributor notes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
                                <p>Daily total: <span className="font-semibold text-white">{tipActivity.summary.dailyTotal}</span></p>
                                <p className="mt-1">Average tip: <span className="font-semibold text-white">{tipActivity.summary.averageTip}</span></p>
                                <p className="mt-1">Largest tip: <span className="font-semibold text-white">{tipActivity.summary.largestTip}</span></p>
                            </div>

                            <div className="space-y-3 text-sm text-white/70">
                                {tipActivity.recent.map((tip) => (
                                    <div key={`${tip.supporter}-${tip.amount}`} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-white">{tip.supporter}</p>
                                            <span className="text-emerald-200">{tip.amount}</span>
                                        </div>
                                        <p className="mt-2 text-xs text-white/60">“{tip.message}”</p>
                                        <p className="mt-3 text-xs uppercase tracking-[0.3em] text-white/50">
                                            {new Date(tip.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Campaign builder</CardTitle>
                            <CardDescription className="text-white/60">
                                Draft the next gratitude drive or limited time offer.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4 text-sm">
                                <div className="grid gap-3">
                                    <Label htmlFor="campaign-name" className="text-xs uppercase tracking-[0.3em] text-white/50">
                                        Campaign name
                                    </Label>
                                    <Input
                                        id="campaign-name"
                                        defaultValue={campaignForm.defaults.name}
                                        className="border-white/15 bg-black/30 text-white placeholder:text-white/40"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-3">
                                        <Label htmlFor="campaign-goal" className="text-xs uppercase tracking-[0.3em] text-white/50">
                                            Funding goal (USD)
                                        </Label>
                                        <Input
                                            id="campaign-goal"
                                            type="number"
                                            defaultValue={campaignForm.defaults.goal}
                                            className="border-white/15 bg-black/30 text-white placeholder:text-white/40"
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="campaign-duration" className="text-xs uppercase tracking-[0.3em] text-white/50">
                                            Duration
                                        </Label>
                                        <Input
                                            id="campaign-duration"
                                            defaultValue={campaignForm.defaults.duration}
                                            className="border-white/15 bg-black/30 text-white placeholder:text-white/40"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="campaign-start" className="text-xs uppercase tracking-[0.3em] text-white/50">
                                        Launch date
                                    </Label>
                                    <Input
                                        id="campaign-start"
                                        type="datetime-local"
                                        defaultValue={campaignForm.defaults.startAt.slice(0, 16)}
                                        className="border-white/15 bg-black/30 text-white placeholder:text-white/40"
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="campaign-match" className="text-xs uppercase tracking-[0.3em] text-white/50">
                                        Match incentive
                                    </Label>
                                    <Input
                                        id="campaign-match"
                                        defaultValue={campaignForm.defaults.match}
                                        className="border-white/15 bg-black/30 text-white placeholder:text-white/40"
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label className="text-xs uppercase tracking-[0.3em] text-white/50">
                                        Supporter benefits
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {campaignForm.defaults.benefits.map((benefit) => (
                                            <span
                                                key={benefit}
                                                className="rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs text-white/70"
                                            >
                                                {benefit}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full rounded-full border-white/20 text-white/80 hover:border-white/40 hover:text-white"
                                >
                                    Save plan (mock)
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Quick paths</CardTitle>
                            <CardDescription className="text-white/60">
                                Jump straight into automations or adjustments that move the needle today.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ActionBanner
                                title="Automate thank-you sequence"
                                description="Trigger DMs, aftercare audio, and bonus drops once tip trains hit milestones."
                                icon={Rocket}
                                tone="emerald"
                                href="/signals/settings"
                                actionLabel="Enable automation"
                            />
                            <ActionBanner
                                title="Run merch add-on"
                                description="Bundle a limited-run merch drop with the Wax Alchemy wishlist to increase average tip."
                                icon={Target}
                                tone="amber"
                                href="/signals/overview"
                                actionLabel="View playbook"
                            />
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}








