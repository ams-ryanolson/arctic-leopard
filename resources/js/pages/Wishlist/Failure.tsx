import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, RefreshCw, XCircle } from 'lucide-react';

interface WishlistFailureProps {
    purchase?: {
        id: number;
        uuid: string;
        item: {
            id: number;
            title: string;
            creator: {
                username: string;
            };
        };
    } | null;
    error?: string;
    message?: string;
}

export default function WishlistFailure({
    purchase,
    error,
    message,
}: WishlistFailureProps) {
    const errorMessage =
        message || error || 'Your payment could not be processed at this time.';
    const itemTitle = purchase?.item.title || 'item';
    const creatorUsername = purchase?.item.creator.username;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Payment Failed', href: '#' },
            ]}
        >
            <Head title="Payment Failed · Wishlist" />

            <div className="mx-auto max-w-2xl space-y-8">
                {/* Failure Header */}
                <div className="text-center">
                    <div className="mb-6 inline-flex size-20 items-center justify-center rounded-full bg-rose-400/10">
                        <XCircle className="size-10 text-rose-400" />
                    </div>
                    <h1 className="mb-2 text-3xl font-semibold text-white">
                        Payment Failed
                    </h1>
                    <p className="text-lg text-white/70">
                        We couldn't process your payment
                    </p>
                </div>

                {/* Error Alert */}
                <Alert className="border-rose-400/40 bg-rose-400/5 text-white">
                    <AlertCircle className="size-4 text-rose-400" />
                    <AlertTitle className="text-white">
                        Payment Error
                    </AlertTitle>
                    <AlertDescription className="mt-2 text-white/80">
                        {errorMessage}
                    </AlertDescription>
                </Alert>

                {/* Info Card */}
                {purchase && (
                    <Card className="border-white/10 bg-white/5 text-white">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Purchase Details
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Your purchase attempt information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-white/60">Item</p>
                                <p className="mt-1 font-medium text-white">
                                    {itemTitle}
                                </p>
                            </div>
                            {purchase.uuid && (
                                <div>
                                    <p className="text-sm text-white/60">
                                        Purchase ID
                                    </p>
                                    <p className="mt-1 font-mono text-sm text-white/80">
                                        {purchase.uuid}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Common Issues */}
                <Card className="border-white/10 bg-white/5 text-white">
                    <CardHeader>
                        <CardTitle className="text-lg">
                            What might have gone wrong?
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 size-1.5 rounded-full bg-white/40" />
                            <div>
                                <p className="text-sm font-medium text-white">
                                    Insufficient funds
                                </p>
                                <p className="mt-1 text-xs text-white/60">
                                    Your payment method may not have enough
                                    funds available.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 size-1.5 rounded-full bg-white/40" />
                            <div>
                                <p className="text-sm font-medium text-white">
                                    Card declined
                                </p>
                                <p className="mt-1 text-xs text-white/60">
                                    Your bank or card issuer may have declined
                                    the transaction.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 size-1.5 rounded-full bg-white/40" />
                            <div>
                                <p className="text-sm font-medium text-white">
                                    Network issues
                                </p>
                                <p className="mt-1 text-xs text-white/60">
                                    A temporary network error may have occurred
                                    during processing.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    {purchase && (
                        <Button
                            onClick={() =>
                                router.visit(
                                    `/wishlist/${purchase.item.id}/checkout`,
                                )
                            }
                            className="flex-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-105"
                        >
                            <RefreshCw className="mr-2 size-4" />
                            Try Again
                        </Button>
                    )}
                    {creatorUsername && (
                        <Button
                            asChild
                            variant="outline"
                            className="flex-1 rounded-full border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10"
                        >
                            <Link href={`/w/${creatorUsername}`}>
                                Back to Wishlist
                            </Link>
                        </Button>
                    )}
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

                {/* Support Message */}
                <Card className="border-white/10 bg-white/5 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="rounded-full bg-amber-400/10 p-2">
                                <AlertCircle className="size-5 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="mb-1 font-semibold text-white">
                                    Need help?
                                </h3>
                                <p className="text-sm text-white/70">
                                    If you continue to experience issues, please
                                    contact support. Your payment method has not
                                    been charged.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}


