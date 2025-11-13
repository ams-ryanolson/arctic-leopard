import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function AdminReportsShow() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Admin', href: '/admin' },
                { title: 'Reports', href: '/admin/reports' },
            ]}
        >
            <Head title="Ad Reports · Admin" />

            <div className="space-y-8 text-white">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight">Ad Reports</h1>
                    <p className="text-sm text-white/65">View advertising performance reports.</p>
                </header>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
                    <p>Reports dashboard coming soon...</p>
                </div>
            </div>
        </AppLayout>
    );
}

