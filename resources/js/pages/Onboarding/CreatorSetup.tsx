import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/layouts/onboarding-layout';
import onboardingRoutes from '@/routes/onboarding';
import {
    ArrowLeft,
    ArrowRight,
    Banknote,
    Gift,
    Loader2,
    MessageCircle,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';

const creatorFeatures = [
    {
        title: 'Verification & Safety',
        subtitle: 'Build trust with your community',
        description:
            "Get verified with a quick ID check to show you're authentic. We review submissions in under 24 hours and never display your legal name—only your verified badge.",
        features: [
            'Government ID verification',
            'Privacy-first identity check',
            'Verified creator badge',
        ],
        icon: ShieldCheck,
        iconColor: 'text-amber-400',
    },
    {
        title: 'Tips & Payouts',
        subtitle: 'Receive earnings securely',
        description:
            'Connect your bank account or payment service to receive tips and subscription revenue. Manage currencies, tax forms, and payout schedules all in one place.',
        features: [
            'Secure bank connections',
            'Multiple currency support',
            'Flexible payout options',
        ],
        icon: Banknote,
        iconColor: 'text-emerald-400',
    },
    {
        title: 'Subscription Tiers',
        subtitle: 'Monetize your content',
        description:
            'Create subscription tiers that match your style—from free to premium. Offer exclusive content, early access, or special perks to your subscribers.',
        features: [
            'Custom tier pricing',
            'Exclusive content access',
            'Flexible subscription models',
        ],
        icon: Sparkles,
        iconColor: 'text-rose-400',
    },
    {
        title: 'Wishlist & Gifts',
        subtitle: 'Let your community support you',
        description:
            'Share gear, travel funds, or experiences you want. Your community can contribute with one-off gifts or goal-based campaigns to help you grow.',
        features: [
            'Public or private wishlists',
            'Goal-based campaigns',
            'One-off gift support',
        ],
        icon: Gift,
        iconColor: 'text-violet-400',
    },
];

export default function CreatorSetup() {
    const [isFinishing, setIsFinishing] = useState(false);

    return (
        <OnboardingLayout
            currentStep="creator"
            eyebrow="Creator tools"
            title="What you can do as a creator"
            description="Explore the tools available to creators. Set up verification, monetization, and community features when you're ready—all from your dashboard."
        >
            <Head title="Creator setup" />

            <div className="space-y-8">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-7 text-white shadow-[0_48px_120px_-58px_rgba(249,115,22,0.55)]">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.2),_transparent_60%)]" />
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(147,51,234,0.15),_transparent_70%)]" />
                    <div className="relative space-y-4">
                        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
                            Monetize your content and grow your community
                        </h2>
                        <p className="text-sm leading-relaxed text-white/70 sm:text-base lg:max-w-3xl">
                            As a creator, you can set up verification to build
                            trust, enable tips and subscriptions to monetize
                            your work, and create wishlists to let your
                            community support your goals. All tools are
                            available from your dashboard when you're ready.
                        </p>
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                    {creatorFeatures.map(
                        ({
                            title,
                            subtitle,
                            description,
                            features,
                            icon: Icon,
                            iconColor,
                        }) => (
                            <div
                                key={title}
                                className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_42px_110px_-60px_rgba(99,102,241,0.45)] transition hover:border-white/20 hover:bg-white/10"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5">
                                            <Icon
                                                className={`size-6 ${iconColor}`}
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-xs tracking-[0.35em] text-white/50 uppercase">
                                                {subtitle}
                                            </p>
                                            <h3 className="text-lg font-semibold text-white sm:text-xl">
                                                {title}
                                            </h3>
                                        </div>
                                    </div>
                                    <p className="text-sm leading-relaxed text-white/70 sm:text-base">
                                        {description}
                                    </p>
                                    <ul className="space-y-2.5 pt-1">
                                        {features.map((feature) => (
                                            <li
                                                key={feature}
                                                className="flex items-start gap-2.5"
                                            >
                                                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                                                <span className="text-xs leading-relaxed text-white/65 sm:text-sm">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ),
                    )}
                </div>

                <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-white shadow-[0_32px_95px_-58px_rgba(249,115,22,0.55)]">
                        <div className="flex items-center gap-2 text-xs tracking-[0.35em] text-white/50 uppercase">
                            <Sparkles className="size-4" />
                            Pro tips
                        </div>
                        <ul className="mt-4 space-y-3 text-sm text-white/70 sm:text-base">
                            <li>
                                <span className="font-semibold text-white">
                                    Privacy controls:
                                </span>{' '}
                                Use alias modes, blurred previews, and location
                                scrubbing to keep personal info protected.
                            </li>
                            <li>
                                <span className="font-semibold text-white">
                                    Consent rituals:
                                </span>{' '}
                                Automated check-ins remind subscribers about
                                your limits before they tip or unlock premium
                                content.
                            </li>
                            <li>
                                <span className="font-semibold text-white">
                                    Transparency:
                                </span>{' '}
                                We only share your verified status badge—never
                                raw documents or payout details.
                            </li>
                        </ul>
                    </div>
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-white shadow-[0_32px_95px_-58px_rgba(99,102,241,0.45)]">
                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(147,51,234,0.1),_transparent_70%)]" />
                        <div className="relative space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="rounded-xl border border-white/15 bg-white/10 p-2">
                                    <MessageCircle className="size-4 text-violet-400" />
                                </div>
                                <p className="text-sm font-semibold text-white sm:text-base">
                                    Need a human?
                                </p>
                            </div>
                            <p className="text-sm leading-relaxed text-white/70 sm:text-base">
                                Our concierge team is here to help. Reach out
                                in-app or via email for live support with
                                verification, banking, tax setup, or any creator
                                tool questions.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:gap-4">
                    <Button
                        asChild
                        variant="secondary"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm text-white transition hover:bg-white/15"
                    >
                        <Link href={onboardingRoutes.follow.url()}>
                            <ArrowLeft className="size-4" /> Back to social
                            setup
                        </Link>
                    </Button>
                    <div className="flex flex-1 justify-end">
                        <Button
                            onClick={() => {
                                setIsFinishing(true);
                                router.post(
                                    '/onboarding/finish',
                                    {},
                                    {
                                        onFinish: () => {
                                            setIsFinishing(false);
                                        },
                                    },
                                );
                            }}
                            disabled={isFinishing}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_55px_-28px_rgba(249,115,22,0.6)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isFinishing ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Finishing...
                                </>
                            ) : (
                                <>
                                    Finish onboarding
                                    <ArrowRight className="size-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </OnboardingLayout>
    );
}
