import { Head, Link, router, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { ArrowRight, MailCheck, RefreshCcw, ShieldCheck } from 'lucide-react';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';

export default function VerifyEmail({ status }: { status?: string }) {
    const resend = useForm({});

    const handleResend = () => {
        resend.post('/email/verification-notification', {
            preserveScroll: true,
        });
    };

    const handleLogout = () => {
        router.post(logout.url());
    };

    return (
        <AuthLayout
            title="Check your inbox"
            description="We just sent you one more step. Confirm your email so we know you’re the one steering this scene."
        >
            <Head title="Verify Email" />

            <div className="space-y-6 text-left text-white">
                <div className="flex items-start gap-4 rounded-3xl border border-white/10 bg-black/35 px-5 py-6 shadow-[0_45px_120px_-50px_rgba(249,115,22,0.55)]">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 text-black shadow-[0_25px_60px_-32px_rgba(249,115,22,0.6)]">
                        <ShieldCheck className="size-6" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Final lock-in</p>
                        <h2 className="text-xl font-semibold tracking-tight text-white">Verify it’s really you</h2>
                        <p className="text-sm text-white/70">
                            Confirming your email keeps payouts, DMs, and private content safe. We just sent a link—pop into your inbox to finish claiming your scene.
                        </p>
                    </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 px-5 py-6 shadow-[0_40px_110px_-55px_rgba(249,115,22,0.5)]">
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/45">
                        <MailCheck className="size-4" />
                        What to do next
                    </div>
                    <ol className="grid gap-3 text-sm text-white/75">
                        <li className="flex gap-2">
                            <span className="inline-flex size-5 items-center justify-center rounded-full border border-white/25 text-xs font-semibold text-white/75">
                                1
                            </span>
                            Check your inbox and spam folders for our verification email.
                        </li>
                        <li className="flex gap-2">
                            <span className="inline-flex size-5 items-center justify-center rounded-full border border-white/25 text-xs font-semibold text-white/75">
                                2
                            </span>
                            Tap the “Verify Email” button in that message to confirm it’s you.
                        </li>
                        <li className="flex gap-2">
                            <span className="inline-flex size-5 items-center justify-center rounded-full border border-white/25 text-xs font-semibold text-white/75">
                                3
                            </span>
                            Come back here to continue onboarding and build out your profile.
                        </li>
                    </ol>
                    {status === 'verification-link-sent' && (
                        <p className="rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-200">
                            We just sent another link—give it a minute, then refresh your inbox.
                        </p>
                    )}
                </div>

                <div className="space-y-3 rounded-3xl border border-white/10 bg-black/25 px-5 py-6 shadow-[0_28px_95px_-58px_rgba(0,0,0,0.6)]">
                    <h3 className="text-base font-semibold text-white">Link never came?</h3>
                    <p className="text-sm text-white/65">
                        Resend the verification email. If you need to switch addresses, log out and sign back in with the correct one.
                    </p>
                    <Button
                        type="button"
                        onClick={handleResend}
                        disabled={resend.processing}
                        className="inline-flex w-full items-center justify-center gap-2 bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 text-white shadow-[0_20px_45px_-25px_rgba(249,115,22,0.6)] hover:scale-[1.01]"
                    >
                        {resend.processing ? (
                            <>
                                <RefreshCcw className="size-4 animate-spin" /> Sending…
                            </>
                        ) : (
                            <>
                                Resend verification email
                                <ArrowRight className="size-4" />
                            </>
                        )}
                    </Button>
                    <p className="text-xs text-white/55">
                        Ready to use another email?{' '}
                        <Link href={logout.url()} className="text-white underline underline-offset-4">
                            Log out and restart
                        </Link>
                        .
                    </p>
                </div>

                <div className="flex flex-col items-center gap-2 text-xs text-white/60">
                    <p>Wrong account?</p>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleLogout}
                        className="text-white/75 hover:text-white"
                    >
                        Log out
                    </Button>
                </div>
            </div>
        </AuthLayout>
    );
}
