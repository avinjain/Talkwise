'use client';

import { DIMENSIONS, ProfileResult } from '@/lib/personality-test';

interface RadarChartProps {
  scores: ProfileResult;
  size?: number;
}

export default function RadarChart({ scores, size = 380 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;
  const levels = 5;
  const dims = DIMENSIONS;
  const angleStep = (2 * Math.PI) / dims.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 10) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

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
              strokeWidth={0.8}
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
              strokeWidth={0.8}
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
            r={3.5}
            fill={dims[i].color}
            stroke="white"
            strokeWidth={2}
          />
        ))}

        {/* Labels */}
        {dims.map((dim, i) => {
          const labelDist = radius + 32;
          const angle = angleStep * i - Math.PI / 2;
          const lx = cx + labelDist * Math.cos(angle);
          const ly = cy + labelDist * Math.sin(angle);
          const value = (scores as unknown as Record<string, number>)[dim.key] ?? 0;

          // Determine text-anchor based on position
          let anchor: 'start' | 'middle' | 'end' = 'middle';
          if (Math.cos(angle) > 0.3) anchor = 'start';
          else if (Math.cos(angle) < -0.3) anchor = 'end';

          return (
            <g key={`label-${i}`}>
              <text
                x={lx}
                y={ly - 5}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="text-[9px] font-semibold fill-slate-600"
              >
                {dim.label}
              </text>
              <text
                x={lx}
                y={ly + 8}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="text-[10px] font-bold"
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
            <stop offset="0%" stopColor="#0ed7b5" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#2e7dd1" stopOpacity={0.12} />
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
