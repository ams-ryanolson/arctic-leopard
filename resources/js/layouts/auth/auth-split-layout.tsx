import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import { Flame, MessageCircle, ShieldCheck } from 'lucide-react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    const { quote } = usePage<SharedData>().props;
    const brandName = 'Real Kink Men';

    const highlights = [
        {
            title: 'Consent-First Spaces',
            description: 'Verified onboarding and layered privacy controls in every interaction.',
            icon: ShieldCheck,
        },
        {
            title: 'Creator-Driven Monetization',
            description: 'Stack subscriptions, tips, and premium scenes without platform friction.',
            icon: Flame,
        },
        {
            title: 'Intimate Communities',
            description: 'DMs, kink circles, and aftercare threads to keep your scene connected.',
            icon: MessageCircle,
        },
    ];

    return (
        <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.25),_transparent_55%)]" />
                <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-amber-500/25 via-transparent to-transparent blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(79,70,229,0.35),_transparent_60%)] blur-3xl" />
            </div>

            <div className="relative grid min-h-screen w-full lg:grid-cols-2">
                <aside className="relative hidden overflow-hidden lg:block">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-black/40 to-violet-600/20" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.08),_transparent_55%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,_rgba(14,165,233,0.25),_transparent_55%)]" />

                    <div className="relative flex h-full flex-col justify-between px-14 py-16 xl:px-18">
                        <Link
                            href={home()}
                            className="flex items-center gap-4 text-white/80 transition hover:text-white"
                        >
                            <div className="flex size-14 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 shadow-[0_28px_60px_-30px_rgba(249,115,22,0.6)]">
                                <AppLogoIcon className="size-6 fill-current text-white" />
                            </div>
                            <div className="text-left leading-tight">
                                <p className="text-sm uppercase tracking-[0.4em] text-white/60">
                                    {brandName}
                                </p>
                                <p className="text-[1.45rem] font-semibold tracking-tight text-white">
                                    Live Your Fetish Out Loud
                                </p>
                            </div>
                        </Link>

                        <div className="space-y-8">
                            <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white">
                                Enter the underground network where gay kink creators own the spotlight.
                            </h2>
                            <p className="max-w-xl text-base leading-relaxed text-white/70">
                                Build paywalled experiences, run tip trains, and keep your circles close with consent
                                systems, privacy shields, and community tooling designed for raw expression.
                            </p>
                            <ul className="grid gap-5 text-sm text-white/75">
                                {highlights.map(({ title: itemTitle, description: itemDescription, icon: Icon }) => (
                                    <li
                                        key={itemTitle}
                                        className="flex gap-4 rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur"
                                    >
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white">
                                            <Icon className="size-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{itemTitle}</p>
                                            <p className="mt-1 text-white/70">{itemDescription}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {quote && (
                            <div className="mt-10 rounded-[2.5rem] border border-white/10 bg-white/5 p-8 text-sm text-white/75 backdrop-blur">
                                <p className="text-lg font-medium text-white">
                                    &ldquo;{quote.message}&rdquo;
                                </p>
                                <p className="mt-4 text-xs uppercase tracking-[0.35em] text-white/40">
                                    {quote.author}
                                </p>
                            </div>
                        )}
                    </div>
                </aside>

                <main className="relative flex min-h-screen items-center justify-center px-6 py-14 sm:px-8 md:px-12">
                    <div className="w-full max-w-xl space-y-10">
                        <div className="flex flex-col items-center gap-4 text-center lg:hidden">
                            <Link
                                href={home()}
                                className="flex items-center gap-3 text-white/70 transition hover:text-white"
                            >
                                <div className="flex size-12 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 shadow-[0_24px_55px_-28px_rgba(249,115,22,0.55)]">
                                    <AppLogoIcon className="size-6 fill-current text-white" />
                                </div>
                                <span className="text-lg font-semibold tracking-tight text-white">
                                    {brandName}
                                </span>
                            </Link>
                            <p className="text-sm leading-relaxed text-white/65">
                                Claim your creator throne, launch premium scenes, and keep the aftercare flowing from
                                one fetish-forward control room.
                            </p>
                        </div>

                        <div className="rounded-[2rem] border border-white/12 bg-black/60 px-6 py-9 text-white shadow-[0_25px_65px_-35px_rgba(0,0,0,0.65)] backdrop-blur sm:px-8">
                            <div className="space-y-3 text-center">
                                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                                    {title}
                                </h1>
                                {description && (
                                    <p className="text-sm leading-relaxed text-white/70">{description}</p>
                                )}
                            </div>
                            <div className="mt-8 space-y-6">{children}</div>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
                            <span className="size-1.5 rounded-full bg-amber-400" />
                            <span>Safe · Verified · Fetish Sovereign</span>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
