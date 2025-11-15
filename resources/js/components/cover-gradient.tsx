import { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

export const COVER_GRADIENT_STYLE =
    'linear-gradient(135deg, rgba(249,115,22,0.75) 0%, rgba(244,63,94,0.6) 45%, rgba(79,70,229,0.65) 100%)';

type CoverGradientProps = {
    className?: string;
    style?: CSSProperties;
};

export default function CoverGradient({ className, style }: CoverGradientProps) {
    return (
        <div
            className={cn('bg-cover bg-center', className)}
            style={{
                backgroundImage: COVER_GRADIENT_STYLE,
                ...style,
            }}
        />
    );
}









