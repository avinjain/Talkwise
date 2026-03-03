'use client';

import { MBTI_DIMENSIONS } from '@/lib/mbti';

interface MBTIDimensionVisualProps {
  activeKey?: string;
  compact?: boolean;
}

export default function MBTIDimensionVisual({ activeKey, compact = false }: MBTIDimensionVisualProps) {
  return (
    <div className={`grid grid-cols-2 gap-2 ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {MBTI_DIMENSIONS.map((d) => {
        const isActive = activeKey === d.key;
        return (
          <div
            key={d.key}
            className={`flex items-center gap-2 rounded-xl border-2 p-3 transition-all ${
              isActive
                ? 'border-violet-500 bg-violet-50 shadow-sm shadow-violet-500/20'
                : 'border-slate-200 bg-white'
            } ${compact ? 'p-2' : 'p-3'}`}
          >
            <div
              className={`flex shrink-0 items-center justify-center rounded-lg font-bold ${
                isActive ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-500'
              } ${compact ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm'}`}
            >
              {d.a}/{d.b}
            </div>
            <div className="min-w-0">
              <p className={`font-medium text-slate-800 ${compact ? 'text-xs' : 'text-sm'}`}>
                {d.aLabel}
              </p>
              <p className={`text-slate-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                vs {d.bLabel}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
