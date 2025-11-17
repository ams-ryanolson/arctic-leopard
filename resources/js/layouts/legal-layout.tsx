import { type ReactNode } from 'react';
import { Head, Link } from '@inertiajs/react';
import AnnouncementBar from '@/components/announcement-bar';
import { Users } from 'lucide-react';

export default function LegalLayout({ children, title }: { children: ReactNode; title?: string }) {
    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-neutral-950 text-white">
            {title && <Head title={title} />}
            {/* Background layers to match welcome */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.28),_transparent_55%)]" />
                <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-amber-500/15 via-transparent to-transparent blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.2),_transparent_60%)] blur-2xl" />
            </div>

            <AnnouncementBar />
            {/* Header (compact brand chip) */}
            <header className="px-5 py-6 sm:px-6 md:px-12">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur sm:rounded-full sm:px-6 sm:py-3">
                    <div className="flex items-center gap-3">
                        <div className="relative flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-700 shadow-[0_0_45px_rgba(249,115,22,0.45)]">
                            <Users className="size-5" />
                        </div>
                        <div className="leading-tight">
                            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/60 sm:text-xs">
                                Real Kink Men
                            </p>
                            <p className="text-sm font-semibold tracking-tight text-white">
                                Legal
                            </p>
                        </div>
                    </div>
                    <nav className="hidden items-center gap-6 text-xs md:flex">
                        <Link href="/legal/terms" className="text-white/70 transition-colors hover:text-white">Terms</Link>
                        <Link href="/legal/privacy" className="text-white/70 transition-colors hover:text-white">Privacy</Link>
                        <Link href="/legal/guidelines" className="text-white/70 transition-colors hover:text-white">Guidelines</Link>
                        <Link href="/legal/cookies" className="text-white/70 transition-colors hover:text-white">Cookies</Link>
                        <Link href="/legal/dmca" className="text-white/70 transition-colors hover:text-white">DMCA</Link>
                    </nav>
                </div>
            </header>

            {/* Content */}
            <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-20 pt-4 sm:px-8 md:px-12">
                {children}
            </main>

            {/* Footer to match welcome tone */}
            <footer className="mt-auto border-t border-white/10 bg-black/40 px-5 py-8 text-sm text-white/60 sm:px-6 md:px-12">
                <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
                    <p className="text-balance">
                        © {new Date().getFullYear()} Real Kink Men. Fetish-forward. Consent-centered.
                    </p>
                    <div className="flex items-center justify-center gap-6 text-[0.7rem] uppercase tracking-[0.3em] text-white/50 sm:text-xs">
                        <Link href="/legal/privacy" className="transition-colors hover:text-white">Privacy</Link>
                        <Link href="/legal/cookies" className="transition-colors hover:text-white">Cookies</Link>
                        <Link href="/legal/terms" className="transition-colors hover:text-white">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}


