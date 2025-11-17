import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Compass, MapPin, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { dashboard, login, register } from '@/routes';
import onboardingRoutes from '@/routes/onboarding';
import { type SharedData } from '@/types';

type NotFoundProps = {
    status?: number;
};

const quickLinks = [
    {
        title: 'Home Base',
        description: 'Jump to the welcome experience and explore what’s new.',
        href: '/',
        icon: Sparkles,
    },
    {
        title: 'Onboarding',
        description: 'Finish setting up your profile, visuals, and circles.',
        href: onboardingRoutes.start.url(),
        icon: Compass,
    },
    {
        title: 'Events',
        description: 'Browse upcoming rituals, workshops, and circle meetups.',
        href: '/events',
        icon: MapPin,
    },
];

export default function NotFound({ status = 404 }: NotFoundProps) {
    const { auth } = usePage<SharedData>().props;
    const isAuthenticated = Boolean(auth?.user);

    const primaryHref = isAuthenticated ? dashboard() : '/';
    const primaryLabel = isAuthenticated ? 'Enter dashboard' : 'Return home';
    const secondaryHref = isAuthenticated ? '/signals' : login();
    const secondaryLabel = isAuthenticated ? 'View signals' : 'Log in';

    return (
        <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
            <Head title={`${status} · Page Not Found`} />

            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.22),_transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(99,102,241,0.25),_transparent_60%)]" />
                <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-amber-500/20 via-transparent to-transparent blur-3xl" />
                <div className="absolute top-1/4 -left-56 size-[520px] rounded-full bg-rose-500/15 blur-3xl" />
                <div className="absolute -right-48 bottom-10 size-[460px] rounded-full bg-sky-500/15 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12 sm:px-8 lg:px-12">
                <header className="flex flex-col gap-3 text-xs tracking-[0.35em] text-white/55 uppercase">
                    <span>Signal lost</span>
                    <span>{status} · Page not found</span>
                </header>

                <main className="mt-12 flex flex-1 flex-col gap-12">
                    <div className="flex flex-col gap-8 rounded-4xl border border-white/10 bg-white/5 p-8 shadow-[0_55px_130px_-60px_rgba(249,115,22,0.55)] backdrop-blur lg:flex-row lg:items-center lg:gap-12 lg:p-10">
                        <div className="space-y-6 lg:flex-1">
                            <p className="text-6xl font-semibold tracking-tight sm:text-7xl md:text-8xl">
                                <span className="bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 bg-clip-text text-transparent">
                                    {status}
                                </span>
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-[2.5rem]">
                                We can’t locate that scene.
                            </h1>
                            <p className="text-sm leading-relaxed text-white/70">
                                The URL you followed is either private, retired,
                                or never existed. Choose a destination below to
                                keep your momentum flowing.
                            </p>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                                <Button
                                    asChild
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_55px_-28px_rgba(249,115,22,0.6)] transition hover:scale-[1.01]"
                                >
                                    <Link href={primaryHref}>
                                        {primaryLabel}
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm text-white transition hover:border-white/35 hover:bg-white/15"
                                >
                                    <Link href={secondaryHref}>
                                        {secondaryLabel}
                                    </Link>
                                </Button>
                                {!isAuthenticated && (
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="inline-flex items-center justify-center gap-2 rounded-full border-white/25 bg-white/10 px-6 py-3 text-sm text-white transition hover:border-white/45 hover:bg-white/15"
                                    >
                                        <Link href={register()}>
                                            Join the network
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="relative flex flex-1 items-center justify-center">
                            <div className="absolute inset-0 -translate-y-6 rotate-6 rounded-3xl border border-dashed border-white/15 bg-white/5 blur-lg" />
                            <div className="relative w-full rounded-3xl border border-white/15 bg-black/30 p-6 text-left shadow-[0_45px_120px_-60px_rgba(99,102,241,0.45)]">
                                <p className="text-[0.65rem] tracking-[0.4em] text-white/45 uppercase">
                                    Navigator note
                                </p>
                                <p className="mt-4 text-sm font-semibold text-white">
                                    “Paths shift fast. When a link fades, head
                                    back to your dashboard or queue up circles
                                    to keep your signal strong.”
                                </p>
                                <p className="mt-6 text-xs text-white/50">
                                    — Real Kink Men Concierge
                                </p>
                            </div>
                        </div>
                    </div>

                    <section className="space-y-5">
                        <p className="text-[0.7rem] tracking-[0.35em] text-white/50 uppercase">
                            Quick links
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {quickLinks.map(
                                ({ title, description, href, icon: Icon }) => (
                                    <Link
                                        key={title}
                                        href={href}
                                        className="group relative flex h-full flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-left text-white transition hover:border-white/30 hover:bg-white/10"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="rounded-2xl border border-white/10 bg-white/10 p-2.5 text-white">
                                                <Icon className="size-5" />
                                            </span>
                                            <p className="text-sm font-semibold">
                                                {title}
                                            </p>
                                        </div>
                                        <p className="text-xs leading-relaxed text-white/65">
                                            {description}
                                        </p>
                                    </Link>
                                ),
                            )}
                        </div>
                    </section>
                </main>

                <footer className="mt-16 flex flex-wrap items-center gap-3 text-xs tracking-[0.3em] text-white/45 uppercase">
                    <Button
                        type="button"
                        variant="ghost"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white transition hover:border-white/30 hover:bg-white/10"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="size-4" />
                        Go back
                    </Button>
                    <span>Need help? Reach out to the concierge any time.</span>
                </footer>
            </div>
        </div>
    );
}
