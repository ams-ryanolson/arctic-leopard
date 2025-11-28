import { useId, useMemo } from 'react';

interface TimelinePoint {
    label: string;
    value: number;
}

interface TimelineSeries {
    name: string;
    values: TimelinePoint[];
    color?: string;
}

interface DualLineChartProps {
    series: TimelineSeries[];
    width?: number;
    height?: number;
}

const palette = [
    'rgba(249, 115, 22, 0.85)',
    'rgba(56, 189, 248, 0.85)',
    'rgba(190, 242, 100, 0.85)',
];

export function DualLineChart({
    series,
    width = 520,
    height = 220,
}: DualLineChartProps) {
    const gradientId = useId();

    const computedSeries = useMemo(() => {
        if (!series.length) {
            return [];
        }

        const maxPoints = Math.max(...series.map((item) => item.values.length));
        const flattened = series.flatMap((item) =>
            item.values.map((value) => value.value),
        );
        const min = Math.min(...flattened);
        const max = Math.max(...flattened);
        const range = max - min || 1;
        const step = width / Math.max(maxPoints - 1, 1);

        return series.map((item, seriesIndex) => {
            const color = item.color ?? palette[seriesIndex % palette.length];
            const points = item.values.map((value, index) => {
                const x = index * step;
                const normalized = (value.value - min) / range;
                const y = height - normalized * height;

                return {
                    ...value,
                    x,
                    y,
                };
            });

            const path = points
                .map(
                    (point, index) =>
                        `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`,
                )
                .join(' ');

            return {
                name: item.name,
                color,
                points,
                path,
            };
        });
    }, [series, height, width]);

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Timeline comparison chart"
        >
            <defs>
                <linearGradient
                    id={gradientId}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                >
                    <stop offset="5%" stopColor="rgba(255,255,255,0.16)" />
                    <stop offset="95%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
            </defs>

            <rect
                x="0"
                y="0"
                width={width}
                height={height}
                fill={`url(#${gradientId})`}
            />
            {computedSeries.map((item) => (
                <g key={item.name}>
                    <path
                        d={item.path}
                        fill="none"
                        stroke={item.color}
                        strokeWidth={2.8}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />
                    {item.points.map((point) => (
                        <circle
                            key={`${item.name}-${point.label}`}
                            cx={point.x}
                            cy={point.y}
                            r={4}
                            fill={item.color}
                        />
                    ))}
                </g>
            ))}
        </svg>
    );
}


