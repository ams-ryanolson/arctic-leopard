import { cn } from '@/lib/utils';
import onboardingRoutes from '@/routes/onboarding';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

type StepDefinition = {
    id: 'welcome' | 'profile' | 'media' | 'follow' | 'creator';
    label: string;
    description: string;
    href: string;
    optional?: boolean;
};

const STEPS = [
    {
        id: 'welcome',
        label: 'Kickoff',
        description: 'Orientation',
        href: onboardingRoutes.start.url(),
    },
    {
        id: 'profile',
        label: 'Profile basics',
        description: 'Identity & vibe',
        href: onboardingRoutes.profile.url(),
    },
    {
        id: 'media',
        label: 'Profile & cover',
        description: 'Visual identity',
        href: onboardingRoutes.media.url(),
    },
    {
        id: 'follow',
        label: 'Social circles',
        description: 'Seed your feed',
        href: onboardingRoutes.follow.url(),
    },
    {
        id: 'creator',
        label: 'Creator toolkit',
        description: 'Optional',
        optional: true,
        href: onboardingRoutes.creator.url(),
    },
] satisfies readonly StepDefinition[];

export type OnboardingStepId = (typeof STEPS)[number]['id'];

interface OnboardingLayoutProps {
    currentStep: OnboardingStepId;
    eyebrow?: string;
    title: string;
    description?: string;
    skipHref?: string;
    skipLabel?: string;
    skipHelper?: string;
}

export default function OnboardingLayout({
    children,
    currentStep,
    eyebrow = 'Onboarding',
    title,
    description,
    skipHref = '/dashboard',
    skipLabel = 'Skip for now',
    skipHelper = 'You can finish setup later from your creator menu.',
}: PropsWithChildren<OnboardingLayoutProps>) {
    const currentIndex = Math.max(
        0,
        STEPS.findIndex((step) => step.id === currentStep),
    );

    return (
        <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.25),_transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(96,165,250,0.2),_transparent_60%)]" />
                <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-amber-500/20 via-transparent to-transparent blur-3xl" />
                <div className="absolute -left-48 top-1/2 size-[520px] -translate-y-1/2 rounded-full bg-rose-500/15 blur-3xl" />
                <div className="absolute -right-40 top-10 size-[480px] rounded-full bg-violet-600/12 blur-3xl" />
            </div>

            <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-12 sm:px-8 md:px-10">
                <header className="space-y-6">
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 shadow-[0_48px_110px_-60px_rgba(249,115,22,0.5)] backdrop-blur">
                        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                            <div className="max-w-3xl space-y-3 text-left">
                                <span className="text-xs uppercase tracking-[0.35em] text-white/55">
                                    {eyebrow}
                                </span>
                                <h1 className="text-3xl font-semibold tracking-tight sm:text-[2.5rem]">
                                    {title}
                                </h1>
                                {description && (
                                    <p className="text-sm leading-relaxed text-white/70">
                                        {description}
                                    </p>
                                )}
                            </div>

                            {skipHref && (
                                <div className="flex flex-col items-start gap-2 text-xs text-white/60 md:items-end">
                                    <Link
                                        href={skipHref}
                                        className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-white/75 transition hover:border-white/40 hover:text-white"
                                    >
                                        {skipLabel}
                                    </Link>
                                    <span className="max-w-xs text-[0.7rem] text-white/55">
                                        {skipHelper}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
                                <span>Setup progress</span>
                                <span>
                                    Step {Math.min(currentIndex + 1, STEPS.length)} of {STEPS.length}
                                </span>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                                {STEPS.map((step, index) => {
                                    const isActive = index === currentIndex;
                                    const isComplete = index < currentIndex;

                                    return (
                                        <div key={step.id} className="space-y-3">
                                            <div
                                                className={cn(
                                                    'rounded-2xl border px-4 py-3 text-left transition md:text-center',
                                                    isActive
                                                        ? 'border-white/40 bg-white/15 text-white shadow-[0_24px_65px_-40px_rgba(249,115,22,0.55)]'
                                                        : 'border-white/15 bg-black/25 text-white/60',
                                                )}
                                            >
                                                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                                                    {step.optional ? 'Optional' : step.description}
                                                </p>
                                                <p className="mt-2 text-sm font-semibold">{step.label}</p>
                                            </div>
                                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/12">
                                                <div
                                                    className={cn(
                                                        'absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 transition-opacity',
                                                        isActive || isComplete ? 'opacity-100' : 'opacity-30',
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </header>

                <section className="mt-12 flex-1 pb-16">
                    <div className="space-y-10">{children}</div>
                </section>

                <footer className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-10 text-xs uppercase tracking-[0.3em] text-white/50">
                    <div>
                        <span className="text-white/65">Need support?</span>{' '}
                        <Link href={onboardingRoutes.start.url()} className="text-white hover:text-white/80">
                            Message the concierge after launch
                        </Link>
                    </div>
                    <span>Safe · Verified · Fetish Sovereign</span>
                </footer>
            </main>
        </div>
    );
}
