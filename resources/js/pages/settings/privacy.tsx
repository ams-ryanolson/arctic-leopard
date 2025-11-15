import PrivacyController from '@/actions/App/Http/Controllers/Settings/PrivacyController';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, UserX } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Privacy settings',
        href: '/settings/privacy',
    },
];

export default function Privacy({
    requiresFollowApproval,
}: {
    requiresFollowApproval: boolean;
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Privacy settings" />

            <SettingsLayout>
                <div className="space-y-8">
                    {/* Privacy Overview Section */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(59,130,246,0.45)]">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-blue-500/15 via-blue-400/5 to-transparent blur-2xl" />
                        </div>
                        <div className="relative space-y-6 p-6 sm:p-8">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-400/30 to-blue-500/20 border border-blue-400/40 p-3 shadow-[0_12px_30px_-18px_rgba(59,130,246,0.65)]">
                                    <Shield className="h-5 w-5 text-blue-300" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Privacy settings</h2>
                                    <p className="text-sm text-white/65">
                                        Control who can follow you and manage your blocked users
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Form
                        {...PrivacyController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-8"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                {/* Follow Approvals Section */}
                                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(16,185,129,0.45)]">
                                    <div className="pointer-events-none absolute inset-0">
                                        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-emerald-500/15 via-emerald-400/5 to-transparent blur-2xl" />
                                    </div>
                                    <div className="relative space-y-6 p-6 sm:p-8">
                                        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-2 flex-1">
                                                    <Label
                                                        htmlFor="requires_follow_approval"
                                                        className="text-base font-semibold text-white"
                                                    >
                                                        Follow approvals
                                                    </Label>
                                                    <p className="text-sm leading-relaxed text-white/70">
                                                        Require people to request permission before they can follow you.
                                                        Pending requests appear in your notifications for review.
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <input
                                                        type="hidden"
                                                        name="requires_follow_approval"
                                                        value="0"
                                                    />
                                                    <input
                                                        id="requires_follow_approval"
                                                        name="requires_follow_approval"
                                                        type="checkbox"
                                                        value="1"
                                                        defaultChecked={requiresFollowApproval}
                                                        className="h-5 w-5 rounded border-white/30 bg-white/10 accent-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                                                    />
                                                </div>
                                            </div>
                                            <InputError
                                                className="mt-3"
                                                message={errors.requires_follow_approval}
                                            />
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                data-test="update-privacy-button"
                                                className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                            >
                                                {processing ? 'Saving...' : 'Save changes'}
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
                                                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                                    <p className="text-sm font-medium text-emerald-300">
                                                        Saved
                                                    </p>
                                                </div>
                                            </Transition>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </Form>

                    {/* Blocked Users Section */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(236,72,153,0.45)]">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-rose-500/15 via-rose-400/5 to-transparent blur-2xl" />
                        </div>
                        <div className="relative space-y-6 p-6 sm:p-8">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-rose-400/30 to-rose-500/20 border border-rose-400/40 p-3 shadow-[0_12px_30px_-18px_rgba(236,72,153,0.65)]">
                                    <UserX className="h-5 w-5 text-rose-300" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Blocked users</h2>
                                    <p className="text-sm text-white/65">
                                        Manage users you have blocked
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                                <p className="mb-4 text-sm leading-relaxed text-white/70">
                                    Blocked users cannot see your posts, send you messages, or follow you. You can unblock users at any time.
                                </p>
                                <Button
                                    asChild
                                    className="rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(236,72,153,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(236,72,153,0.5)]"
                                >
                                    <Link href="/settings/privacy/blocked-users">
                                        Manage blocked users
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

