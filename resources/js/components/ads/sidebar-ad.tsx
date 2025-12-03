import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { useCallback } from 'react';

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
        async (e: React.MouseEvent) => {
            if (!ad) {
                return;
            }

            e.preventDefault();

            // Record click using fetch (API route, not Inertia)
            try {
                await fetch(`/api/ads/${ad.ad_id}/clicks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        creative_id: ad.id,
                        placement: ad.placement,
                    }),
                });
            } catch (error) {
                // Silently fail - don't block the user from clicking
                console.error('Failed to record ad click:', error);
            }

            // Track and redirect
            window.open(
                `/api/ads/${ad.ad_id}/track?creative_id=${ad.id}&placement=${ad.placement}`,
                '_blank',
            );
        },
        [ad],
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
        <Card className="overflow-hidden border-white/10 bg-white/5 text-white">
            <CardHeader className="p-0">
                {ad.asset_type === 'image' && ad.asset_url && (
                    <div
                        className={`relative ${sizeClasses[size]} w-full overflow-hidden`}
                    >
                        <img
                            src={ad.asset_url}
                            alt={ad.headline || 'Advertisement'}
                            className="h-full w-full object-cover"
                        />
                        {ad.headline && (
                            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                                <p className="text-sm font-semibold text-white">
                                    {ad.headline}
                                </p>
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
                <CardContent className="space-y-2 p-4">
                    {ad.headline && (
                        <h3 className="text-sm font-semibold text-white">
                            {ad.headline}
                        </h3>
                    )}
                    {ad.body_text && (
                        <p className="line-clamp-2 text-xs text-white/70">
                            {ad.body_text}
                        </p>
                    )}
                    {ad.cta_text && (
                        <a
                            href={ad.cta_url}
                            onClick={handleClick}
                            className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 transition-colors hover:text-amber-300"
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
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                    >
                        {ad.cta_text}
                        <ExternalLink className="size-4" />
                    </a>
                </CardContent>
            )}
        </Card>
    );
}
