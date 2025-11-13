import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { useCallback } from 'react';
import { router } from '@inertiajs/react';

type AdCreative = {
    id: number;
    ad_id: number;
    placement: string;
    size: string;
    asset_type: string;
    asset_path: string | null;
    asset_url: string | null;
    headline: string | null;
    body_text: string | null;
    cta_text: string | null;
    cta_url: string;
    display_order: number;
    is_active: boolean;
};

type SidebarAdProps = {
    ad: AdCreative | null;
    size?: 'small' | 'medium' | 'large';
};

export default function SidebarAd({ ad, size = 'large' }: SidebarAdProps) {
    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            if (!ad) {
                return;
            }

            e.preventDefault();

            // Record click
            router.post(
                `/api/ads/${ad.ad_id}/clicks`,
                {
                    creative_id: ad.id,
                    placement: ad.placement,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                }
            );

            // Track and redirect
            window.open(`/api/ads/${ad.ad_id}/track?creative_id=${ad.id}&placement=${ad.placement}`, '_blank');
        },
        [ad]
    );

    if (!ad) {
        return null;
    }

    const sizeClasses = {
        small: 'h-32',
        medium: 'h-48',
        large: 'h-64',
    };

    return (
        <Card className="border-white/10 bg-white/5 text-white overflow-hidden">
            <CardHeader className="p-0">
                {ad.asset_type === 'image' && ad.asset_url && (
                    <div className={`relative ${sizeClasses[size]} w-full overflow-hidden`}>
                        <img
                            src={ad.asset_url}
                            alt={ad.headline || 'Advertisement'}
                            className="h-full w-full object-cover"
                        />
                        {ad.headline && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-4">
                                <p className="text-sm font-semibold text-white">{ad.headline}</p>
                            </div>
                        )}
                    </div>
                )}
                {ad.asset_type === 'html' && (
                    <div
                        className={`${sizeClasses[size]} w-full`}
                        dangerouslySetInnerHTML={{ __html: ad.asset_url || '' }}
                    />
                )}
            </CardHeader>
            {(ad.headline || ad.body_text || ad.cta_text) && (
                <CardContent className="p-4 space-y-2">
                    {ad.headline && <h3 className="text-sm font-semibold text-white">{ad.headline}</h3>}
                    {ad.body_text && <p className="text-xs text-white/70 line-clamp-2">{ad.body_text}</p>}
                    {ad.cta_text && (
                        <a
                            href={ad.cta_url}
                            onClick={handleClick}
                            className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                        >
                            {ad.cta_text}
                            <ExternalLink className="size-3" />
                        </a>
                    )}
                </CardContent>
            )}
            {!ad.headline && !ad.body_text && ad.cta_text && (
                <CardContent className="p-4">
                    <a
                        href={ad.cta_url}
                        onClick={handleClick}
                        className="inline-flex items-center justify-center w-full gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                    >
                        {ad.cta_text}
                        <ExternalLink className="size-4" />
                    </a>
                </CardContent>
            )}
        </Card>
    );
}

