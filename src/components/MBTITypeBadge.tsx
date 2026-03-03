'use client';

import { MBTI_DIMENSIONS } from '@/lib/mbti';

interface MBTITypeBadgeProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
}

export default function MBTITypeBadge({ type, size = 'md', showBreakdown = false }: MBTITypeBadgeProps) {
  const letters = type.split('');
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };
  const boxClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${boxClasses[size]} rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25`}
      >
        <span className={`${sizeClasses[size]} font-bold text-white tracking-tight`}>
          {type}
        </span>
      </div>
      {showBreakdown && letters.length === 4 && (
        <div className="flex flex-wrap justify-center gap-2">
          {letters.map((letter, i) => {
            const dim = MBTI_DIMENSIONS[i];
            if (!dim) return null;
            return (
              <div
                key={i}
                className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1"
                title={dim.label}
              >
                <span className="text-xs font-bold text-violet-600">{dim.a}/{dim.b}</span>
                <span className="text-xs font-semibold text-slate-700">{letter}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
