'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { SavedPersona, Track, ENABLE_INTERVIEW_PREP } from '@/lib/types';

const RESUME_ICON = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

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
      className={`group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg ${t.glow}`}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${t.iconBg}`}>{icon}</div>
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
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.6A7.97 7.97 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  ),
  briefcase: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m-12.5 8.006a2.18 2.18 0 00.75-1.661V8.706c0-1.081.768-2.015 1.837-2.175a48.114 48.114 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894"
      />
    </svg>
  ),
  sparkle: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  ),
  plus: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  pencil: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
      />
    </svg>
  ),
  trash: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  ),
};

export default function HomeDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [personas, setPersonas] = useState<SavedPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [trackFilter, setTrackFilter] = useState<Track | 'all'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
  }, [status, router]);

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
    const handleFocus = () => {
      if (session) fetchPersonas();
    };
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
    trackFilter === 'all' ? personas : personas.filter((p) => (p.track || 'professional') === trackFilter);

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

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Logo size={80} className="animate-pulse" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const userName = session.user.name?.split(' ')[0] || 'there';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60">
      <div className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <section className="relative mb-10 overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-7 sm:px-8 sm:py-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-gradient-to-br from-brand-100 via-accent-50 to-amber-50 opacity-70 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-gradient-to-br from-amber-50 to-brand-50 opacity-60 blur-2xl"
            />

            <div className="relative">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Hi {userName} — what do you want to work on?
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Pick any of the four — practice, prep for an interview, sharpen your resume, or learn your style.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <PillarCard
                tone="brand"
                icon={ICONS.chat}
                title="Practice conversations"
                description="Salary talks, tough feedback, hard chats with friends or family."
                ctaLabel="Practise a conversation"
                onClick={() => handleCreateCharacter('professional')}
              />
              <PillarCard
                tone="amber"
                icon={ICONS.briefcase}
                title="Prepare for interview"
                description="A 2-minute kickoff turns your resume into a personalised interview plan."
                ctaLabel="Build my plan"
                onClick={() => router.push('/prepare')}
              />
              <PillarCard
                tone="emerald"
                icon={RESUME_ICON}
                title="Build my resume"
                description="Sharpen your resume, align it with LinkedIn, and pull out interview stories."
                ctaLabel="Sharpen my resume"
                onClick={() => router.push('/resume')}
              />
              <PillarCard
                tone="accent"
                icon={ICONS.sparkle}
                title="Know yourself"
                description="Communication test + MBTI. Strengths, blind spots, growth tips."
                ctaLabel="Take the tests"
                onClick={() => router.push('/profile')}
              />
            </div>
          </section>

          {(loading || personas.length > 0) && (
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Your characters</h2>
                  <p className="text-xs text-slate-500">Pick one to keep practising, or create a new one.</p>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs">
                  {(
                    ['all', 'professional', 'personal', ...(ENABLE_INTERVIEW_PREP ? (['interview'] as const) : [])] as const
                  ).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTrackFilter(t as Track | 'all')}
                      className={`rounded px-2.5 py-1 font-medium capitalize transition-colors ${
                        trackFilter === t ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
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
                  <p className="mt-1 text-xs text-slate-500">Create one to start practising.</p>
                  <button
                    type="button"
                    onClick={() =>
                      handleCreateCharacter(trackFilter === 'all' ? 'professional' : (trackFilter as Track))
                    }
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
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${trackBadge}`}
                            >
                              {trackLabel}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500 group-hover:text-slate-700">
                            Continue practising →
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPersona(p);
                            }}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="Edit"
                          >
                            {ICONS.pencil}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePersona(p.id);
                            }}
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
