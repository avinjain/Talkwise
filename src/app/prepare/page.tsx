'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import AppHeader from '@/components/AppHeader';
import type {
  KickoffSummary,
  KickoffTrack,
  KickoffTimeline,
  InterviewHistory,
  StallingStage,
  KickoffPlanItem,
} from '@/lib/kickoff';

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function PrepareForInterviewPage() {
  const router = useRouter();

  const [kickoffLoading, setKickoffLoading] = useState(true);
  const [savedKickoff, setSavedKickoff] = useState<{
    summary: KickoffSummary;
    inputs: KickoffSavedInputs;
    updatedAt: string;
  } | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  const fetchKickoff = useCallback(async () => {
    try {
      const res = await fetch('/api/kickoff', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.hasResult && data.summary) {
          setSavedKickoff({ summary: data.summary, inputs: data.inputs, updatedAt: data.updatedAt });
          setShowWizard(false);
        } else {
          setShowWizard(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch kickoff:', err);
      setShowWizard(true);
    } finally {
      setKickoffLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKickoff();
  }, [fetchKickoff]);

  const runPlanAction = (item: KickoffPlanItem) => {
    switch (item.command) {
      case 'speaking_points':
      case 'pitch':
      case 'stories':
      case 'hype':
        router.push('/resume#speaking-points');
        break;
      case 'optimise_resume':
      case 'decode':
        router.push('/resume#resume-optimisation');
        break;
      case 'analyse_profile':
      case 'concerns':
        router.push('/resume#profile-alignment');
        break;
      case 'practice':
        router.push('/configure');
        break;
      case 'mock':
      case 'research':
        router.push('/interview/prep');
        break;
      default:
        router.push('/resume');
    }
  };

  if (kickoffLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Logo size={80} className="animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60">
      <AppHeader backHref="/" backLabel="Home" />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Prepare for interview
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              A 2-minute kickoff turns your resume into a personalised plan — what to fix, what to
              practise, and where you&rsquo;re likely to get tripped up.
            </p>
          </header>

          {savedKickoff && !showWizard ? (
            <KickoffSummaryView
              summary={savedKickoff.summary}
              updatedAt={savedKickoff.updatedAt}
              onRerun={() => setShowWizard(true)}
              onAction={runPlanAction}
            />
          ) : (
            <KickoffWizard
              initial={savedKickoff?.inputs}
              onCancel={savedKickoff ? () => setShowWizard(false) : undefined}
              onComplete={async () => {
                await fetchKickoff();
              }}
            />
          )}

          {/* Quiet cross-link */}
          <div className="mt-10">
            <button
              onClick={() => router.push('/resume')}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">Build my resume →</p>
                <p className="text-xs text-slate-500">
                  Sharpen your resume, align it with LinkedIn, and pull out interview stories.
                </p>
              </div>
              <span className="text-slate-400">→</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-100 bg-white px-6 py-4 text-center text-xs text-slate-400">
        TalkWise · Practice makes confident
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Kickoff wizard
// ─────────────────────────────────────────────────────────────

interface KickoffSavedInputs {
  track: KickoffTrack;
  targetRoles: string;
  timeline: KickoffTimeline;
  feedbackDirectness: number;
  biggestConcern: string;
  interviewHistory: InterviewHistory;
  stallingStage: StallingStage;
  targetCompanies: string[];
}

function KickoffWizard({
  initial,
  onComplete,
  onCancel,
}: {
  initial?: KickoffSavedInputs;
  onComplete: () => void | Promise<void>;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [targetRoles, setTargetRoles] = useState(initial?.targetRoles || '');
  const [timeline, setTimeline] = useState<KickoffTimeline>(initial?.timeline || '1_2w');
  const [feedbackDirectness, setFeedbackDirectness] = useState(initial?.feedbackDirectness ?? 5);
  const [biggestConcern, setBiggestConcern] = useState(initial?.biggestConcern || '');
  const [track, setTrack] = useState<KickoffTrack>(initial?.track || 'full_system');

  const [interviewHistory, setInterviewHistory] = useState<InterviewHistory>(
    initial?.interviewHistory || 'first_time'
  );
  const [stallingStage, setStallingStage] = useState<StallingStage>(initial?.stallingStage || '');

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePaste, setResumePaste] = useState('');
  const [linkedInPaste, setLinkedInPaste] = useState('');
  const [companies, setCompanies] = useState(initial?.targetCompanies?.join(', ') || '');

  const canNext1 = targetRoles.trim().length > 0;
  const canNext2 = interviewHistory !== 'active_not_advancing' || stallingStage !== '';

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);

    let resumeText = resumePaste.trim();
    if (!resumeText && resumeFile) {
      try {
        const fd = new FormData();
        fd.set('file', resumeFile);
        const r = await fetch('/api/interview/extract-resume', { method: 'POST', body: fd });
        const d = await r.json();
        if (r.ok && d.text) resumeText = d.text;
      } catch {
        /* ignore */
      }
    }

    try {
      const res = await fetch('/api/kickoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track,
          targetRoles: targetRoles.trim(),
          timeline,
          feedbackDirectness,
          biggestConcern: biggestConcern.trim(),
          interviewHistory,
          stallingStage,
          resumeText,
          linkedInText: linkedInPaste.trim(),
          targetCompanies: companies
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kickoff failed');
      await onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not run kickoff');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Kickoff</h2>
          <p className="text-xs text-slate-500">
            A 2-minute setup. Builds your personalised plan.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                n <= step ? 'bg-slate-900' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-6">
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-slate-900">Tell me about you</h3>
            <FormField label="Target role(s)" hint="e.g. Senior Product Manager, Group PM">
              <input
                type="text"
                value={targetRoles}
                onChange={(e) => setTargetRoles(e.target.value)}
                placeholder="Senior Product Manager"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </FormField>

            <FormField label="When is your next interview?">
              <ChoiceGroup
                value={timeline}
                onChange={(v) => setTimeline(v as KickoffTimeline)}
                options={[
                  { value: 'lt_48h', label: 'In ≤ 48 hours', sub: 'Triage mode' },
                  { value: '1_2w', label: '1-2 weeks', sub: 'Focused mode' },
                  { value: '3plus_w', label: '3+ weeks', sub: 'Full system' },
                ]}
              />
            </FormField>

            <FormField label="Feedback style" hint="5 = high candor, 1 = gentle. Default: high candor.">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={feedbackDirectness}
                  onChange={(e) => setFeedbackDirectness(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-10 text-right text-sm font-semibold text-slate-700">
                  {feedbackDirectness}
                </span>
              </div>
            </FormField>

            <FormField label="Biggest concern (optional)" hint="One sentence — what worries you most.">
              <textarea
                value={biggestConcern}
                onChange={(e) => setBiggestConcern(e.target.value)}
                placeholder="e.g. I freeze on behavioural questions about conflict."
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </FormField>

            <FormField label="Track">
              <ChoiceGroup
                value={track}
                onChange={(v) => setTrack(v as KickoffTrack)}
                options={[
                  { value: 'quick_prep', label: 'Quick Prep', sub: 'Short timeline' },
                  { value: 'full_system', label: 'Full System', sub: 'Multi-week search' },
                ]}
              />
            </FormField>

            <Footer
              onCancel={onCancel}
              onNext={() => setStep(2)}
              nextLabel="Next"
              nextDisabled={!canNext1}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-slate-900">Where are you in your search?</h3>
            <ChoiceGroup
              vertical
              value={interviewHistory}
              onChange={(v) => {
                setInterviewHistory(v as InterviewHistory);
                if (v !== 'active_not_advancing') setStallingStage('');
              }}
              options={[
                {
                  value: 'first_time',
                  label: 'First-time interviewer',
                  sub: 'Need fundamentals — storybank, structure, confidence.',
                },
                {
                  value: 'active_not_advancing',
                  label: 'Active but not advancing',
                  sub: "I'm interviewing but not getting through.",
                },
                {
                  value: 'experienced_rusty',
                  label: 'Experienced but rusty',
                  sub: 'Have a strong base, need refresh on stories and differentiation.',
                },
              ]}
            />

            {interviewHistory === 'active_not_advancing' && (
              <FormField label="Where are you getting stuck?">
                <ChoiceGroup
                  vertical
                  value={stallingStage || ''}
                  onChange={(v) => setStallingStage(v as StallingStage)}
                  options={[
                    { value: 'first_rounds', label: 'Failing first rounds' },
                    { value: 'final_rounds', label: 'Failing final rounds' },
                    { value: 'no_callbacks', label: 'Not hearing back at all' },
                  ]}
                />
              </FormField>
            )}

            <Footer
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              nextLabel="Next"
              nextDisabled={!canNext2}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-slate-900">Drop your context</h3>
            <p className="text-xs text-slate-500">
              The more specific you are, the better the plan. Resume is recommended.
            </p>

            <FormField label="Resume" hint=".pdf, .docx, .txt — or paste below">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setResumeFile(f || null);
                  e.target.value = '';
                }}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
              />
              {resumeFile && <p className="mt-1.5 text-xs text-slate-500">{resumeFile.name}</p>}
              <details className="mt-2">
                <summary className="cursor-pointer select-none text-xs text-slate-400 hover:text-slate-600">
                  Or paste resume text
                </summary>
                <textarea
                  value={resumePaste}
                  onChange={(e) => setResumePaste(e.target.value)}
                  placeholder="Paste resume text..."
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </details>
            </FormField>

            <FormField label="LinkedIn (optional)" hint="Paste your About section or headline.">
              <textarea
                value={linkedInPaste}
                onChange={(e) => setLinkedInPaste(e.target.value)}
                placeholder="Paste LinkedIn About, headline, or key sections..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </FormField>

            <FormField label="Target companies (optional)" hint="Comma-separated. Up to 5.">
              <input
                type="text"
                value={companies}
                onChange={(e) => setCompanies(e.target.value)}
                placeholder="Stripe, Notion, Figma"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </FormField>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Footer
              onBack={() => setStep(2)}
              onNext={handleSubmit}
              nextLabel={submitting ? 'Building your plan…' : 'Build my plan'}
              nextDisabled={submitting}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Kickoff summary view
// ─────────────────────────────────────────────────────────────

function KickoffSummaryView({
  summary,
  updatedAt,
  onRerun,
  onAction,
}: {
  summary: KickoffSummary;
  updatedAt: string;
  onRerun: () => void;
  onAction: (item: KickoffPlanItem) => void;
}) {
  const modeLabel =
    summary.timeMode === 'triage'
      ? 'Triage mode'
      : summary.timeMode === 'focused'
      ? 'Focused mode'
      : 'Full system';

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Your kickoff plan</h2>
          <p className="text-xs text-slate-500">
            {modeLabel} · saved{' '}
            {new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={onRerun}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Re-run kickoff
        </button>
      </div>

      <div className="space-y-6 p-6">
        <div className="rounded-xl border border-slate-900/5 bg-slate-900 p-5 text-white">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-300">
            Highest-leverage next move
          </p>
          <p className="mt-1.5 text-base font-semibold leading-relaxed">
            {summary.recommendedNext.text}
          </p>
          {summary.recommendedNext.command && (
            <button
              onClick={() => onAction(summary.recommendedNext)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Start now →
            </button>
          )}
        </div>

        {summary.targetRealityCheck && (
          <Callout tone="amber" title={`Target reality check: ${summary.targetRealityCheck.target}`}>
            <p className="text-sm text-amber-900">{summary.targetRealityCheck.gap}</p>
            <p className="mt-2 text-sm text-amber-900">{summary.targetRealityCheck.recommendation}</p>
          </Callout>
        )}

        {summary.careerTransition && (
          <Callout tone="brand" title={`Career transition detected: ${summary.careerTransition.type}`}>
            <p className="text-sm text-slate-700">{summary.careerTransition.bridgeStoryAdvice}</p>
          </Callout>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <SnapshotList title="Positioning strengths" items={summary.profile.positioningStrengths} tone="brand" />
          <SnapshotList title="Likely interviewer concerns" items={summary.profile.likelyConcerns} tone="amber" />
          {summary.profile.narrativeGaps.length > 0 && (
            <SnapshotList title="Narrative gaps" items={summary.profile.narrativeGaps} tone="amber" />
          )}
          <SnapshotList title="Story seeds" items={summary.profile.storySeeds} tone="accent" />
        </div>

        <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-3">
          <ReadinessStat label="Current readiness" value={summary.readiness.current} />
          <ReadinessStat label="Biggest risk" value={summary.readiness.biggestRisk} />
          <ReadinessStat label="Biggest asset" value={summary.readiness.biggestAsset} />
        </div>

        <div className="space-y-4">
          <PlanGroup label="Right now" items={summary.plan.immediate} onAction={onAction} />
          <PlanGroup label="This week" items={summary.plan.thisWeek} onAction={onAction} />
          <PlanGroup label="Before first interview" items={summary.plan.beforeFirstInterview} onAction={onAction} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {hint && <p className="mb-2 text-xs text-slate-400">{hint}</p>}
      {children}
    </div>
  );
}

function ChoiceGroup({
  value,
  onChange,
  options,
  vertical,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; sub?: string }[];
  vertical?: boolean;
}) {
  return (
    <div className={`grid gap-2 ${vertical ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              selected
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <p className="text-sm font-semibold">{o.label}</p>
            {o.sub && (
              <p className={`mt-0.5 text-xs ${selected ? 'text-slate-300' : 'text-slate-500'}`}>
                {o.sub}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Footer({
  onBack,
  onCancel,
  onNext,
  nextLabel,
  nextDisabled,
}: {
  onBack?: () => void;
  onCancel?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <div>
        {onBack ? (
          <button
            onClick={onBack}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            Back
          </button>
        ) : onCancel ? (
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            Cancel
          </button>
        ) : null}
      </div>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function SnapshotList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'brand' | 'accent' | 'amber';
}) {
  const dot =
    tone === 'brand' ? 'bg-brand-500' : tone === 'accent' ? 'bg-accent-500' : 'bg-amber-500';
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h4>
      </div>
      <ul className="space-y-1.5 text-sm text-slate-700">
        {items.map((it, i) => (
          <li key={i} className="leading-relaxed">
            • {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReadinessStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-700">{value}</p>
    </div>
  );
}

function PlanGroup({
  label,
  items,
  onAction,
}: {
  label: string;
  items: KickoffPlanItem[];
  onAction: (item: KickoffPlanItem) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start justify-between gap-3">
            <p className="flex-1 text-sm text-slate-700">{item.text}</p>
            {item.command && (
              <button
                onClick={() => onAction(item)}
                className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Go →
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Callout({
  title,
  children,
  tone,
}: {
  title: string;
  children: React.ReactNode;
  tone: 'brand' | 'amber';
}) {
  const styles =
    tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-brand-200 bg-brand-50';
  return (
    <div className={`rounded-xl border ${styles} p-4`}>
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
