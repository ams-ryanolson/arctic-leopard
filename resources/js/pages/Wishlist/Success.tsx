import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Gift, Heart, Sparkles } from 'lucide-react';

type PurchaseSummary = {
    id: number;
    uuid: string;
    amount: number;
    currency: string;
    message: string | null;
    covers_fee: boolean;
    created_at: string;
    fulfilled_at: string;
    item: {
        id: number;
        title: string;
        description: string | null;
        image_url: string | null;
        is_crowdfunded: boolean;
        creator: {
            id: number;
            username: string;
            display_name: string;
            avatar_url: string | null;
        };
    };
    payment: {
        id: number;
        amount: number;
        fee_amount: number;
        net_amount: number;
        currency: string;
        provider_payment_id: string | null;
    } | null;
};

interface WishlistSuccessProps {
    purchase: PurchaseSummary;
}

function formatCurrency(cents: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 2,
    }).format(cents / 100);
}

export default function WishlistSuccess({ purchase }: WishlistSuccessProps) {
    const getInitials = useInitials();
    const creatorInitials = getInitials(purchase.item.creator.display_name);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Wishlist Purchase', href: '#' },
            ]}
        >
            <Head title="Purchase Successful · Wishlist" />

            <div className="mx-auto max-w-2xl space-y-8">
                {/* Success Header */}
                <div className="text-center">
                    <div className="mb-6 inline-flex size-20 items-center justify-center rounded-full bg-emerald-400/10">
                        <CheckCircle2 className="size-10 text-emerald-400" />
                    </div>
                    <h1 className="mb-2 text-3xl font-semibold text-white">
                        Thank You!
                    </h1>
                    <p className="text-lg text-white/70">
                        Your{' '}
                        {purchase.item.is_crowdfunded
                            ? 'contribution'
                            : 'purchase'}{' '}
                        was successful
                    </p>
                </div>

                {/* Purchase Summary Card */}
                <Card className="border-white/10 bg-white/5 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Gift className="size-5 text-amber-400" />
                            Purchase Summary
                        </CardTitle>
                        <CardDescription className="text-white/60">
                            Your purchase details and receipt
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Item Info */}
                        <div className="flex gap-4">
                            {purchase.item.image_url ? (
                                <img
                                    src={purchase.item.image_url}
                                    alt={purchase.item.title}
                                    className="h-24 w-24 rounded-xl border border-white/10 object-cover"
                                />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-amber-400/20 via-rose-500/20 to-violet-600/20">
                                    <Gift className="size-8 text-white/40" />
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white">
                                    {purchase.item.title}
                                </h3>
                                {purchase.item.description && (
                                    <p className="mt-1 text-sm text-white/60">
                                        {purchase.item.description}
                                    </p>
                                )}
                                <div className="mt-2 flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="border-white/20 bg-white/5 text-xs text-white/70"
                                    >
                                        {purchase.item.is_crowdfunded
                                            ? 'Crowdfunded'
                                            : 'Fixed Price'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <Separator className="border-white/10" />

                        {/* Creator Info */}
                        <div className="flex items-center gap-3">
                            <Avatar className="size-12 border-2 border-white/20">
                                <AvatarImage
                                    src={
                                        purchase.item.creator.avatar_url ??
                                        undefined
                                    }
                                    alt={purchase.item.creator.display_name}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-amber-400/80 via-rose-500/80 to-violet-600/80 text-sm font-semibold text-white">
                                    {creatorInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium text-white">
                                    {purchase.item.creator.display_name}
                                </p>
                                <p className="text-xs text-white/60">
                                    @{purchase.item.creator.username}
                                </p>
                            </div>
                        </div>

                        <Separator className="border-white/10" />

                        {/* Purchase Details */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white/70">
                                    {purchase.item.is_crowdfunded
                                        ? 'Contribution Amount'
                                        : 'Item Price'}
                                </span>
                                <span className="text-lg font-semibold text-white">
                                    {formatCurrency(
                                        purchase.amount,
                                        purchase.currency,
                                    )}
                                </span>
                            </div>
                            {purchase.payment &&
                                purchase.payment.fee_amount > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white/70">
                                            Platform Fee{' '}
                                            {purchase.covers_fee &&
                                                '(You covered)'}
                                        </span>
                                        <span className="text-sm font-medium text-white/80">
                                            {formatCurrency(
                                                purchase.payment.fee_amount,
                                                purchase.currency,
                                            )}
                                        </span>
                                    </div>
                                )}
                            {purchase.payment && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-white/70">
                                        Total Paid
                                    </span>
                                    <span className="text-sm font-medium text-white/80">
                                        {formatCurrency(
                                            purchase.payment.amount,
                                            purchase.currency,
                                        )}
                                    </span>
                                </div>
                            )}
                            {purchase.message && (
                                <>
                                    <Separator className="border-white/10" />
                                    <div>
                                        <p className="mb-1 text-xs tracking-[0.3em] text-white/50 uppercase">
                                            Your Message
                                        </p>
                                        <p className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white/80">
                                            {purchase.message}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        <Separator className="border-white/10" />

                        {/* Purchase Info */}
                        <div className="space-y-2 text-xs text-white/60">
                            <div className="flex items-center justify-between">
                                <span>Purchase ID</span>
                                <span className="font-mono text-white/80">
                                    {purchase.uuid}
                                </span>
                            </div>
                            {purchase.payment?.provider_payment_id && (
                                <div className="flex items-center justify-between">
                                    <span>Transaction ID</span>
                                    <span className="font-mono text-white/80">
                                        {purchase.payment.provider_payment_id}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span>Date</span>
                                <span className="text-white/80">
                                    {new Date(
                                        purchase.fulfilled_at ||
                                            purchase.created_at,
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                        asChild
                        className="flex-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-105"
                    >
                        <Link href={`/w/${purchase.item.creator.username}`}>
                            <Heart className="mr-2 size-4" />
                            View Wishlist
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="flex-1 rounded-full border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10"
                    >
                        <Link href={`/p/${purchase.item.creator.username}`}>
                            <Sparkles className="mr-2 size-4" />
                            View Profile
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="ghost"
                        className="rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                    >
                        <Link href="/dashboard">
                            <ArrowLeft className="mr-2 size-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>

                {/* Thank You Message */}
                <Card className="border-emerald-400/20 bg-emerald-400/5 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="rounded-full bg-emerald-400/10 p-2">
                                <Heart className="size-5 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="mb-1 font-semibold text-white">
                                    You're amazing!
                                </h3>
                                <p className="text-sm text-white/70">
                                    Your{' '}
                                    {purchase.item.is_crowdfunded
                                        ? 'contribution'
                                        : 'purchase'}{' '}
                                    helps {purchase.item.creator.display_name}{' '}
                                    bring their creative vision to life. They'll
                                    receive a notification and may reach out to
                                    thank you personally.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}


