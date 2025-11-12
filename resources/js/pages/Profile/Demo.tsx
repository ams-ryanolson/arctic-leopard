import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useInitials } from '@/hooks/use-initials';
import { Head, Link } from '@inertiajs/react';
import { SubscribeDialog, TipDialog } from '@/pages/Profile/dialogs';
import { type ProfilePayload } from '@/pages/Profile/types';

interface ProfileDemoProps {
    profile: ProfilePayload;
}

export default function ProfileDemo({ profile }: ProfileDemoProps) {
    const {
        display_name: displayName,
        handle,
        location,
        pronouns,
        role,
        cover_image: coverImage,
        avatar_url: avatarUrl,
        bio,
        badges,
        tags,
        stats,
        availability,
        subscription_tiers: subscriptionTiers,
        tip_options: tipOptions,
        wishlist,
        feed,
    } = profile;

    const getInitials = useInitials();
    const initials = getInitials(displayName);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Profiles', href: '/profile-demo' },
                { title: displayName, href: '/profile-demo' },
            ]}
        >
            <Head title={`${displayName} · Profile`} />

            <div className="space-y-8">
                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_45px_85px_-45px_rgba(249,115,22,0.55)]">
                    <div
                        className="h-48 w-full bg-cover bg-center md:h-60"
                        style={{ backgroundImage: `url(${coverImage})` }}
                    />
                    <div className="p-6 sm:p-8">
                        <div className="-mt-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="flex items-end gap-4">
                                <div className="relative -mt-2 h-28 w-28 overflow-hidden rounded-3xl border-4 border-neutral-950 shadow-[0_25px_65px_-35px_rgba(249,115,22,0.65)]">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt={displayName}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 text-2xl font-semibold text-white">
                                            {initials || 'RK'}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 text-white">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge className="rounded-full border-white/20 bg-white/10 text-white/70">
                                            Verified Creator
                                        </Badge>
                                    </div>
                                    <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                                        {displayName}
                                    </h1>
                                    <p className="text-sm uppercase tracking-[0.4em] text-white/50">
                                        {handle}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col gap-3 text-white sm:items-end">
                                {pronouns && (
                                    <p className="text-sm font-semibold text-white">{pronouns}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-3 text-xs text-white/60 sm:justify-end">
                                    <Badge className="rounded-full border-white/20 bg-white/10 text-white/70">
                                        {location}
                                    </Badge>
                                    {badges.map((badge) => (
                                        <Badge
                                            key={badge}
                                            className="rounded-full border-white/20 bg-white/10 text-white/70"
                                        >
                                            {badge}
                                        </Badge>
                                    ))}
                                </div>
                                <p className="text-sm text-white/70 sm:text-right">{role}</p>
                                <div className="flex flex-wrap gap-2">
                                    <SubscribeDialog
                                        tiers={subscriptionTiers}
                                        trigger={
                                            <Button className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-[1.02]">
                                                Subscribe
                                            </Button>
                                        }
                                    />
                                    <TipDialog
                                        options={tipOptions}
                                        trigger={
                                            <Button
                                                variant="outline"
                                                className="rounded-full border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/20"
                                            >
                                                Send Tip
                                            </Button>
                                        }
                                    />
                                    <Button
                                        asChild
                                        variant="ghost"
                                        className="rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                                    >
                                        <Link href="/profile-demo/wishlist">Wishlist</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <Separator className="my-6 border-white/10" />
                        <p className="max-w-3xl text-sm leading-relaxed text-white/70">{bio}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="rounded-full border-white/15 bg-white/10 text-xs text-white/70"
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[1.7fr_1.1fr]">
                    <section className="space-y-6">
                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Scene stats</CardTitle>
                                <CardDescription className="text-white/60">
                                    Live metrics updated every hour.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {stats.map((stat) => (
                                        <div
                                            key={stat.label}
                                            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-5"
                                        >
                                            <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                                                {stat.label}
                                            </p>
                                            <p className="mt-2 text-2xl font-semibold text-white">
                                                {stat.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Creator feed</CardTitle>
                                <CardDescription className="text-white/60">
                                    Latest drops, circle updates, and monetized moments.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {feed.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-3xl border border-white/10 bg-black/35 p-5"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                                            <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                                                {item.timestamp}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm text-white/70">{item.content}</p>
                                        {item.media.length > 0 && (
                                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                {item.media.map((mediaUrl) => (
                                                    <div
                                                        key={mediaUrl}
                                                        className="relative overflow-hidden rounded-2xl border border-white/10"
                                                    >
                                                        <img
                                                            src={mediaUrl}
                                                            alt={item.title}
                                                            className="h-48 w-full object-cover sm:h-56"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                            <Button size="sm" className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-4 text-xs font-semibold">
                                                Unlock Scene
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="rounded-full px-4 text-xs text-white/75 hover:bg-white/10 hover:text-white"
                                            >
                                                Tip Train
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </section>

                    <aside className="space-y-6">
                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Availability</CardTitle>
                                <CardDescription className="text-white/60">
                                    Updated weekly for collaborators.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-white/75">
                                <p className="text-base font-semibold text-white">
                                    {availability.status}
                                </p>
                                <p className="text-white/65">{availability.window}</p>
                                <p>{availability.note}</p>
                            </CardContent>
                            <CardFooter>
                                <Button variant="ghost" className="w-full rounded-full text-white/80 hover:bg-white/10 hover:text-white">
                                    Request collaboration
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Membership tiers</CardTitle>
                                <CardDescription className="text-white/60">
                                    Choose your level of access and perks.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {subscriptionTiers.map((tier) => (
                                    <div
                                        key={tier.name}
                                        className="space-y-3 rounded-2xl border border-white/10 bg-black/35 p-4"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-sm font-semibold text-white">{tier.name}</h3>
                                            <Badge className="rounded-full border-white/15 bg-white/10 text-xs text-white/70">
                                                {tier.price}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-white/65">{tier.description}</p>
                                        <ul className="space-y-2 text-xs text-white/60">
                                            {tier.perks.map((perk) => (
                                                <li key={perk} className="flex items-start gap-2">
                                                    <span className="mt-1 size-1.5 rounded-full bg-amber-400" />
                                                    <span>{perk}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <Button className="w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-xs font-semibold">
                                            Join tier
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Tip jar</CardTitle>
                                <CardDescription className="text-white/60">
                                    Boost the next scene or unlock bonuses instantly.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {tipOptions.map((tip) => (
                                    <Button
                                        key={tip.amount}
                                        variant="ghost"
                                        className="rounded-full border border-white/15 bg-white/5 px-4 text-sm text-white/80 hover:border-white/40 hover:bg-white/10 hover:text-white"
                                    >
                                        <span className="font-semibold text-white">{tip.amount}</span>
                                        <span className="ml-2 text-xs text-white/70">{tip.label}</span>
                                    </Button>
                                ))}
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-sm font-semibold">
                                    Custom tip
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Wishlist</CardTitle>
                                <CardDescription className="text-white/60">
                                    Help unlock new gear, travel, and production upgrades.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {wishlist.map((item) => (
                                    <div
                                        key={item.title}
                                        className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-white/75"
                                    >
                                        <div className="flex items-center justify-between gap-2 text-white">
                                            <p className="font-semibold">{item.title}</p>
                                            <span className="text-xs uppercase tracking-[0.3em] text-white/55">
                                                {item.price}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-white/60">
                                            {displayName} will shout you out on the next drop.
                                        </p>
                                        <Button
                                            variant="ghost"
                                            className="mt-3 w-full rounded-full border border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                        >
                                            Gift this
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}

