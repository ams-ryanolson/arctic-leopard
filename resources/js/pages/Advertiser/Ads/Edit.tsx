import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

type AdvertiserAdsEditProps = {
    ad: {
        id: number;
        name: string;
    };
};

export default function AdvertiserAdsEdit({ ad }: AdvertiserAdsEditProps) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'My Ads', href: '/advertiser/ads' },
                { title: ad.name, href: `/advertiser/ads/${ad.id}/edit` },
            ]}
        >
            <Head title={`Edit ${ad.name}`} />

            <div className="space-y-8 text-white">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight">Edit Ad</h1>
                    <p className="text-sm text-white/65">Update your ad settings.</p>
                </header>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
                    <p>Ad edit form coming soon...</p>
                </div>
            </div>
        </AppLayout>
    );
}


