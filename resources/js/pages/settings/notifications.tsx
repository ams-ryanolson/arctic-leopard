import NotificationsController from '@/actions/App/Http/Controllers/Settings/NotificationsController';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bell, Heart, MessageSquare, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notification settings',
        href: '/settings/notifications',
    },
];

type NotificationPreferences = {
    follows: boolean;
    follow_requests: boolean;
    follow_approvals: boolean;
    post_likes: boolean;
    post_bookmarks: boolean;
    messages: boolean;
    comments: boolean;
    replies: boolean;
};

export default function Notifications({
    preferences,
}: {
    preferences: NotificationPreferences;
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notification settings" />

            <SettingsLayout>
                <div className="space-y-8">
                    {/* Notifications Overview Section */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(236,72,153,0.45)]">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-rose-500/15 via-rose-400/5 to-transparent blur-2xl" />
                        </div>
                        <div className="relative space-y-6 p-6 sm:p-8">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center rounded-xl border border-rose-400/40 bg-gradient-to-br from-rose-400/30 to-rose-500/20 p-3 shadow-[0_12px_30px_-18px_rgba(236,72,153,0.65)]">
                                    <Bell className="h-5 w-5 text-rose-300" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">
                                        Notification preferences
                                    </h2>
                                    <p className="text-sm text-white/65">
                                        Choose which notifications you want to
                                        receive
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Form
                        {...NotificationsController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-8"
                    >
                        {(
                            { processing, recentlySuccessful, errors: _errors }, // eslint-disable-line @typescript-eslint/no-unused-vars
                        ) => (
                            <>
                                <div className="space-y-8">
                                    {/* Social Notifications */}
                                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(59,130,246,0.45)]">
                                        <div className="pointer-events-none absolute inset-0">
                                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-blue-500/15 via-blue-400/5 to-transparent blur-2xl" />
                                        </div>
                                        <div className="relative space-y-6 p-6 sm:p-8">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center rounded-xl border border-blue-400/40 bg-gradient-to-br from-blue-400/30 to-blue-500/20 p-3 shadow-[0_12px_30px_-18px_rgba(59,130,246,0.65)]">
                                                    <Users className="h-5 w-5 text-blue-300" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-semibold text-white">
                                                        Social
                                                    </h3>
                                                    <p className="text-sm text-white/65">
                                                        Notifications about
                                                        follows and follow
                                                        requests
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 space-y-1">
                                                            <Label
                                                                htmlFor="follows"
                                                                className="text-base font-semibold text-white"
                                                            >
                                                                New followers
                                                            </Label>
                                                            <p className="text-sm leading-relaxed text-white/70">
                                                                Get notified
                                                                when someone
                                                                follows you
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="hidden"
                                                            name="follows"
                                                            value="0"
                                                        />
                                                        <input
                                                            id="follows"
                                                            name="follows"
                                                            type="checkbox"
                                                            value="1"
                                                            defaultChecked={
                                                                preferences.follows
                                                            }
                                                            className="h-5 w-5 rounded border-white/30 bg-white/10 accent-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 space-y-1">
                                                            <Label
                                                                htmlFor="follow_requests"
                                                                className="text-base font-semibold text-white"
                                                            >
                                                                Follow requests
                                                            </Label>
                                                            <p className="text-sm leading-relaxed text-white/70">
                                                                Get notified
                                                                when someone
                                                                requests to
                                                                follow you
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="hidden"
                                                            name="follow_requests"
                                                            value="0"
                                                        />
                                                        <input
                                                            id="follow_requests"
                                                            name="follow_requests"
                                                            type="checkbox"
                                                            value="1"
                                                            defaultChecked={
                                                                preferences.follow_requests
                                                            }
                                                            className="h-5 w-5 rounded border-white/30 bg-white/10 accent-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 space-y-1">
                                                            <Label
                                                                htmlFor="follow_approvals"
                                                                className="text-base font-semibold text-white"
                                                            >
                                                                Follow approvals
                                                            </Label>
                                                            <p className="text-sm leading-relaxed text-white/70">
                                                                Get notified
                                                                when your follow
                                                                request is
                                                                approved
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="hidden"
                                                            name="follow_approvals"
                                                            value="0"
                                                        />
                                                        <input
                                                            id="follow_approvals"
                                                            name="follow_approvals"
                                                            type="checkbox"
                                                            value="1"
                                                            defaultChecked={
                                                                preferences.follow_approvals
                                                            }
                                                            className="h-5 w-5 rounded border-white/30 bg-white/10 accent-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Post Notifications */}
                                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(249,115,22,0.45)]">
                                        <div className="pointer-events-none absolute inset-0">
                                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-500/15 via-amber-400/5 to-transparent blur-2xl" />
                                        </div>
                                        <div className="relative space-y-6 p-6 sm:p-8">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-400/30 to-amber-500/20 p-3 shadow-[0_12px_30px_-18px_rgba(249,115,22,0.65)]">
                                                    <Heart className="h-5 w-5 text-amber-300" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-semibold text-white">
                                                        Posts
                                                    </h3>
                                                    <p className="text-sm text-white/65">
                                                        Notifications about your
                                                        posts
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 space-y-1">
                                                            <Label
                                                                htmlFor="post_likes"
                                                                className="text-base font-semibold text-white"
                                                            >
                                                                Post likes
                                                            </Label>
                                                            <p className="text-sm leading-relaxed text-white/70">
                                                                Get notified
                                                                when someone
                                                                likes your post
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="hidden"
                                                            name="post_likes"
                                                            value="0"
                                                        />
                                                        <input
                                                            id="post_likes"
                                                            name="post_likes"
                                                            type="checkbox"
                                                            value="1"
                                                            defaultChecked={
                                                                preferences.post_likes
                                                            }
                                                            className="h-5 w-5 rounded border-white/30 bg-white/10 accent-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 space-y-1">
                                                            <Label
                                                                htmlFor="post_bookmarks"
                                                                className="text-base font-semibold text-white"
                                                            >
                                                                Post bookmarks
                                                            </Label>
                                                            <p className="text-sm leading-relaxed text-white/70">
                                                                Get notified
                                                                when someone
                                                                bookmarks your
                                                                post
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="hidden"
                                                            name="post_bookmarks"
                                                            value="0"
                                                        />
                                                        <input
                                                            id="post_bookmarks"
                                                            name="post_bookmarks"
                                                            type="checkbox"
                                                            value="1"
                                                            defaultChecked={
                                                                preferences.post_bookmarks
                                                            }
                                                            className="h-5 w-5 rounded border-white/30 bg-white/10 accent-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messaging Notifications */}
                                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(124,58,237,0.45)]">
                                        <div className="pointer-events-none absolute inset-0">
                                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-violet-500/15 via-violet-400/5 to-transparent blur-2xl" />
                                        </div>
                                        <div className="relative space-y-6 p-6 sm:p-8">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center rounded-xl border border-violet-400/40 bg-gradient-to-br from-violet-400/30 to-violet-500/20 p-3 shadow-[0_12px_30px_-18px_rgba(124,58,237,0.65)]">
                                                    <MessageSquare className="h-5 w-5 text-violet-300" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-semibold text-white">
                                                        Messaging
                                                    </h3>
                                                    <p className="text-sm text-white/65">
                                                        Notifications about
                                                        messages, comments, and
                                                        replies
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 space-y-1">
                                                            <Label
                                                                htmlFor="messages"
                                                                className="text-base font-semibold text-white"
                                                            >
                                                                New messages
                                                            </Label>
                                                            <p className="text-sm leading-relaxed text-white/70">
                                                                Get notified
                                                                when you receive
                                                                a new message
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="hidden"
                                                            name="messages"
                                                            value="0"
                                                        />
                                                        <input
                                                            id="messages"
                                                            name="messages"
                                                            type="checkbox"
                                                            value="1"
                                                            defaultChecked={
                                                                preferences.messages
                                                            }
                                                            className="h-5 w-5 rounded border-white/30 bg-white/10 accent-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 space-y-1">
                                                            <Label
                                                                htmlFor="comments"
                                                                className="text-base font-semibold text-white"
                                                            >
                                                                New comments
                                                            </Label>
                                                            <p className="text-sm leading-relaxed text-white/70">
                                                                Get notified
                                                                when someone
                                                                comments on your
                                                                post
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="hidden"
                                                            name="comments"
                                                            value="0"
                                                        />
                                                        <input
                                                            id="comments"
                                                            name="comments"
                                                            type="checkbox"
                                                            value="1"
                                                            defaultChecked={
                                                                preferences.comments
                                                            }
                                                            className="h-5 w-5 rounded border-white/30 bg-white/10 accent-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 space-y-1">
                                                            <Label
                                                                htmlFor="replies"
                                                                className="text-base font-semibold text-white"
                                                            >
                                                                New replies
                                                            </Label>
                                                            <p className="text-sm leading-relaxed text-white/70">
                                                                Get notified
                                                                when someone
                                                                replies to your
                                                                comment
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="hidden"
                                                            name="replies"
                                                            value="0"
                                                        />
                                                        <input
                                                            id="replies"
                                                            name="replies"
                                                            type="checkbox"
                                                            value="1"
                                                            defaultChecked={
                                                                preferences.replies
                                                            }
                                                            className="h-5 w-5 rounded border-white/30 bg-white/10 accent-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-2">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        data-test="update-notifications-button"
                                        className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(16,185,129,0.5)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        {processing
                                            ? 'Saving...'
                                            : 'Save changes'}
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
            </SettingsLayout>
        </AppLayout>
    );
}
