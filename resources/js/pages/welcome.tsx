import AgeConsentModal from '@/components/age-consent-modal';
import AnnouncementBar from '@/components/announcement-bar';
import CookiesBanner from '@/components/cookies-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Flame,
    HeartHandshake,
    Lock,
    ShieldCheck,
    Sparkles,
    Users,
} from 'lucide-react';

const featureHighlights = [
    {
        title: 'Scene Feed',
        description:
            'Your personalized feed of posts from people you follow. Share scenes, drops, and moments with public, followers-only, or subscriber audiences. Like, comment, bookmark, and unlock pay-to-view content.',
        icon: Flame,
    },
    {
        title: 'Radar',
        description:
            "Discover nearby members based on location and shared interests. See mutual connections, compatibility scores, and circle memberships. Toggle traveler mode when you're on the move.",
        icon: Sparkles,
    },
    {
        title: 'Circles',
        description:
            'Join circles organized around interests, locations, or identities. Each circle has facets for different conversations. Post to specific circles and discover new communities.',
        icon: Users,
    },
];

const trustPoints = [
    {
        title: 'Verified & Safe',
        description:
            'ID verification for creators, consent-first design, and robust moderation keep the community authentic and safe.',
        icon: ShieldCheck,
    },
    {
        title: 'Privacy Controls',
        description:
            'Control who sees your posts—public, followers-only, subscribers, or pay-to-view. Manage profile visibility and traveler mode.',
        icon: Lock,
    },
    {
        title: 'Signals',
        description:
            "Creator tools for monetization. Tips, subscriptions, and pay-to-view content. Track earnings and manage payouts when you're ready.",
        icon: Sparkles,
    },
    {
        title: 'Real Connections',
        description:
            'Follow people, join circles, and discover nearby members through Radar. Build your network with compatibility matching.',
        icon: HeartHandshake,
    },
];

const communityStats = [
    { label: 'Now in Beta', value: 'Early Access' },
    { label: 'Features Shipping', value: 'Weekly' },
    { label: 'Community First', value: 'Always' },
];

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;
    const isAuthenticated = Boolean(auth?.user);

    return (
        <>
            <Head title="Real Kink Men · The Social Network for Gay Kink">
                <meta
                    name="description"
                    content="Real Kink Men is the social network for gay kink and fetish men. Share on your feed, discover nearby members with Radar, join circles, and monetize with Signals."
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
                                    <div className="flex items-center gap-2">
                                        <p className="text-[0.65rem] tracking-[0.35em] text-white/60 uppercase sm:text-xs">
                                            Real Kink Men
                                        </p>
                                        <Badge className="rounded-full border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[0.6rem] font-semibold tracking-wider text-amber-200 uppercase">
                                            Beta
                                        </Badge>
                                    </div>
                                    <p className="text-lg font-semibold tracking-tight">
                                        Enter the Scene
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
                                        <Link href={dashboard()}>
                                            Enter Dashboard
                                        </Link>
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
                                                <Link href={register()}>
                                                    Join The Network
                                                </Link>
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </header>

                    <main className="flex-1">
                        <section className="px-5 pt-10 pb-16 sm:px-6 md:px-12 md:pt-6 md:pb-24">
                            <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                                <div className="space-y-10">
                                    <div className="space-y-5 text-center md:text-left">
                                        <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
                                            The social network for{' '}
                                            <span className="bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 bg-clip-text text-transparent">
                                                gay kink & fetish men
                                            </span>
                                            .
                                        </h1>
                                        <p className="text-base leading-relaxed text-balance text-white/70 sm:text-lg">
                                            Share drops on your feed, discover
                                            nearby members with Radar, join
                                            circles, and connect with your
                                            community. Turn on Signals when
                                            you're ready to monetize with tips,
                                            subscriptions, and pay-to-view
                                            content.
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                                        <Button
                                            asChild
                                            size="lg"
                                            className="w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-9 py-3 text-base font-semibold text-white shadow-[0_25px_55px_-20px_rgba(249,115,22,0.5)] transition hover:scale-[1.03] sm:w-auto"
                                        >
                                            <Link
                                                href={
                                                    isAuthenticated
                                                        ? dashboard()
                                                        : register()
                                                }
                                            >
                                                {isAuthenticated
                                                    ? 'Go to Dashboard'
                                                    : 'Join the Beta'}
                                            </Link>
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                                        {communityStats.map((stat) => (
                                            <div
                                                key={stat.label}
                                                className="group rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center backdrop-blur transition hover:border-white/20 hover:bg-white/10 sm:text-left"
                                            >
                                                <p className="text-2xl font-semibold text-white transition group-hover:scale-105">
                                                    {stat.value}
                                                </p>
                                                <p className="mt-1.5 text-xs font-medium tracking-[0.2em] text-white/60 uppercase">
                                                    {stat.label}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute -inset-6 -z-10 rounded-[2.75rem] bg-gradient-to-br from-amber-400/40 via-rose-500/30 to-indigo-500/30 blur-3xl" />
                                    <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 shadow-[0_35px_60px_-25px_rgba(0,0,0,0.65)]">
                                        <div className="absolute -top-20 -right-20 size-56 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-700 opacity-60 blur-3xl" />
                                        <div className="absolute -bottom-24 -left-10 size-52 rounded-full bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-700 opacity-40 blur-3xl" />

                                        <div className="relative space-y-6 p-6 sm:p-8">
                                            <div className="flex flex-col items-start gap-2 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
                                                <span>What's Inside</span>
                                                <Badge className="rounded-full border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wider text-amber-200 uppercase">
                                                    Beta
                                                </Badge>
                                            </div>
                                            <div className="rounded-2xl border border-white/10 bg-black/50 p-5 backdrop-blur transition hover:border-white/20 sm:p-6">
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 shadow-[0_15px_30px_-15px_rgba(249,115,22,0.45)]">
                                                        <Flame className="size-7" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm tracking-[0.25em] text-white/50 uppercase">
                                                            Scene Feed
                                                        </p>
                                                        <p className="mt-1 text-lg font-semibold tracking-tight text-white">
                                                            Share drops with
                                                            your audience
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="mt-4 text-sm leading-relaxed text-white/70">
                                                    Post scenes, updates, and
                                                    moments. Control who sees
                                                    what—public, followers-only,
                                                    subscribers, or pay-to-view.
                                                    Like, comment, bookmark, and
                                                    amplify.
                                                </p>
                                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:border-white/20 hover:bg-white/10">
                                                        <p className="text-xs tracking-[0.3em] text-white/60 uppercase">
                                                            Radar
                                                        </p>
                                                        <p className="mt-1 text-base font-semibold text-white">
                                                            Nearby discovery
                                                        </p>
                                                    </div>
                                                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:border-white/20 hover:bg-white/10">
                                                        <p className="text-xs tracking-[0.3em] text-white/60 uppercase">
                                                            Circles
                                                        </p>
                                                        <p className="mt-1 text-base font-semibold text-white">
                                                            Community groups
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:grid-cols-2">
                                                <div>
                                                    <p className="text-xs tracking-[0.3em] text-white/60 uppercase">
                                                        Signals
                                                    </p>
                                                    <p className="mt-2 text-base font-semibold text-white">
                                                        Creator monetization
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs tracking-[0.3em] text-white/60 uppercase">
                                                        Messages
                                                    </p>
                                                    <p className="mt-2 text-base font-semibold text-white">
                                                        Direct conversations
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section
                            id="vision"
                            className="scroll-mt-24 px-5 pb-16 sm:px-6 md:px-12 md:pb-24"
                        >
                            <div className="mx-auto grid w-full max-w-6xl gap-14 rounded-[2rem] border border-white/10 bg-white/5 px-6 py-10 backdrop-blur sm:px-8 sm:py-12 md:gap-16 md:rounded-[2.5rem] md:px-12 md:py-16 lg:grid-cols-[1.1fr_0.9fr]">
                                <div className="space-y-6 text-center md:text-left">
                                    <p className="text-[0.7rem] tracking-[0.4em] text-white/50 uppercase sm:text-xs">
                                        Why Real Kink Men
                                    </p>
                                    <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
                                        Built by kink men who were tired of
                                        vanilla platforms muting our scenes.
                                    </h2>
                                    <p className="text-base leading-relaxed text-white/70">
                                        We wanted a social network where fetish
                                        talk comes first, where handles feel
                                        safe, and where our communities can
                                        breathe. So we built one.
                                    </p>
                                    <p className="text-base leading-relaxed text-white/70">
                                        Your feed, your audience—share publicly,
                                        with followers, subscribers, or behind a
                                        paywall. Radar helps you discover nearby
                                        members. Circles let you organize around
                                        shared interests. And Signals gives you
                                        creator tools when you're ready to
                                        monetize.
                                    </p>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    {trustPoints.map(
                                        ({
                                            title,
                                            description,
                                            icon: Icon,
                                        }) => (
                                            <div
                                                key={title}
                                                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 text-left transition hover:border-white/20 hover:bg-white/15"
                                            >
                                                <div className="absolute top-1/2 -left-8 size-24 -translate-y-1/2 rounded-full bg-amber-400/15 blur-2xl transition group-hover:bg-amber-400/25" />
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
                                        ),
                                    )}
                                </div>
                            </div>
                        </section>

                        <section
                            id="features"
                            className="scroll-mt-24 px-5 pb-16 sm:px-6 md:px-12 md:pb-24"
                        >
                            <div className="mx-auto w-full max-w-6xl space-y-12">
                                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                    <div>
                                        <p className="text-[0.7rem] tracking-[0.4em] text-white/50 uppercase sm:text-xs">
                                            Core Features
                                        </p>
                                        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                                            Built for the scene
                                        </h2>
                                    </div>
                                    <p className="max-w-xl text-sm leading-relaxed text-white/65">
                                        Your feed, location-based discovery, and
                                        community circles—every feature is
                                        designed for authentic kink connection.
                                    </p>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {featureHighlights.map(
                                        ({
                                            title,
                                            description,
                                            icon: Icon,
                                        }) => (
                                            <div
                                                key={title}
                                                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-amber-400/40 hover:bg-white/10 sm:p-8"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/0 via-transparent to-violet-600/0 opacity-0 transition-opacity group-hover:opacity-70" />
                                                <div className="relative flex size-11 items-center justify-center rounded-xl bg-white/10 text-white shadow-[0_20px_40px_-24px_rgba(249,115,22,0.6)] transition group-hover:scale-110 group-hover:bg-white/15">
                                                    <Icon className="size-5" />
                                                </div>
                                                <h3 className="relative mt-6 text-xl font-semibold text-white">
                                                    {title}
                                                </h3>
                                                <p className="relative mt-4 text-sm leading-relaxed text-white/70">
                                                    {description}
                                                </p>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </section>

                        <section
                            id="trust"
                            className="scroll-mt-24 px-5 pb-16 sm:px-6 md:px-12 md:pb-24"
                        >
                            <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5">
                                <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-0">
                                    <div className="relative p-8 sm:p-10 sm:pb-12 md:p-14">
                                        <div className="absolute -top-16 left-12 size-48 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 opacity-50 blur-3xl" />
                                        <p className="text-[0.7rem] tracking-[0.4em] text-white/50 uppercase sm:text-xs">
                                            Trust & Safety
                                        </p>
                                        <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-tight">
                                            Consent-first design, built for our
                                            community.
                                        </h2>
                                        <ul className="mt-6 space-y-4 text-sm leading-relaxed text-white/70">
                                            <li className="flex items-start gap-3">
                                                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-400" />
                                                <span>
                                                    ID verification for creators.
                                                    Robust moderation keeps the
                                                    community authentic and safe.
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-400" />
                                                <span>
                                                    Audience controls on every
                                                    post—public, followers-only,
                                                    subscribers, or pay-to-view.
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-400" />
                                                <span>
                                                    Privacy settings for location,
                                                    profile visibility, and
                                                    traveler mode.
                                                </span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="relative border-t border-white/10 bg-gradient-to-br from-black/60 to-black/30 p-8 sm:p-10 md:border-t-0 md:border-l md:p-14">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(249,115,22,0.25),_transparent_55%)] opacity-60" />
                                        <div className="relative space-y-6 rounded-3xl border border-white/10 bg-black/40 p-8 shadow-[0_25px_65px_-35px_rgba(249,115,22,0.55)]">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-10 items-center justify-center rounded-xl bg-white/10">
                                                    <Sparkles className="size-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">
                                                        Beta Feedback
                                                    </p>
                                                    <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                                        From our early community
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm leading-relaxed text-white/75">
                                                "Finally a platform that gets
                                                it. The feed keeps us connected,
                                                Radar helps find nearby members,
                                                and Circles let us organize.
                                                Signals is there when I'm ready
                                                to monetize—no pressure."
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 overflow-hidden rounded-full border border-amber-400/60">
                                                    <div className="h-full w-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-700" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">
                                                        Beta Tester
                                                    </p>
                                                    <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                                        Early Access Member
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section
                            id="join"
                            className="scroll-mt-24 px-5 pb-24 sm:px-6 md:px-12 md:pb-28"
                        >
                            <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 rounded-[2.5rem] border border-white/10 bg-white/5 px-6 py-12 text-center backdrop-blur sm:rounded-[3rem] sm:px-8 sm:py-14 md:px-12">
                                <p className="text-[0.7rem] tracking-[0.4em] text-white/50 uppercase sm:text-xs">
                                    Join the Beta
                                </p>
                                <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                                    Help us build the social network for kink.
                                </h2>
                                <p className="max-w-2xl text-sm leading-relaxed text-white/70">
                                    We're in beta, shipping features weekly
                                    based on community feedback. Join now to
                                    shape what comes next—follow people, join
                                    circles, discover nearby members, and share
                                    your scenes.
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-4">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-8 py-3 text-base font-semibold text-white shadow-[0_25px_55px_-25px_rgba(249,115,22,0.55)] transition hover:scale-[1.03] sm:w-auto"
                                    >
                                        <Link
                                            href={
                                                isAuthenticated
                                                    ? dashboard()
                                                    : register()
                                            }
                                        >
                                            {isAuthenticated
                                                ? 'Go to Dashboard'
                                                : 'Join the Beta'}
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="lg"
                                        className="w-full rounded-full border-white/20 bg-white/5 px-7 py-3 text-base text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white sm:w-auto"
                                    >
                                        <Link href="#vision">
                                            Learn More
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </main>

                    <footer className="border-t border-white/10 bg-black/40 px-5 py-8 text-sm text-white/60 sm:px-6 md:px-12">
                        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
                            <p className="text-balance">
                                © {new Date().getFullYear()} Real Kink Men.
                                Currently in beta.
                            </p>
                            <div className="flex items-center justify-center gap-6 text-[0.7rem] tracking-[0.3em] text-white/50 uppercase sm:text-xs">
                                <a
                                    href="#trust"
                                    className="transition-colors hover:text-white"
                                >
                                    Trust & Safety
                                </a>
                                <a
                                    href="#features"
                                    className="transition-colors hover:text-white"
                                >
                                    Features
                                </a>
                                <a
                                    href="#join"
                                    className="transition-colors hover:text-white"
                                >
                                    Join Beta
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
