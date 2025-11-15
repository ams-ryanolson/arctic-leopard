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

export default function Upgrade({ plans, currentMembership }: UpgradePageProps) {
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;
    const userRoles = user?.roles?.map((role) => role.name) ?? [];
    const isAdmin = userRoles.includes('Admin') || userRoles.includes('Super Admin') || userRoles.includes('Moderator');

    const formatPrice = (cents: number, currency: string = 'USD'): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(cents / 100);
    };

    const handlePurchase = (plan: MembershipPlan) => {
        router.visit(membershipsRoutes.checkout(plan.id).url);
    };

    const isCurrentPlan = (plan: MembershipPlan): boolean => {
        return currentMembership?.plan.id === plan.id && currentMembership.status === 'active';
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

            <div className="space-y-12 text-white">
                <section className="grid gap-8 md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-3 rounded-full border border-amber-400/40 bg-white/10 px-4 py-2 text-sm font-semibold text-amber-100">
                            <Flame className="size-4 text-amber-300" />
                            Unlock deeper access to the scene
                        </div>

                        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                            Connect deeper with exclusive content, community access, and real-world events.
                        </h1>

                        <p className="text-lg text-white/70 md:text-xl">
                            Upgrade your membership to unlock premium features, support creators in the community, and get priority access to exclusive content, circles, and IRL gatherings. Switch or cancel anytime.
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200">
                                <CheckCircle2 className="size-4 text-emerald-300" />
                                Cancel or change plans anytime
                            </div>
                            <div className="flex items-center gap-2 rounded-full bg-sky-500/15 px-4 py-2 text-sm text-sky-200">
                                <CheckCircle2 className="size-4 text-sky-300" />
                                Support creators & unlock exclusive content
                            </div>
                            <div className="flex items-center gap-2 rounded-full bg-rose-500/15 px-4 py-2 text-sm text-rose-200">
                                <CheckCircle2 className="size-4 text-rose-300" />
                                Priority access to events & circles
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-amber-500/25 via-rose-500/20 to-indigo-500/25 p-1">
                        <div className="rounded-[1.65rem] bg-neutral-950/95 p-6">
                            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
                                What you get
                            </span>
                            <ul className="mt-6 space-y-4 text-sm text-white/80">
                                <li className="flex items-start gap-3">
                                    <Sparkles className="mt-0.5 size-4 text-amber-300" />
                                    Exclusive paywalled content from creators you follow, plus access to premium archives and behind-the-scenes content.
                                </li>
                                <li className="flex items-start gap-3">
                                    <Sparkles className="mt-0.5 size-4 text-amber-300" />
                                    Priority access to events, circles, and real-world meetups. Get first dibs on tickets and exclusive circle memberships.
                                </li>
                                <li className="flex items-start gap-3">
                                    <Sparkles className="mt-0.5 size-4 text-amber-300" />
                                    Enhanced discovery features, advanced Radar filters, and the ability to hide ads for a cleaner experience.
                                </li>
                                <li className="flex items-start gap-3">
                                    <Sparkles className="mt-0.5 size-4 text-amber-300" />
                                    Directly support the creators building this community—your membership helps fund new content and features.
                                </li>
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
                                            Current Membership: {currentMembership.plan.name}
                                        </p>
                                        {currentMembership.ends_at && (
                                            <p className="text-sm text-white/60">
                                                Expires {new Date(currentMembership.ends_at).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}

                <section>
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold md:text-3xl">Choose your membership</h2>
                            <p className="text-white/65">
                                All plans include creator tipping, event RSVPs, and traveller mode access.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={billingInterval === 'monthly' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setBillingInterval('monthly')}
                            >
                                Monthly
                            </Button>
                            <Button
                                variant={billingInterval === 'yearly' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setBillingInterval('yearly')}
                            >
                                Yearly
                                <Badge variant="secondary" className="ml-2 bg-emerald-500/20 text-emerald-400">
                                    Save 2 months
                                </Badge>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-8 grid gap-6 lg:grid-cols-3">
                        {plans.map((plan) => {
                            const price = billingInterval === 'yearly' ? plan.yearly_price : plan.monthly_price;
                            const isCurrent = isCurrentPlan(plan);

                            return (
                                <Card
                                    key={plan.id}
                                    className={`border-white/12 bg-white/5 backdrop-blur transition hover:-translate-y-1 ${
                                        isCurrent
                                            ? 'border-amber-400/50 bg-amber-500/10'
                                            : 'hover:border-amber-400/30 hover:bg-white/10'
                                    }`}
                                >
                                    <CardHeader className="space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <CardTitle className="text-xl font-semibold">{plan.name}</CardTitle>
                                            {isCurrent && (
                                                <Badge className="border-white/20 bg-amber-500/80 text-neutral-950">
                                                    Current
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription className="text-white/65">
                                            {plan.description || 'Premium membership tier'}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-6">
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-semibold text-white">
                                                    {formatPrice(price, plan.currency)}
                                                </span>
                                                <span className="text-sm text-white/60">
                                                    / {billingInterval === 'yearly' ? 'year' : 'month'}
                                                </span>
                                            </div>
                                            {billingInterval === 'yearly' && (
                                                <p className="mt-2 text-sm text-white/55">
                                                    Save {formatPrice(plan.monthly_price * 12 - plan.yearly_price, plan.currency)}{' '}
                                                    vs monthly
                                                </p>
                                            )}
                                        </div>

                                        {plan.features && Object.keys(plan.features).length > 0 && (
                                            <ul className="space-y-3 text-sm text-white/80">
                                                {Object.entries(plan.features).map(([key, value]) => (
                                                    <li key={key} className="flex items-start gap-2">
                                                        <CheckCircle2 className="mt-0.5 size-4 text-emerald-300" />
                                                        <span>{value}</span>
                                                    </li>
                                                ))}
                                            </ul>
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
                                                onClick={() => handlePurchase(plan)}
                                                className="w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 text-white hover:from-amber-300 hover:via-rose-400 hover:to-indigo-400"
                                            >
                                                {currentMembership ? 'Upgrade to' : 'Start with'} {plan.name}
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

