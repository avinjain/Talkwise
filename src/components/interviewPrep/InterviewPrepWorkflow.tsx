'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isInterviewStoriesStepDone } from '@/lib/interviewPrepWorkflow';
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
  storyCount = 0,
}: {
  kickoffDone: boolean;
  coachState: CoachStateBundle;
  speakingPersisted?: { pitchCount: number; workflowAck: boolean; loaded: boolean };
  /** Stories saved in the Story bank — the canonical home for stories. */
  storyCount?: number;
}) {
  const router = useRouter();
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

  const storiesComplete = sessionStoriesAck || persistedStoriesComplete || storyCount > 0;

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

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const navigateToPhase = (phaseId: PhaseId, locked: boolean) => {
    if (locked) return;
    switch (phaseId) {
      case 'kickoff':
        scrollToId('kickoff-plan');
        break;
      case 'stories':
        scrollToId('stories-to-prepare');
        break;
      case 'preparation':
        scrollToId('interview-preparation');
        break;
      case 'practice': {
        const el = document.getElementById('practice-focus');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          router.push('/prepare/practice');
        }
        break;
      }
      default:
        break;
    }
  };

  return (
    <section
      aria-label="Interview preparation workflow"
      className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Your workflow</h2>
          <p className="text-xs text-slate-500">
            Kickoff → stories → preparation → practice. Tap a step to jump to that section on this page.
          </p>
        </div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-brand-700">
          Next: {PHASES.find((p) => p.id === currentPhase)?.title ?? 'Kickoff'}
        </p>
      </div>

      <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-4">
        {PHASES.map((phase, index) => {
          const locked = !kickoffDone && phase.id !== 'kickoff';
          const done = locked ? false : completion[phase.id];
          const isCurrent = phase.id === currentPhase;

          const surface =
            locked
              ? 'border-slate-100 bg-slate-50/80 opacity-70'
              : done
              ? 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-300'
              : isCurrent
              ? 'border-brand-300 bg-brand-50/50 ring-1 ring-brand-200/60 hover:border-brand-400'
              : 'border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-white';

          return (
            <li key={phase.id}>
              <button
                type="button"
                disabled={locked}
                onClick={() => navigateToPhase(phase.id, locked)}
                aria-label={
                  locked
                    ? `${phase.title} — finish kickoff first`
                    : `Go to ${phase.title}: ${phase.description}`
                }
                className={`relative w-full rounded-xl border px-3 py-3 text-left transition ${surface} ${
                  locked ? 'cursor-not-allowed' : 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40'
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
                    <PhaseHint
                      phase={phase.id}
                      locked={locked}
                      done={done}
                      kickoffDone={kickoffDone}
                      practiceReady={practiceReady}
                    />
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function PhaseHint({
  phase,
  locked,
  done,
  kickoffDone,
  practiceReady,
}: {
  phase: PhaseId;
  locked: boolean;
  done: boolean;
  kickoffDone: boolean;
  practiceReady: boolean;
}) {
  if (locked) {
    return <p className="mt-2 text-[10px] text-slate-400">Finish kickoff first.</p>;
  }

  if (phase === 'kickoff') {
    return (
      <p className="mt-2 text-[10px] font-medium text-brand-800">
        {done ? 'Go to your kickoff plan →' : 'Go to kickoff wizard →'}
      </p>
    );
  }

  if (phase === 'stories') {
    return (
      <div className="mt-2 space-y-0.5">
        <p className="text-[10px] font-medium text-brand-800">Open your Story bank →</p>
        {done ? <p className="text-[10px] text-emerald-700">Stories saved</p> : null}
      </div>
    );
  }

  if (phase === 'preparation') {
    return (
      <div className="mt-2 space-y-0.5">
        <p className="text-[10px] font-medium text-brand-800">Go to coaching tools →</p>
        {done ? <p className="text-[10px] text-emerald-700">At least one tool saved</p> : null}
      </div>
    );
  }

  /* practice */
  if (!practiceReady) {
    return (
      <p className="mt-2 text-[10px] font-medium text-brand-800">
        {kickoffDone ? 'Opens practice hub →' : 'Available after kickoff.'}
      </p>
    );
  }

  return (
    <p className="mt-2 text-[10px] font-medium text-brand-800">
      Go to practice lens / hub →
    </p>
  );
}
