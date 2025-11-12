import { useMemo, useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import profileRoutes from '@/routes/profile';
import usersRoutes from '@/routes/users';
import { Head, Link, router } from '@inertiajs/react';
import type { SharedData } from '@/types';
import { ShieldOff, UserMinus } from 'lucide-react';

type BlockedUser = {
    id: number;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    followers_count: number;
    blocked_at: string | null;
};

type BlockedUsersPageProps = SharedData & {
    blocked: BlockedUser[];
};

const numberFormatter = new Intl.NumberFormat();
const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
});

export default function BlockedUsersPage({ blocked }: BlockedUsersPageProps) {
    const [processingIds, setProcessingIds] = useState<number[]>([]);

    const breadcrumbs = useMemo(
        () => [
            {
                title: 'Blocked users',
                href: '/settings/blocked-users',
            },
        ],
        [],
    );

    const handleUnblock = (userId: number) => {
        if (processingIds.includes(userId)) {
            return;
        }

        setProcessingIds((previous) => [...previous, userId]);

        router.delete(
            usersRoutes.block.destroy.url(userId),
            {},
            {
            preserveScroll: true,
            onFinish: () =>
                setProcessingIds((previous) =>
                    previous.filter((id) => id !== userId),
                ),
            },
        );
    };

    const isEmpty = blocked.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Blocked users" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Blocked users"
                        description="Manage who can see or interact with your profile."
                    />

                    {isEmpty ? (
                        <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-white/65">
                            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/70">
                                <ShieldOff className="size-5" />
                            </div>
                            <p className="mt-4">
                                You haven&apos;t blocked anyone yet. When you block someone, they
                                disappear from your feed, search, and notifications.
                            </p>
                            <p className="mt-2 text-xs text-white/45">
                                Spot something off? You can block directly from their profile or
                                comment.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {blocked.map((entry) => {
                                const displayName =
                                    entry.display_name ??
                                    entry.username ??
                                    'Unknown member';
                                const initials =
                                    displayName
                                        .split(' ')
                                        .map((segment) => segment.trim().charAt(0))
                                        .filter(Boolean)
                                        .slice(0, 2)
                                        .join('')
                                        .toUpperCase() || '??';
                                const isProcessing = processingIds.includes(entry.id);
                                const blockedLabel = entry.blocked_at
                                    ? dateFormatter.format(new Date(entry.blocked_at))
                                    : '—';

                                return (
                                    <div
                                        key={entry.id}
                                        className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-white md:flex-row md:items-center md:justify-between"
                                    >
                                        <div className="flex flex-1 items-center gap-4">
                                            <Avatar className="size-14 border border-white/10">
                                                {entry.avatar_url ? (
                                                    <AvatarImage
                                                        src={entry.avatar_url}
                                                        alt={displayName}
                                                    />
                                                ) : (
                                                    <AvatarFallback className="bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 text-lg font-semibold text-white">
                                                        {initials}
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-base font-semibold">
                                                        {displayName}
                                                    </p>
                                                    {entry.username && (
                                                        <span className="text-xs uppercase tracking-[0.35em] text-white/45">
                                                            @{entry.username}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-white/55">
                                                    Blocked on {blockedLabel}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                                                    <Badge className="rounded-full border-white/15 bg-white/10 text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
                                                        Followers {numberFormatter.format(entry.followers_count)}
                                                    </Badge>
                                                    <Link
                                                        href={profileRoutes.show.url(
                                                            entry.username ?? entry.id,
                                                        )}
                                                        className="text-xs uppercase tracking-[0.35em] text-white/50 underline-offset-4 hover:text-white hover:underline"
                                                    >
                                                        View profile
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 md:justify-end">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                className="rounded-full px-5"
                                                onClick={() => handleUnblock(entry.id)}
                                                disabled={isProcessing}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <UserMinus className="size-4" />
                                                    {isProcessing ? 'Unblocking…' : 'Unblock'}
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}


