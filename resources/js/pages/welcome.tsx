import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Button } from '@/components/ui/button';
import AgeConsentModal from '@/components/age-consent-modal';
import CookiesBanner from '@/components/cookies-banner';
import { Head, Link, usePage } from '@inertiajs/react';
import AnnouncementBar from '@/components/announcement-bar';
import {
    ArrowRight,
    Flame,
    HeartHandshake,
    Lock,
    MessageCircle,
    ShieldCheck,
    Sparkles,
    Users,
} from 'lucide-react';

const featureHighlights = [
    {
        title: 'Your Scene Feed',
        description:
            'A personalized timeline of posts from people you follow. Share scenes, updates, and moments with public, followers-only, or subscriber audiences. Like, comment, bookmark, and unlock pay-to-view content.',
        icon: Flame,
    },
    {
        title: 'Radar Discovery',
        description:
            "Find nearby members based on location, compatibility, and shared interests. See mutual connections, circle memberships, and compatibility scores. Turn on traveler mode when you're on the move.",
        icon: Sparkles,
    },
    {
        title: 'Circles & Community',
        description:
            'Join circles organized around interests, locations, or identities. Each circle has multiple facets for different conversations. Share posts to specific circles and discover new communities.',
        icon: Users,
    },
];

const trustPoints = [
    {
        title: 'Verified & Safe',
        description:
            'ID verification for creators, consent-first design, and robust moderation keep the community authentic and safe for everyone.',
        icon: ShieldCheck,
    },
    {
        title: 'Privacy Controls',
        description:
            'Control who sees your posts with audience settings—public, followers-only, subscribers, or pay-to-view. Manage your profile visibility and traveler mode for location privacy.',
        icon: Lock,
    },
    {
        title: 'Creator Tools',
        description:
            'Monetize your content with tips, subscriptions, and pay-to-view posts. Track earnings, manage payouts, and grow your audience with Signals—our creator dashboard.',
        icon: Sparkles,
    },
    {
        title: 'Real Connections',
        description:
            'Follow people, join circles, and discover nearby members through Radar. Build your network with compatibility matching and mutual connections.',
        icon: HeartHandshake,
    },
];

const communityStats = [
    { label: 'Members Active This Week', value: '29,000+' },
    { label: 'Scenes Shared / Day', value: '185K' },
    { label: 'Cities Represented', value: '112' },
];

export default function Welcome({ canRegister = true }: { canRegister?: boolean }) {
    const { auth } = usePage<SharedData>().props;
    const isAuthenticated = Boolean(auth?.user);

    return (
        <>
            <Head title="Real Kink Men · Enter The Scene">
                <meta
                    name="description"
                    content="Real Kink Men is the social network built for gay kink and fetish men. Trade scenes, find crews, flirt in DMs, and turn on creator tools only when you want."
                />
            </Head>

            <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
                <AnnouncementBar />
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.28),_transparent_55%)]" />
                    <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-amber-500/15 via-transparent to-transparent blur-3xl" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.2),_transparent_60%)] blur-2xl" />
                </div>

                <div className="relative z-10 flex min-h-screen flex-col">
                    <header className="px-5 py-6 sm:px-6 md:px-12">
                        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur transition hover:border-white/15 sm:flex-row sm:items-center sm:justify-between sm:rounded-full sm:px-6 sm:py-3">
                            <Link
                                href={isAuthenticated ? dashboard() : '/'}
                                className="flex items-center justify-center gap-3 sm:justify-start"
                            >
                                <div className="relative flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-700 shadow-[0_0_45px_rgba(249,115,22,0.45)]">
                                    <Users className="size-5" />
                                </div>
                                <div className="text-center leading-tight sm:text-left">
                                    <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/60 sm:text-xs">
                                        Real Kink Men
                                    </p>
                                    <p className="text-lg font-semibold tracking-tight">
                                        Unleash Your Kink
                                    </p>
                                </div>
                            </Link>

                            <nav className="hidden items-center gap-6 text-sm md:flex">
                                <a
                                    href="#vision"
                                    className="text-white/70 transition-colors hover:text-white"
                                >
                                    Vision
                                </a>
                                <a
                                    href="#features"
                                    className="text-white/70 transition-colors hover:text-white"
                                >
                                    Features
                                </a>
                                <a
                                    href="#trust"
                                    className="text-white/70 transition-colors hover:text-white"
                                >
                                    Trust & Safety
                                </a>
                                <a
                                    href="#join"
                                    className="text-white/70 transition-colors hover:text-white"
                                >
                                    Join The Scene
                                </a>
                            </nav>

                            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                                {isAuthenticated ? (
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full border-white/30 bg-white/5 text-white hover:border-white/50 hover:bg-white/10 sm:w-auto"
                                    >
                                        <Link href={dashboard()}>Enter Dashboard</Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            asChild
                                            variant="ghost"
                                            className="w-full text-white/70 hover:bg-white/5 hover:text-white sm:w-auto"
                                        >
                                            <Link href={login()}>Log in</Link>
                                        </Button>
                                        {canRegister && (
                                            <Button
                                                asChild
                                                className="w-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-5 text-base font-semibold tracking-tight text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-[1.02] hover:bg-gradient-to-r hover:from-amber-400 hover:via-rose-500 hover:to-violet-600 sm:w-auto"
                                            >
                                                <Link href={register()}>Join The Network</Link>
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </header>

                    <main className="flex-1">
                        <section className="px-5 pb-16 pt-10 sm:px-6 md:px-12 md:pb-24 md:pt-6">
                            <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                                <div className="space-y-10">
                                    <div className="space-y-5 text-center md:text-left">
                                        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
                                            The underground home for{' '}
                                            <span className="bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 bg-clip-text text-transparent">
                                                gay kink connection & play
                                            </span>
                                            .
                                        </h1>
                                        <p className="text-balance text-base leading-relaxed text-white/70 sm:text-lg">
                                            Real Kink Men is the social network built for gay kink and fetish men. Share posts on your feed, discover nearby members with Radar, join circles, and connect with your community. Turn on creator tools when you're ready to monetize with tips, subscriptions, and pay-to-view content.
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                                        <Button
                                            asChild
                                            size="lg"
                                            className="w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-9 py-3 text-base font-semibold text-white shadow-[0_25px_55px_-20px_rgba(249,115,22,0.5)] transition hover:scale-[1.03] sm:w-auto"
                                        >
                                            <Link href={isAuthenticated ? dashboard() : register()}>
                                                {isAuthenticated ? 'Enter The Scene' : 'Claim Your Profile'}
                                            </Link>
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                                        {communityStats.map((stat) => (
                                            <div
                                                key={stat.label}
                                                className="group rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center backdrop-blur transition hover:border-white/20 hover:bg-white/10 sm:text-left"
                                            >
                                                <p className="text-2xl font-semibold text-white transition group-hover:scale-105">{stat.value}</p>
                                                <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/60">
                                                    {stat.label}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute -inset-6 -z-10 rounded-[2.75rem] bg-gradient-to-br from-amber-400/40 via-rose-500/30 to-indigo-500/30 blur-3xl" />
                                    <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 shadow-[0_35px_60px_-25px_rgba(0,0,0,0.65)]">
                                        <div className="absolute -right-20 -top-20 size-56 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-700 opacity-60 blur-3xl" />
                                        <div className="absolute -bottom-24 -left-10 size-52 rounded-full bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-700 opacity-40 blur-3xl" />

                                        <div className="relative space-y-6 p-6 sm:p-8">
                                            <div className="flex flex-col items-start gap-2 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
                                                <span>Creator Spotlight</span>
                                                <span>Live Now</span>
                                            </div>
                                            <div className="rounded-2xl border border-white/10 bg-black/50 p-5 backdrop-blur transition hover:border-white/20 sm:p-6">
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 shadow-[0_15px_30px_-15px_rgba(249,115,22,0.45)]">
                                                        <Flame className="size-7" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
                                                            Bound Series · Episode 07
                                                        </p>
                                                        <p className="mt-1 text-lg font-semibold tracking-tight text-white">
                                                            Iron & Rope Ritual with Dante Knox
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="mt-4 text-sm leading-relaxed text-white/70">
                                                    A 45-minute multi-camera experience featuring breath play,
                                                    suspension, and partner control. Shot in 4K. Includes backstage
                                                    scenes, rigging notes, and safeword check-ins.
                                                </p>
                                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:border-white/20 hover:bg-white/10">
                                                        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                                                            Tip Train Active
                                                        </p>
                                                        <p className="mt-1 text-base font-semibold text-white">
                                                            162 patrons · 18 min left
                                                        </p>
                                                    </div>
                                                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:border-white/20 hover:bg-white/10">
                                                        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                                                            Unlockable Scenes
                                                        </p>
                                                        <p className="mt-1 text-base font-semibold text-white">
                                                            Breath control, wax, aftercare
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:grid-cols-2">
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">Creators</p>
                                                    <p className="mt-2 text-base font-semibold text-white">Verified pros</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                                                        Experiences
                                                    </p>
                                                    <p className="mt-2 text-base font-semibold text-white">
                                                        IRL + digital crossover
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section id="vision" className="scroll-mt-24 px-5 pb-16 sm:px-6 md:px-12 md:pb-24">
                            <div className="mx-auto grid w-full max-w-6xl gap-14 rounded-[2rem] border border-white/10 bg-white/5 px-6 py-10 backdrop-blur sm:px-8 sm:py-12 md:gap-16 md:rounded-[2.5rem] md:px-12 md:py-16 lg:grid-cols-[1.1fr_0.9fr]">
                                <div className="space-y-6 text-center md:text-left">
                                    <p className="text-[0.7rem] uppercase tracking-[0.4em] text-white/50 sm:text-xs">
                                        Why Real Kink Men
                                    </p>
                                    <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                                        Built by men into kink who were tired of vanilla platforms muting our scenes and
                                        shadowbanning our connections.
                                    </h2>
                                    <p className="text-base leading-relaxed text-white/70">
                                        Real Kink Men grew out of late-night debriefs, dungeon deconstructions, and
                                        friendships that kept getting throttled elsewhere. We wanted a social network where
                                        fetish talk comes first, where handles feel safe, and where underground
                                        communities can breathe in public.
                                    </p>
                                    <p className="text-base leading-relaxed text-white/70">
                                        We built a feed where you control your audience—share publicly, with followers, subscribers, or behind a paywall. We added Radar to help you discover nearby members based on compatibility and location. We created Circles for community organization. And we built Signals—creator tools for monetization—that you can turn on whenever you're ready. This isn't a sanitized clone—it's our fetish metropolis.
                                    </p>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    {trustPoints.map(({ title, description, icon: Icon }) => (
                                        <div
                                            key={title}
                                            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 text-left transition hover:border-white/20 hover:bg-white/15"
                                        >
                                            <div className="absolute -left-8 top-1/2 size-24 -translate-y-1/2 rounded-full bg-amber-400/15 blur-2xl transition group-hover:bg-amber-400/25" />
                                            <div className="relative flex size-10 items-center justify-center rounded-xl bg-white/10 text-white transition group-hover:bg-white/15">
                                                <Icon className="size-5" />
                                            </div>
                                            <h3 className="relative mt-4 text-base font-semibold text-white">
                                                {title}
                                            </h3>
                                            <p className="relative mt-3 text-sm leading-relaxed text-white/70">
                                                {description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section id="features" className="scroll-mt-24 px-5 pb-16 sm:px-6 md:px-12 md:pb-24">
                            <div className="mx-auto w-full max-w-6xl space-y-12">
                                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                    <div>
                                        <p className="text-[0.7rem] uppercase tracking-[0.4em] text-white/50 sm:text-xs">
                                            Platform DNA
                                        </p>
                                        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                                            Everything the scene needs to thrive
                                        </h2>
                                    </div>
                                    <p className="max-w-xl text-sm leading-relaxed text-white/65">
                                        From your personalized feed to location-based discovery, every feature is designed for authentic kink connection. Share posts, discover nearby members, join circles, and monetize your content when you're ready.
                                    </p>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {featureHighlights.map(({ title, description, icon: Icon }) => (
                                        <div
                                            key={title}
                                            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-amber-400/40 hover:bg-white/10 sm:p-8"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/0 via-transparent to-violet-600/0 opacity-0 transition-opacity group-hover:opacity-70" />
                                            <div className="relative flex size-11 items-center justify-center rounded-xl bg-white/10 text-white shadow-[0_20px_40px_-24px_rgba(249,115,22,0.6)] transition group-hover:scale-110 group-hover:bg-white/15">
                                                <Icon className="size-5" />
                                            </div>
                                            <h3 className="relative mt-6 text-xl font-semibold text-white">{title}</h3>
                                            <p className="relative mt-4 text-sm leading-relaxed text-white/70">
                                                {description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section id="trust" className="scroll-mt-24 px-5 pb-16 sm:px-6 md:px-12 md:pb-24">
                            <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5">
                                <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-0">
                                    <div className="relative p-8 sm:p-10 sm:pb-12 md:p-14">
                                        <div className="absolute -top-16 left-12 size-48 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 opacity-50 blur-3xl" />
                                        <p className="text-[0.7rem] uppercase tracking-[0.4em] text-white/50 sm:text-xs">
                                            Consent Is King
                                        </p>
                                        <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight">
                                            Safety, verification, and privacy built for the kink community.
                                        </h2>
                                        <ul className="mt-6 space-y-4 text-sm leading-relaxed text-white/70">
                                            <li className="flex items-start gap-3">
                                                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-400" />
                                                <span>ID verification for creators ensures authentic profiles. Consent-first design and robust moderation keep the community safe.</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-400" />
                                                <span>Control your audience with post settings—public, followers-only, subscribers, or pay-to-view. Your content, your rules.</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-400" />
                                                <span>Privacy controls let you manage location sharing, profile visibility, and traveler mode for when you're on the move.</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="relative border-t border-white/10 bg-gradient-to-br from-black/60 to-black/30 p-8 sm:p-10 md:border-l md:border-t-0 md:p-14">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(249,115,22,0.25),_transparent_55%)] opacity-60" />
                                        <div className="relative space-y-6 rounded-3xl border border-white/10 bg-black/40 p-8 shadow-[0_25px_65px_-35px_rgba(249,115,22,0.55)]">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-10 items-center justify-center rounded-xl bg-white/10">
                                                    <Users className="size-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">
                                                        VERIFIED CIRCLE: SILVER COLLAR
                                                    </p>
                                                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                                                        Invite-only · 783 members
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm leading-relaxed text-white/75">
                                                "Real Kink Men gave us the community tools we needed. The feed keeps us connected, Radar helps us find nearby members, and Circles let us organize around shared interests. The creator tools are optional but powerful when you're ready to monetize."
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 overflow-hidden rounded-full border border-amber-400/60">
                                                    <div className="h-full w-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-700" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">Father Torin</p>
                                                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                                                        Circle Curator · 12 years rigging
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section id="join" className="scroll-mt-24 px-5 pb-24 sm:px-6 md:px-12 md:pb-28">
                            <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 rounded-[2.5rem] border border-white/10 bg-white/5 px-6 py-12 text-center backdrop-blur sm:rounded-[3rem] sm:px-8 sm:py-14 md:px-12">
                                <p className="text-[0.7rem] uppercase tracking-[0.4em] text-white/50 sm:text-xs">
                                    Ready When You Are
                                </p>
                                <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                                    Join the doms, subs, pups, voyeurs, and creators building the next era of kink culture.
                                </h2>
                                <p className="max-w-2xl text-sm leading-relaxed text-white/70">
                                    Join the community and start connecting. Follow people, join circles, discover nearby members with Radar, and share your scenes. Turn on creator tools in Signals whenever you're ready to monetize your content.
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-4">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-8 py-3 text-base font-semibold text-white shadow-[0_25px_55px_-25px_rgba(249,115,22,0.55)] transition hover:scale-[1.03] sm:w-auto"
                                    >
                                        <Link href={isAuthenticated ? dashboard() : register()}>
                                            {isAuthenticated ? 'Open The Dashboard' : 'Claim Your Spot'}
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="lg"
                                        className="w-full rounded-full border-white/20 bg-white/5 px-7 py-3 text-base text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white sm:w-auto"
                                    >
                                        <Link href="#vision">Preview Our Playbook</Link>
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </main>

                    <footer className="border-t border-white/10 bg-black/40 px-5 py-8 text-sm text-white/60 sm:px-6 md:px-12">
                        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
                            <p className="text-balance">
                                © {new Date().getFullYear()} Real Kink Men. Fetish-forward. Consent-centered.
                            </p>
                            <div className="flex items-center justify-center gap-6 text-[0.7rem] uppercase tracking-[0.3em] text-white/50 sm:text-xs">
                                <a href="#trust" className="transition-colors hover:text-white">
                                    Safety
                                </a>
                                <a href="#features" className="transition-colors hover:text-white">
                                    Features
                                </a>
                                <a href="#join" className="transition-colors hover:text-white">
                                    Join
                                </a>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
            <AgeConsentModal />
            <CookiesBanner />
        </>
    );
}

