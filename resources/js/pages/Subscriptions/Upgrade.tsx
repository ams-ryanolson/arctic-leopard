import AppLayout from '@/layouts/app-layout';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Flame, Sparkles } from 'lucide-react';

type Plan = {
    id: string;
    name: string;
    monthly: number;
    yearly: number;
    tagline: string;
    description: string;
    highlights: string[];
    badge?: string;
};

interface UpgradePageProps {
    plans: Plan[];
}

export default function Upgrade({ plans }: UpgradePageProps) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Upgrade', href: '/upgrade' },
            ]}
            headerActions={[
                {
                    id: 'contact-sales',
                    label: 'Talk with us',
                    href: '/signals/monetization',
                    icon: Sparkles,
                    variant: 'secondary',
                },
            ]}
        >
            <Head title="Upgrade Membership" />

            <div className="space-y-12 text-white">
                <section className="grid gap-8 md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-3 rounded-full border border-amber-400/40 bg-white/10 px-4 py-2 text-sm font-semibold text-amber-100">
                            <Flame className="size-4 text-amber-300" />
                            Subscriptions built for fetish creators & superfans
                        </div>

                        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                            Fuel your obsession with memberships built for edge play, live ritual drops, and premium
                            archives.
                        </h1>

                        <p className="text-lg text-white/70 md:text-xl">
                            Choose the tier that unlocks the right mix of exclusive scenes, concierge support, and IRL
                            access. Switch or cancel anytime.
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200">
                                <CheckCircle2 className="size-4 text-emerald-300" />
                                Cancel or downgrade whenever you want
                            </div>
                            <div className="flex items-center gap-2 rounded-full bg-sky-500/15 px-4 py-2 text-sm text-sky-200">
                                <CheckCircle2 className="size-4 text-sky-300" />
                                Members-only vault + live programming
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-amber-500/25 via-rose-500/20 to-indigo-500/25 p-1">
                        <div className="rounded-[1.65rem] bg-neutral-950/95 p-6">
                            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
                                Why upgrade?
                            </span>
                            <ul className="mt-6 space-y-4 text-sm text-white/80">
                                <li className="flex items-start gap-3">
                                    <Sparkles className="mt-0.5 size-4 text-amber-300" />
                                    Access deeper cuts, rituals, and uncut scene vaults that never land on the public
                                    feed.
                                </li>
                                <li className="flex items-start gap-3">
                                    <Sparkles className="mt-0.5 size-4 text-amber-300" />
                                    Unlock IRL drop calendars, mentorship cohorts, and private circle rooms with other
                                    devotees.
                                </li>
                                <li className="flex items-start gap-3">
                                    <Sparkles className="mt-0.5 size-4 text-amber-300" />
                                    Support the performers who keep your kink world thriving—every plan fuels new
                                    productions.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold md:text-3xl">Choose your membership</h2>
                            <p className="text-white/65">
                                All plans include creator tipping, event RSVPs, and traveller mode access.
                            </p>
                        </div>
                        <p className="text-sm text-white/50">
                            Prices shown in USD · Save two months when you choose annual billing.
                        </p>
                    </div>

                    <div className="mt-8 grid gap-6 lg:grid-cols-3">
                        {plans.map((plan) => (
                            <Card
                                key={plan.id}
                                className="border-white/12 bg-white/5 backdrop-blur transition hover:-translate-y-1 hover:border-amber-400/30 hover:bg-white/10"
                            >
                                <CardHeader className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <CardTitle className="text-xl font-semibold">{plan.name}</CardTitle>
                                        {plan.badge ? (
                                            <Badge className="border-white/20 bg-amber-500/80 text-neutral-950">
                                                {plan.badge}
                                            </Badge>
                                        ) : null}
                                    </div>
                                    <CardDescription className="text-white/65">{plan.tagline}</CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-semibold text-white">${plan.monthly}</span>
                                            <span className="text-sm text-white/60">/ month</span>
                                        </div>
                                        <p className="mt-2 text-sm text-white/55">or ${plan.yearly} billed annually</p>
                                    </div>

                                    <p className="text-sm text-white/70">{plan.description}</p>

                                    <ul className="space-y-3 text-sm text-white/80">
                                        {plan.highlights.map((highlight) => (
                                            <li key={highlight} className="flex items-start gap-2">
                                                <CheckCircle2 className="mt-0.5 size-4 text-emerald-300" />
                                                <span>{highlight}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>

                                <CardFooter>
                                    <Button
                                        asChild
                                        className="w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 text-neutral-900 hover:from-amber-300 hover:via-rose-400 hover:to-indigo-400"
                                    >
                                        <Link href={`/upgrade?selected=${plan.id}`} prefetch>
                                            Start with {plan.name}
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}







