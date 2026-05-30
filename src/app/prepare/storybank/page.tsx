'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { STORY_DIMENSIONS, type StoryScores } from '@/lib/storybank';

// ─────────────────────────────────────────────────────────────
// Types (mirror the API DTOs)
// ─────────────────────────────────────────────────────────────

interface StoryDTO {
  id: string;
  title: string;
  primarySkill: string;
  secondarySkills: string[];
  situation: string;
  task: string;
  action: string;
  result: string;
  earnedSecret: string;
  deployUseCase: string;
  spokenDraft: string;
  strength: number;
  scores: Partial<StoryScores>;
  versionHistory: Array<{ date: string; note: string }>;
  notes: string;
  updatedAt: string;
}

interface ScoreResult {
  strength: number;
  scores: StoryScores;
  gapType: string;
  diagnosis: string;
  improvementQuestions: string[];
  suggestedFix: { section: string; before: string; after: string; why: string };
}

interface GapItem {
  competency: string;
  reason: string;
  recommendation: string;
}
interface GapsResult {
  critical: GapItem[];
  important: GapItem[];
  niceToHave: GapItem[];
  recommendedNext: string;
}

interface NarrativeResult {
  themes: Array<{ theme: string; description: string; storyTitles: string[] }>;
  sharpestEdge: string;
  orphanStories: string[];
  fragileThemes: string[];
  howToUse: { inAnswers: string; inQuestions: string; inPositioning: string };
}

interface NoteDTO {
  id: string;
  title: string;
  body: string;
  tag: string;
  updatedAt: string;
}

type Tab = 'stories' | 'gaps' | 'narrative' | 'notes';

const FIX_SECTION_FIELD: Record<string, keyof StoryDTO> = {
  Situation: 'situation',
  Task: 'task',
  Action: 'action',
  Result: 'result',
  'Earned Secret': 'earnedSecret',
};

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function StorybankPage() {
  const [tab, setTab] = useState<Tab>('stories');
  const [stories, setStories] = useState<StoryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch('/api/interview/storybank', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStories(Array.isArray(data.stories) ? data.stories : []);
      }
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const strong = stories.filter((s) => s.strength >= 4).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Logo size={72} className="animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60">
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <header className="mb-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Link href="/prepare" className="hover:text-slate-600">
                Prepare
              </Link>
              <span>/</span>
              <span className="text-slate-600">Storybank</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Storybank</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Turn real experiences into memorable STAR stories, score and improve them, find the gaps for your
              target role, and discover the themes that tie your career together.
            </p>
          </header>

          {/* Health strip */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            <StatCard label="Stories" value={String(stories.length)} />
            <StatCard label="Strong (4+)" value={`${strong}/${stories.length || 0}`} />
            <StatCard
              label="Healthy bank"
              value={stories.length >= 5 && strong / Math.max(stories.length, 1) >= 0.6 ? 'Yes' : 'Building'}
            />
          </div>

          <TabBar tab={tab} setTab={setTab} storyCount={stories.length} />

          <div className="mt-6">
            {tab === 'stories' && (
              <StoriesTab stories={stories} refresh={fetchStories} />
            )}
            {tab === 'gaps' && <GapsTab />}
            {tab === 'narrative' && <NarrativeTab storyCount={stories.length} />}
            {tab === 'notes' && <NotesTab />}
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
// Tab bar + small UI
// ─────────────────────────────────────────────────────────────

function TabBar({ tab, setTab, storyCount }: { tab: Tab; setTab: (t: Tab) => void; storyCount: number }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'stories', label: 'Stories' },
    { id: 'gaps', label: 'Find gaps' },
    { id: 'narrative', label: 'Narrative identity' },
    { id: 'notes', label: 'Notes' },
  ];
  return (
    <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTab(t.id)}
          className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
            tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          {t.label}
          {t.id === 'stories' && storyCount > 0 ? (
            <span className={`ml-1.5 text-xs ${tab === t.id ? 'text-slate-300' : 'text-slate-400'}`}>
              {storyCount}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StrengthBadge({ strength }: { strength: number }) {
  if (!strength) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
        Unscored
      </span>
    );
  }
  const tone =
    strength <= 2
      ? 'bg-red-100 text-red-700'
      : strength === 3
      ? 'bg-amber-100 text-amber-700'
      : 'bg-emerald-100 text-emerald-700';
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>Strength {strength}/5</span>;
}

function ScoreBars({ scores }: { scores: Partial<StoryScores> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {STORY_DIMENSIONS.map((d) => {
        const v = scores[d.key] ?? 0;
        const pct = (v / 5) * 100;
        const barColor = v <= 2 ? 'bg-red-400' : v === 3 ? 'bg-amber-400' : 'bg-emerald-400';
        return (
          <div key={d.key}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600" title={d.desc}>
                {d.label}
              </span>
              <span className="text-slate-400">{v || '—'}/5</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-2 text-sm text-red-600">{children}</p>;
}

// ─────────────────────────────────────────────────────────────
// Stories tab
// ─────────────────────────────────────────────────────────────

function StoriesTab({ stories, refresh }: { stories: StoryDTO[]; refresh: () => Promise<void> }) {
  const [rawNotes, setRawNotes] = useState('');
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);

  const build = async () => {
    if (!rawNotes.trim()) return;
    setBuilding(true);
    setError(null);
    setDiagnosis(null);
    try {
      const res = await fetch('/api/interview/storybank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawNotes: rawNotes.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not build story');
      setRawNotes('');
      setDiagnosis(data.diagnosis || null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to build story');
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Add story */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Add a story</h2>
        <p className="mt-1 text-xs text-slate-500">
          Don&rsquo;t worry about structure. Paste rough notes about ONE real experience — the moment, what was at
          stake, what you did, how it turned out. We&rsquo;ll shape it into STAR, pull out your earned secret, and
          score it.
        </p>
        <textarea
          value={rawNotes}
          onChange={(e) => setRawNotes(e.target.value)}
          rows={4}
          placeholder="e.g. The launch was slipping and two teams blamed each other. I pulled them into one room, cut scope to the riskiest 20%, and we shipped in 3 weeks. Retention held..."
          className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">{rawNotes.length}/6000</span>
          <button
            type="button"
            onClick={build}
            disabled={building || !rawNotes.trim()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {building ? 'Building…' : 'Build my story'}
          </button>
        </div>
        <ErrorText>{error}</ErrorText>
        {diagnosis && (
          <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-slate-700">
            <span className="font-semibold text-brand-700">To make it stronger:</span> {diagnosis}
          </div>
        )}
      </div>

      {/* List */}
      {stories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">Your storybank is empty</p>
          <p className="mt-1 text-xs text-slate-500">Add your first story above. Aim for 5–8 across leadership, conflict, failure, and impact.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} refresh={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

function StoryCard({ story, refresh }: { story: StoryDTO; refresh: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const runScore = async () => {
    setScoring(true);
    setError(null);
    try {
      const res = await fetch('/api/interview/storybank/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: story.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not score');
      setScoreResult(data as ScoreResult);
      setOpen(true);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to score');
    } finally {
      setScoring(false);
    }
  };

  const applyFix = async () => {
    if (!scoreResult) return;
    const field = FIX_SECTION_FIELD[scoreResult.suggestedFix.section];
    if (!field) return;
    setApplying(true);
    setError(null);
    try {
      const res = await fetch('/api/interview/storybank', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: story.id, updates: { [field]: scoreResult.suggestedFix.after } }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not apply fix');
      }
      setScoreResult(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply fix');
    } finally {
      setApplying(false);
    }
  };

  const del = async () => {
    if (!confirm(`Delete "${story.title}"? This can't be undone.`)) return;
    await fetch(`/api/interview/storybank?id=${encodeURIComponent(story.id)}`, { method: 'DELETE' });
    await refresh();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{story.title}</h3>
            <StrengthBadge strength={story.strength} />
          </div>
          {story.primarySkill && (
            <p className="mt-1 text-xs text-slate-500">
              <span className="font-medium text-slate-600">{story.primarySkill}</span>
              {story.secondarySkills.length > 0 && <> · {story.secondarySkills.join(', ')}</>}
            </p>
          )}
          {story.deployUseCase && <p className="mt-1 text-xs italic text-slate-400">Use for: {story.deployUseCase}</p>}
        </button>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={runScore}
            disabled={scoring}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {scoring ? 'Scoring…' : story.strength ? 'Re-score' : 'Score'}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing((e) => !e);
              setOpen(true);
            }}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={del}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4">
          {editing ? (
            <StoryEditor story={story} onDone={async () => { setEditing(false); await refresh(); }} onCancel={() => setEditing(false)} />
          ) : (
            <div className="space-y-3">
              <Star label="Situation" text={story.situation} />
              <Star label="Task" text={story.task} />
              <Star label="Action" text={story.action} />
              <Star label="Result" text={story.result} />
              {story.earnedSecret && (
                <div className="rounded-lg border border-accent-200 bg-accent-50/50 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-700">Earned secret</p>
                  <p className="mt-1 text-sm text-slate-700">{story.earnedSecret}</p>
                </div>
              )}
              {story.spokenDraft && (
                <details>
                  <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
                    Spoken draft (60–90s)
                  </summary>
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                    {story.spokenDraft}
                  </p>
                </details>
              )}
            </div>
          )}

          {/* Scores */}
          {story.strength > 0 && !editing && (
            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <ScoreBars scores={story.scores} />
            </div>
          )}

          <ErrorText>{error}</ErrorText>

          {/* Score result / improve */}
          {scoreResult && !editing && (
            <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50/60 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                Diagnosis · gap: {scoreResult.gapType.replace(/_/g, ' ')}
              </p>
              <p className="mt-1 text-sm text-slate-700">{scoreResult.diagnosis}</p>

              {scoreResult.improvementQuestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-600">Answer these to strengthen it:</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {scoreResult.improvementQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {scoreResult.suggestedFix.after && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold text-slate-700">
                    Suggested fix — {scoreResult.suggestedFix.section}
                  </p>
                  {scoreResult.suggestedFix.before && (
                    <p className="mt-1.5 text-xs text-slate-400 line-through">{scoreResult.suggestedFix.before}</p>
                  )}
                  <p className="mt-1.5 text-sm text-slate-800">{scoreResult.suggestedFix.after}</p>
                  {scoreResult.suggestedFix.why && (
                    <p className="mt-1 text-xs italic text-slate-500">{scoreResult.suggestedFix.why}</p>
                  )}
                  {FIX_SECTION_FIELD[scoreResult.suggestedFix.section] && (
                    <button
                      type="button"
                      onClick={applyFix}
                      disabled={applying}
                      className="mt-2 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {applying ? 'Applying…' : 'Apply this fix'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Star({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm leading-relaxed text-slate-700">{text}</p>
    </div>
  );
}

function StoryEditor({
  story,
  onDone,
  onCancel,
}: {
  story: StoryDTO;
  onDone: () => Promise<void>;
  onCancel: () => void;
}) {
  const [fields, setFields] = useState({
    title: story.title,
    primarySkill: story.primarySkill,
    situation: story.situation,
    task: story.task,
    action: story.action,
    result: story.result,
    earnedSecret: story.earnedSecret,
    deployUseCase: story.deployUseCase,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/interview/storybank', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: story.id, updates: fields }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save');
      }
      await onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <EditField label="Title">
          <input value={fields.title} onChange={set('title')} className={inputCls} />
        </EditField>
        <EditField label="Primary skill">
          <input value={fields.primarySkill} onChange={set('primarySkill')} className={inputCls} />
        </EditField>
      </div>
      <EditField label="Situation">
        <textarea value={fields.situation} onChange={set('situation')} rows={2} className={inputCls} />
      </EditField>
      <EditField label="Task">
        <textarea value={fields.task} onChange={set('task')} rows={2} className={inputCls} />
      </EditField>
      <EditField label="Action">
        <textarea value={fields.action} onChange={set('action')} rows={3} className={inputCls} />
      </EditField>
      <EditField label="Result">
        <textarea value={fields.result} onChange={set('result')} rows={2} className={inputCls} />
      </EditField>
      <EditField label="Earned secret">
        <textarea value={fields.earnedSecret} onChange={set('earnedSecret')} rows={2} className={inputCls} />
      </EditField>
      <EditField label="Deploy use-case">
        <input value={fields.deployUseCase} onChange={set('deployUseCase')} className={inputCls} />
      </EditField>
      <ErrorText>{error}</ErrorText>
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900">
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Gaps tab
// ─────────────────────────────────────────────────────────────

function GapsTab() {
  const [loading, setLoading] = useState(false);
  const [gaps, setGaps] = useState<GapsResult | null>(null);
  const [hasRole, setHasRole] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/interview/storybank/gaps', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not analyse gaps');
      setGaps(data.gaps as GapsResult);
      setHasRole(!!data.hasTargetRole);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyse gaps');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Find storybank gaps</h2>
        <p className="mt-1 text-xs text-slate-500">
          Cross-references your stories against your target role (from kickoff) and ranks what&rsquo;s missing by how
          much it matters.
        </p>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Analysing…' : gaps ? 'Re-analyse' : 'Analyse gaps'}
        </button>
        <ErrorText>{error}</ErrorText>
        {gaps && !hasRole && (
          <p className="mt-2 text-xs text-amber-600">
            No target role set — analysed against general standards. Run kickoff on{' '}
            <Link href="/prepare" className="underline">
              Prepare
            </Link>{' '}
            for role-specific gaps.
          </p>
        )}
      </div>

      {gaps && (
        <div className="space-y-3">
          {gaps.recommendedNext && (
            <div className="rounded-xl border border-slate-900/5 bg-slate-900 px-5 py-4 text-white">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-300">Fill this next</p>
              <p className="mt-1 text-sm font-semibold">{gaps.recommendedNext}</p>
            </div>
          )}
          <GapGroup title="Critical" tone="red" items={gaps.critical} />
          <GapGroup title="Important" tone="amber" items={gaps.important} />
          <GapGroup title="Nice to have" tone="slate" items={gaps.niceToHave} />
        </div>
      )}
    </div>
  );
}

function GapGroup({ title, tone, items }: { title: string; tone: 'red' | 'amber' | 'slate'; items: GapItem[] }) {
  if (items.length === 0) return null;
  const dot = tone === 'red' ? 'bg-red-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-slate-400';
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-400">{items.length}</span>
      </div>
      <ul className="space-y-3">
        {items.map((g, i) => (
          <li key={i} className="border-l-2 border-slate-100 pl-3">
            <p className="text-sm font-medium text-slate-800">{g.competency}</p>
            {g.reason && <p className="mt-0.5 text-xs text-slate-500">{g.reason}</p>}
            {g.recommendation && (
              <p className="mt-1 text-xs text-brand-700">→ {g.recommendation}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Narrative tab
// ─────────────────────────────────────────────────────────────

function NarrativeTab({ storyCount }: { storyCount: number }) {
  const [loading, setLoading] = useState(false);
  const [narrative, setNarrative] = useState<NarrativeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const enough = storyCount >= 5;

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/interview/storybank/narrative', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not extract themes');
      setNarrative(data.narrative as NarrativeResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to extract narrative identity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Narrative identity</h2>
        <p className="mt-1 text-xs text-slate-500">
          Find the 2–3 themes that connect your stories — your sharpest edge and how to use it in answers, questions,
          and positioning. Needs 5+ stories.
        </p>
        {!enough ? (
          <p className="mt-3 text-sm text-amber-600">
            You have {storyCount} {storyCount === 1 ? 'story' : 'stories'}. Add {5 - storyCount} more to unlock theme
            extraction.
          </p>
        ) : (
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Extracting…' : narrative ? 'Re-extract' : 'Extract my themes'}
          </button>
        )}
        <ErrorText>{error}</ErrorText>
      </div>

      {narrative && (
        <div className="space-y-3">
          {narrative.sharpestEdge && (
            <div className="rounded-xl border border-accent-200 bg-accent-50/50 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-700">Your sharpest edge</p>
              <p className="mt-1 text-sm text-slate-700">{narrative.sharpestEdge}</p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Core themes</h3>
            <div className="space-y-3">
              {narrative.themes.map((t, i) => (
                <div key={i} className="border-l-2 border-brand-200 pl-3">
                  <p className="text-sm font-semibold text-slate-800">{t.theme}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{t.description}</p>
                  {t.storyTitles.length > 0 && (
                    <p className="mt-1 text-[11px] text-slate-400">Stories: {t.storyTitles.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {(narrative.orphanStories.length > 0 || narrative.fragileThemes.length > 0) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {narrative.orphanStories.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold text-amber-800">Orphan stories (reframe or retire)</p>
                  <p className="mt-1 text-xs text-amber-900">{narrative.orphanStories.join(', ')}</p>
                </div>
              )}
              {narrative.fragileThemes.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold text-amber-800">Fragile themes (only 1 story)</p>
                  <p className="mt-1 text-xs text-amber-900">{narrative.fragileThemes.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">How to use this</h3>
            <HowRow label="In answers" text={narrative.howToUse.inAnswers} />
            <HowRow label="In questions you ask" text={narrative.howToUse.inQuestions} />
            <HowRow label="In positioning" text={narrative.howToUse.inPositioning} />
          </div>
        </div>
      )}
    </div>
  );
}

function HowRow({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div className="mb-2 last:mb-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-700">{text}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Notes tab
// ─────────────────────────────────────────────────────────────

function NotesTab() {
  const [notes, setNotes] = useState<NoteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tag, setTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/interview/notes', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setNotes(Array.isArray(data.notes) ? data.notes : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const add = async () => {
    if (!title.trim() && !body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/interview/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), tag: tag.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save note');
      }
      setTitle('');
      setBody('');
      setTag('');
      await fetchNotes();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    await fetch(`/api/interview/notes?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await fetchNotes();
  };

  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">New note</h2>
        <p className="mt-1 text-xs text-slate-500">
          Jot down anything — company research, recruiter signals, things you want to remember mid-search.
        </p>
        <div className="mt-3 space-y-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={inputCls} />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Note…"
            className={inputCls}
          />
          <div className="flex items-center gap-2">
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Tag (optional) — e.g. Stripe, recruiter"
              className={`${inputCls} flex-1`}
            />
            <button
              type="button"
              onClick={add}
              disabled={saving || (!title.trim() && !body.trim())}
              className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add note'}
            </button>
          </div>
        </div>
        <ErrorText>{error}</ErrorText>
      </div>

      {loading ? (
        <p className="px-1 text-sm text-slate-400">Loading…</p>
      ) : notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">No notes yet</p>
          <p className="mt-1 text-xs text-slate-500">Capture research and signals as you go.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} onChanged={fetchNotes} onDelete={() => del(n.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({ note, onChanged, onDelete }: { note: NoteDTO; onChanged: () => Promise<void>; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [tag, setTag] = useState(note.tag);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/interview/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: note.id, title, body, tag }),
      });
      setEditing(false);
      await onChanged();
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      {editing ? (
        <div className="space-y-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className={inputCls} />
          <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag" className={inputCls} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{note.title}</h3>
                {note.tag && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    {note.tag}
                  </span>
                )}
              </div>
              {note.body && <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{note.body}</p>}
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button type="button" onClick={() => setEditing(true)} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                Edit
              </button>
              <button type="button" onClick={onDelete} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
