import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import membershipsRoutes from '@/routes/memberships';
import { type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Crown, Flame, Sparkles } from 'lucide-react';
import { useState } from 'react';

type MembershipPlan = {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    description: string | null;
    monthly_price: number;
    yearly_price: number;
    currency: string;
    role_to_assign: string;
    features: Record<string, string>;
    allows_recurring: boolean;
    allows_one_time: boolean;
    one_time_duration_days: number | null;
};

type CurrentMembership = {
    id: number;
    plan: {
        id: number;
        name: string;
        slug: string;
    };
    status: string;
    ends_at: string | null;
} | null;

type UpgradePageProps = {
    plans: MembershipPlan[];
    currentMembership: CurrentMembership;
};

export default function Upgrade({
    plans,
    currentMembership,
}: UpgradePageProps) {
    const [billingInterval, setBillingInterval] = useState<
        'monthly' | 'yearly'
    >('monthly');
    const { auth, features } = usePage<SharedData>().props;
    const user = auth?.user;
    const userRoles = user?.roles?.map((role) => role.name) ?? [];
    const isAdmin =
        userRoles.includes('Admin') ||
        userRoles.includes('Super Admin') ||
        userRoles.includes('Moderator');
    const signalsEnabled = features?.signals ?? false;

    const formatPrice = (cents: number, currency: string = 'USD'): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(cents / 100);
    };

    const handlePurchase = (plan: MembershipPlan) => {
        router.visit(membershipsRoutes.checkout(plan.slug).url);
    };

    const isCurrentPlan = (plan: MembershipPlan): boolean => {
        return (
            currentMembership?.plan.id === plan.id &&
            currentMembership.status === 'active'
        );
    };

    const isDisabled = (plan: MembershipPlan): boolean => {
        // Disabled if admin/moderator
        if (isAdmin) {
            return true;
        }

        // Disabled if it's the current plan
        if (isCurrentPlan(plan)) {
            return true;
        }

        // Disabled if it's a lower tier than current
        if (currentMembership && currentMembership.status === 'active') {
            const tiers = ['Premium', 'Elite', 'Unlimited'];
            const currentTier = tiers.indexOf(currentMembership.plan.name);
            const newTier = tiers.indexOf(plan.name);
            return newTier <= currentTier;
        }

        return false;
    };

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

            <div className="space-y-16 text-white">
                <section className="grid gap-8 md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-3 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-rose-500/20 px-4 py-2 text-sm font-semibold text-amber-100 backdrop-blur-sm">
                            <Flame className="size-4 animate-pulse text-amber-300" />
                            Unlock deeper access to the scene
                        </div>

                        <h1 className="bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-4xl leading-tight font-semibold text-transparent md:text-5xl">
                            Unlock exclusive content and community access.
                        </h1>

                        <p className="text-lg leading-relaxed text-white/70 md:text-xl">
                            Upgrade your membership to unlock premium features
                            {signalsEnabled &&
                                ', support creators in the community'}
                            , and get priority access to exclusive content,
                            circles, and IRL gatherings. Switch or cancel
                            anytime.
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200">
                                <CheckCircle2 className="size-4 text-emerald-300" />
                                Cancel or change plans anytime
                            </div>
                            {signalsEnabled && (
                                <div className="flex items-center gap-2 rounded-full bg-sky-500/15 px-4 py-2 text-sm text-sky-200">
                                    <CheckCircle2 className="size-4 text-sky-300" />
                                    Support creators & unlock exclusive content
                                </div>
                            )}
                            <div className="flex items-center gap-2 rounded-full bg-rose-500/15 px-4 py-2 text-sm text-rose-200">
                                <CheckCircle2 className="size-4 text-rose-300" />
                                Priority access to events & circles
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-amber-500/25 via-rose-500/20 to-indigo-500/25 p-1 shadow-2xl">
                        <div className="rounded-[1.65rem] bg-gradient-to-br from-neutral-950/98 via-neutral-950/95 to-neutral-900/95 p-8 backdrop-blur-sm">
                            <div className="mb-6">
                                <span className="text-sm font-semibold tracking-[0.3em] text-amber-300/80 uppercase">
                                    What you get
                                </span>
                                <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-amber-400 to-rose-400" />
                            </div>
                            <ul className="space-y-5 text-sm text-white/85">
                                <li className="flex items-start gap-4 transition-transform hover:translate-x-1">
                                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                                        <Sparkles className="size-4 text-amber-300" />
                                    </div>
                                    <span className="leading-relaxed">
                                        Exclusive paywalled content from
                                        creators you follow, plus access to
                                        premium archives and behind-the-scenes
                                        content.
                                    </span>
                                </li>
                                <li className="flex items-start gap-4 transition-transform hover:translate-x-1">
                                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-500/20">
                                        <Sparkles className="size-4 text-rose-300" />
                                    </div>
                                    <span className="leading-relaxed">
                                        Priority access to events, circles, and
                                        real-world meetups. Get first dibs on
                                        tickets and exclusive circle
                                        memberships.
                                    </span>
                                </li>
                                <li className="flex items-start gap-4 transition-transform hover:translate-x-1">
                                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20">
                                        <Sparkles className="size-4 text-indigo-300" />
                                    </div>
                                    <span className="leading-relaxed">
                                        Enhanced discovery features, advanced
                                        Radar filters, and the ability to hide
                                        ads for a cleaner experience.
                                    </span>
                                </li>
                                {signalsEnabled && (
                                    <li className="flex items-start gap-4 transition-transform hover:translate-x-1">
                                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20">
                                            <Sparkles className="size-4 text-sky-300" />
                                        </div>
                                        <span className="leading-relaxed">
                                            Directly support the creators
                                            building this community—your
                                            membership helps fund new content
                                            and features.
                                        </span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </section>

                {currentMembership && (
                    <section>
                        <Card className="border-amber-400/30 bg-amber-500/10">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3">
                                    <Crown className="size-5 text-amber-400" />
                                    <div>
                                        <p className="font-semibold text-white">
                                            Current Membership:{' '}
                                            {currentMembership.plan.name}
                                        </p>
                                        {currentMembership.ends_at && (
                                            <p className="text-sm text-white/60">
                                                Expires{' '}
                                                {new Date(
                                                    currentMembership.ends_at,
                                                ).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}

                <section>
                    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-semibold md:text-4xl">
                                Choose your membership
                            </h2>
                            <p className="text-lg text-white/70">
                                All plans include{' '}
                                {signalsEnabled && 'creator tipping, '}
                                event RSVPs, and traveller mode access.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-1">
                            <Button
                                variant={
                                    billingInterval === 'monthly'
                                        ? 'default'
                                        : 'ghost'
                                }
                                size="sm"
                                onClick={() => setBillingInterval('monthly')}
                                className={
                                    billingInterval === 'monthly'
                                        ? 'bg-white/10 text-white shadow-sm'
                                        : 'text-white/70 hover:text-white'
                                }
                            >
                                Monthly
                            </Button>
                            <Button
                                variant={
                                    billingInterval === 'yearly'
                                        ? 'default'
                                        : 'ghost'
                                }
                                size="sm"
                                onClick={() => setBillingInterval('yearly')}
                                className={
                                    billingInterval === 'yearly'
                                        ? 'bg-white/10 text-white shadow-sm'
                                        : 'text-white/70 hover:text-white'
                                }
                            >
                                Yearly
                                <Badge
                                    variant="secondary"
                                    className="ml-2 border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                                >
                                    Save 2 months
                                </Badge>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-8 grid gap-6 lg:grid-cols-3">
                        {plans.map((plan, index) => {
                            const price =
                                billingInterval === 'yearly'
                                    ? plan.yearly_price
                                    : plan.monthly_price;
                            const isCurrent = isCurrentPlan(plan);
                            const isMostPopular =
                                plans.length >= 3 &&
                                index === Math.floor(plans.length / 2);

                            return (
                                <Card
                                    key={plan.id}
                                    className={`group relative border-white/12 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                                        isCurrent
                                            ? 'border-amber-400/50 bg-gradient-to-br from-amber-500/15 to-amber-500/5 shadow-amber-500/20'
                                            : isMostPopular
                                              ? 'scale-105 border-rose-400/50 bg-gradient-to-br from-rose-500/15 to-rose-500/5 shadow-xl shadow-rose-500/20'
                                              : 'hover:border-amber-400/40 hover:bg-gradient-to-br hover:from-white/10 hover:to-white/5'
                                    }`}
                                >
                                    {isMostPopular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <Badge className="border-rose-400/50 bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg">
                                                <Flame className="mr-1 size-3" />
                                                Most Popular
                                            </Badge>
                                        </div>
                                    )}
                                    <CardHeader className="space-y-4 pb-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <CardTitle className="text-2xl font-bold">
                                                {plan.name}
                                            </CardTitle>
                                            {isCurrent && (
                                                <Badge className="border-amber-400/30 bg-amber-500/90 text-neutral-950 shadow-md">
                                                    <Crown className="mr-1 size-3" />
                                                    Current
                                                </Badge>
                                            )}
                                        </div>
                                        {plan.description && (
                                            <CardDescription className="text-base leading-relaxed text-white/70">
                                                {plan.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>

                                    <CardContent className="space-y-6">
                                        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl font-bold text-white">
                                                    {formatPrice(
                                                        price,
                                                        plan.currency,
                                                    )}
                                                </span>
                                                <span className="text-base text-white/60">
                                                    /{' '}
                                                    {billingInterval ===
                                                    'yearly'
                                                        ? 'year'
                                                        : 'month'}
                                                </span>
                                            </div>
                                            {billingInterval === 'yearly' && (
                                                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1">
                                                    <span className="text-xs font-semibold text-emerald-300">
                                                        Save{' '}
                                                        {formatPrice(
                                                            plan.monthly_price *
                                                                12 -
                                                                plan.yearly_price,
                                                            plan.currency,
                                                        )}{' '}
                                                        vs monthly
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {plan.features &&
                                            Object.keys(plan.features).length >
                                                0 && (
                                                <div className="space-y-1">
                                                    <h3 className="mb-3 text-sm font-semibold tracking-wider text-white/50 uppercase">
                                                        Features
                                                    </h3>
                                                    <ul className="space-y-2.5 text-sm text-white/85">
                                                        {Object.entries(
                                                            plan.features,
                                                        ).map(
                                                            ([key, value]) => (
                                                                <li
                                                                    key={key}
                                                                    className="flex items-start gap-3 transition-colors hover:text-white"
                                                                >
                                                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                                                                    <span className="leading-relaxed">
                                                                        {value}
                                                                    </span>
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                    </CardContent>

                                    <CardFooter>
                                        {isDisabled(plan) ? (
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                disabled
                                            >
                                                {isAdmin
                                                    ? 'Not available for admins'
                                                    : isCurrent
                                                      ? 'Current Plan'
                                                      : 'Downgrade not available'}
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() =>
                                                    handlePurchase(plan)
                                                }
                                                className={`w-full rounded-full font-semibold transition-all duration-300 ${
                                                    isMostPopular
                                                        ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 hover:scale-105 hover:from-rose-400 hover:via-pink-400 hover:to-rose-500 hover:shadow-xl hover:shadow-rose-500/40'
                                                        : 'bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 text-white hover:scale-105 hover:from-amber-300 hover:via-rose-400 hover:to-indigo-400 hover:shadow-lg'
                                                }`}
                                            >
                                                {currentMembership
                                                    ? 'Upgrade to'
                                                    : 'Start with'}{' '}
                                                {plan.name}
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
