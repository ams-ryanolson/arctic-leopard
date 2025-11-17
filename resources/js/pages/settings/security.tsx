import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link } from '@inertiajs/react';
import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Shield } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Security settings',
        href: '/settings/security',
    },
];

export default function Security() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Security settings" />

            <SettingsLayout>
                <div className="space-y-8">
                    {/* Password Section */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(249,115,22,0.45)]">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-500/15 via-amber-400/5 to-transparent blur-2xl" />
                        </div>
                        <div className="relative space-y-6 p-6 sm:p-8">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-400/30 to-amber-500/20 p-3 shadow-[0_12px_30px_-18px_rgba(249,115,22,0.65)]">
                                    <Lock className="h-5 w-5 text-amber-300" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">
                                        Update password
                                    </h2>
                                    <p className="text-sm text-white/65">
                                        Ensure your account is using a long,
                                        random password to stay secure
                                    </p>
                                </div>
                            </div>

                            <Form
                                {...PasswordController.update.form()}
                                options={{
                                    preserveScroll: true,
                                }}
                                resetOnError={[
                                    'password',
                                    'password_confirmation',
                                    'current_password',
                                ]}
                                resetOnSuccess
                                onError={(errors) => {
                                    if (errors.password) {
                                        passwordInput.current?.focus();
                                    }

                                    if (errors.current_password) {
                                        currentPasswordInput.current?.focus();
                                    }
                                }}
                                className="space-y-6"
                            >
                                {({
                                    errors,
                                    processing,
                                    recentlySuccessful,
                                }) => (
                                    <>
                                        <div className="space-y-5 rounded-2xl border border-white/10 bg-black/40 p-5">
                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor="current_password"
                                                    className="text-sm font-medium text-white"
                                                >
                                                    Current password
                                                </Label>
                                                <Input
                                                    id="current_password"
                                                    ref={currentPasswordInput}
                                                    name="current_password"
                                                    type="password"
                                                    autoComplete="current-password"
                                                    placeholder="Enter your current password"
                                                />
                                                <InputError
                                                    message={
                                                        errors.current_password
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor="password"
                                                    className="text-sm font-medium text-white"
                                                >
                                                    New password
                                                </Label>
                                                <Input
                                                    id="password"
                                                    ref={passwordInput}
                                                    name="password"
                                                    type="password"
                                                    autoComplete="new-password"
                                                    placeholder="Enter your new password"
                                                />
                                                <InputError
                                                    message={errors.password}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor="password_confirmation"
                                                    className="text-sm font-medium text-white"
                                                >
                                                    Confirm password
                                                </Label>
                                                <Input
                                                    id="password_confirmation"
                                                    name="password_confirmation"
                                                    type="password"
                                                    autoComplete="new-password"
                                                    placeholder="Confirm your new password"
                                                />
                                                <InputError
                                                    message={
                                                        errors.password_confirmation
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                data-test="update-password-button"
                                                className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(16,185,129,0.5)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                                            >
                                                {processing
                                                    ? 'Saving...'
                                                    : 'Update password'}
                                            </Button>

                                            <Transition
                                                show={recentlySuccessful}
                                                enter="transition ease-in-out"
                                                enterFrom="opacity-0 scale-95"
                                                enterTo="opacity-100 scale-100"
                                                leave="transition ease-in-out"
                                                leaveFrom="opacity-100 scale-100"
                                                leaveTo="opacity-0 scale-95"
                                            >
                                                <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2">
                                                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                                                    <p className="text-sm font-medium text-emerald-300">
                                                        Saved
                                                    </p>
                                                </div>
                                            </Transition>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </div>
                    </div>

                    {/* Two-Factor Authentication Section */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(124,58,237,0.45)]">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-violet-500/15 via-violet-400/5 to-transparent blur-2xl" />
                        </div>
                        <div className="relative space-y-6 p-6 sm:p-8">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center rounded-xl border border-violet-400/40 bg-gradient-to-br from-violet-400/30 to-violet-500/20 p-3 shadow-[0_12px_30px_-18px_rgba(124,58,237,0.65)]">
                                    <Shield className="h-5 w-5 text-violet-300" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">
                                        Two-Factor Authentication
                                    </h2>
                                    <p className="text-sm text-white/65">
                                        Add an extra layer of security to your
                                        account
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                                <p className="mb-4 text-sm leading-relaxed text-white/70">
                                    Two-factor authentication adds an additional
                                    layer of security to your account by
                                    requiring a verification code in addition to
                                    your password.
                                </p>
                                <Button
                                    asChild
                                    className="rounded-full bg-gradient-to-r from-violet-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(124,58,237,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(124,58,237,0.5)]"
                                >
                                    <Link href="/settings/security/two-factor">
                                        Manage two-factor authentication
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
