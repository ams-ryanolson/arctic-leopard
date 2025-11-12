import { Head, Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/layouts/onboarding-layout';
import onboardingRoutes from '@/routes/onboarding';
import { ArrowLeft, ArrowRight, BellRing, HeartHandshake, UsersRound } from 'lucide-react';

const creatorMock = [
    {
        name: 'Sir Rook',
        tagline: 'Leather switch · Rope curious',
        status: 'Live scenes Tuesdays',
    },
    {
        name: 'Mika Aftercare',
        tagline: 'Soft dom · Sensory play',
        status: 'Opens cuddle rooms on weekends',
    },
    {
        name: 'House Obsidian',
        tagline: 'Impact collective · Consent-first',
        status: 'Hosting “Bruise & Glow” next week',
    },
];

const communityMock = [
    {
        title: 'Primal Pulses',
        members: '182 members',
        description: 'Daily prompts, howl threads, and structured aftercare buddies.',
    },
    {
        title: 'Impact Theory',
        members: '243 members',
        description: 'Classes, rope labs, and tip trains centered on safe, heavy play.',
    },
    {
        title: 'Queer Pup Lounge',
        members: '320 members',
        description: 'Handler collabs, gear swaps, and monthly pack howl meets.',
    },
];

export default function FollowSuggestions() {
    return (
        <OnboardingLayout
            currentStep="follow"
            eyebrow="Onboarding"
            title="Choose your first connections"
            description="Follow a few people and circles so Real Kink Men feels alive the moment you land on the dashboard. This mock shows how the upcoming follow studio will feel."
        >
            <Head title="Follow suggestions" />

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-7 text-white shadow-[0_48px_130px_-60px_rgba(99,102,241,0.45)] lg:px-8">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.2),_transparent_60%)]" />
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.18),_transparent_65%)]" />

                <div className="relative space-y-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/50">
                        <UsersRound className="size-4" />
                        Suggested profiles
                    </div>
                    <p className="text-xs text-white/60">
                        In the finished experience, these tiles will adapt to your interests, safety preferences, and the circles you’ve shown curiosity in.
                    </p>
                    <div className="grid gap-4 md:grid-cols-3">
                        {creatorMock.map((creator) => (
                            <div
                                key={creator.name}
                                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-5 text-left shadow-[0_28px_85px_-58px_rgba(249,115,22,0.5)] backdrop-blur"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex size-12 items-center justify-center rounded-full border border-white/15 bg-black/35 text-sm text-white/70">
                                        Avatar
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{creator.name}</p>
                                        <p className="text-xs text-white/60">{creator.tagline}</p>
                                    </div>
                                </div>
                                <p className="mt-4 text-xs text-white/60">{creator.status}</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="mt-4 w-full rounded-full border border-white/20 bg-white/10 text-xs text-white transition hover:bg-white/15"
                                >
                                    Follow
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-7 text-white shadow-[0_36px_110px_-58px_rgba(249,115,22,0.45)] lg:px-8">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(147,197,253,0.2),_transparent_60%)]" />
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(244,114,182,0.18),_transparent_65%)]" />

                <div className="relative space-y-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/50">
                        <HeartHandshake className="size-4" />
                        Community circles
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {communityMock.map((circle) => (
                            <div
                                key={circle.title}
                                className="space-y-3 rounded-2xl border border-white/15 bg-white/5 px-5 py-5 text-left shadow-[0_28px_85px_-58px_rgba(99,102,241,0.45)] backdrop-blur"
                            >
                                <p className="text-sm font-semibold text-white">{circle.title}</p>
                                <p className="text-[0.7rem] uppercase tracking-[0.35em] text-white/50">
                                    {circle.members}
                                </p>
                                <p className="text-xs text-white/60">{circle.description}</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full rounded-full border border-white/20 bg-white/10 text-xs text-white transition hover:bg-white/15"
                                >
                                    Preview circle
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-xs text-white/60 shadow-[0_32px_95px_-58px_rgba(0,0,0,0.55)] lg:px-8">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <BellRing className="size-4 text-amber-300" />
                    Coming soon
                </div>
                <p className="mt-2 leading-relaxed">
                    Expect mutual connections, consent-matching signals, and a one-click way to follow every member of a circle you trust. This mock marks where that tooling will appear.
                </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <Button
                        asChild
                        variant="secondary"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm text-white transition hover:bg-white/15"
                    >
                        <Link href={onboardingRoutes.media.url()}>
                            <ArrowLeft className="size-4" /> Back
                        </Link>
                    </Button>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-1 sm:justify-end">
                        <Button
                            asChild
                            variant="outline"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm text-white transition hover:border-white/45 hover:bg-white/15"
                        >
                            <Link href={onboardingRoutes.creator.url()}>
                                Explore creator tools (optional)
                            </Link>
                        </Button>
                        <Button
                            asChild
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-emerald-400 via-amber-400 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_55px_-28px_rgba(249,115,22,0.6)] transition hover:scale-[1.01]"
                        >
                            <Link href="/dashboard">
                                Finish onboarding
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </OnboardingLayout>
    );
}
