import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function SignalsAdsCreate() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Signals', href: '/signals' },
                { title: 'Ads', href: '/signals/ads' },
                { title: 'Create', href: '/signals/ads/create' },
            ]}
        >
            <Head title="Create Ad" />

            <div className="space-y-8 text-white">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight">Create Ad</h1>
                    <p className="text-sm text-white/65">Create a new advertising campaign.</p>
                </header>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
                    <p>Ad creation form coming soon...</p>
                </div>
            </div>
        </AppLayout>
    );
}

