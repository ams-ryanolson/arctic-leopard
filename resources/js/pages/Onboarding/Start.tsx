import { Head, Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/layouts/onboarding-layout';
import onboardingRoutes from '@/routes/onboarding';
import { ArrowRight, ShieldCheck, Sparkles, Users } from 'lucide-react';

const readinessChecklist = [
    {
        title: 'Choose how you show up',
        description: 'Pick a display name, pronouns, and the tone you want friends and circles to see first.',
    },
    {
        title: 'Share comfort zones & curiosities',
        description: 'Let folks know the scenes that energise you and what boundaries keep you grounded.',
    },
    {
        title: 'Prep your visuals',
        description: 'You’ll add a profile photo and cover banner so people recognise you across the feed.',
    },
];

export default function OnboardingStart() {
    return (
        <OnboardingLayout
            currentStep="welcome"
            eyebrow="Onboarding"
            title="Set the tone for your Real Kink Men experience"
            description="Across the next few moments you’ll lock in how you appear, what you enjoy, and which circles feel like home. You’re in control—everything here can be revisited later."
            skipHref="/dashboard"
            skipLabel="Skip for now"
            skipHelper="You can finish setup anytime from your menu → Onboarding"
        >
            <Head title="Onboarding" />

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-8 text-white shadow-[0_45px_95px_-55px_rgba(249,115,22,0.55)] lg:px-8">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.25),_transparent_60%)]" />
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(124,58,237,0.18),_transparent_65%)]" />

                <div className="relative space-y-8">
                    <div className="space-y-4 text-left lg:max-w-4xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
                            <ShieldCheck className="size-4" /> Welcome brief
                        </span>
                        <h2 className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
                            Let’s get you comfortable before you hop into the scene.
                        </h2>
                        <p className="text-sm leading-relaxed text-white/70">
                            First we’ll capture how you want to be addressed, then the visuals that carry your energy. You’ll finish by picking people and circles to follow so your feed pulses from
                            day one.
                        </p>
                    </div>

                    <div className="grid gap-5 text-sm text-white/80 md:grid-cols-3">
                        {[
                            {
                                title: 'Profile basics',
                                description: 'Dial in your display name, pronouns, and the story that helps others understand you.',
                                icon: ShieldCheck,
                            },
                            {
                                title: 'Profile photo & cover',
                                description: 'Upload visuals that feel true to you—bold, discreet, or anything in between.',
                                icon: Sparkles,
                            },
                            {
                                title: 'Circles & friends',
                                description: 'Pick creators, clubs, and houses to follow so your feed comes alive instantly.',
                                icon: Users,
                            },
                        ].map((step) => (
                            <div
                                key={step.title}
                                className="space-y-3 rounded-2xl border border-white/15 bg-white/5 px-5 py-5 text-left shadow-[0_28px_85px_-58px_rgba(249,115,22,0.5)] backdrop-blur"
                            >
                                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/55">
                                    <step.icon className="size-4 text-white/65" />
                                    <span>{step.title}</span>
                                </div>
                                <p className="text-xs text-white/65">{step.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-2xl border border-white/12 bg-black/25 px-5 py-5 text-sm text-white/70 backdrop-blur">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <Sparkles className="size-4 text-amber-300" />
                                <div>
                                    <p className="text-sm font-semibold text-white">Curious about earning later?</p>
                                    <p className="text-xs text-white/60">
                                        After the social setup you can explore optional creator tools—verification, payouts, subscriptions, and wishlist drops.
                                    </p>
                                </div>
                            </div>
                            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.7rem] uppercase tracking-[0.35em] text-white/55">
                                Step 5 · Optional
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-xs text-white/60 backdrop-blur">
                        <p className="text-sm font-semibold text-white">Getting you ready</p>
                        <ul className="grid gap-2">
                            {readinessChecklist.map((item) => (
                                <li key={item.title} className="leading-relaxed">
                                    <span className="font-semibold text-white">{item.title}:</span> {item.description}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <Button
                            asChild
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_22px_55px_-30px_rgba(249,115,22,0.6)] transition hover:scale-[1.01]"
                        >
                            <Link href={onboardingRoutes.profile.url()}>
                                Start profile basics
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                        <p className="text-xs text-white/60">
                            Want to wait? Hit “Skip for now” above and finish onboarding whenever you’re ready.
                        </p>
                    </div>
                </div>
            </div>
        </OnboardingLayout>
    );
}

