import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function AdminCampaignsIndex() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Admin', href: '/admin' },
                { title: 'Campaigns', href: '/admin/campaigns' },
            ]}
        >
            <Head title="Manage Campaigns · Admin" />

            <div className="space-y-8 text-white">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight">Manage Campaigns</h1>
                    <p className="text-sm text-white/65">View and manage advertising campaigns.</p>
                </header>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
                    <p>Campaigns list coming soon...</p>
                </div>
            </div>
        </AppLayout>
    );
}


