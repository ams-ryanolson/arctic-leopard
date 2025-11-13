import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SignalsAdsShowProps = {
    ad: {
        id: number;
        name: string;
        status: string;
    };
    report: {
        impressions: number;
        clicks: number;
        spend: number;
        ctr: number;
    };
};

export default function SignalsAdsShow({ ad, report }: SignalsAdsShowProps) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Signals', href: '/signals' },
                { title: 'Ads', href: '/signals/ads' },
                { title: ad.name, href: `/signals/ads/${ad.id}` },
            ]}
        >
            <Head title={ad.name} />

            <div className="space-y-8 text-white">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight">{ad.name}</h1>
                    <p className="text-sm text-white/65">View your ad performance.</p>
                </header>

                <Card className="border-white/10 bg-white/5">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Impressions</p>
                            <p className="text-2xl font-semibold text-white">{report.impressions.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Clicks</p>
                            <p className="text-2xl font-semibold text-white">{report.clicks.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/60">CTR</p>
                            <p className="text-2xl font-semibold text-white">{(report.ctr * 100).toFixed(2)}%</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

