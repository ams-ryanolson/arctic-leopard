import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({ status, canResetPassword, canRegister }: LoginProps) {
    return (
        <AuthLayout
            title="Welcome back, creator"
            description="Log in to keep your feed, DMs, and premium drops humming."
        >
            <Head title="Log in" />

            <div className="space-y-6">
                {status && (
                    <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-center text-xs font-medium uppercase tracking-[0.3em] text-emerald-200">
                        {status}
                    </div>
                )}

                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-4 text-white shadow-[0_20px_45px_-35px_rgba(249,115,22,0.55)]">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.25),_transparent_55%)] opacity-60" />
                    <div className="relative flex items-center gap-4">
                        <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 text-white shadow-[0_18px_45px_-28px_rgba(249,115,22,0.55)]">
                            <ShieldCheck className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold tracking-tight text-white">Safeguarded sessions</p>
                            <p className="text-xs text-white/70">
                                Encrypted login, consent-first moderation, and 2FA-ready security tuned for fetish creators.
                            </p>
                        </div>
                    </div>
                </div>

                <Form {...store.form()} resetOnSuccess={["password"]} className="space-y-6 text-left">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-5">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="you@realkink.men"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">Password</Label>
                                        {canResetPassword && (
                                            <TextLink href={request()} className="ml-auto text-sm" tabIndex={5}>
                                                Forgot password?
                                            </TextLink>
                                        )}
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Password"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex items-center gap-3">
                                    <Checkbox id="remember" name="remember" tabIndex={3} />
                                    <Label htmlFor="remember">Remember me on this device</Label>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>

                            {canRegister && (
                                <div className="text-center text-sm text-white/65">
                                    New here?{' '}
                                    <TextLink href={register()} tabIndex={6} className="text-white">
                                        Start your creator profile
                                    </TextLink>
                                </div>
                            )}
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}
