'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

type Step = {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: 'brand' | 'amber' | 'emerald' | 'accent';
  href: string;
};

const STEPS: Step[] = [
  {
    tone: 'brand',
    title: 'Practice tough conversations',
    description: 'Rehearse salary talks, hard feedback, or a difficult chat out loud with a realistic AI partner.',
    href: '/configure',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.6A7.97 7.97 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    tone: 'amber',
    title: 'Prepare for interviews',
    description: 'A 2-minute kickoff turns your resume into a personalised plan, with a story bank to back it up.',
    href: '/prepare',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m-12.5 8.006a2.18 2.18 0 00.75-1.661V8.706c0-1.081.768-2.015 1.837-2.175a48.114 48.114 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894" />
      </svg>
    ),
  },
  {
    tone: 'emerald',
    title: 'Build your resume',
    description: 'Sharpen your resume, align it with LinkedIn, and pull out stories you can reuse in interviews.',
    href: '/resume',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    tone: 'accent',
    title: 'Know yourself',
    description: 'A short communication-style test plus MBTI — your strengths, blind spots, and growth tips.',
    href: '/profile',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
  },
];

const TONE: Record<Step['tone'], string> = {
  brand: 'bg-gradient-to-br from-brand-100 to-brand-50 text-brand-700 ring-1 ring-brand-200/50',
  amber: 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 ring-1 ring-amber-200/50',
  emerald: 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
  accent: 'bg-gradient-to-br from-accent-100 to-accent-50 text-accent-700 ring-1 ring-accent-200/50',
};

/**
 * First-run welcome shown once per user (tracked via /api/onboarding). Explains
 * the four things TalkWise can do so new users aren't dropped into an empty
 * dashboard with no context.
 */
export default function WelcomeModal({ userName }: { userName?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/onboarding', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.completed === false) setOpen(true);
      } catch {
        /* network issue — skip the welcome rather than block the app */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') void dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function markComplete() {
    if (saving) return;
    setSaving(true);
    try {
      await fetch('/api/onboarding', { method: 'POST' });
    } catch {
      /* best-effort; closing the modal locally is enough for this session */
    } finally {
      setSaving(false);
    }
  }

  async function dismiss() {
    setOpen(false);
    await markComplete();
  }

  async function goTo(href: string) {
    setOpen(false);
    await markComplete();
    router.push(href);
  }

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close welcome"
        onClick={() => void dismiss()}
        className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[1px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="fixed left-1/2 top-[max(1rem,6vh)] z-[101] flex max-h-[min(88vh,calc(100dvh-2rem))] w-[min(100%,34rem)] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="relative shrink-0 overflow-hidden border-b border-slate-100 px-6 py-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-brand-100 via-accent-50 to-amber-50 opacity-70 blur-2xl"
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Logo size={36} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">Welcome to TalkWise</p>
                <h2 id="welcome-title" className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">
                  {userName ? `Hi ${userName} — here's what you can do` : "Here's what you can do"}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void dismiss()}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="relative mt-3 text-sm leading-relaxed text-slate-500">
            TalkWise is your AI communication coach. Practise high-stakes conversations, prep for interviews,
            and understand your own style — pick any starting point below.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          <ul className="space-y-2.5">
            {STEPS.map((s) => (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => void goTo(s.href)}
                  className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONE[s.tone]}`}>
                    {s.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{s.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{s.description}</span>
                  </span>
                  <span className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500">
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <p className="text-xs text-slate-400">You can revisit any of these anytime from the left menu.</p>
          <button
            type="button"
            onClick={() => void dismiss()}
            disabled={saving}
            className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            Explore on my own
          </button>
        </div>
      </div>
    </>
  );
}
