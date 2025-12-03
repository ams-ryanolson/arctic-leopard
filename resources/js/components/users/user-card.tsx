import { useCallback, useState } from 'react';

import { COVER_GRADIENT_STYLE } from '@/components/cover-gradient';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import { getCsrfToken } from '@/lib/csrf';
import usersRoutes from '@/routes/users';
import { Link } from '@inertiajs/react';

export type UserCardUser = {
    id: number;
    username: string;
    display_name: string;
    pronouns?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    cover_url?: string | null;
};

interface UserCardProps {
    user: UserCardUser;
    showFollowButton?: boolean;
    initialFollowing?: boolean;
    initialPending?: boolean;
    onFollowChange?: (isFollowing: boolean, isPending: boolean) => void;
    className?: string;
}

export function UserCard({
    user,
    showFollowButton = true,
    initialFollowing = false,
    initialPending = false,
    onFollowChange,
    className,
}: UserCardProps) {
    const getInitials = useInitials();
    const [isFollowing, setIsFollowing] = useState(initialFollowing);
    const [isPending, setIsPending] = useState(initialPending);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFollowClick = useCallback(
        async (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (isProcessing) {
                return;
            }

            const method = isFollowing || isPending ? 'DELETE' : 'POST';
            const endpoint =
                method === 'POST'
                    ? usersRoutes.follow.store.url(user.id)
                    : usersRoutes.follow.destroy.url(user.id);

            setIsProcessing(true);

            try {
                const csrfToken = getCsrfToken();
                const response = await fetch(endpoint, {
                    method,
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
                    },
                    credentials: 'include',
                });

                let payload: {
                    status?: string;
                    pending?: boolean;
                    accepted?: boolean;
                    message?: string;
                } | null = null;

                try {
                    payload = (await response.json()) as typeof payload;
                } catch {
                    payload = null;
                }

                if (!response.ok || payload === null) {
                    const message =
                        payload?.message ??
                        'We could not update follow settings. Please try again.';
                    throw new Error(message);
                }

                const accepted =
                    Boolean(payload.accepted) || payload.status === 'following';
                const pending = Boolean(payload.pending) && !accepted;

                setIsFollowing(accepted);
                setIsPending(pending);
                onFollowChange?.(accepted, pending);
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : 'We could not update follow settings. Please try again.';
                console.error('Follow error:', message);
            } finally {
                setIsProcessing(false);
            }
        },
        [user.id, isFollowing, isPending, isProcessing, onFollowChange],
    );

    const getFollowButtonLabel = () => {
        if (isProcessing) {
            return 'Processing...';
        }
        if (isPending) {
            return 'Requested';
        }
        if (isFollowing) {
            return 'Following';
        }
        return 'Follow';
    };

    const displayName = user.display_name || user.username || 'User';
    const initials = getInitials(displayName);
    const isFollowingState = isFollowing || isPending;

    return (
        <div className={className}>
            <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 text-left shadow-[0_28px_85px_-58px_rgba(249,115,22,0.5)] backdrop-blur transition hover:border-white/25 hover:bg-white/10">
                {/* Cover Image */}
                <Link href={`/p/${user.username}`}>
                    <div className="relative h-32 w-full overflow-hidden">
                        {user.cover_url ? (
                            <img
                                src={user.cover_url}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div
                                className="h-full w-full"
                                style={{
                                    backgroundImage: COVER_GRADIENT_STYLE,
                                }}
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </div>
                </Link>

                {/* Avatar */}
                <div className="relative -mt-12 px-5 pb-5">
                    <Link href={`/p/${user.username}`}>
                        <div className="relative inline-block">
                            {user.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt={displayName}
                                    className="size-16 rounded-3xl border-4 border-black/50 object-cover"
                                />
                            ) : (
                                <div className="flex size-16 items-center justify-center rounded-3xl border-4 border-black/50 bg-gradient-to-br from-amber-500/80 via-rose-500/80 to-violet-600/80 text-lg font-semibold text-white">
                                    {initials}
                                </div>
                            )}
                        </div>
                    </Link>

                    {/* User Info */}
                    <Link href={`/p/${user.username}`}>
                        <div className="mt-3 space-y-1">
                            <div>
                                <h3 className="text-base font-semibold text-white">
                                    {displayName}
                                </h3>
                                <p className="text-xs text-white/60">
                                    @{user.username}
                                </p>
                                {user.pronouns && (
                                    <p className="text-xs text-white/50">
                                        {user.pronouns}
                                    </p>
                                )}
                            </div>
                            {user.bio && (
                                <p className="mt-1 line-clamp-2 text-xs text-white/70">
                                    {user.bio}
                                </p>
                            )}
                        </div>
                    </Link>

                    {/* Follow Button */}
                    {showFollowButton && (
                        <Button
                            onClick={handleFollowClick}
                            disabled={isProcessing}
                            variant={isFollowingState ? 'secondary' : 'default'}
                            size="sm"
                            className="mt-4 w-full rounded-full border border-white/20 bg-white/10 text-xs text-white transition hover:bg-white/15 disabled:opacity-50"
                        >
                            {getFollowButtonLabel()}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
