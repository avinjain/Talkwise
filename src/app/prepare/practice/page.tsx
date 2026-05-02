'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Logo from '@/components/Logo';
import {
  CoachingToolsSection,
  type CoachStateBundle,
} from '@/components/interviewPrep/CoachingToolsSection';
import { kickoffSecondaryResourceHref } from '@/lib/kickoff';
import {
  buildStartPersonaDataFromFocus,
  type PracticeCoachingFocusPayload,
} from '@/lib/practiceCoaching';

const SCENARIO_PRESET_KEY = 'practiceScenarioPreset';

export default function PreparePracticeHubPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [bootstrapping, setBootstrapping] = useState(true);
  const [focus, setFocus] = useState<PracticeCoachingFocusPayload | null>(null);
  const [coachState, setCoachState] = useState<CoachStateBundle>({
    prep: null,
    concerns: null,
    questions: null,
    practiceFocus: null,
  });

  const fetchCoach = useCallback(async () => {
    try {
      const res = await fetch('/api/coach', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCoachState({
          prep: data.prep || null,
          concerns: data.concerns || null,
          questions: data.questions || null,
          practiceFocus: (data.practiceFocus as PracticeCoachingFocusPayload) || null,
        });
      }
    } catch (err) {
      console.error('Failed to fetch coach:', err);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/auth?callbackUrl=/prepare/practice');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/practice-coaching', { cache: 'no-store' });
        if (cancelled) return;
        if (!res.ok) {
          if (res.status === 401) {
            router.replace('/auth?callbackUrl=/prepare/practice');
          } else {
            router.replace('/prepare');
          }
          return;
        }
        const data = await res.json();
        if (!data.focus) {
          router.replace('/prepare');
          return;
        }
        setFocus(data.focus as PracticeCoachingFocusPayload);
        await fetchCoach();
      } catch {
        if (!cancelled) router.replace('/prepare');
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, status, router, fetchCoach]);

  const startPractice = () => {
    if (!focus || !session) return;
    sessionStorage.setItem('userName', session.user?.name || 'there');
    sessionStorage.setItem('startPersonaData', JSON.stringify(buildStartPersonaDataFromFocus(focus)));
    sessionStorage.setItem(SCENARIO_PRESET_KEY, focus.planItemText);
    router.push('/start');
  };

  if (status === 'loading' || bootstrapping || !focus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/60">
        <Logo size={80} className="animate-pulse" />
      </div>
    );
  }

  const secondary = kickoffSecondaryResourceHref(focus.canonicalCommand || focus.kickoffCommand);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60">
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <nav className="mb-6">
            <Link
              href="/prepare"
              className="text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              ← Back to prepare
            </Link>
          </nav>

          <header className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
              Kickoff practice hub
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Practise this step
            </h1>
            <p className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-sm">
              {focus.planItemText}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{focus.skillLens}</p>
          </header>

          <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold text-slate-900">Practice conversation</h2>
            <p className="mt-1 text-sm text-slate-500">
              Open the mock interviewer with your kickoff skill lens applied to coaching and feedback.
            </p>
            <button
              type="button"
              onClick={startPractice}
              className="mt-4 w-full rounded-xl bg-gradient-brand py-3 text-center font-semibold text-white shadow-md shadow-brand-500/20 transition hover:opacity-95 sm:w-auto sm:px-8"
            >
              Start practice conversation
            </button>
            <p className="mt-4 text-xs text-slate-500">
              Related workspace:{' '}
              <Link
                href={secondary.href}
                className="font-medium text-brand-700 underline-offset-2 hover:underline"
              >
                {secondary.label}
              </Link>
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Prep tools</h2>
            <p className="mb-4 text-sm text-slate-500">
              Generate a brief, surface concerns, or drill likely questions — grounded in your kickoff
              profile.
            </p>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <CoachingToolsSection
                showSectionHeader={false}
                state={coachState}
                onChange={(next) => setCoachState((s) => ({ ...s, ...next }))}
                refresh={fetchCoach}
              />
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-100 bg-white px-6 py-4 text-center text-xs text-slate-400">
        TalkWise · Practice makes confident
      </footer>
    </div>
  );
}
