import { useMemo, useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Head, Link, router } from '@inertiajs/react';
import profileRoutes from '@/routes/profile';
import usersRoutes from '@/routes/users';
import type { SharedData } from '@/types';
import { Loader2, ShieldOff, Undo2 } from 'lucide-react';

type BlockedProfile = {
    id: number;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
};

type BlockedState = {
    viewer_has_blocked: boolean;
    profile_has_blocked_viewer: boolean;
};

type BlockedPageProps = SharedData & {
    user: BlockedProfile;
    blocked: BlockedState;
    message: string;
};

export default function BlockedProfilePage({ user, blocked, message }: BlockedPageProps) {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const displayName = user.display_name ?? user.username ?? 'This profile';

    const initials = useMemo(() => {
        const source = user.display_name ?? user.username ?? '??';

        return source
            .split(' ')
            .map((segment) => segment.trim().charAt(0))
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase() || '??';
    }, [user.display_name, user.username]);

    const breadcrumbs = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: displayName,
            href: profileRoutes.show.url(user.username ?? ''),
        },
    ];

    const handleUnblock = () => {
        if (!blocked.viewer_has_blocked || processing) {
            return;
        }

        setProcessing(true);
        setError(null);

        router.delete(
            usersRoutes.block.destroy.url(user.id),
            {},
            {
                preserveScroll: true,
                onError: (errors: Record<string, string>) => {
                    const message =
                        typeof errors.reason === 'string'
                            ? errors.reason
                            : 'We could not unblock this profile. Please try again.';
                    setError(message);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${displayName} · Profile unavailable`} />

            <div className="mx-auto max-w-3xl space-y-10 py-12 text-white">
                <div className="rounded-3xl border border-white/10 bg-black/40 p-10 text-center shadow-[0_60px_140px_-70px_rgba(33,33,33,0.65)]">
                    <div className="mx-auto flex size-24 items-center justify-center rounded-3xl border border-rose-500/40 bg-rose-500/10 text-rose-100 shadow-[0_45px_120px_-60px_rgba(244,63,94,0.45)]">
                        <ShieldOff className="size-10" />
                    </div>
                    <h1 className="mt-6 text-3xl font-semibold tracking-tight">{displayName}</h1>
                    {user.username && (
                        <p className="mt-2 text-sm uppercase tracking-[0.35em] text-white/45">
                            @{user.username}
                        </p>
                    )}

                    <div className="mt-6 flex justify-center">
                        <Avatar className="size-20 border border-white/15">
                            {user.avatar_url ? (
                                <AvatarImage src={user.avatar_url} alt={displayName} />
                            ) : (
                                <AvatarFallback className="bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 text-2xl font-semibold text-white">
                                    {initials}
                                </AvatarFallback>
                            )}
                        </Avatar>
                    </div>

                    <p className="mt-8 text-base text-white/70">{message}</p>
                    {blocked.profile_has_blocked_viewer && (
                        <p className="mt-3 text-sm text-white/50">
                            This member has chosen to block you. You won&apos;t be able to view their
                            content or interact with them unless they change their settings.
                        </p>
                    )}
                    {blocked.viewer_has_blocked && (
                        <p className="mt-3 text-sm text-white/55">
                            You blocked this profile. You can manage blocked members from settings.
                        </p>
                    )}

                    {error && (
                        <p className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/15 px-4 py-3 text-sm text-rose-100">
                            {error}
                        </p>
                    )}

                    <div className="mt-10 flex flex-wrap justify-center gap-3">
                        <Button
                            asChild
                            variant="secondary"
                            className="rounded-full border-white/15 bg-white/10 px-5 text-white hover:border-white/30 hover:bg-white/20"
                        >
                            <Link href="/dashboard">
                                <Undo2 className="mr-2 size-4" />
                                Back to dashboard
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="ghost"
                            className="rounded-full border-white/15 bg-white/5 px-5 text-white/80 hover:border-white/30 hover:bg-white/15 hover:text-white"
                        >
                            <Link href="/settings/blocked-users">Manage blocked users</Link>
                        </Button>
                        {blocked.viewer_has_blocked && (
                            <Button
                                type="button"
                                variant="destructive"
                                className="rounded-full px-6"
                                onClick={handleUnblock}
                                disabled={processing}
                            >
                                <span className="flex items-center gap-2">
                                    {processing && <Loader2 className="size-4 animate-spin" />}
                                    {processing ? 'Unblocking…' : 'Unblock'}
                                </span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}


