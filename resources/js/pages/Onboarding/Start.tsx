import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/layouts/onboarding-layout';
import onboardingRoutes from '@/routes/onboarding';
import { ArrowRight, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { LocationModal } from '@/components/onboarding/location-modal';
import type { SharedData } from '@/types';

const appName = import.meta.env.VITE_APP_NAME || 'Real Kink Men';

export default function OnboardingStart() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const [showLocationModal, setShowLocationModal] = useState(false);

    // Check if user is missing location coordinates on mount
    useEffect(() => {
        if (
            user &&
            (!user.location_latitude || !user.location_longitude)
        ) {
            setShowLocationModal(true);
        }
    }, [user]);

    return (
        <OnboardingLayout
            currentStep="welcome"
            eyebrow="Onboarding"
            title={`Welcome to ${appName}`}
            description="Across the next few moments you'll lock in how you appear, what you enjoy, and which circles feel like home. You're in control—everything here can be revisited later."
        >
            <Head title="Onboarding" />

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-4 py-6 text-white shadow-[0_45px_95px_-55px_rgba(249,115,22,0.55)] sm:px-6 sm:py-8 lg:px-8">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.25),_transparent_60%)]" />
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(124,58,237,0.18),_transparent_65%)]" />

                <div className="relative space-y-6 sm:space-y-8">
                    <div className="space-y-3 text-left sm:space-y-4 lg:max-w-4xl">
                        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-[2rem]">
                            Let's get you comfortable before you hop into the
                            scene.
                        </h2>
                        <p className="text-sm leading-relaxed text-white/75 sm:text-base sm:leading-relaxed">
                            First we'll capture how you want to be addressed,
                            then the visuals that carry your energy. You'll
                            finish by picking people and circles to follow so
                            your feed pulses from day one.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
                        {[
                            {
                                title: 'Profile basics',
                                description:
                                    'Dial in your display name, pronouns, and the story that helps others understand you.',
                                icon: ShieldCheck,
                                iconColor: 'text-amber-400',
                            },
                            {
                                title: 'Profile photo & cover',
                                description:
                                    'Upload visuals that feel true to you—bold, discreet, or anything in between.',
                                icon: Sparkles,
                                iconColor: 'text-rose-400',
                            },
                            {
                                title: 'Circles & friends',
                                description:
                                    'Pick creators, clubs, and houses to follow so your feed comes alive instantly.',
                                icon: Users,
                                iconColor: 'text-violet-400',
                            },
                        ].map((step) => (
                            <div
                                key={step.title}
                                className="group relative space-y-4 rounded-2xl border border-white/20 bg-white/[0.07] px-5 py-5 text-left shadow-[0_28px_85px_-58px_rgba(249,115,22,0.5)] backdrop-blur transition-all hover:border-white/30 hover:bg-white/[0.1] hover:shadow-[0_32px_95px_-55px_rgba(249,115,22,0.65)] sm:px-6 sm:py-6"
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`flex-shrink-0 rounded-xl bg-white/10 p-2.5 ${step.iconColor} transition-colors group-hover:bg-white/15`}
                                    >
                                        <step.icon className="size-5 sm:size-6" />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <h3 className="text-base font-semibold text-white sm:text-lg">
                                            {step.title}
                                        </h3>
                                        <p className="text-sm leading-relaxed text-white/75 sm:text-sm">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-violet-500/10 px-5 py-5 shadow-[0_8px_32px_-8px_rgba(249,115,22,0.3)] backdrop-blur sm:px-6 sm:py-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 rounded-xl bg-amber-400/20 p-2.5">
                                <Sparkles className="size-5 text-amber-300 sm:size-6" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-base font-semibold text-white sm:text-lg">
                                        Curious about earning later?
                                    </p>
                                    <span className="flex-shrink-0 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-[0.65rem] font-medium tracking-[0.2em] text-white/70 uppercase">
                                        Optional
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed text-white/75 sm:text-base">
                                    After the social setup you can explore
                                    optional creator tools—verification,
                                    payouts, subscriptions, and wishlist drops.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:gap-4">
                        <Button
                            asChild
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_22px_55px_-30px_rgba(249,115,22,0.6)] transition hover:scale-[1.01] sm:text-base"
                        >
                            <Link href={onboardingRoutes.profile.url()}>
                                Start profile basics
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                        <p className="text-xs leading-relaxed text-white/70 sm:text-sm">
                            This is all optional, but helps you connect with
                            others. You can skip any section and come back
                            later.
                        </p>
                    </div>
                </div>
            </div>

            {user && (
                <LocationModal
                    open={showLocationModal}
                    onOpenChange={setShowLocationModal}
                    user={{
                        location_latitude: (user as any).location_latitude,
                        location_longitude: (user as any).location_longitude,
                        location_city: user.location_city,
                        location_region: user.location_region,
                        location_country: user.location_country,
                    }}
                />
            )}
        </OnboardingLayout>
    );
}
