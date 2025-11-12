import { Head, Link } from '@inertiajs/react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/layouts/onboarding-layout';
import onboardingRoutes from '@/routes/onboarding';
import { ArrowLeft, ArrowRight, Banknote, Gift, ShieldCheck, Sparkles } from 'lucide-react';

const creatorTasks = [
    {
        title: 'KYC & ID verification',
        subtitle: 'Keep the community safe',
        description:
            'Upload a government-issued ID and a quick selfie check. We review submissions in under 24 hours and never display your legal name.',
        checklist: ['Government ID upload', 'Live selfie or video verification', 'Consent + policy acknowledgement'],
        icon: ShieldCheck,
        actionLabel: 'Start verification',
    },
    {
        title: 'Add payout details',
        subtitle: 'Enable tips & subscriptions',
        description:
            'Securely connect a bank account or payment service to receive earnings. You can manage currencies and tax forms later.',
        checklist: ['Link bank or payout service', 'Confirm account micro-deposit', 'Save preferred currency'],
        icon: Banknote,
        actionLabel: 'Connect payout account',
    },
    {
        title: 'Set subscription pricing',
        subtitle: 'Share premium experiences',
        description:
            'Create tiers that fit your vibe—keep it free, offer one tier, or stack multiple levels. You can edit or pause them anytime.',
        checklist: ['Create tier names & perks', 'Choose monthly or bundle pricing', 'Preview member experience'],
        icon: Sparkles,
        actionLabel: 'Design tiers',
    },
    {
        title: 'Curate a wishlist',
        subtitle: 'Let fans boost your craft',
        description:
            'Add gear, travel funds, or experiences to your wishlist. Members can chip in with one-off gifts or goal-based campaigns.',
        checklist: ['Add at least three items', 'Set pricing or contribution goals', 'Decide on public or circle visibility'],
        icon: Gift,
        actionLabel: 'Build wishlist',
    },
];

export default function CreatorSetup() {
    return (
        <OnboardingLayout
            currentStep="creator"
            eyebrow="Creator tools"
            title="Unlock creator tools when you’re ready"
            description="These steps are optional. Complete them now to go live faster, or revisit anytime from your dashboard. Each action respects consent, privacy, and safety for everyone involved."
            skipHref={onboardingRoutes.follow.url()}
            skipLabel="Back to circles"
            skipHelper="Decide later from your dashboard → Creator tools"
        >
            <Head title="Creator setup" />

            <div className="space-y-8">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-7 text-white shadow-[0_48px_120px_-58px_rgba(249,115,22,0.55)]">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.2),_transparent_60%)]" />
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(39,39,42,0.6),_transparent_70%)]" />
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-4 lg:max-w-2xl">
                            <Badge className="w-fit rounded-full border-white/20 bg-white/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-white/70">
                                Optional · Creator step
                            </Badge>
                            <h2 className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
                                Earn, host, and share on your terms.
                            </h2>
                            <p className="text-sm leading-relaxed text-white/70">
                                Complete these tasks to enable tips, subscriptions, and wishlist gifts. Your progress saves automatically, so feel free to pause whenever you need a breather.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-4 text-sm text-white/70 backdrop-blur">
                            <p className="font-semibold text-white">Need to move slowly?</p>
                            <p className="mt-2 text-xs text-white/60">
                                Switch to “subscriber-only mode,” hide your wishlist, or pause payouts anytime—consent stays central to every setting.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                    {creatorTasks.map(({ title, subtitle, description, checklist, icon: Icon, actionLabel }) => (
                        <div
                            key={title}
                            className="relative flex h-full flex-col justify-between gap-5 rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_42px_110px_-60px_rgba(99,102,241,0.45)]"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                                        <Icon className="size-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm uppercase tracking-[0.35em] text-white/55">{subtitle}</p>
                                        <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed text-white/70">{description}</p>
                                <ul className="space-y-2 text-xs text-white/60">
                                    {checklist.map((item) => (
                                        <li key={item} className="flex items-start gap-2">
                                            <span className="mt-[5px] size-1.5 rounded-full bg-amber-400" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Button className="w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-sm font-semibold text-white shadow-[0_24px_55px_-28px_rgba(249,115,22,0.6)] transition hover:scale-[1.01]">
                                {actionLabel}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-white shadow-[0_32px_95px_-58px_rgba(249,115,22,0.55)]">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/50">
                            <Sparkles className="size-4" />
                            Pro tips
                        </div>
                        <ul className="mt-4 space-y-3 text-sm text-white/70">
                            <li>
                                <span className="font-semibold text-white">Privacy controls:</span> Use alias modes, blurred previews, and location scrubbing to keep personal info protected.
                            </li>
                            <li>
                                <span className="font-semibold text-white">Consent rituals:</span> Automated check-ins remind subscribers about your limits before they tip or unlock premium content.
                            </li>
                            <li>
                                <span className="font-semibold text-white">Transparency:</span> We only share your verified status badge—never raw documents or payout details.
                            </li>
                        </ul>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-white shadow-[0_32px_95px_-58px_rgba(99,102,241,0.45)]">
                        <p className="text-sm font-semibold text-white">Need a human?</p>
                        <p className="mt-2 text-xs text-white/60">
                            The concierge team can walk you through any step. Ping us in-app or email support for live help with verification, banking, or tax readiness.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4 w-full rounded-full border-white/30 bg-white/10 text-sm text-white transition hover:border-white/50 hover:bg-white/15"
                        >
                            Message concierge
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:gap-4">
                    <Button
                        asChild
                        variant="secondary"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm text-white transition hover:bg-white/15"
                    >
                        <Link href={onboardingRoutes.follow.url()}>
                            <ArrowLeft className="size-4" /> Back to social setup
                        </Link>
                    </Button>
                    <Button
                        asChild
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_55px_-28px_rgba(249,115,22,0.6)] transition hover:scale-[1.01]"
                    >
                        <Link href="/dashboard">
                            Finish onboarding
                            <ArrowRight className="size-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </OnboardingLayout>
    );
}





