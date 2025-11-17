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
    skipHref,
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
                <div className="absolute top-1/2 -left-48 size-[520px] -translate-y-1/2 rounded-full bg-rose-500/15 blur-3xl" />
                <div className="absolute top-10 -right-40 size-[480px] rounded-full bg-violet-600/12 blur-3xl" />
            </div>

            <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-12 sm:px-8 md:px-10">
                <header className="space-y-6">
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 shadow-[0_48px_110px_-60px_rgba(249,115,22,0.5)] backdrop-blur">
                        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                            <div className="max-w-3xl space-y-3 text-left">
                                <span className="text-xs tracking-[0.35em] text-white/55 uppercase">
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
                                        className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold tracking-[0.35em] text-white/75 uppercase transition hover:border-white/40 hover:text-white"
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
                            <div className="flex items-center justify-between text-sm font-medium text-white/90 sm:text-base">
                                <span>Setup progress</span>
                                <span className="text-white">
                                    Step{' '}
                                    {Math.min(currentIndex + 1, STEPS.length)}{' '}
                                    of {STEPS.length}
                                </span>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
                                {STEPS.map((step, index) => {
                                    const isActive = index === currentIndex;
                                    const isComplete = index < currentIndex;
                                    const isIncomplete =
                                        !isActive && !isComplete;

                                    return (
                                        <div
                                            key={step.id}
                                            className="space-y-2.5"
                                        >
                                            <div
                                                className={cn(
                                                    'group rounded-2xl border px-4 py-3.5 text-left transition-all md:text-center',
                                                    isActive
                                                        ? 'border-white/40 bg-white/15 text-white shadow-[0_24px_65px_-40px_rgba(249,115,22,0.55)]'
                                                        : isComplete
                                                          ? 'border-white/20 bg-white/8 text-white/80 hover:border-white/30 hover:bg-white/10'
                                                          : 'border-white/15 bg-black/25 text-white/60',
                                                )}
                                            >
                                                <p className="text-xs tracking-[0.3em] text-white/60 uppercase sm:text-xs">
                                                    {step.optional
                                                        ? 'Optional'
                                                        : step.description}
                                                </p>
                                                <p className="mt-1.5 text-sm font-semibold sm:text-base">
                                                    {step.label}
                                                </p>
                                            </div>
                                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/12">
                                                {isIncomplete ? (
                                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neutral-600 via-neutral-500 to-neutral-600" />
                                                ) : (
                                                    <div
                                                        className={cn(
                                                            'absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 transition-opacity',
                                                            isActive ||
                                                                isComplete
                                                                ? 'opacity-100'
                                                                : 'opacity-30',
                                                        )}
                                                    />
                                                )}
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

                <footer className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-10 text-xs tracking-[0.3em] text-white/50 uppercase">
                    <div>
                        <span className="text-white/65">Need support?</span>{' '}
                        <Link
                            href={onboardingRoutes.start.url()}
                            className="text-white hover:text-white/80"
                        >
                            Message our concierge
                        </Link>
                    </div>
                    <span>Safe · Verified · For Adults Only</span>
                </footer>
            </main>
        </div>
    );
}
