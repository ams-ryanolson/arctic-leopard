import { CheckoutSummary } from '@/components/payments/CheckoutSummary';
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

type SignalsAdsCheckoutProps = {
    ad: {
        id: number;
        name: string;
    };
    intent: {
        id: number;
        client_secret: string;
        amount: number;
        currency: string;
    };
    ccbill_client_accnum?: number;
    ccbill_client_subacc?: number;
};

export default function SignalsAdsCheckout({
    ad,
    intent,
    ccbill_client_accnum,
    ccbill_client_subacc,
}: SignalsAdsCheckoutProps) {
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
        number | null
    >(null);

    const { post, processing } = useForm({
        ad_id: ad.id,
        amount: intent.amount,
        currency: intent.currency,
        gateway:
            ccbill_client_accnum && ccbill_client_subacc ? 'ccbill' : 'fake',
        method: 'card',
        payment_method_id: null as number | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/advertiser/ads/checkout', {
            preserveScroll: true,
            onSuccess: () => {
                // Handle success (redirect or show confirmation)
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Signals', href: '/signals' },
                { title: 'Ads', href: '/signals/ads' },
                { title: 'Checkout', href: '/signals/ads/checkout' },
            ]}
        >
            <Head title="Checkout" />

            <div className="mx-auto max-w-4xl space-y-8">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">
                        Checkout
                    </h1>
                    <p className="text-sm text-white/65">
                        Complete your ad purchase.
                    </p>
                </header>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-2">
                            <Card className="border-white/10 bg-white/5">
                                <CardHeader>
                                    <CardTitle className="text-white">
                                        Ad Purchase
                                    </CardTitle>
                                    <CardDescription className="text-white/60">
                                        {ad.name}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-white/70">
                                                Payment Method
                                            </label>
                                            {ccbill_client_accnum &&
                                            ccbill_client_subacc ? (
                                                <PaymentMethodSelector
                                                    selectedId={
                                                        selectedPaymentMethodId
                                                    }
                                                    onSelect={
                                                        setSelectedPaymentMethodId
                                                    }
                                                    onAddNew={() => {
                                                        window.location.href =
                                                            '/settings/payment-methods';
                                                    }}
                                                    showAddButton={true}
                                                />
                                            ) : (
                                                <p className="text-sm text-white/60">
                                                    Payment method selection
                                                    will be available after
                                                    CCBill is configured.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-1">
                            <Card className="sticky top-4 border-white/10 bg-white/5">
                                <CardHeader>
                                    <CardTitle className="text-white">
                                        Order Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CheckoutSummary
                                        items={[
                                            {
                                                label: ad.name,
                                                amount: intent.amount,
                                                currency: intent.currency,
                                            },
                                        ]}
                                        total={intent.amount}
                                        currency={intent.currency}
                                    />
                                    <Button
                                        type="submit"
                                        className="mt-6 w-full"
                                        disabled={
                                            processing ||
                                            (!selectedPaymentMethodId &&
                                                ccbill_client_accnum &&
                                                ccbill_client_subacc)
                                        }
                                        size="lg"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Complete Purchase'
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
