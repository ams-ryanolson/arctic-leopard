import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function AdvertiserReportsShow() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'My Ads', href: '/advertiser/ads' },
                { title: 'Reports', href: '/advertiser/reports' },
            ]}
        >
            <Head title="Ad Reports" />

            <div className="space-y-8 text-white">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight">Ad Reports</h1>
                    <p className="text-sm text-white/65">View your advertising performance reports.</p>
                </header>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
                    <p>Reports dashboard coming soon...</p>
                </div>
            </div>
        </AppLayout>
    );
}


