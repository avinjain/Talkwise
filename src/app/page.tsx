'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

const RESUME_ICON = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Small UI primitives (kept local for now to avoid churn)
// ─────────────────────────────────────────────────────────────

function PillarCard({
  icon,
  title,
  description,
  ctaLabel,
  onClick,
  tone = 'brand',
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  onClick: () => void;
  tone?: 'brand' | 'accent' | 'amber' | 'emerald';
}) {
  const toneMap = {
    brand: {
      iconBg: 'bg-gradient-to-br from-brand-100 to-brand-50 text-brand-700 ring-1 ring-brand-200/50',
      cta: 'text-brand-700 group-hover:text-brand-800',
      glow: 'group-hover:shadow-brand-100/60',
    },
    accent: {
      iconBg: 'bg-gradient-to-br from-accent-100 to-accent-50 text-accent-700 ring-1 ring-accent-200/50',
      cta: 'text-accent-700 group-hover:text-accent-800',
      glow: 'group-hover:shadow-accent-100/60',
    },
    amber: {
      iconBg: 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 ring-1 ring-amber-200/50',
      cta: 'text-amber-700 group-hover:text-amber-800',
      glow: 'group-hover:shadow-amber-100/60',
    },
    emerald: {
      iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
      cta: 'text-emerald-700 group-hover:text-emerald-800',
      glow: 'group-hover:shadow-emerald-100/60',
    },
  } as const;
  const t = toneMap[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-h-[52px] w-full touch-manipulation flex-col items-start gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg sm:min-h-0 sm:p-6 ${t.glow}`}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${t.iconBg}`}>
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm leading-relaxed text-slate-500">{description}</p>
      </div>
      <span className={`mt-1 inline-flex items-center gap-1 text-sm font-medium ${t.cta}`}>
        {ctaLabel}
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Hero illustration — layered chat bubble mockup
// ─────────────────────────────────────────────────────────────

function HeroGraphic() {
  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-md">
      {/* Soft blob backdrop */}
      <div className="absolute inset-x-6 inset-y-10 rounded-[3rem] bg-gradient-to-br from-brand-100 via-accent-50 to-amber-50 blur-3xl opacity-70" />

      {/* Incoming bubble — interviewer */}
      <div
        className="absolute left-0 top-2 w-[78%] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 transition-transform"
        style={{ transform: 'rotate(-2deg)' }}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-xs font-bold text-white shadow-sm">
            HM
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Hiring manager
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              Tell me about a time you handled a tough conversation on your team.
            </p>
          </div>
        </div>
      </div>

      {/* Outgoing bubble — you */}
      <div
        className="absolute right-0 top-[44%] w-[80%] rounded-2xl bg-slate-900 p-4 text-white shadow-lg shadow-slate-900/10"
        style={{ transform: 'rotate(1.5deg)' }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">You</p>
        <p className="mt-1 text-sm leading-relaxed">
          In my last role, two engineers were stuck on a design choice. I&hellip;
        </p>
        <div className="mt-2 flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400 [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400 [animation-delay:240ms]" />
        </div>
      </div>

      {/* Feedback chip */}
      <div className="absolute bottom-2 left-4 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm shadow-slate-200/40">
        <svg className="h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
        <span className="text-xs font-medium text-slate-700">Feedback ready · 4.8/5</span>
      </div>

      {/* Floating sparkle */}
      <svg
        className="absolute right-2 top-0 h-7 w-7 text-amber-400 drop-shadow-sm"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2l1.6 5.6L19 9l-5.4 1.4L12 16l-1.6-5.6L5 9l5.4-1.4z" />
      </svg>
      <svg
        className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400 drop-shadow-sm"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2l1.6 5.6L19 9l-5.4 1.4L12 16l-1.6-5.6L5 9l5.4-1.4z" />
      </svg>
    </div>
  );
}

const ICONS = {
  chat: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.6A7.97 7.97 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  briefcase: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m-12.5 8.006a2.18 2.18 0 00.75-1.661V8.706c0-1.081.768-2.015 1.837-2.175a48.114 48.114 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894" />
    </svg>
  ),
  /**
   * Single sparkle icon used everywhere "Know yourself" is shown
   * (dashboard cards, public landing cards, side-nav). Keeps visual
   * identity consistent across the app.
   */
  sparkle: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  ),
  arrow: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session) {
      router.replace('/home');
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Logo size={80} className="animate-pulse" />
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/60">
        <Logo size={80} className="animate-pulse" />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // PUBLIC LANDING (logged out) — calm hero, single primary CTA
  // ════════════════════════════════════════════════════════════
  return (
      <div className="flex min-h-screen flex-col bg-white pb-[env(safe-area-inset-bottom)]">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-20 lg:pt-24">
          {/* Decorative gradient blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-100 via-accent-50 to-amber-50 opacity-60 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 -right-32 -z-10 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-amber-100 to-brand-50 opacity-50 blur-3xl"
          />

          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                AI Communication Coach
              </span>
              <h1 className="mt-5 text-[2rem] font-bold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                Practice tough conversations
                <br />
                <span className="text-gradient">before they happen.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg lg:mx-0">
                Job interviews, salary talks, hard feedback, first dates. Talk to an AI partner,
                then get specific feedback on what to say differently.
              </p>
              <div className="mt-8 flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                <button
                  type="button"
                  onClick={() => router.push('/auth?mode=signup')}
                  className="inline-flex min-h-[48px] touch-manipulation items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 sm:min-h-0"
                >
                  Start practicing free
                  {ICONS.arrow}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/auth')}
                  className="min-h-[48px] touch-manipulation rounded-xl px-5 py-3 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 sm:min-h-0 sm:hover:bg-transparent"
                >
                  Sign in
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                No credit card. ~1 minute to first conversation.
              </p>
            </div>

            {/* Hero illustration — only on lg+ to keep mobile clean */}
            <div className="hidden lg:block">
              <HeroGraphic />
            </div>
          </div>
        </section>

        {/* What you get — four things, mirrors the left-nav once you sign in */}
        <section className="border-t border-slate-100 bg-slate-50/60 px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-semibold text-slate-900">Everything in one place</h2>
              <p className="mt-2 text-sm text-slate-500">
                Pick what you need. The rest is one click away.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <PillarCard
                tone="brand"
                icon={ICONS.chat}
                title="Practice conversations"
                description="Rehearse a tough talk — salary, feedback, a hard chat — with an AI partner."
                ctaLabel="Practise a conversation"
                onClick={() => router.push('/auth?mode=signup&callbackUrl=/configure')}
              />
              <PillarCard
                tone="amber"
                icon={ICONS.briefcase}
                title="Prepare for interview"
                description="A 2-minute kickoff turns your resume into a personalised interview plan."
                ctaLabel="Build my plan"
                onClick={() => router.push('/auth?mode=signup&callbackUrl=/prepare')}
              />
              <PillarCard
                tone="emerald"
                icon={RESUME_ICON}
                title="Build my resume"
                description="Sharpen your resume, align it with LinkedIn, and pull out interview stories."
                ctaLabel="Sharpen my resume"
                onClick={() => router.push('/auth?mode=signup&callbackUrl=/resume')}
              />
              <PillarCard
                tone="accent"
                icon={ICONS.sparkle}
                title="Know yourself"
                description="A short communication-style test plus MBTI. Strengths, blind spots, growth tips."
                ctaLabel="Take the tests"
                onClick={() => router.push('/auth?mode=signup&callbackUrl=/profile/test')}
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">How it works</h2>
              <p className="mt-2 text-sm text-slate-500">Three steps. No setup beyond signing in.</p>
            </div>
            <ol className="relative grid gap-6 sm:grid-cols-3">
              {/* Connector line on sm+ */}
              <span
                aria-hidden
                className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-[1.75rem] hidden h-px bg-gradient-to-r from-brand-200 via-amber-200 to-accent-200 sm:block"
              />
              {[
                {
                  n: 1,
                  title: 'Pick a scenario',
                  body: 'Choose what you want to practice — interview, tough feedback, a hard chat.',
                  tone: 'brand',
                },
                {
                  n: 2,
                  title: 'Have the conversation',
                  body: 'Talk naturally with an AI partner you can dial up or down in toughness.',
                  tone: 'amber',
                },
                {
                  n: 3,
                  title: 'Get feedback',
                  body: 'Specific, line-by-line notes on what worked and how to phrase it better.',
                  tone: 'accent',
                },
              ].map((step) => {
                const orb =
                  step.tone === 'brand'
                    ? 'from-brand-500 to-brand-400'
                    : step.tone === 'amber'
                    ? 'from-amber-500 to-amber-400'
                    : 'from-accent-500 to-accent-400';
                return (
                  <li key={step.n} className="relative">
                    <div
                      className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${orb} text-lg font-bold text-white shadow-lg shadow-slate-900/5 ring-4 ring-white`}
                    >
                      {step.n}
                    </div>
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-center">
                      <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{step.body}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <footer className="border-t border-slate-100 px-4 py-6 text-center text-xs text-slate-400 sm:px-6">
          TalkWise · Practice makes confident
        </footer>
      </div>
  );
}
