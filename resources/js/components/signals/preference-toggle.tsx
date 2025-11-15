import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PreferenceToggleProps {
    active: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
    className?: string;
}

export function PreferenceToggle({
    active,
    activeLabel = 'Enabled',
    inactiveLabel = 'Enable',
    className,
}: PreferenceToggleProps) {
    return (
        <Button
            variant={active ? 'default' : 'outline'}
            size="sm"
            className={cn(
                'rounded-full',
                active
                    ? 'bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-300 text-black'
                    : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white',
                className,
            )}
        >
            {active ? activeLabel : inactiveLabel}
        </Button>
    );
}








