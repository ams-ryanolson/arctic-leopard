import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import admin from '@/routes/admin';
import { Head, Link } from '@inertiajs/react';

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

interface AdminDashboardProps {
    welcome: WelcomeMessage;
    overview: OverviewStat[];
    recentActivity: ActivityItem[];
    quickLinks: QuickLink[];
}

export default function AdminDashboard({
    welcome,
    overview,
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin · Dashboard" />

            <div className="space-y-8 text-white">
                <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_-45px_rgba(249,115,22,0.35)]">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">Admin Control Center</p>
                    <h1 className="mt-3 text-3xl font-semibold">
                        {welcome?.name ? `Welcome back, ${welcome.name}` : 'Welcome back'}
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm text-white/70">{welcome.message}</p>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    {overview.map((stat) => (
                        <Card
                            key={stat.label}
                            className="border-white/10 bg-white/5 text-white shadow-[0_24px_65px_-45px_rgba(14,116,144,0.35)]"
                        >
                            <CardHeader>
                                <CardDescription className="text-xs uppercase tracking-[0.35em] text-white/55">
                                    {stat.label}
                                </CardDescription>
                                <CardTitle className="text-2xl font-semibold text-white">{stat.value}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-emerald-200">{stat.trend}</p>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                    <Card className="border-white/10 bg-white/5 text-white">
                        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <CardTitle className="text-lg font-semibold">Recent activity</CardTitle>
                                <CardDescription className="text-white/65">
                                    What moderators and systems surfaced in the last day.
                                </CardDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full border border-white/15 bg-white/5 px-4 text-xs text-white/75 hover:border-white/30 hover:bg-white/10 hover:text-white"
                            >
                                View full activity log
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {recentActivity.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-2xl border border-white/10 bg-black/35 px-5 py-4 transition hover:border-amber-400/40 hover:bg-white/10"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="text-base font-semibold text-white">{item.title}</h3>
                                        <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                                            {item.timestamp}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm text-white/70">{item.summary}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5 text-white">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Quick links</CardTitle>
                            <CardDescription className="text-white/65">
                                Jump straight into the queues that need eyes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {quickLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.disabled ? '#' : link.url}
                                    prefetch={!link.disabled}
                                    className="group block rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-amber-400/40 hover:bg-white/10"
                                    aria-disabled={link.disabled}
                                >
                                    <p className="text-sm font-semibold text-white group-aria-disabled:text-white/40">
                                        {link.label}
                                    </p>
                                    <p className="mt-2 text-xs text-white/65 group-aria-disabled:text-white/40">
                                        {link.description}
                                    </p>
                                    {link.disabled ? (
                                        <span className="mt-3 inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-white/40">
                                            Coming soon
                                        </span>
                                    ) : (
                                        <span className="mt-3 inline-flex items-center gap-2 text-xs text-amber-200">
                                            Go to section
                                            <span aria-hidden>→</span>
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}




