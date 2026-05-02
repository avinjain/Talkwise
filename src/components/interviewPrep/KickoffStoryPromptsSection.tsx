'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { StoryDraftPersisted } from '@/lib/db';

function mergeDraftText(prompts: string[], saved: StoryDraftPersisted[]): string[] {
  return prompts.map((p) => {
    const hit = saved.find((s) => s.prompt === p);
    return hit?.draft ?? '';
  });
}

function formatStarForTextarea(out: {
  situation: string;
  task: string;
  action: string;
  result: string;
  spokenDraft: string;
}): string {
  const blocks = [
    out.situation.trim() ? `Situation:\n${out.situation.trim()}` : '',
    out.task.trim() ? `Task:\n${out.task.trim()}` : '',
    out.action.trim() ? `Action:\n${out.action.trim()}` : '',
    out.result.trim() ? `Result:\n${out.result.trim()}` : '',
  ].filter(Boolean);
  const body = blocks.join('\n\n');
  const spoken = out.spokenDraft.trim();
  if (spoken) {
    return body ? `${body}\n\nSpoken version:\n${spoken}` : `Spoken version:\n${spoken}`;
  }
  return body;
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

function SparklesIcon(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={props.className}
      aria-hidden
    >
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

type StarPayload = {
  situation: string;
  task: string;
  action: string;
  result: string;
  spokenDraft: string;
};

export function KickoffStoryPromptsSection({
  prompts,
  intro = 'Write rough notes — bullets are fine. Use the STAR guide (info icon next to the title). Save each story when you’re ready — drafts sync across Prepare and Interview prep.',
}: {
  prompts: string[];
  intro?: string;
}) {
  const [texts, setTexts] = useState<string[]>(() => prompts.map(() => ''));
  const [loaded, setLoaded] = useState(false);
  const [savingRow, setSavingRow] = useState<number | null>(null);
  const [savedFlashRow, setSavedFlashRow] = useState<number | null>(null);

  const [guideOpen, setGuideOpen] = useState(false);
  const guideRef = useRef<HTMLDivElement>(null);
  const guideBtnRef = useRef<HTMLButtonElement>(null);

  const [starModalOpen, setStarModalOpen] = useState(false);
  const [starRowIndex, setStarRowIndex] = useState<number | null>(null);
  const [starLoading, setStarLoading] = useState(false);
  const [starError, setStarError] = useState<string | null>(null);
  const [starPreview, setStarPreview] = useState<StarPayload | null>(null);

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
    if (!starModalOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setStarModalOpen(false);
        setStarPreview(null);
        setStarError(null);
        setStarRowIndex(null);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [starModalOpen]);

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

  const persistDrafts = useCallback(async (drafts: string[], flashRow: number) => {
    const storyDrafts: StoryDraftPersisted[] = prompts.map((prompt, i) => ({
      prompt,
      draft: drafts[i] ?? '',
    }));
    setSavingRow(flashRow);
    try {
      await fetch('/api/interview/speaking-points', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyDrafts }),
      });
      setSavedFlashRow(flashRow);
      window.setTimeout(() => {
        setSavedFlashRow((cur) => (cur === flashRow ? null : cur));
      }, 2000);
    } catch {
      /* ignore */
    } finally {
      setSavingRow(null);
    }
  }, [prompts]);

  const persistRow = useCallback(
    async (rowIndex: number) => {
      await persistDrafts(texts, rowIndex);
    },
    [persistDrafts, texts]
  );

  const closeStarModal = useCallback(() => {
    setStarModalOpen(false);
    setStarPreview(null);
    setStarError(null);
    setStarLoading(false);
    setStarRowIndex(null);
  }, []);

  const openStarForRow = useCallback(
    async (rowIndex: number) => {
      const bullets = (texts[rowIndex] ?? '').trim();
      if (!bullets) {
        setStarError('Add some notes in the box first, then try again.');
        window.setTimeout(() => setStarError(null), 3500);
        return;
      }
      setStarRowIndex(rowIndex);
      setStarModalOpen(true);
      setStarPreview(null);
      setStarError(null);
      setStarLoading(true);
      try {
        const res = await fetch('/api/interview/story-star', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bullets }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStarError(typeof data.error === 'string' ? data.error : 'Could not generate STAR.');
          setStarLoading(false);
          return;
        }
        setStarPreview({
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
    },
    [texts]
  );

  const acceptStarPreview = useCallback(() => {
    if (starRowIndex === null || !starPreview) return;
    const replacement = formatStarForTextarea(starPreview);
    const idx = starRowIndex;
    const merged = texts.map((t, i) => (i === idx ? replacement : t));
    setTexts(merged);
    closeStarModal();
    void persistDrafts(merged, idx);
  }, [starRowIndex, starPreview, texts, closeStarModal, persistDrafts]);

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
        {starError && !starModalOpen ? (
          <p className="mt-2 text-xs font-medium text-rose-600" role="status">
            {starError}
          </p>
        ) : null}
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
              placeholder="Rough bullets or paragraphs — then Write with AI or Save."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => void openStarForRow(i)}
                disabled={starLoading || savingRow !== null}
                className="inline-flex items-center gap-1 rounded-lg border border-brand-400/70 bg-white px-2.5 py-1 text-xs font-medium text-brand-800 shadow-sm hover:border-brand-500 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 disabled:pointer-events-none disabled:opacity-45"
              >
                <SparklesIcon className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                Write with AI
              </button>
              <button
                type="button"
                onClick={() => void persistRow(i)}
                disabled={savingRow !== null}
                className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
              >
                {savingRow === i ? 'Saving…' : 'Save'}
              </button>
              {savedFlashRow === i ? (
                <span className="text-xs font-medium text-emerald-700">Saved</span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {starModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeStarModal();
          }}
        >
          <div className="absolute inset-0 bg-slate-900/50" aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="star-modal-title"
            className="relative z-10 flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 id="star-modal-title" className="text-base font-semibold text-slate-900">
                STAR rewrite
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Replace notes updates this story’s box and saves it to your account (you can edit after).
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {starLoading ? (
                <p className="text-sm text-slate-600">Generating…</p>
              ) : starError ? (
                <p className="text-sm font-medium text-rose-600">{starError}</p>
              ) : starPreview ? (
                <div className="space-y-4 text-sm text-slate-800">
                  {(['situation', 'task', 'action', 'result'] as const).map((key) => (
                    <div key={key}>
                      <p className="text-xs font-semibold capitalize text-slate-500">{key}</p>
                      <p className="mt-1 whitespace-pre-wrap">{starPreview[key]}</p>
                    </div>
                  ))}
                  {starPreview.spokenDraft ? (
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Spoken version</p>
                      <p className="mt-1 whitespace-pre-wrap">{starPreview.spokenDraft}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={closeStarModal}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!starPreview || starLoading}
                onClick={acceptStarPreview}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
              >
                Replace notes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
