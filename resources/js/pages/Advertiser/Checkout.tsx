import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

type AdvertiserCheckoutProps = {
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
};

export default function AdvertiserCheckout({ ad, intent }: AdvertiserCheckoutProps) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'My Ads', href: '/advertiser/ads' },
                { title: 'Checkout', href: '/advertiser/checkout' },
            ]}
        >
            <Head title="Checkout" />

            <div className="space-y-8 text-white">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
                    <p className="text-sm text-white/65">Complete your ad purchase.</p>
                </header>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
                    <p>Checkout form for {ad.name} coming soon...</p>
                    <p className="mt-2 text-sm">Amount: ${(intent.amount / 100).toFixed(2)} {intent.currency}</p>
                </div>
            </div>
        </AppLayout>
    );
}


