import { useId, useMemo } from 'react';

interface MiniSparklineProps {
    values: number[];
    width?: number;
    height?: number;
    stroke?: string;
    fill?: string;
    className?: string;
}

export function MiniSparkline({
    values,
    width = 160,
    height = 56,
    stroke = 'rgba(255,255,255,0.85)',
    fill = 'rgba(255,255,255,0.12)',
    className,
}: MiniSparklineProps) {
    const gradientId = useId();

    const { path, area } = useMemo(() => {
        if (values.length === 0) {
            return { path: '', area: '' };
        }

        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;

        const step = width / Math.max(values.length - 1, 1);

        const points = values.map((value, index) => {
            const x = index * step;
            const normalized = (value - min) / range;
            const y = height - normalized * height;
            return { x, y };
        });

        const linePath = points
            .map(
                (point, index) =>
                    `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`,
            )
            .join(' ');
        const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

        return { path: linePath, area: areaPath };
    }, [values, width, height]);

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className={className}
            role="img"
            aria-label="Sparkline trend visualization"
        >
            <defs>
                <linearGradient
                    id={gradientId}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                >
                    <stop offset="5%" stopColor={fill} stopOpacity="0.7" />
                    <stop offset="95%" stopColor={fill} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradientId})`} />
            <path
                d={path}
                fill="none"
                stroke={stroke}
                strokeWidth={2.2}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
}
