import { useCallback, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import { getCsrfToken } from '@/lib/csrf';
import usersRoutes from '@/routes/users';
import { Link } from '@inertiajs/react';

export type UserListItemUser = {
    id: number;
    username: string;
    display_name: string;
    pronouns?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
};

interface UserListItemProps {
    user: UserListItemUser;
    showFollowButton?: boolean;
    initialFollowing?: boolean;
    initialPending?: boolean;
    onFollowChange?: (isFollowing: boolean, isPending: boolean) => void;
}

export function UserListItem({
    user,
    showFollowButton = true,
    initialFollowing = false,
    initialPending = false,
    onFollowChange,
}: UserListItemProps) {
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
        <div className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10">
            <Link href={`/p/${user.username}`} className="flex-shrink-0">
                {user.avatar_url ? (
                    <Avatar className="size-12 border-2 border-white/20">
                        <AvatarImage src={user.avatar_url} alt={displayName} />
                        <AvatarFallback className="bg-gradient-to-br from-amber-500/80 via-rose-500/80 to-violet-600/80 text-white">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                ) : (
                    <Avatar className="size-12 border-2 border-white/20">
                        <AvatarFallback className="bg-gradient-to-br from-amber-500/80 via-rose-500/80 to-violet-600/80 text-white">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                )}
            </Link>

            <div className="min-w-0 flex-1">
                <Link href={`/p/${user.username}`}>
                    <div className="space-y-0.5">
                        <h3 className="truncate text-sm font-semibold text-white">
                            {displayName}
                        </h3>
                        <p className="truncate text-xs text-white/60">
                            @{user.username}
                        </p>
                        {user.pronouns && (
                            <p className="text-xs text-white/50">
                                {user.pronouns}
                            </p>
                        )}
                        {user.bio && (
                            <p className="mt-1 line-clamp-2 text-xs text-white/70">
                                {user.bio}
                            </p>
                        )}
                    </div>
                </Link>
            </div>

            {showFollowButton && (
                <Button
                    onClick={handleFollowClick}
                    disabled={isProcessing}
                    variant={isFollowingState ? 'secondary' : 'default'}
                    size="sm"
                    className="flex-shrink-0 rounded-full border border-white/20 bg-white/10 px-4 text-xs text-white transition hover:bg-white/15 disabled:opacity-50"
                >
                    {getFollowButtonLabel()}
                </Button>
            )}
        </div>
    );
}
