import { MiniSparkline } from '@/components/signals/mini-sparkline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type HeaderAction, type HeaderFilter, type HeaderQuickAction } from '@/types';
import { Head } from '@inertiajs/react';
import { useMemo } from 'react';
import { Globe, Group, Radar, Users } from 'lucide-react';

type GrowthSeries = {
    name: string;
    values: number[];
};

type GrowthData = {
    labels: string[];
    series: GrowthSeries[];
};

type EngagementPoint = {
    circle: string;
    x: number;
    y: number;
    size: number;
};

type CircleLoad = {
    name: string;
    members: number;
    moderators: number;
    capacity: number;
};

type ModerationMetric = {
    name: string;
    value: number;
    unit?: string;
    threshold: number;
};

interface AudiencePageProps {
    growth: GrowthData;
    engagementScatter: EngagementPoint[];
    circleLoad: CircleLoad[];
    moderationLoad: ModerationMetric[];
}

export default function AudiencePage({ growth, engagementScatter, circleLoad, moderationLoad }: AudiencePageProps) {
    const headerActions: HeaderAction[] = [
        {
            id: 'launch-pulse',
            label: 'Launch pulse survey',
            icon: Radar,
            href: '/signals/audience',
            variant: 'primary',
        },
        {
            id: 'assign-moderators',
            label: 'Rebalance moderators',
            icon: Users,
            href: '/signals/settings',
            variant: 'secondary',
        },
    ];

    const headerFilters: HeaderFilter[] = [
        {
            id: 'segment',
            label: 'Segment',
            value: 'Global view',
            options: [
                { label: 'Global view', value: 'global' },
                { label: 'Top circles', value: 'top' },
                { label: 'New joiners', value: 'new' },
            ],
        },
    ];

    const headerQuickActions: HeaderQuickAction[] = [
        {
            id: 'create-welcome-flow',
            title: 'Create welcome flow',
            description: 'Personalize first week experience for new circle members.',
            icon: Globe,
            badge: 'Growth',
            href: '/signals/settings?view=automations',
        },
        {
            id: 'schedule-townhall',
            title: 'Schedule live townhall',
            description: 'Align community energy around next rigging release.',
            icon: Group,
            badge: 'Engagement',
            href: '/signals/settings?view=notifications',
        },
    ];

    const maxMembers = useMemo(() => Math.max(...circleLoad.map((circle) => circle.members)), [circleLoad]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Signals', href: '/signals' },
                { title: 'Audience', href: '/signals/audience' },
            ]}
            headerActions={headerActions}
            headerFilters={headerFilters}
            headerQuickActions={headerQuickActions}
        >
            <Head title="Signals · Audience" />

            <div className="space-y-8 text-white">
                <section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-2xl font-semibold">Growth trajectories</CardTitle>
                            <CardDescription className="text-white/60">
                                Follow weekly velocity across follower and active-member segments.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {growth.series.map((series, index) => (
                                <div key={series.name} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-white">{series.name}</p>
                                        <span className="text-xs uppercase tracking-[0.25em] text-white/50">
                                            {growth.labels.at(-1)}
                                        </span>
                                    </div>
                                    <MiniSparkline
                                        values={series.values}
                                        stroke={index === 0 ? 'rgba(56,189,248,0.9)' : 'rgba(167,243,208,0.9)'}
                                        fill={index === 0 ? 'rgba(56,189,248,0.25)' : 'rgba(16,185,129,0.22)'}
                                        className="mt-3 h-16 w-full"
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Engagement scatter</CardTitle>
                            <CardDescription className="text-white/60">
                                High energy circles plotted by responsiveness and session volume.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative h-64 rounded-2xl border border-white/10 bg-gradient-to-br from-black/20 via-black/10 to-black/30">
                                <div className="absolute inset-0">
                                    {engagementScatter.map((point) => (
                                        <span
                                            key={point.circle}
                                            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/20 text-[0.6rem] font-semibold text-white/80 backdrop-blur"
                                            style={{
                                                left: `${point.x}%`,
                                                top: `${100 - point.y}%`,
                                                width: `${point.size}px`,
                                                height: `${point.size}px`,
                                            }}
                                        >
                                            {point.circle.split(' ').at(0)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
                                <span>Responsiveness</span>
                                <span>Session velocity</span>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Circle load</CardTitle>
                            <CardDescription className="text-white/60">
                                Capacity and staffing overview to avoid moderator burnout.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {circleLoad.map((circle) => (
                                <div key={circle.name} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                        <div>
                                            <p className="font-semibold text-white">{circle.name}</p>
                                            <p className="text-xs text-white/60">
                                                {circle.members.toLocaleString()} members · {circle.moderators} moderators
                                            </p>
                                        </div>
                                        <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                                            {(circle.capacity * 100).toFixed(0)}% capacity
                                        </span>
                                    </div>
                                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className={cn(
                                                'h-full rounded-full',
                                                circle.capacity > 0.8
                                                    ? 'bg-rose-400/80'
                                                    : circle.capacity > 0.65
                                                      ? 'bg-amber-300/80'
                                                      : 'bg-emerald-300/80',
                                            )}
                                            style={{ width: `${circle.capacity * 100}%` }}
                                        />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                                        <span>
                                            Moderators per 100 members:{' '}
                                            {(circle.moderators / (circle.members / 100)).toFixed(1)}
                                        </span>
                                        <span>Peak load: {Math.round((circle.members / maxMembers) * 100)}th percentile</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Moderation radar</CardTitle>
                            <CardDescription className="text-white/60">
                                Core stability metrics versus operational thresholds.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {moderationLoad.map((metric) => {
                                const ratio = Math.min(metric.value / metric.threshold, 1);
                                return (
                                    <div key={metric.name} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <p className="font-semibold text-white">{metric.name}</p>
                                            <span className="text-white/70">
                                                {metric.value}
                                                {metric.unit ? ` ${metric.unit}` : ''}
                                            </span>
                                        </div>
                                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                                            <div
                                                className={cn(
                                                    'h-full rounded-full',
                                                    ratio > 1
                                                        ? 'bg-rose-400/80'
                                                        : ratio > 0.75
                                                          ? 'bg-amber-400/80'
                                                          : 'bg-emerald-300/80',
                                                )}
                                                style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-white/60">
                                            Threshold {metric.threshold}
                                            {metric.unit ? ` ${metric.unit}` : ''}
                                        </p>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}


