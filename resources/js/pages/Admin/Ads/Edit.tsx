import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

type AdminAdsEditProps = {
    ad: {
        id: number;
        name: string;
    };
};

export default function AdminAdsEdit({ ad }: AdminAdsEditProps) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Admin', href: '/admin' },
                { title: 'Ads', href: '/admin/ads' },
                { title: ad.name, href: `/admin/ads/${ad.id}/edit` },
            ]}
        >
            <Head title={`Edit ${ad.name} · Admin`} />

            <div className="space-y-8 text-white">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight">Edit Ad</h1>
                    <p className="text-sm text-white/65">Update ad settings and creatives.</p>
                </header>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
                    <p>Ad edit form coming soon...</p>
                </div>
            </div>
        </AppLayout>
    );
}

