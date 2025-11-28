import { Card } from '@/components/ui/card';
import type { AdCreative } from '@/types/feed';

type TimelineAdProps = {
    ad: AdCreative;
};

export default function TimelineAd({ ad }: TimelineAdProps) {
    const handleClick = () => {
        if (ad.cta_url) {
            window.open(ad.cta_url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <Card className="border-white/10 bg-white/5 text-white">
            <div className="p-4">
                {ad.asset_url && (
                    <div className="mb-3 overflow-hidden rounded-lg">
                        <img
                            src={ad.asset_url}
                            alt={ad.headline || 'Advertisement'}
                            className="h-auto w-full object-cover"
                        />
                    </div>
                )}
                {ad.headline && (
                    <h3 className="mb-2 text-base font-semibold text-white">
                        {ad.headline}
                    </h3>
                )}
                {ad.body_text && (
                    <p className="mb-3 text-sm text-white/70">{ad.body_text}</p>
                )}
                {ad.cta_text && ad.cta_url && (
                    <button
                        type="button"
                        onClick={handleClick}
                        className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                    >
                        {ad.cta_text}
                    </button>
                )}
                <p className="mt-2 text-xs text-white/40">Advertisement</p>
            </div>
        </Card>
    );
}


