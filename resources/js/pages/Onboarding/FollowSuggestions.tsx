import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { UserCard } from '@/components/users/user-card';
import OnboardingLayout from '@/layouts/onboarding-layout';
import onboardingRoutes from '@/routes/onboarding';
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

    const getFollowState = (userId: number) => {
        return (
            followStates[userId] ?? {
                isFollowing: false,
                isPending: false,
                isProcessing: false,
            }
        );
    };

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

                            return (
                                <UserCard
                                    key={user.id}
                                    user={{
                                        id: user.id,
                                        username: user.username,
                                        display_name: user.display_name,
                                        pronouns: user.pronouns,
                                        bio: user.bio,
                                        avatar_url: user.avatar_url,
                                        cover_url: user.cover_url,
                                    }}
                                    showFollowButton={true}
                                    initialFollowing={state.isFollowing}
                                    initialPending={state.isPending}
                                    onFollowChange={(
                                        isFollowing,
                                        isPending,
                                    ) => {
                                        setFollowStates((prev) => ({
                                            ...prev,
                                            [user.id]: {
                                                isFollowing,
                                                isPending,
                                                isProcessing: false,
                                            },
                                        }));
                                    }}
                                />
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
