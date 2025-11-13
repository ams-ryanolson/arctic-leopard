import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Head } from '@inertiajs/react';

type AdminAdsShowProps = {
    ad: {
        id: number;
        name: string;
        status: string;
        budget_amount: number;
        spent_amount: number;
        impressions_count: number;
        clicks_count: number;
    };
    report: {
        impressions: number;
        clicks: number;
        spend: number;
        ctr: number;
        cpm: number | null;
        cpc: number | null;
    };
    dateRange: {
        start: string;
        end: string;
    };
};

export default function AdminAdsShow({ ad, report, dateRange }: AdminAdsShowProps) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Admin', href: '/admin' },
                { title: 'Ads', href: '/admin/ads' },
                { title: ad.name, href: `/admin/ads/${ad.id}` },
            ]}
        >
            <Head title={`${ad.name} · Admin`} />

            <div className="space-y-8 text-white">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight">{ad.name}</h1>
                    <p className="text-sm text-white/65">Ad details and performance metrics.</p>
                </header>

                <div className="grid gap-6 md:grid-cols-2">
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
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Spend</p>
                                <p className="text-2xl font-semibold text-white">${(report.spend / 100).toFixed(2)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Budget</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Budget</p>
                                <p className="text-2xl font-semibold text-white">${(ad.budget_amount / 100).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Spent</p>
                                <p className="text-2xl font-semibold text-white">${(ad.spent_amount / 100).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Remaining</p>
                                <p className="text-2xl font-semibold text-white">${((ad.budget_amount - ad.spent_amount) / 100).toFixed(2)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

