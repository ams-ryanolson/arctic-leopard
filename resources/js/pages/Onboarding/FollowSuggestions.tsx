import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';

import { COVER_GRADIENT_STYLE } from '@/components/cover-gradient';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/layouts/onboarding-layout';
import { getCsrfToken } from '@/lib/csrf';
import onboardingRoutes from '@/routes/onboarding';
import usersRoutes from '@/routes/users';
import {
    ArrowLeft,
    ArrowRight,
    Banknote,
    Gift,
    Loader2,
    ShieldCheck,
    Sparkles,
    UsersRound,
} from 'lucide-react';

type SuggestedUser = {
    id: number;
    username: string;
    display_name: string;
    pronouns: string | null;
    bio: string | null;
    avatar_url: string | null;
    cover_url: string | null;
};

type FollowSuggestionsProps = {
    suggestedUsers: SuggestedUser[];
};

export default function FollowSuggestions({
    suggestedUsers,
}: FollowSuggestionsProps) {
    const [followStates, setFollowStates] = useState<
        Record<
            number,
            { isFollowing: boolean; isPending: boolean; isProcessing: boolean }
        >
    >({});
    const [isFinishing, setIsFinishing] = useState(false);

    const getFollowState = useCallback(
        (userId: number) => {
            return (
                followStates[userId] ?? {
                    isFollowing: false,
                    isPending: false,
                    isProcessing: false,
                }
            );
        },
        [followStates],
    );

    const updateFollowState = useCallback(
        (
            userId: number,
            updates: Partial<{
                isFollowing: boolean;
                isPending: boolean;
                isProcessing: boolean;
            }>,
        ) => {
            setFollowStates((prev) => ({
                ...prev,
                [userId]: { ...getFollowState(userId), ...updates },
            }));
        },
        [getFollowState],
    );

    const handleFollowClick = useCallback(
        async (user: SuggestedUser) => {
            const currentState = getFollowState(user.id);
            if (currentState.isProcessing) {
                return;
            }

            const method =
                currentState.isFollowing || currentState.isPending
                    ? 'DELETE'
                    : 'POST';
            const endpoint =
                method === 'POST'
                    ? usersRoutes.follow.store.url(user.id)
                    : usersRoutes.follow.destroy.url(user.id);

            updateFollowState(user.id, { isProcessing: true });

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

                updateFollowState(user.id, {
                    isFollowing: accepted,
                    isPending: pending,
                    isProcessing: false,
                });
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : 'We could not update follow settings. Please try again.';
                console.error('Follow error:', message);
                updateFollowState(user.id, { isProcessing: false });
            }
        },
        [getFollowState, updateFollowState],
    );

    const getFollowButtonLabel = useCallback(
        (user: SuggestedUser) => {
            const state = getFollowState(user.id);
            if (state.isProcessing) {
                return 'Processing...';
            }
            if (state.isPending) {
                return 'Requested';
            }
            if (state.isFollowing) {
                return 'Following';
            }
            return 'Follow';
        },
        [getFollowState],
    );

    return (
        <OnboardingLayout
            currentStep="follow"
            eyebrow="Onboarding"
            title="Choose your first connections"
            description="Follow a few people so your dashboard feels alive the moment you land on it."
        >
            <Head title="Follow suggestions" />

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-7 text-white shadow-[0_48px_130px_-60px_rgba(99,102,241,0.45)] lg:px-8">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.2),_transparent_60%)]" />
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.18),_transparent_65%)]" />

                <div className="relative space-y-4">
                    <div className="flex items-center gap-2 text-xs tracking-[0.35em] text-white/50 uppercase">
                        <UsersRound className="size-4" />
                        Suggested profiles
                    </div>
                    <p className="text-sm text-white/70">
                        Discover creators and community members to follow. These
                        suggestions are based on active profiles in the
                        community.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {suggestedUsers.map((user) => {
                            const state = getFollowState(user.id);
                            const isFollowing =
                                state.isFollowing || state.isPending;

                            return (
                                <div
                                    key={user.id}
                                    className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 text-left shadow-[0_28px_85px_-58px_rgba(249,115,22,0.5)] backdrop-blur transition hover:border-white/25 hover:bg-white/10"
                                >
                                    {/* Cover Image */}
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
                                                    backgroundImage:
                                                        COVER_GRADIENT_STYLE,
                                                }}
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                    </div>

                                    {/* Avatar */}
                                    <div className="relative -mt-12 px-5 pb-5">
                                        <div className="relative inline-block">
                                            {user.avatar_url ? (
                                                <img
                                                    src={user.avatar_url}
                                                    alt={user.display_name}
                                                    className="size-16 rounded-3xl border-4 border-black/50 object-cover"
                                                />
                                            ) : (
                                                <div className="flex size-16 items-center justify-center rounded-3xl border-4 border-black/50 bg-gradient-to-br from-amber-500/80 via-rose-500/80 to-violet-600/80 text-lg font-semibold text-white">
                                                    {user.display_name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        {/* User Info */}
                                        <div className="mt-3 space-y-1">
                                            <div>
                                                <h3 className="text-base font-semibold text-white">
                                                    {user.display_name}
                                                </h3>
                                                {user.pronouns && (
                                                    <p className="text-xs text-white/60">
                                                        {user.pronouns}
                                                    </p>
                                                )}
                                            </div>
                                            {user.bio && (
                                                <p className="line-clamp-2 text-xs text-white/70">
                                                    {user.bio}
                                                </p>
                                            )}
                                        </div>

                                        {/* Follow Button */}
                                        <Button
                                            onClick={() => {
                                                handleFollowClick(user);
                                            }}
                                            disabled={state.isProcessing}
                                            variant={
                                                isFollowing
                                                    ? 'secondary'
                                                    : 'default'
                                            }
                                            size="sm"
                                            className="mt-4 w-full rounded-full border border-white/20 bg-white/10 text-xs text-white transition hover:bg-white/15 disabled:opacity-50"
                                        >
                                            {getFollowButtonLabel(user)}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-7 text-white shadow-[0_48px_130px_-60px_rgba(249,115,22,0.45)] lg:px-8">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.15),_transparent_60%)]" />
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(147,51,234,0.12),_transparent_65%)]" />

                <div className="relative space-y-5">
                    <div className="flex items-center gap-2 text-xs tracking-[0.35em] text-white/50 uppercase">
                        <Sparkles className="size-4 text-amber-300" />
                        Optional: Creator tools
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-white sm:text-2xl">
                            Unlock tips, subscriptions & wishlist gifts
                        </h3>
                        <p className="text-sm leading-relaxed text-white/70">
                            Set up creator tools to start earning. Complete
                            verification, add payout details, create
                            subscription tiers, and curate a wishlist—all at
                            your own pace.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-center backdrop-blur">
                            <div className="rounded-xl border border-white/15 bg-white/10 p-2.5">
                                <ShieldCheck className="size-5 text-amber-400" />
                            </div>
                            <p className="text-xs font-medium text-white">
                                Verification
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-center backdrop-blur">
                            <div className="rounded-xl border border-white/15 bg-white/10 p-2.5">
                                <Banknote className="size-5 text-emerald-400" />
                            </div>
                            <p className="text-xs font-medium text-white">
                                Payouts
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-center backdrop-blur">
                            <div className="rounded-xl border border-white/15 bg-white/10 p-2.5">
                                <Sparkles className="size-5 text-rose-400" />
                            </div>
                            <p className="text-xs font-medium text-white">
                                Subscriptions
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-center backdrop-blur">
                            <div className="rounded-xl border border-white/15 bg-white/10 p-2.5">
                                <Gift className="size-5 text-violet-400" />
                            </div>
                            <p className="text-xs font-medium text-white">
                                Wishlist
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-white/60">
                            You can finish onboarding now and set up creator
                            tools later from your dashboard.
                        </p>
                        <Button
                            asChild
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_55px_-28px_rgba(249,115,22,0.6)] transition hover:scale-[1.01]"
                        >
                            <Link href={onboardingRoutes.creator.url()}>
                                Explore creator tools
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <Button
                        asChild
                        variant="secondary"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm text-white transition hover:bg-white/15"
                    >
                        <Link href={onboardingRoutes.media.url()}>
                            <ArrowLeft className="size-4" /> Back
                        </Link>
                    </Button>
                    <div className="flex flex-1 justify-end">
                        <Button
                            onClick={() => {
                                setIsFinishing(true);
                                router.post(
                                    '/onboarding/finish',
                                    {},
                                    {
                                        onFinish: () => {
                                            setIsFinishing(false);
                                        },
                                    },
                                );
                            }}
                            disabled={isFinishing}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_55px_-28px_rgba(249,115,22,0.6)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isFinishing ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Finishing...
                                </>
                            ) : (
                                <>
                                    Finish onboarding
                                    <ArrowRight className="size-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </OnboardingLayout>
    );
}
