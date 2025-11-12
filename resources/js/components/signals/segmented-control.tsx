import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface SegmentedOption {
    id: string;
    label: ReactNode;
    description?: ReactNode;
}

interface SegmentedControlProps {
    options: SegmentedOption[];
    selectedId: string;
    onSelect?: (id: string) => void;
    className?: string;
}

export function SegmentedControl({ options, selectedId, onSelect, className }: SegmentedControlProps) {
    return (
        <div className={cn('inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/20 p-1 text-xs', className)}>
            {options.map((option) => {
                const isActive = option.id === selectedId;
                return (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => onSelect?.(option.id)}
                        className={cn(
                            'flex min-w-[6rem] flex-col items-center rounded-full px-3 py-2 transition',
                            isActive ? 'bg-white/15 text-white shadow-[0_12px_30px_-18px_rgba(255,255,255,0.8)]' : 'text-white/60 hover:text-white',
                        )}
                    >
                        <span className="text-[0.65rem] uppercase tracking-[0.3em]">{option.label}</span>
                        {option.description ? (
                            <span className="mt-1 text-[0.6rem] text-white/50">{option.description}</span>
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
}




