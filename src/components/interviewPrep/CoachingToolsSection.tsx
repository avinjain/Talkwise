'use client';

import { useState } from 'react';
import type {
  CoachCommand,
  PrepOutput,
  ConcernsOutput,
  QuestionsOutput,
  InterviewStage,
} from '@/lib/coach';
import type { PracticeCoachingFocusPayload } from '@/lib/practiceCoaching';

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
// ─────────────────────────────────────────────────────────────
// Coaching tools — prep / concerns / questions
// ─────────────────────────────────────────────────────────────

export interface CoachStateBundle {
  prep: (PrepOutput & { updatedAt: string }) | null;
  concerns: (ConcernsOutput & { updatedAt: string }) | null;
  questions: (QuestionsOutput & { updatedAt: string }) | null;
  practiceFocus: PracticeCoachingFocusPayload | null;
}

export function CoachingToolsSection({
  state,
  onChange,
  refresh,
  showSectionHeader = true,
}: {
  state: CoachStateBundle;
  onChange: (next: Partial<CoachStateBundle>) => void;
  refresh: () => Promise<void> | void;
  /** When false, omit outer title (e.g. embedded in Prepare practice hub). */
  showSectionHeader?: boolean;
}) {
  const [active, setActive] = useState<CoachCommand | null>(null);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const tiles: Array<{
    cmd: CoachCommand;
    title: string;
    description: string;
    badge: string | null;
    tone: 'amber' | 'brand' | 'accent';
  }> = [
    {
      cmd: 'prep',
      title: 'Prep brief',
      description:
        'A focused brief for one specific interview. Predicts likely questions, maps stories, and gives you what to ask back.',
      badge: state.prep ? `${state.prep.company} · ${formatDate(state.prep.updatedAt)}` : null,
      tone: 'amber',
    },
    {
      cmd: 'concerns',
      title: 'Address my concerns',
      description:
        'Surfaces the concerns a hiring manager is likely to raise about you, ranked by severity, with three counter framings each.',
      badge: state.concerns ? `Saved · ${formatDate(state.concerns.updatedAt)}` : null,
      tone: 'brand',
    },
    {
      cmd: 'questions',
      title: 'Questions to ask interviewers',
      description:
        '5 strong, stage-aware questions to ask the interviewer — each with a likely follow-up and a prepared response.',
      badge: state.questions ? `Saved · ${formatDate(state.questions.updatedAt)}` : null,
      tone: 'accent',
    },
  ];

  return (
    <section className={showSectionHeader ? 'mt-10' : 'mt-0'}>
      {showSectionHeader ? (
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Coaching tools</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Sharper output, grounded in your kickoff. Run any of the three on demand.
          </p>
        </header>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <CoachTile
            key={tile.cmd}
            tone={tile.tone}
            title={tile.title}
            description={tile.description}
            badge={tile.badge}
            active={active === tile.cmd}
            onOpen={() => setActive(tile.cmd)}
          />
        ))}
      </div>

      {/* Inline panel for the active tool */}
      {active && (
        <div className="mt-5">
          {active === 'prep' && (
            <PrepPanel
              saved={state.prep}
              defaultRole={undefined}
              onClose={() => setActive(null)}
              onResult={(prep) => onChange({ prep: { ...prep, updatedAt: new Date().toISOString() } })}
              refresh={refresh}
            />
          )}
          {active === 'concerns' && (
            <ConcernsPanel
              saved={state.concerns}
              onClose={() => setActive(null)}
              onResult={(concerns) =>
                onChange({ concerns: { ...concerns, updatedAt: new Date().toISOString() } })
              }
              refresh={refresh}
            />
          )}
          {active === 'questions' && (
            <QuestionsPanel
              saved={state.questions}
              onClose={() => setActive(null)}
              onResult={(questions) =>
                onChange({ questions: { ...questions, updatedAt: new Date().toISOString() } })
              }
              refresh={refresh}
            />
          )}
        </div>
      )}
    </section>
  );
}

function CoachTile({
  tone,
  title,
  description,
  badge,
  active,
  onOpen,
}: {
  tone: 'amber' | 'brand' | 'accent';
  title: string;
  description: string;
  badge: string | null;
  active: boolean;
  onOpen: () => void;
}) {
  const dot =
    tone === 'amber' ? 'bg-amber-500' : tone === 'brand' ? 'bg-brand-500' : 'bg-accent-500';
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex h-full flex-col items-start gap-2 rounded-2xl border bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md ${
        active ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="text-xs leading-relaxed text-slate-500">{description}</p>
      <span
        className={`mt-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
          badge ? 'bg-slate-100 text-slate-700' : 'text-slate-400'
        }`}
      >
        {badge ?? 'Not yet generated'}
      </span>
    </button>
  );
}

// ── Prep panel ──

function PrepPanel({
  saved,
  defaultRole,
  onClose,
  onResult,
  refresh,
}: {
  saved: PrepOutput | null;
  defaultRole?: string;
  onClose: () => void;
  onResult: (out: PrepOutput) => void;
  refresh: () => Promise<void> | void;
}) {
  const [showForm, setShowForm] = useState(!saved);
  const [company, setCompany] = useState(saved?.company || '');
  const [role, setRole] = useState(saved?.role || defaultRole || '');
  const [jd, setJd] = useState('');
  const [stage, setStage] = useState<InterviewStage>(saved?.stage || 'unknown');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    if (!company.trim() || !role.trim() || jd.trim().length < 50) {
      setError('Company, role, and a full job description are required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'prep',
          company: company.trim(),
          role: role.trim(),
          jd: jd.trim(),
          stage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Prep failed');
      onResult(data.artifact as PrepOutput);
      setShowForm(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not run prep');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PanelShell title="Prep brief" onClose={onClose}>
      {showForm ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Company">
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Stripe"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </FormField>
            <FormField label="Role">
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Senior PM, Payments"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </FormField>
          </div>

          <FormField label="Stage" hint="Helps tailor format and questions to ask back.">
            <ChoiceGroup
              value={stage}
              onChange={(v) => setStage(v as InterviewStage)}
              options={[
                { value: 'phone_screen', label: 'Phone screen' },
                { value: 'hiring_manager', label: 'Hiring manager' },
                { value: 'final_round', label: 'Final / exec' },
                { value: 'peer', label: 'Peer round' },
                { value: 'panel', label: 'Panel' },
                { value: 'unknown', label: 'Not sure' },
              ]}
            />
          </FormField>

          <FormField label="Job description" hint="Paste the full JD — the more context, the sharper the brief.">
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the full job description..."
              rows={8}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </FormField>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-2">
            {saved && (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleRun}
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Building brief…' : saved ? 'Generate new brief' : 'Build my brief'}
            </button>
          </div>
        </div>
      ) : saved ? (
        <PrepResultView prep={saved} onRegenerate={() => setShowForm(true)} />
      ) : null}
    </PanelShell>
  );
}

function PrepResultView({ prep, onRegenerate }: { prep: PrepOutput; onRegenerate: () => void }) {
  const stageLabel: Record<InterviewStage, string> = {
    phone_screen: 'Phone screen',
    hiring_manager: 'Hiring manager',
    final_round: 'Final round',
    peer: 'Peer round',
    panel: 'Panel',
    unknown: 'Stage unspecified',
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {prep.company} · {prep.role}
          </p>
          <p className="mt-0.5 text-sm text-slate-700">
            {stageLabel[prep.stage]} · {prep.format.name}
          </p>
          {prep.format.notes && <p className="mt-0.5 text-xs text-slate-500">{prep.format.notes}</p>}
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          New brief
        </button>
      </div>

      {prep.topCriteria.length > 0 && (
        <SectionList title="Top evaluation criteria" items={prep.topCriteria} tone="brand" />
      )}
      {prep.jdCompetencies.length > 0 && (
        <SectionList title="Competencies (priority order)" items={prep.jdCompetencies} tone="accent" />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {prep.candidateStrengths.length > 0 && (
          <SectionList title="Your strengths" items={prep.candidateStrengths} tone="brand" compact />
        )}
        {prep.candidateRisks.length > 0 && (
          <SectionList title="Likely probes" items={prep.candidateRisks} tone="amber" compact />
        )}
      </div>

      {prep.predictedQuestions.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Predicted questions
          </h4>
          <ul className="mt-2 space-y-3">
            {prep.predictedQuestions.map((q, i) => (
              <li key={i} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-slate-900">{q.text}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Tests <span className="font-medium text-slate-700">{q.competency}</span>
                  {q.storyHint && ` · Story: ${q.storyHint}`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {prep.questionsToAsk.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Questions to ask back
          </h4>
          <ul className="mt-2 space-y-2">
            {prep.questionsToAsk.map((q, i) => (
              <li key={i}>
                <p className="text-sm text-slate-800">{q.text}</p>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">{q.purpose}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {prep.prepTips.length > 0 && (
        <SectionList title="Prep tips" items={prep.prepTips} tone="brand" />
      )}
    </div>
  );
}

// ── Concerns panel ──

function ConcernsPanel({
  saved,
  onClose,
  onResult,
  refresh,
}: {
  saved: ConcernsOutput | null;
  onClose: () => void;
  onResult: (out: ConcernsOutput) => void;
  refresh: () => Promise<void> | void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'concerns' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Concerns failed');
      onResult(data.artifact as ConcernsOutput);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not run concerns');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PanelShell title="Address my concerns" onClose={onClose}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Uses your kickoff context (resume + target role + interview history).
        </p>
        <button
          type="button"
          onClick={handleRun}
          disabled={submitting}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? 'Working…' : saved ? 'Regenerate' : 'Generate concerns'}
        </button>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {saved && <ConcernsResultView concerns={saved} />}
    </PanelShell>
  );
}

function ConcernsResultView({ concerns }: { concerns: ConcernsOutput }) {
  return (
    <div className="space-y-4">
      {concerns.topPriority?.concern && (
        <div className="rounded-xl border border-slate-900/5 bg-slate-900 p-4 text-white">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-300">
            Top priority
          </p>
          <p className="mt-1 text-sm font-semibold">{concerns.topPriority.concern}</p>
          <p className="mt-1 text-sm text-slate-300">{concerns.topPriority.recommendation}</p>
        </div>
      )}

      {concerns.dealbreakers.length > 0 && (
        <ConcernGroup label="Dealbreakers" tone="amber" items={concerns.dealbreakers} />
      )}
      {concerns.significant.length > 0 && (
        <ConcernGroup label="Significant" tone="amber" items={concerns.significant} />
      )}

      {concerns.minor.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Minor</h4>
          <ul className="mt-2 space-y-2.5">
            {concerns.minor.map((c, i) => (
              <li key={i} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-slate-800">{c.concern}</p>
                {c.source && <p className="text-[11px] text-slate-400">Source: {c.source}</p>}
                {c.counter && <p className="mt-1 text-sm text-slate-600">{c.counter}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ConcernGroup({
  label,
  tone,
  items,
}: {
  label: string;
  tone: 'amber';
  items: ConcernsOutput['significant'];
}) {
  const border = tone === 'amber' ? 'border-amber-200' : 'border-slate-200';
  return (
    <div className={`overflow-hidden rounded-xl border ${border} bg-white`}>
      <div className="border-b border-slate-100 bg-amber-50 px-4 py-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900">{label}</h4>
      </div>
      <ul className="divide-y divide-slate-100">
        {items.map((c, i) => (
          <li key={i} className="space-y-2 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">{c.concern}</p>
              {c.source && <p className="text-[11px] text-slate-400">Source: {c.source}</p>}
            </div>
            <div className="grid gap-2 rounded-lg bg-slate-50/60 p-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Direct
                </p>
                <p className="mt-1 text-slate-700">{c.counters.direct}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Subtle probe
                </p>
                <p className="mt-1 text-slate-700">{c.counters.subtle}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Pushback
                </p>
                <p className="mt-1 text-slate-700">{c.counters.followUp}</p>
              </div>
            </div>
            {c.bestStory && (
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">Best story: </span>
                {c.bestStory}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Questions panel ──

function QuestionsPanel({
  saved,
  onClose,
  onResult,
  refresh,
}: {
  saved: QuestionsOutput | null;
  onClose: () => void;
  onResult: (out: QuestionsOutput) => void;
  refresh: () => Promise<void> | void;
}) {
  const [stage, setStage] = useState<InterviewStage>(saved?.stage || 'hiring_manager');
  const [company, setCompany] = useState(saved?.company || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'questions', stage, company: company.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Questions failed');
      onResult(data.artifact as QuestionsOutput);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not run questions');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PanelShell title="Questions to ask interviewers" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <FormField label="Stage">
            <ChoiceGroup
              value={stage}
              onChange={(v) => setStage(v as InterviewStage)}
              options={[
                { value: 'phone_screen', label: 'Phone screen' },
                { value: 'hiring_manager', label: 'Hiring manager' },
                { value: 'final_round', label: 'Final / exec' },
                { value: 'peer', label: 'Peer' },
                { value: 'panel', label: 'Panel' },
              ]}
            />
          </FormField>
          <FormField label="Company (optional)">
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Stripe"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </FormField>
        </div>
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleRun}
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? 'Working…' : saved ? 'Regenerate' : 'Generate questions'}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <QuestionsResultView questions={saved} />}
      </div>
    </PanelShell>
  );
}

function QuestionsResultView({ questions }: { questions: QuestionsOutput }) {
  const purposeLabel: Record<string, string> = {
    information: 'Information',
    concern_mitigation: 'Concern mitigation',
    differentiation: 'Differentiation',
    rapport: 'Rapport',
  };
  return (
    <div className="space-y-4">
      <ol className="space-y-3">
        {questions.questions.map((q, i) => (
          <li key={i} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{q.text}</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  {purposeLabel[q.purpose] || q.purpose}
                  {q.bestFor && ` · ${q.bestFor}`}
                </p>
                {q.whyStrong && (
                  <p className="mt-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Why this is strong: </span>
                    {q.whyStrong}
                  </p>
                )}
                {q.likelyFollowUp && (
                  <div className="mt-2 rounded-lg bg-slate-50/60 p-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      They might ask back
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">{q.likelyFollowUp}</p>
                    {q.yourResponse && (
                      <>
                        <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                          Your prepared response
                        </p>
                        <p className="mt-0.5 text-xs text-slate-700">{q.yourResponse}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {questions.toAvoid.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900">
            Skip these this round
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {questions.toAvoid.map((q, i) => (
              <li key={i}>• {q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Shared little bits ──

function PanelShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SectionList({
  title,
  items,
  tone,
  compact,
}: {
  title: string;
  items: string[];
  tone: 'brand' | 'accent' | 'amber';
  compact?: boolean;
}) {
  const dot =
    tone === 'brand' ? 'bg-brand-500' : tone === 'accent' ? 'bg-accent-500' : 'bg-amber-500';
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h4>
      </div>
      <ul className={`space-y-${compact ? '1' : '1.5'} text-sm text-slate-700`}>
        {items.map((it, i) => (
          <li key={i} className="leading-relaxed">
            • {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
