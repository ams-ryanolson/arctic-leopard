import { useCallback, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInitials } from '@/hooks/use-initials';
import { getCsrfToken } from '@/lib/csrf';
import usersRoutes from '@/routes/users';
import { Link } from '@inertiajs/react';
import { CheckCircle2, Loader2 } from 'lucide-react';

type UserHoverCardProfile = {
    id: number;
    username: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    is_verified: boolean;
    is_following: boolean;
    has_pending_follow_request: boolean;
    can_follow: boolean;
    stats: {
        posts: number;
        followers: number;
        following: number;
    };
};

type UserHoverCardProps = {
    userId: number;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    children: React.ReactNode;
};

export function UserHoverCard({
    userId,
    username,
    displayName,
    children,
}: UserHoverCardProps) {
    const getInitials = useInitials();
    const [profile, setProfile] = useState<UserHoverCardProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [hasPendingRequest, setHasPendingRequest] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchProfile = useCallback(async () => {
        if (isLoading || profile !== null) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`/api/users/${userId}/profile`, {
                method: 'get',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                return;
            }

            const data = (await response.json()) as UserHoverCardProfile;
            setProfile(data);
            setIsFollowing(data.is_following);
            setHasPendingRequest(data.has_pending_follow_request);
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, isLoading, profile]);

    const handleFollowClick = useCallback(
        async (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (isProcessing || !profile?.can_follow) {
                return;
            }

            const method = isFollowing || hasPendingRequest ? 'DELETE' : 'POST';
            const endpoint =
                method === 'POST'
                    ? usersRoutes.follow.store.url(userId)
                    : usersRoutes.follow.destroy.url(userId);

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
                    followers_count?: number;
                    message?: string;
                } | null = null;

                try {
                    payload = (await response.json()) as typeof payload;
                } catch {
                    payload = null;
                }

                if (!response.ok || payload === null) {
                    throw new Error(
                        payload?.message ??
                            'We could not update follow settings. Please try again.',
                    );
                }

                const accepted =
                    Boolean(payload.accepted) || payload.status === 'following';
                const pending = Boolean(payload.pending) && !accepted;

                setIsFollowing(accepted);
                setHasPendingRequest(pending);

                // Update profile stats if provided
                if (payload.followers_count !== undefined && profile) {
                    setProfile({
                        ...profile,
                        stats: {
                            ...profile.stats,
                            followers: payload.followers_count,
                        },
                    });
                }
            } catch (error) {
                console.error('Follow error:', error);
            } finally {
                setIsProcessing(false);
            }
        },
        [userId, isFollowing, hasPendingRequest, isProcessing, profile],
    );

    const getFollowButtonLabel = () => {
        if (isProcessing) {
            return 'Processing...';
        }
        if (hasPendingRequest) {
            return 'Requested';
        }
        if (isFollowing) {
            return 'Following';
        }
        return 'Follow';
    };

    const finalDisplayName = profile?.display_name ?? displayName ?? username;
    const initials = getInitials(finalDisplayName);

    return (
        <HoverCard
            openDelay={300}
            onOpenChange={(open) => open && fetchProfile()}
        >
            <HoverCardTrigger asChild>{children}</HoverCardTrigger>
            <HoverCardContent className="w-72 p-0" side="right" align="start">
                {isLoading ? (
                    <div className="space-y-3 p-4">
                        <div className="flex items-start gap-3">
                            <Skeleton className="size-12 shrink-0 rounded-full" />
                            <div className="min-w-0 flex-1 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                        <div className="flex items-center gap-4 pt-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="mt-3 h-9 w-full" />
                    </div>
                ) : profile ? (
                    <div className="p-4">
                        {/* Header: Avatar and Name */}
                        <div className="mb-3 flex items-start gap-3">
                            <Link
                                href={`/p/${profile.username}`}
                                prefetch
                                className="shrink-0"
                            >
                                {profile.avatar_url ? (
                                    <Avatar className="size-12 border border-white/10">
                                        <AvatarImage
                                            src={profile.avatar_url}
                                            alt={finalDisplayName}
                                        />
                                        <AvatarFallback className="bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 text-sm font-semibold text-white">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <div className="flex size-12 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 text-sm font-semibold text-white">
                                        {initials}
                                    </div>
                                )}
                            </Link>
                            <div className="min-w-0 flex-1">
                                <Link
                                    href={`/p/${profile.username}`}
                                    prefetch
                                    className="block"
                                >
                                    <div className="mb-0.5 flex items-center gap-1.5">
                                        <h3 className="truncate text-sm font-semibold text-white">
                                            {finalDisplayName}
                                        </h3>
                                        {profile.is_verified && (
                                            <CheckCircle2 className="size-3.5 shrink-0 text-amber-400" />
                                        )}
                                    </div>
                                    <p className="truncate text-xs text-white/60">
                                        @{profile.username}
                                    </p>
                                </Link>
                            </div>
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-white/80">
                                {profile.bio}
                            </p>
                        )}

                        {/* Stats */}
                        <div className="mb-3 flex items-center gap-4 text-xs">
                            <div className="text-white/70">
                                <span className="font-semibold text-white">
                                    {profile.stats.posts.toLocaleString()}
                                </span>{' '}
                                <span>
                                    {profile.stats.posts === 1
                                        ? 'Post'
                                        : 'Posts'}
                                </span>
                            </div>
                            <div className="text-white/70">
                                <span className="font-semibold text-white">
                                    {profile.stats.followers.toLocaleString()}
                                </span>{' '}
                                <span>
                                    {profile.stats.followers === 1
                                        ? 'Follower'
                                        : 'Followers'}
                                </span>
                            </div>
                            <div className="text-white/70">
                                <span className="font-semibold text-white">
                                    {profile.stats.following.toLocaleString()}
                                </span>{' '}
                                <span>Following</span>
                            </div>
                        </div>

                        {/* Follow Button */}
                        {profile.can_follow && (
                            <Button
                                onClick={handleFollowClick}
                                disabled={isProcessing}
                                variant={
                                    isFollowing || hasPendingRequest
                                        ? 'secondary'
                                        : 'default'
                                }
                                size="sm"
                                className="w-full rounded-full border border-white/20 bg-white/10 text-xs font-medium text-white transition hover:border-white/30 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-1.5 size-3 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    getFollowButtonLabel()
                                )}
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="p-4 text-xs text-white/70">
                        Failed to load profile
                    </div>
                )}
            </HoverCardContent>
        </HoverCard>
    );
}
