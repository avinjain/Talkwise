'use client';

interface MBTIProgressRingProps {
  current: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'brand' | 'violet';
}

export default function MBTIProgressRing({
  current,
  total,
  size = 80,
  strokeWidth = 6,
  variant = 'violet',
}: MBTIProgressRingProps) {
  const progress = total > 0 ? current / total : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const gradientId = `progressRing-${variant}`;

  const gradient = variant === 'brand'
    ? { start: '#0ed7b5', end: '#2e7dd1' }
    : { start: '#8b5cf6', end: '#d946ef' };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient.start} />
            <stop offset="100%" stopColor={gradient.end} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-slate-700 tabular-nums">
          {current}/{total}
        </span>
      </div>
    </div>
  );
}
