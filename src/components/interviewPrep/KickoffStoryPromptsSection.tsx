'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { StoryDraftPersisted } from '@/lib/db';

function mergeDraftText(prompts: string[], saved: StoryDraftPersisted[]): string[] {
  return prompts.map((p) => {
    const hit = saved.find((s) => s.prompt === p);
    return hit?.draft ?? '';
  });
}

const STAR_SAMPLE = `Situation: Our checkout API started failing intermittently during a holiday sale.
Task: I owned restoring reliability without rolling back the new pricing engine.
Action: I paired metrics from traces with queue depth, added circuit breakers on the flaky downstream, and coordinated a phased rollout with support on standby.
Result: Error rate dropped under 0.1% within hours; we kept the promotion live and documented runbooks for the next spike.`;

function InfoIcon(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={props.className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function KickoffStoryPromptsSection({
  prompts,
  intro = 'Write rough notes — bullets are fine. Use the STAR guide (info icon next to the title) for structure and a sample. Speaking-point generation can tighten wording later.',
}: {
  prompts: string[];
  intro?: string;
}) {
  const [texts, setTexts] = useState<string[]>(() => prompts.map(() => ''));
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const [guideOpen, setGuideOpen] = useState(false);
  const guideRef = useRef<HTMLDivElement>(null);
  const guideBtnRef = useRef<HTMLButtonElement>(null);

  const [starInput, setStarInput] = useState('');
  const [starLoading, setStarLoading] = useState(false);
  const [starError, setStarError] = useState<string | null>(null);
  const [starOut, setStarOut] = useState<{
    situation: string;
    task: string;
    action: string;
    result: string;
    spokenDraft: string;
  } | null>(null);

  const stablePromptKey = useMemo(() => prompts.join('\x1e'), [prompts]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!guideOpen) return;
      const t = e.target as Node;
      if (guideRef.current?.contains(t) || guideBtnRef.current?.contains(t)) return;
      setGuideOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [guideOpen]);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    fetch('/api/interview/speaking-points', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const saved = Array.isArray(data.storyDrafts)
          ? (data.storyDrafts as StoryDraftPersisted[]).filter(
              (x) => x && typeof x.prompt === 'string' && typeof x.draft === 'string'
            )
          : [];
        setTexts(mergeDraftText(prompts, saved));
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setTexts(prompts.map(() => ''));
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [stablePromptKey]);

  const persist = useCallback(async () => {
    const storyDrafts: StoryDraftPersisted[] = prompts.map((prompt, i) => ({
      prompt,
      draft: texts[i] ?? '',
    }));
    setSaving(true);
    try {
      await fetch('/api/interview/speaking-points', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyDrafts }),
      });
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2000);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }, [prompts, texts]);

  const convertStar = useCallback(async () => {
    const bullets = starInput.trim();
    if (!bullets) {
      setStarError('Add bullets or rough notes first.');
      return;
    }
    setStarError(null);
    setStarLoading(true);
    setStarOut(null);
    try {
      const res = await fetch('/api/interview/story-star', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullets }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStarError(typeof data.error === 'string' ? data.error : 'Could not generate STAR.');
        return;
      }
      setStarOut({
        situation: data.situation ?? '',
        task: data.task ?? '',
        action: data.action ?? '',
        result: data.result ?? '',
        spokenDraft: data.spokenDraft ?? '',
      });
    } catch {
      setStarError('Network error — try again.');
    } finally {
      setStarLoading(false);
    }
  }, [starInput]);

  if (!loaded) {
    return (
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Loading story drafts…</p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <header className="mb-4">
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
          <h2 className="text-base font-semibold text-slate-900">Stories to prepare</h2>
          <div className="relative inline-flex items-center">
            <button
              ref={guideBtnRef}
              type="button"
              aria-expanded={guideOpen}
              aria-controls="kickoff-star-guide-popover"
              onClick={() => setGuideOpen((o) => !o)}
              className="rounded-full p-1 text-slate-400 outline-none ring-brand-500/40 hover:bg-slate-100 hover:text-brand-700 focus-visible:ring-2"
              title="STAR format guide"
            >
              <InfoIcon className="h-5 w-5" />
              <span className="sr-only">STAR format guide</span>
            </button>
            {guideOpen ? (
              <div
                ref={guideRef}
                id="kickoff-star-guide-popover"
                className="absolute left-0 top-full z-20 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-lg sm:w-[26rem]"
                role="dialog"
                aria-label="STAR interview format"
              >
                <p className="font-semibold text-slate-900">STAR (behavioral interviews)</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-slate-600">
                  <li>
                    <strong className="text-slate-800">Situation</strong> — short context and stakes
                  </li>
                  <li>
                    <strong className="text-slate-800">Task</strong> — what you needed to achieve
                  </li>
                  <li>
                    <strong className="text-slate-800">Action</strong> — specific steps you took
                  </li>
                  <li>
                    <strong className="text-slate-800">Result</strong> — outcome and impact (metrics if you have them)
                  </li>
                </ul>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Sample (one story)
                </p>
                <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-sans text-xs leading-relaxed text-slate-700">
                  {STAR_SAMPLE}
                </pre>
              </div>
            ) : null}
          </div>
        </div>
        <p className="mt-1 text-sm text-slate-500">{intro}</p>
      </header>

      <ol className="space-y-5">
        {prompts.map((prompt, i) => (
          <li key={`${i}-${prompt.slice(0, 48)}`}>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">
              <span className="mr-2 font-semibold text-brand-700">{i + 1}.</span>
              {prompt}
            </label>
            <textarea
              value={texts[i] ?? ''}
              onChange={(e) =>
                setTexts((prev) => {
                  const next = [...prev];
                  next[i] = e.target.value;
                  return next;
                })
              }
              rows={4}
              placeholder="Rough bullets or paragraphs — you’ll polish later."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </li>
        ))}
      </ol>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <h3 className="text-sm font-semibold text-slate-900">Turn rough notes into STAR</h3>
        <p className="mt-1 text-xs text-slate-500">
          Paste bullets or fragments for one story below. AI lays out Situation → Task → Action → Result plus a short spoken version you can rehearse.
        </p>
        <textarea
          value={starInput}
          onChange={(e) => setStarInput(e.target.value)}
          rows={5}
          placeholder={'e.g.\n- Legacy billing crashed twice in Q4\n- I led restore + guardrails\n- Cut incidents by …'}
          className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        {starError ? <p className="mt-2 text-xs font-medium text-rose-600">{starError}</p> : null}
        <button
          type="button"
          onClick={() => void convertStar()}
          disabled={starLoading}
          className="mt-3 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {starLoading ? 'Converting…' : 'Convert to STAR with AI'}
        </button>

        {starOut ? (
          <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            {['situation', 'task', 'action', 'result'].map((key) => (
              <div key={key}>
                <p className="text-xs font-semibold capitalize text-slate-600">{key}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                  {starOut[key as keyof typeof starOut]}
                </p>
              </div>
            ))}
            {starOut.spokenDraft ? (
              <div>
                <p className="text-xs font-semibold text-slate-600">Spoken draft (~45–90s)</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{starOut.spokenDraft}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void persist()}
          disabled={saving}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save story drafts'}
        </button>
        {savedFlash ? (
          <span className="text-xs font-medium text-emerald-700">Saved to your account.</span>
        ) : (
          <span className="text-xs text-slate-400">Drafts sync across Prepare and Interview prep.</span>
        )}
      </div>
    </section>
  );
}
