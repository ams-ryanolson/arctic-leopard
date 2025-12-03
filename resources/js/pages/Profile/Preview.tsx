import CoverGradient from '@/components/cover-gradient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useInitials } from '@/hooks/use-initials';
import PublicLayout from '@/layouts/public-layout';
import { login, register } from '@/routes';
import { Link } from '@inertiajs/react';
import { BadgeCheck, Hash, MapPin, Plane, Sparkles, User } from 'lucide-react';
import QRCode from 'react-qr-code';

type Circle = {
    id: number;
    name: string;
    slug: string;
};

type PreviewUser = {
    id: number;
    username: string;
    display_name?: string | null;
    pronouns?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    cover_url?: string | null;
    location?: string | null;
    is_traveling?: boolean;
    is_creator?: boolean;
    is_verified?: boolean;
    interests?: string[];
    hashtags?: string[];
    circles?: Circle[];
};

type Stats = {
    followers: number;
    following: number;
    posts: number;
};

interface ProfilePreviewProps {
    user: PreviewUser;
    stats: Stats;
    profileUrl: string;
}

export default function ProfilePreview({
    user,
    stats,
    profileUrl,
}: ProfilePreviewProps) {
    const getInitials = useInitials();
    const initials = getInitials(user.display_name ?? user.username ?? '');
    const displayName = user.display_name ?? user.username ?? 'Member';

    const interests = user.interests ?? [];
    const hashtags = user.hashtags ?? [];
    const circles = user.circles ?? [];

    return (
        <PublicLayout title={`${displayName} on Real Kink Men`} subtitle="Profile">
            <div className="flex w-full max-w-xl flex-col items-center gap-6 py-8">
                {/* Combined Profile Card with QR Code */}
                <div className="w-full overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-[0_28px_85px_-35px_rgba(249,115,22,0.5)] backdrop-blur">
                    {/* Cover Image */}
                    <div className="relative h-36 w-full overflow-hidden sm:h-44">
                        {user.cover_url ? (
                            <img
                                src={user.cover_url}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <CoverGradient className="h-full w-full" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    </div>

                    {/* Profile Content */}
                    <div className="relative px-6 pb-6 sm:px-8 sm:pb-8">
                        {/* Avatar */}
                        <div className="relative z-10 -mt-12 sm:-mt-14">
                            <div className="relative inline-block">
                                {user.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={displayName}
                                        className="size-20 rounded-2xl border-4 border-neutral-950/80 object-cover shadow-[0_18px_45px_-20px_rgba(249,115,22,0.5)] sm:size-24"
                                    />
                                ) : (
                                    <div className="flex size-20 items-center justify-center rounded-2xl border-4 border-neutral-950/80 bg-gradient-to-br from-amber-500/80 via-rose-500/80 to-violet-600/80 text-xl font-semibold text-white shadow-[0_18px_45px_-20px_rgba(249,115,22,0.5)] sm:size-24 sm:text-2xl">
                                        {initials}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="mt-3 space-y-3 sm:mt-4">
                            {/* Name and badges */}
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                                    {displayName}
                                </h1>
                                {user.is_verified && (
                                    <BadgeCheck className="size-5 text-amber-400" />
                                )}
                                {user.is_creator && (
                                    <Badge className="rounded-full border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[0.6rem] font-semibold tracking-wider text-amber-200 uppercase">
                                        Creator
                                    </Badge>
                                )}
                            </div>

                            {/* Username */}
                            <p className="text-sm text-white/60">@{user.username}</p>

                            {/* Meta info row */}
                            <div className="flex flex-wrap items-center gap-3 text-sm text-white/50">
                                {user.pronouns && (
                                    <span className="flex items-center gap-1.5">
                                        <User className="size-3.5" />
                                        {user.pronouns}
                                    </span>
                                )}
                                {user.location && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="size-3.5" />
                                        {user.location}
                                    </span>
                                )}
                                {user.is_traveling && (
                                    <Badge
                                        variant="secondary"
                                        className="gap-1 rounded-full border-amber-400/30 bg-amber-500/20 px-2 py-0.5 text-[0.65rem] text-amber-200"
                                    >
                                        <Plane className="size-3" />
                                        Traveling
                                    </Badge>
                                )}
                            </div>

                            {/* Bio */}
                            {user.bio && (
                                <div
                                    className="text-sm leading-relaxed text-white/70 [&_br]:block [&_s]:line-through [&_strong]:font-semibold [&_u]:underline"
                                    dangerouslySetInnerHTML={{ __html: user.bio }}
                                />
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-6 border-t border-white/10 pt-4">
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-white">
                                        {stats.posts.toLocaleString()}
                                    </p>
                                    <p className="text-[0.65rem] tracking-wider text-white/50 uppercase">
                                        Posts
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-white">
                                        {stats.followers.toLocaleString()}
                                    </p>
                                    <p className="text-[0.65rem] tracking-wider text-white/50 uppercase">
                                        Followers
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-white">
                                        {stats.following.toLocaleString()}
                                    </p>
                                    <p className="text-[0.65rem] tracking-wider text-white/50 uppercase">
                                        Following
                                    </p>
                                </div>
                            </div>

                            {/* Interests */}
                            {interests.length > 0 && (
                                <div className="space-y-2 border-t border-white/10 pt-4">
                                    <p className="flex items-center gap-1.5 text-[0.65rem] font-medium tracking-wider text-white/50 uppercase">
                                        <Sparkles className="size-3" />
                                        Interests
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {interests.map((interest) => (
                                            <Badge
                                                key={interest}
                                                variant="secondary"
                                                className="rounded-full border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/70"
                                            >
                                                {interest}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Hashtags */}
                            {hashtags.length > 0 && (
                                <div className="space-y-2">
                                    <p className="flex items-center gap-1.5 text-[0.65rem] font-medium tracking-wider text-white/50 uppercase">
                                        <Hash className="size-3" />
                                        Hashtags
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {hashtags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="secondary"
                                                className="rounded-full border-amber-400/20 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-200/80"
                                            >
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Circles */}
                            {circles.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[0.65rem] font-medium tracking-wider text-white/50 uppercase">
                                        Member of {circles.length} Circle
                                        {circles.length !== 1 ? 's' : ''}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {circles.map((circle) => (
                                            <Badge
                                                key={circle.id}
                                                variant="secondary"
                                                className="rounded-full border-violet-400/20 bg-violet-500/10 px-2.5 py-0.5 text-xs text-violet-200/80"
                                            >
                                                {circle.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Separator className="bg-white/10" />

                            {/* QR Code Section - Inside card */}
                            <div className="flex flex-col items-center gap-4 pt-2">
                                <div className="rounded-xl bg-white p-3 shadow-lg">
                                    <QRCode
                                        value={profileUrl}
                                        size={120}
                                        level="H"
                                        bgColor="#ffffff"
                                        fgColor="#0a0a0a"
                                    />
                                </div>
                                <div className="space-y-0.5 text-center">
                                    <p className="text-[0.65rem] font-medium tracking-[0.2em] text-white/50 uppercase">
                                        Scan to view profile
                                    </p>
                                    <p className="max-w-xs truncate text-xs text-white/30">
                                        {profileUrl}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Call to Action - Separate Card */}
                <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-violet-600/10 p-5 text-center sm:p-6">
                    <div className="space-y-1.5">
                        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                            See the full profile
                        </h2>
                        <p className="text-sm text-white/60">
                            Log in or create a free account to view{' '}
                            <span className="font-medium text-white/80">
                                {displayName}'s
                            </span>{' '}
                            complete profile, posts, and more.
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
                        <Button
                            asChild
                            size="lg"
                            className="w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-[1.02] sm:w-auto"
                        >
                            <Link href={register()}>Create Free Account</Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="w-full rounded-full border-white/20 bg-white/5 px-6 text-sm text-white hover:border-white/40 hover:bg-white/10 sm:w-auto"
                        >
                            <Link href={login()}>Log In</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
