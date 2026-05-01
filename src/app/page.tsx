'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import AppHeader from '@/components/AppHeader';
import { SavedPersona, Track, ENABLE_INTERVIEW_PREP } from '@/lib/types';

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
  tone?: 'brand' | 'accent' | 'amber';
}) {
  const toneMap = {
    brand: { iconBg: 'bg-brand-50 text-brand-600', cta: 'text-brand-700 hover:text-brand-800' },
    accent: { iconBg: 'bg-accent-50 text-accent-600', cta: 'text-accent-700 hover:text-accent-800' },
    amber: { iconBg: 'bg-amber-50 text-amber-600', cta: 'text-amber-700 hover:text-amber-800' },
  } as const;
  const t = toneMap[tone];
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all hover:border-slate-300 hover:shadow-sm"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.iconBg}`}>
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

const ICONS = {
  chat: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.6A7.97 7.97 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  briefcase: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m-12.5 8.006a2.18 2.18 0 00.75-1.661V8.706c0-1.081.768-2.015 1.837-2.175a48.114 48.114 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894" />
    </svg>
  ),
  brain: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104a24.301 24.301 0 014.5 0m-4.5 0c-.251.023-.501.05-.75.082m5.25-.082c.252.023.502.05.75.082m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
    </svg>
  ),
  spark: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  ),
  arrow: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  ),
  pencil: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
    </svg>
  ),
  trash: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  plus: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [personas, setPersonas] = useState<SavedPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [trackFilter, setTrackFilter] = useState<Track | 'all'>('all');

  const fetchPersonas = useCallback(async () => {
    try {
      const res = await fetch('/api/personas');
      if (res.ok) {
        const data = await res.json();
        setPersonas(data);
      }
    } catch (err) {
      console.error('Failed to fetch personas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.name) {
      sessionStorage.setItem('userName', session.user.name);
    }
    if (session) {
      fetchPersonas();
    }
  }, [session, fetchPersonas]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && session) fetchPersonas();
    };
    const handleFocus = () => { if (session) fetchPersonas(); };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [session, fetchPersonas]);

  const handleDeletePersona = async (id: string) => {
    if (!confirm('Delete this character?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/personas/${id}`, { method: 'DELETE' });
      if (res.ok) setPersonas((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete persona:', err);
    } finally {
      setDeleting(null);
    }
  };

  const filteredPersonas =
    trackFilter === 'all'
      ? personas
      : personas.filter((p) => (p.track || 'professional') === trackFilter);

  const handleSelectPersona = (persona: SavedPersona) => {
    sessionStorage.setItem('userName', session?.user?.name || 'there');
    sessionStorage.setItem(
      'startPersonaData',
      JSON.stringify({
        track: persona.track || 'professional',
        name: persona.name,
        difficultyLevel: persona.difficultyLevel,
        decisionOrientation: persona.decisionOrientation,
        communicationStyle: persona.communicationStyle,
        authorityPosture: persona.authorityPosture,
        temperamentStability: persona.temperamentStability,
        socialPresence: persona.socialPresence,
        interestLevel: persona.interestLevel,
        flirtatiousness: persona.flirtatiousness,
        communicationEffort: persona.communicationEffort,
        emotionalOpenness: persona.emotionalOpenness,
        humorStyle: persona.humorStyle,
        pickiness: persona.pickiness,
      })
    );
    router.push('/start');
  };

  const handleEditPersona = (persona: SavedPersona) => {
    sessionStorage.setItem('userName', session?.user?.name || 'there');
    sessionStorage.setItem('editPersonaId', persona.id);
    sessionStorage.setItem(
      'editPersonaData',
      JSON.stringify({
        track: persona.track || 'professional',
        name: persona.name,
        difficultyLevel: persona.difficultyLevel,
        decisionOrientation: persona.decisionOrientation,
        communicationStyle: persona.communicationStyle,
        authorityPosture: persona.authorityPosture,
        temperamentStability: persona.temperamentStability,
        socialPresence: persona.socialPresence,
        interestLevel: persona.interestLevel,
        flirtatiousness: persona.flirtatiousness,
        communicationEffort: persona.communicationEffort,
        emotionalOpenness: persona.emotionalOpenness,
        humorStyle: persona.humorStyle,
        pickiness: persona.pickiness,
      })
    );
    router.push('/configure');
  };

  const handleCreateCharacter = (track: Track = 'professional') => {
    sessionStorage.setItem('userName', session?.user?.name || 'there');
    sessionStorage.removeItem('editPersonaId');
    sessionStorage.setItem('editPersonaData', JSON.stringify({ track }));
    if (track === 'interview') router.push('/interview/prep');
    else router.push('/configure');
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Logo size={80} className="animate-pulse" />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // PUBLIC LANDING (logged out) — calm hero, single primary CTA
  // ════════════════════════════════════════════════════════════
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
          <Logo size={32} />
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/auth')}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              Sign in
            </button>
            <button
              onClick={() => router.push('/auth?mode=signup')}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Get started
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="px-6 pb-16 pt-20 sm:pt-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              AI Communication Coach
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Practice tough conversations
              <br />
              <span className="text-gradient">before they happen.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
              Job interviews, salary talks, hard feedback, first dates. Talk to
              an AI partner, then get specific feedback on what to say differently.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => router.push('/auth?mode=signup')}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
              >
                Start practicing free
                {ICONS.arrow}
              </button>
              <button
                onClick={() => router.push('/auth')}
                className="rounded-xl px-5 py-3 text-base font-medium text-slate-600 hover:text-slate-900"
              >
                Sign in
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-400">No credit card. ~1 minute to first conversation.</p>
          </div>
        </section>

        {/* What you get — 3 pillar cards */}
        <section className="border-t border-slate-100 bg-slate-50/60 px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-semibold text-slate-900">Three things, one place</h2>
              <p className="mt-2 text-sm text-slate-500">
                Pick what you need. You can always come back for the others.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <PillarCard
                tone="brand"
                icon={ICONS.chat}
                title="Practice conversations"
                description="Build a character — boss, date, client — and rehearse the talk that matters. Get feedback at the end."
                ctaLabel="See how it works"
                onClick={() => router.push('/auth?mode=signup&callbackUrl=/configure')}
              />
              <PillarCard
                tone="amber"
                icon={ICONS.briefcase}
                title="Prepare for a new job"
                description="A 2-minute kickoff builds your plan. Then resume, LinkedIn, and an interview story bank."
                ctaLabel="Get coaching"
                onClick={() => router.push('/auth?mode=signup&callbackUrl=/prepare')}
              />
              <PillarCard
                tone="accent"
                icon={ICONS.brain}
                title="Know yourself"
                description="A short communication-style test plus MBTI. See your strengths, blind spots, and how to grow."
                ctaLabel="Take the test"
                onClick={() => router.push('/auth?mode=signup&callbackUrl=/profile/test')}
              />
            </div>
          </div>
        </section>

        {/* How it works — calmer, fewer emojis */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-semibold text-slate-900">How it works</h2>
              <p className="mt-2 text-sm text-slate-500">Three steps. No setup beyond signing in.</p>
            </div>
            <ol className="grid gap-6 sm:grid-cols-3">
              {[
                { n: 1, title: 'Pick a scenario', body: 'Choose what you want to practice — interview, tough feedback, a hard chat.' },
                { n: 2, title: 'Have the conversation', body: 'Talk naturally with an AI partner you can dial up or down in toughness.' },
                { n: 3, title: 'Get feedback', body: 'Specific, line-by-line notes on what worked and how to phrase it better.' },
              ].map((step) => (
                <li key={step.n} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                    {step.n}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <footer className="border-t border-slate-100 px-6 py-6 text-center text-xs text-slate-400">
          TalkWise · Practice makes confident
        </footer>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // LOGGED-IN DASHBOARD — one primary action, intent-organised
  // ════════════════════════════════════════════════════════════
  const userName = session.user?.name?.split(' ')[0] || 'there';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60">
      <AppHeader />
      <div className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          {/* Greeting + primary action */}
          <section className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Hi {userName} — what do you want to work on?
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Practice a conversation, prep for interviews, or learn your style.
              </p>
            </div>
            <button
              onClick={() => handleCreateCharacter('professional')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              {ICONS.plus}
              New conversation
            </button>
          </section>

          {/* What do you want to do — intent cards */}
          <section className="mb-12">
            <div className="grid gap-4 sm:grid-cols-3">
              <PillarCard
                tone="brand"
                icon={ICONS.chat}
                title="Practice a conversation"
                description="Salary talks, tough feedback, hard chats with friends or family."
                ctaLabel="Build a character"
                onClick={() => handleCreateCharacter('professional')}
              />
              <PillarCard
                tone="amber"
                icon={ICONS.briefcase}
                title="Prepare for a new job"
                description="2-minute kickoff, then resume, LinkedIn, and your interview story bank."
                ctaLabel="Open coaching"
                onClick={() => router.push('/prepare')}
              />
              <PillarCard
                tone="accent"
                icon={ICONS.brain}
                title="Know your style"
                description="Communication test + MBTI. Strengths, blind spots, growth tips."
                ctaLabel="Open profile"
                onClick={() => router.push('/profile')}
              />
            </div>
          </section>

          {/* Continue practising — only show if there are personas */}
          {(loading || personas.length > 0) && (
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Your characters</h2>
                  <p className="text-xs text-slate-500">Pick one to keep practising, or create a new one.</p>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs">
                  {(['all', 'professional', 'personal', ...(ENABLE_INTERVIEW_PREP ? ['interview' as Track] : [])] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTrackFilter(t as Track | 'all')}
                      className={`rounded px-2.5 py-1 font-medium capitalize transition-colors ${
                        trackFilter === t
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {t === 'professional' ? 'Work' : t === 'personal' ? 'Life' : t}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-400">
                  Loading…
                </div>
              ) : filteredPersonas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
                  <h3 className="text-sm font-semibold text-slate-700">No characters here yet</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Create one to start practising.
                  </p>
                  <button
                    onClick={() => handleCreateCharacter(trackFilter === 'all' ? 'professional' : (trackFilter as Track))}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    {ICONS.plus} New character
                  </button>
                </div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {filteredPersonas.map((p) => {
                    const track = p.track || 'professional';
                    const trackLabel =
                      track === 'personal' ? 'Life' : track === 'interview' ? 'Interview' : 'Work';
                    const trackBadge =
                      track === 'personal'
                        ? 'bg-pink-50 text-pink-700'
                        : track === 'interview'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-brand-50 text-brand-700';
                    return (
                      <li
                        key={p.id}
                        onClick={() => handleSelectPersona(p)}
                        className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition-all hover:border-slate-300 hover:shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-slate-900">{p.name}</h3>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${trackBadge}`}>
                              {trackLabel}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500 group-hover:text-slate-700">
                            Continue practising →
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditPersona(p); }}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="Edit"
                          >
                            {ICONS.pencil}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePersona(p.id); }}
                            disabled={deleting === p.id}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            title="Delete"
                          >
                            {ICONS.trash}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
      <footer className="border-t border-slate-100 bg-white px-6 py-4 text-center text-xs text-slate-400">
        TalkWise · Practice makes confident
      </footer>
    </div>
  );
}
