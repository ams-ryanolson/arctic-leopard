import { useMemo } from 'react';

interface RadialGaugeProps {
    value: number;
    max?: number;
    size?: number;
    label?: string;
    highlight?: string;
}

export function RadialGauge({ value, max = 100, size = 120, label, highlight = 'rgba(56,189,248,0.9)' }: RadialGaugeProps) {
    const { circumference, dashOffset } = useMemo(() => {
        const normalizedValue = Math.max(0, Math.min(value / max, 1));
        const radius = (size - 12) / 2;
        const c = 2 * Math.PI * radius;
        return {
            circumference: c,
            dashOffset: c - normalizedValue * c,
        };
    }, [value, max, size]);

    const center = size / 2;
    const radius = (size - 12) / 2;

    return (
        <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Gauge showing ${value} of ${max}`}>
            <circle
                cx={center}
                cy={center}
                r={radius}
                stroke="rgba(148,163,184,0.25)"
                strokeWidth={12}
                fill="none"
                strokeLinecap="round"
            />
            <circle
                cx={center}
                cy={center}
                r={radius}
                stroke={highlight}
                strokeWidth={12}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${center} ${center})`}
            />
            <text
                x="50%"
                y="52%"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={size * 0.2}
                fill="white"
                fontWeight={600}
            >
                {Math.round((value / max) * 100)}%
            </text>
            {label ? (
                <text
                    x="50%"
                    y="70%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={size * 0.12}
                    fill="rgba(226,232,240,0.7)"
                >
                    {label}
                </text>
            ) : null}
        </svg>
    );
}




