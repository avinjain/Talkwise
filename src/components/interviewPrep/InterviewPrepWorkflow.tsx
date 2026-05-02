'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { isInterviewStoriesStepDone, resumeStoriesWorkflowHref } from '@/lib/interviewPrepWorkflow';
import type { CoachStateBundle } from '@/components/interviewPrep/CoachingToolsSection';

type PhaseId = 'kickoff' | 'stories' | 'preparation' | 'practice';

const PHASES: Array<{
  id: PhaseId;
  title: string;
  description: string;
}> = [
  { id: 'kickoff', title: 'Kickoff', description: 'Plan from your resume & goals' },
  { id: 'stories', title: 'Stories', description: 'Speaking points from experience' },
  { id: 'preparation', title: 'Preparation', description: 'Brief, concerns, questions' },
  { id: 'practice', title: 'Practice', description: 'Mock conversation with lens' },
];

export function InterviewPrepWorkflow({
  kickoffDone,
  coachState,
  speakingPersisted = { pitchCount: 0, workflowAck: false, loaded: false },
}: {
  kickoffDone: boolean;
  coachState: CoachStateBundle;
  speakingPersisted?: { pitchCount: number; workflowAck: boolean; loaded: boolean };
}) {
  const [sessionStoriesAck, setSessionStoriesAck] = useState(false);

  useEffect(() => {
    const sync = () => setSessionStoriesAck(isInterviewStoriesStepDone());
    sync();
    window.addEventListener('storage', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('storage', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  const persistedStoriesComplete =
    speakingPersisted.loaded &&
    (speakingPersisted.workflowAck || speakingPersisted.pitchCount > 0);

  const storiesComplete = sessionStoriesAck || persistedStoriesComplete;

  const preparationDone = !!(
    coachState.prep ||
    coachState.concerns ||
    coachState.questions
  );
  const practiceReady = !!coachState.practiceFocus;

  const completion = useMemo(
    () => ({
      kickoff: kickoffDone,
      stories: storiesComplete,
      preparation: preparationDone,
      practice: practiceReady,
    }),
    [kickoffDone, storiesComplete, preparationDone, practiceReady]
  );

  const currentPhase = useMemo((): PhaseId => {
    if (!completion.kickoff) return 'kickoff';
    if (!completion.stories) return 'stories';
    if (!completion.preparation) return 'preparation';
    return 'practice';
  }, [completion]);

  const scrollToPreparation = () => {
    document.getElementById('interview-preparation')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const resumeStoriesHref = resumeStoriesWorkflowHref();

  return (
    <section
      aria-label="Interview preparation workflow"
      className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Your workflow</h2>
          <p className="text-xs text-slate-500">
            Kickoff → stories → preparation → practice. Follow in order when you can — each step feeds the next.
          </p>
        </div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-brand-700">
          Next: {PHASES.find((p) => p.id === currentPhase)?.title ?? 'Kickoff'}
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-4">
        {PHASES.map((phase, index) => {
          const locked = !kickoffDone && phase.id !== 'kickoff';
          const done = locked ? false : completion[phase.id];
          const isCurrent = phase.id === currentPhase;

          return (
            <li
              key={phase.id}
              className={`relative rounded-xl border px-3 py-3 text-left ${
                locked
                  ? 'border-slate-100 bg-slate-50/80 opacity-70'
                  : done
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : isCurrent
                  ? 'border-brand-300 bg-brand-50/50 ring-1 ring-brand-200/60'
                  : 'border-slate-200 bg-slate-50/40'
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                  aria-hidden
                >
                  {done ? '✓' : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900">{phase.title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{phase.description}</p>
                  <PhaseAction
                    phase={phase.id}
                    locked={locked}
                    done={done}
                    isCurrent={isCurrent}
                    resumeStoriesHref={resumeStoriesHref}
                    practiceReady={practiceReady}
                    scrollToPreparation={scrollToPreparation}
                    kickoffDone={kickoffDone}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function PhaseAction({
  phase,
  locked,
  done,
  isCurrent,
  resumeStoriesHref,
  practiceReady,
  scrollToPreparation,
  kickoffDone,
}: {
  phase: PhaseId;
  locked: boolean;
  done: boolean;
  isCurrent: boolean;
  resumeStoriesHref: string;
  practiceReady: boolean;
  scrollToPreparation: () => void;
  kickoffDone: boolean;
}) {
  if (locked) {
    return (
      <p className="mt-2 text-[10px] text-slate-400">Finish kickoff first</p>
    );
  }

  if (phase === 'kickoff') {
    return (
      <p className="mt-2 text-[10px] text-slate-500">
        {done ? 'Saved — adjust anytime with Re-run kickoff.' : 'Complete the wizard below.'}
      </p>
    );
  }

  if (phase === 'stories') {
    return (
      <div className="mt-2 space-y-1.5">
        <Link
          href={resumeStoriesHref}
          className={`inline-block text-[11px] font-semibold underline-offset-2 hover:underline ${
            kickoffDone && isCurrent && !done ? 'text-brand-800' : 'text-brand-700'
          }`}
        >
          Open speaking points →
        </Link>
        {done && <p className="text-[10px] text-emerald-700">Marked complete</p>}
      </div>
    );
  }

  if (phase === 'preparation') {
    return (
      <div className="mt-2 space-y-1.5">
        <button
          type="button"
          onClick={scrollToPreparation}
          disabled={!kickoffDone}
          className={`block text-left text-[11px] font-semibold underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline ${
            kickoffDone && isCurrent && !done ? 'text-brand-800' : 'text-brand-700'
          }`}
        >
          Jump to coaching tools →
        </button>
        {done && <p className="text-[10px] text-emerald-700">At least one tool saved</p>}
      </div>
    );
  }

  /* practice */
  if (!practiceReady) {
    return (
      <p className="mt-2 text-[10px] text-slate-500">
        {kickoffDone ? (
          <>
            Tap <span className="font-semibold">Go</span> on a kickoff plan item to set your practice lens.
          </>
        ) : (
          'Available after kickoff.'
        )}
      </p>
    );
  }

  return (
    <Link
      href="/prepare/practice"
      className={`mt-2 inline-block text-[11px] font-semibold underline-offset-2 hover:underline ${
        kickoffDone && isCurrent ? 'text-brand-800' : 'text-brand-700'
      }`}
    >
      Open practice hub →
    </Link>
  );
}
