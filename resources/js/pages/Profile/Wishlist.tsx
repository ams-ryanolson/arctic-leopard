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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SubscribeDialog, TipDialog } from '@/pages/Profile/dialogs';
import { type ProfilePayload } from '@/pages/Profile/types';
import { useInitials } from '@/hooks/use-initials';
import { Head, Link } from '@inertiajs/react';

interface ProfileWishlistProps {
    profile: ProfilePayload;
}

export default function ProfileWishlist({ profile }: ProfileWishlistProps) {
    const {
        display_name: displayName,
        handle,
        cover_image: coverImage,
        avatar_url: avatarUrl,
        wishlist,
        subscription_tiers: subscriptionTiers,
        tip_options: tipOptions,
    } = profile;

    const getInitials = useInitials();
    const initials = getInitials(displayName);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Profiles', href: '/profile-demo' },
                { title: displayName, href: '/profile-demo' },
                { title: 'Wishlist', href: '/profile-demo/wishlist' },
            ]}
        >
            <Head title={`${displayName} · Wishlist`} />

            <div className="space-y-8">
                <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_45px_85px_-45px_rgba(249,115,22,0.55)]">
                    <div
                        className="h-40 w-full bg-cover bg-center sm:h-48"
                        style={{ backgroundImage: `url(${coverImage})` }}
                    />
                    <div className="p-6 sm:p-8">
                        <div className="-mt-14 flex flex-col gap-6 sm:flex-row sm:items-end">
                            <div className="flex items-end gap-4">
                                <Avatar className="size-24 border-4 border-neutral-950 shadow-[0_25px_65px_-35px_rgba(249,115,22,0.65)]">
                                    <AvatarImage src={avatarUrl} alt={displayName} />
                                    <AvatarFallback className="bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 text-xl font-semibold text-white">
                                        {initials || 'RK'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1 text-white">
                                    <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                                        Wishlist • {displayName}
                                    </h1>
                                    <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                                        {handle}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col gap-3 text-white sm:items-end">
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
                                        <Link href="/profile-demo">Full profile</Link>
                                    </Button>
                                </div>
                                <p className="text-xs text-white/60">
                                    Gift gear, travel, and upgrades that fuel the next
                                    scene.
                                </p>
                            </div>
                        </div>

                        <Separator className="my-6 border-white/10" />
                        <p className="max-w-3xl text-sm leading-relaxed text-white/70">
                            Every wishlist item unlocks bigger, bolder experiences. Gift
                            equipment, production upgrades, or travel boosts and get
                            shouted out during the next drop.
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-white">
                        <div>
                            <h2 className="text-xl font-semibold">Wishlisted items</h2>
                            <p className="text-sm text-white/60">
                                Hand-picked gear and experiences that amplify every ritual.
                            </p>
                        </div>
                        <Badge className="rounded-full border-white/15 bg-white/10 text-xs text-white/70">
                            {wishlist.length} items
                        </Badge>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {wishlist.map((item) => (
                            <Card
                                key={item.title}
                                className="flex h-full flex-col border-white/10 bg-white/5 text-white"
                            >
                                <CardHeader className="gap-2">
                                    <CardTitle className="text-lg font-semibold">
                                        {item.title}
                                    </CardTitle>
                                    <CardDescription className="text-white/60">
                                        Supports the next wave of immersive scenes.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="h-36 w-full overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.25),_transparent_60%)]" />
                                    <p className="text-sm text-white/70">
                                        Your gift unlocks behind-the-scenes shout outs and
                                        exclusive follow-up content.
                                    </p>
                                </CardContent>
                                <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <Badge className="rounded-full border-white/15 bg-white/10 text-xs text-white/70">
                                        {item.price}
                                    </Badge>
                                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                        <Button
                                            className="flex-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-[1.02]"
                                        >
                                            Gift this
                                        </Button>
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="flex-1 rounded-full border-white/20 bg-white/5 text-sm text-white hover:border-white/40 hover:bg-white/10 sm:flex-none"
                                        >
                                            <Link href={item.link || '#'} target="_blank">
                                                View item
                                            </Link>
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-white/10 bg-white/5 text-white">
                        <CardHeader className="gap-2">
                            <CardTitle className="text-lg font-semibold">
                                Membership perks
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Choose a tier and unlock continuous access to scenes,
                                analytics, and circle rooms.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <ul className="space-y-2 text-sm text-white/70">
                                {subscriptionTiers.map((tier) => (
                                    <li key={tier.name} className="flex items-start gap-2">
                                        <span className="mt-2 size-1.5 rounded-full bg-amber-400" />
                                        <span>
                                            <span className="font-semibold text-white">
                                                {tier.name}
                                            </span>{' '}
                                            • {tier.price} — {tier.description}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <SubscribeDialog
                                tiers={subscriptionTiers}
                                trigger={
                                    <Button className="w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-[1.02]">
                                        Become a member
                                    </Button>
                                }
                            />
                        </CardFooter>
                    </Card>

                    <Card className="border-white/10 bg-white/5 text-white">
                        <CardHeader className="gap-2">
                            <CardTitle className="text-lg font-semibold">
                                Quick tip
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Send an instant boost without leaving the wishlist.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-white/70">
                                Tip trains help fund gear drops, travel, and production
                                upgrades. Choose a quick amount or enter your own.
                            </p>
                        </CardContent>
                        <CardFooter>
                            <TipDialog
                                options={tipOptions}
                                trigger={
                                    <Button className="w-full rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-white hover:border-white/40 hover:bg-white/20">
                                        Launch tip tray
                                    </Button>
                                }
                            />
                        </CardFooter>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}





