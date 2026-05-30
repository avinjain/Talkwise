'use client';

import Link from 'next/link';

type PrepStep = 'prepare' | 'storybank' | 'resume';

const STEPS: { id: PrepStep; label: string; href: string }[] = [
  { id: 'prepare', label: 'Plan', href: '/prepare' },
  { id: 'storybank', label: 'Story bank', href: '/prepare/storybank' },
  { id: 'resume', label: 'Resume', href: '/resume' },
];

/**
 * Shared sub-navigation that ties the three connected interview-prep surfaces
 * (Prepare / Story bank / Resume) together so they read as one flow.
 */
export default function InterviewPrepNav({ active }: { active: PrepStep }) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Interview prep</p>
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5">
        {STEPS.map((s) => {
          const isActive = s.id === active;
          return (
            <Link
              key={s.id}
              href={s.href}
              aria-current={isActive ? 'page' : undefined}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
