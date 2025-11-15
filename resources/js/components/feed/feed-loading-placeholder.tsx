import { Card } from '@/components/ui/card';

const FeedLoadingPlaceholder = () => (
    <Card className="border border-white/10 bg-white/5 p-5 text-sm text-white/70">
        <div className="animate-pulse space-y-3">
            <div className="h-3 rounded-full bg-white/10" />
            <div className="h-3 rounded-full bg-white/10" />
            <div className="h-3 rounded-full bg-white/10" />
        </div>
    </Card>
);

export default FeedLoadingPlaceholder;








