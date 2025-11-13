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

interface ChartWithAxesProps {
    series: TimelineSeries[];
    width?: number;
    height?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    formatYValue?: (value: number) => string;
}

const palette = ['rgba(249, 115, 22, 0.85)', 'rgba(56, 189, 248, 0.85)', 'rgba(190, 242, 100, 0.85)'];

const PADDING = {
    top: 20,
    right: 20,
    bottom: 40,
    left: 50,
};

export function ChartWithAxes({
    series,
    width = 520,
    height = 220,
    xAxisLabel,
    yAxisLabel,
    formatYValue = (v) => v.toLocaleString(),
}: ChartWithAxesProps) {
    const gradientId = useId();
    const chartWidth = width - PADDING.left - PADDING.right;
    const chartHeight = height - PADDING.top - PADDING.bottom;

    const computedSeries = useMemo(() => {
        if (!series.length) {
            return [];
        }

        const maxPoints = Math.max(...series.map((item) => item.values.length));
        const flattened = series.flatMap((item) => item.values.map((value) => value.value));
        const min = Math.min(...flattened);
        const max = Math.max(...flattened);
        const range = max - min || 1;
        const step = chartWidth / Math.max(maxPoints - 1, 1);

        // Calculate Y-axis tick values
        const tickCount = 5;
        const tickStep = range / (tickCount - 1);
        const yTicks = Array.from({ length: tickCount }, (_, i) => min + tickStep * i);

        return {
            series: series.map((item, seriesIndex) => {
                const color = item.color ?? palette[seriesIndex % palette.length];
                const points = item.values.map((value, index) => {
                    const x = PADDING.left + index * step;
                    const normalized = (value.value - min) / range;
                    const y = PADDING.top + chartHeight - normalized * chartHeight;

                    return {
                        ...value,
                        x,
                        y,
                    };
                });

                const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');

                return {
                    name: item.name,
                    color,
                    points,
                    path,
                };
            }),
            yTicks,
            min,
            max,
        };
    }, [series, chartHeight, chartWidth]);

    if (!computedSeries.series.length) {
        return null;
    }

    return (
        <div className="relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Chart with axes">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="5%" stopColor="rgba(255,255,255,0.16)" />
                        <stop offset="95%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                </defs>

                {/* Y-axis label */}
                {yAxisLabel && (
                    <text
                        x={15}
                        y={height / 2}
                        textAnchor="middle"
                        transform={`rotate(-90, 15, ${height / 2})`}
                        fill="rgba(255,255,255,0.6)"
                        fontSize="12"
                        fontWeight="500"
                    >
                        {yAxisLabel}
                    </text>
                )}

                {/* Y-axis ticks and labels */}
                {computedSeries.yTicks.map((tickValue, index) => {
                    const normalized = (tickValue - computedSeries.min) / (computedSeries.max - computedSeries.min || 1);
                    const y = PADDING.top + chartHeight - normalized * chartHeight;

                    return (
                        <g key={index}>
                            <line
                                x1={PADDING.left}
                                y1={y}
                                x2={PADDING.left - 5}
                                y2={y}
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth={1}
                            />
                            <text
                                x={PADDING.left - 10}
                                y={y + 4}
                                textAnchor="end"
                                fill="rgba(255,255,255,0.5)"
                                fontSize="10"
                            >
                                {formatYValue(tickValue)}
                            </text>
                        </g>
                    );
                })}

                {/* X-axis line */}
                <line
                    x1={PADDING.left}
                    y1={PADDING.top + chartHeight}
                    x2={PADDING.left + chartWidth}
                    y2={PADDING.top + chartHeight}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={1}
                />

                {/* X-axis label */}
                {xAxisLabel && (
                    <text
                        x={PADDING.left + chartWidth / 2}
                        y={height - 5}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.6)"
                        fontSize="12"
                        fontWeight="500"
                    >
                        {xAxisLabel}
                    </text>
                )}

                {/* X-axis date labels (show every 5th label to avoid crowding) */}
                {series[0]?.values.map((point, index) => {
                    if (index % 5 !== 0 && index !== series[0].values.length - 1) {
                        return null;
                    }
                    const x = PADDING.left + (index / Math.max(series[0].values.length - 1, 1)) * chartWidth;
                    return (
                        <g key={index}>
                            <line
                                x1={x}
                                y1={PADDING.top + chartHeight}
                                x2={x}
                                y2={PADDING.top + chartHeight + 5}
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth={1}
                            />
                            <text
                                x={x}
                                y={PADDING.top + chartHeight + 18}
                                textAnchor="middle"
                                fill="rgba(255,255,255,0.5)"
                                fontSize="10"
                            >
                                {point.label}
                            </text>
                        </g>
                    );
                })}

                {/* Chart area gradient */}
                <rect
                    x={PADDING.left}
                    y={PADDING.top}
                    width={chartWidth}
                    height={chartHeight}
                    fill={`url(#${gradientId})`}
                />

                {/* Chart lines and points */}
                {computedSeries.series.map((item) => (
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
        </div>
    );
}

