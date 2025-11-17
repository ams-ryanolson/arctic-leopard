import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';

interface OverviewHighlight {
    title: string;
    body: string;
}

interface OverviewMetric {
    label: string;
    value: string;
    delta: string;
}

interface OverviewTutorial {
    title: string;
    duration: string;
    category: string;
    href: string;
}

interface SignalsOverviewProps {
    headline: string;
    subheading: string;
    highlights: OverviewHighlight[];
    metrics: OverviewMetric[];
    tutorials: OverviewTutorial[];
}

export default function SignalsOverview({
    headline,
    subheading,
    highlights,
    metrics,
    tutorials,
}: SignalsOverviewProps) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Signals', href: '/signals' },
                { title: 'Overview', href: '/signals' },
            ]}
        >
            <Head title="Signals · Overview" />

            <div className="space-y-8 text-white">
                <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <h1 className="text-3xl font-semibold">{headline}</h1>
                    <p className="mt-4 text-sm text-white/70">{subheading}</p>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    {metrics.map((metric) => (
                        <div
                            key={metric.label}
                            className="rounded-3xl border border-white/10 bg-white/5 p-6"
                        >
                            <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                {metric.label}
                            </p>
                            <p className="mt-3 text-2xl font-semibold text-white">
                                {metric.value}
                            </p>
                            <p className="mt-2 text-xs text-emerald-200">
                                {metric.delta}
                            </p>
                        </div>
                    ))}
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    {highlights.map((highlight) => (
                        <div
                            key={highlight.title}
                            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_-45px_rgba(59,130,246,0.35)]"
                        >
                            <h2 className="text-lg font-semibold text-white">
                                {highlight.title}
                            </h2>
                            <p className="mt-3 text-sm text-white/70">
                                {highlight.body}
                            </p>
                        </div>
                    ))}
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <h2 className="text-lg font-semibold text-white">
                        Start with the playbooks
                    </h2>
                    <p className="mt-2 text-sm text-white/70">
                        Watch or read the latest tutorials to unlock more value
                        from your signals data.
                    </p>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {tutorials.map((tutorial) => (
                            <Link
                                key={tutorial.title}
                                href={tutorial.href}
                                prefetch
                                className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-amber-400/40 hover:bg-white/5"
                            >
                                <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                    {tutorial.category}
                                </p>
                                <p className="mt-2 text-sm font-semibold text-white">
                                    {tutorial.title}
                                </p>
                                <p className="mt-2 text-xs text-white/60">
                                    {tutorial.duration}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
