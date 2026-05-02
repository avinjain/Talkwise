'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StoryDraftPersisted } from '@/lib/db';

function mergeDraftText(prompts: string[], saved: StoryDraftPersisted[]): string[] {
  return prompts.map((p) => {
    const hit = saved.find((s) => s.prompt === p);
    return hit?.draft ?? '';
  });
}

export function KickoffStoryPromptsSection({
  prompts,
  intro = 'Write rough notes — bullets are fine. Speaking-point generation can tighten these later.',
}: {
  prompts: string[];
  intro?: string;
}) {
  const [texts, setTexts] = useState<string[]>(() => prompts.map(() => ''));
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const stablePromptKey = useMemo(() => prompts.join('\x1e'), [prompts]);

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
        <h2 className="text-base font-semibold text-slate-900">Stories to prepare</h2>
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
