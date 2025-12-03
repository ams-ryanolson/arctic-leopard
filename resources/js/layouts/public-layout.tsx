import AnnouncementBar from '@/components/announcement-bar';
import { Button } from '@/components/ui/button';
import { login, register } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { type ReactNode } from 'react';

interface PublicLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    showAuthButtons?: boolean;
}

export default function PublicLayout({
    children,
    title,
    subtitle,
    showAuthButtons = true,
}: PublicLayoutProps) {
    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-neutral-950 text-white">
            {title && <Head title={title} />}

            {/* Background layers */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.28),_transparent_55%)]" />
                <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-amber-500/15 via-transparent to-transparent blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.2),_transparent_60%)] blur-2xl" />
            </div>

            <AnnouncementBar />

            {/* Header */}
            <header className="px-5 py-6 sm:px-6 md:px-12">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:rounded-full sm:px-6 sm:py-3">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="relative flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-700 shadow-[0_0_45px_rgba(249,115,22,0.45)]">
                            <Users className="size-5" />
                        </div>
                        <div className="leading-tight">
                            <p className="text-[0.65rem] tracking-[0.35em] text-white/60 uppercase sm:text-xs">
                                Real Kink Men
                            </p>
                            {subtitle && (
                                <p className="text-sm font-semibold tracking-tight text-white">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </Link>

                    {showAuthButtons && (
                        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                            <Button
                                asChild
                                variant="ghost"
                                className="w-full text-white/70 hover:bg-white/5 hover:text-white sm:w-auto"
                            >
                                <Link href={login()}>Log in</Link>
                            </Button>
                            <Button
                                asChild
                                className="w-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-5 text-base font-semibold tracking-tight text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-[1.02] hover:bg-gradient-to-r hover:from-amber-400 hover:via-rose-500 hover:to-violet-600 sm:w-auto"
                            >
                                <Link href={register()}>Join Free</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-5 pt-4 pb-20 sm:px-8 md:px-12">
                {children}
            </main>

            {/* Footer */}
            <footer className="mt-auto border-t border-white/10 bg-black/40 px-5 py-8 text-sm text-white/60 sm:px-6 md:px-12">
                <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
                    <p className="text-balance">
                        © {new Date().getFullYear()} Real Kink Men.
                        Fetish-forward. Consent-centered.
                    </p>
                    <div className="flex items-center justify-center gap-6 text-[0.7rem] tracking-[0.3em] text-white/50 uppercase sm:text-xs">
                        <Link
                            href="/legal/privacy"
                            className="transition-colors hover:text-white"
                        >
                            Privacy
                        </Link>
                        <Link
                            href="/legal/terms"
                            className="transition-colors hover:text-white"
                        >
                            Terms
                        </Link>
                        <Link
                            href="/legal/guidelines"
                            className="transition-colors hover:text-white"
                        >
                            Guidelines
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

