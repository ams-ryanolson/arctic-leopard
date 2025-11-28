import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';

type Ad = {
    id: number;
    name: string;
    status: string;
    budget_amount: number;
    spent_amount: number;
    impressions_count: number;
    clicks_count: number;
};

type AdvertiserAdsIndexProps = {
    ads: {
        data: Ad[];
        meta: {
            current_page: number;
            per_page: number;
            total: number;
            last_page: number;
        };
    };
};

export default function AdvertiserAdsIndex({ ads }: AdvertiserAdsIndexProps) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'My Ads', href: '/advertiser/ads' },
            ]}
        >
            <Head title="My Ads" />

            <div className="space-y-8 text-white">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            My Ads
                        </h1>
                        <p className="text-sm text-white/65">
                            Manage your advertising campaigns.
                        </p>
                    </div>
                    <Link
                        href="/advertiser/ads/create"
                        className="rounded-full bg-white px-5 text-xs font-semibold tracking-[0.35em] text-black uppercase shadow-[0_30px_70px_-45px_rgba(255,255,255,0.55)] hover:scale-[1.02]"
                    >
                        Create Ad
                    </Link>
                </header>

                {ads.data.length === 0 ? (
                    <Card className="border-white/10 bg-white/5">
                        <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-white/70">
                            <p>You haven't created any ads yet.</p>
                            <Link
                                href="/advertiser/ads/create"
                                className="rounded-full bg-white px-5 text-xs font-semibold tracking-[0.35em] text-black uppercase"
                            >
                                Create Your First Ad
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {ads.data.map((ad) => (
                            <Card
                                key={ad.id}
                                className="border-white/10 bg-white/5 text-white"
                            >
                                <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Link
                                                href={`/advertiser/ads/${ad.id}`}
                                                className="text-lg font-semibold hover:underline"
                                            >
                                                {ad.name}
                                            </Link>
                                            <Badge className="rounded-full bg-gray-500/20 text-[0.65rem] text-gray-300">
                                                {ad.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-white/70">
                                            Budget: $
                                            {(ad.budget_amount / 100).toFixed(
                                                2,
                                            )}{' '}
                                            · Spent: $
                                            {(ad.spent_amount / 100).toFixed(2)}
                                        </p>
                                        <div className="flex flex-wrap gap-2 text-xs tracking-[0.3em] text-white/60 uppercase">
                                            <Badge className="rounded-full border-white/20 bg-white/10 text-[0.65rem]">
                                                {ad.impressions_count}{' '}
                                                impressions
                                            </Badge>
                                            <Badge className="rounded-full border-white/20 bg-white/10 text-[0.65rem]">
                                                {ad.clicks_count} clicks
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}


