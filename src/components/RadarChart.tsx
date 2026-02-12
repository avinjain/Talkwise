'use client';

import { DIMENSIONS, ProfileResult } from '@/lib/personality-test';

interface RadarChartProps {
  scores: ProfileResult;
  size?: number;
}

export default function RadarChart({ scores, size = 320 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const levels = 5; // concentric rings (0, 2, 4, 6, 8, 10 mapped to 5 rings)
  const dims = DIMENSIONS;
  const angleStep = (2 * Math.PI) / dims.length;

  // Get point on the chart for a given dimension index and value (0-10)
  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2; // start from top
    const r = (value / 10) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Build the data polygon
  const dataPoints = dims.map((dim, i) => {
    const value = (scores as unknown as Record<string, number>)[dim.key] ?? 0;
    return getPoint(i, value);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Concentric rings */}
        {Array.from({ length: levels }, (_, i) => {
          const r = (radius / levels) * (i + 1);
          const ringPoints = dims.map((_, j) => {
            const angle = angleStep * j - Math.PI / 2;
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
          });
          return (
            <polygon
              key={`ring-${i}`}
              points={ringPoints.join(' ')}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          );
        })}

        {/* Axis lines */}
        {dims.map((_, i) => {
          const end = getPoint(i, 10);
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          );
        })}

        {/* Data area */}
        <path
          d={dataPath}
          fill="url(#radarGradient)"
          stroke="url(#radarStroke)"
          strokeWidth={2.5}
          opacity={0.85}
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={`point-${i}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={dims[i].color}
            stroke="white"
            strokeWidth={2}
          />
        ))}

        {/* Labels */}
        {dims.map((dim, i) => {
          const labelDist = radius + 28;
          const angle = angleStep * i - Math.PI / 2;
          const lx = cx + labelDist * Math.cos(angle);
          const ly = cy + labelDist * Math.sin(angle);
          const value = (scores as unknown as Record<string, number>)[dim.key] ?? 0;

          return (
            <g key={`label-${i}`}>
              <text
                x={lx}
                y={ly - 6}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] font-semibold fill-slate-700"
              >
                {dim.label}
              </text>
              <text
                x={lx}
                y={ly + 8}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[11px] font-bold"
                fill={dim.color}
              >
                {value.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ed7b5" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#2e7dd1" stopOpacity={0.15} />
          </linearGradient>
          <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ed7b5" />
            <stop offset="100%" stopColor="#2e7dd1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
