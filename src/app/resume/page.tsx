'use client';

import { useState, useEffect, useRef } from 'react';
import AnalysisDisplay from '@/components/AnalysisDisplay';

export default function BuildResumePage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePaste, setResumePaste] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [linkedInPaste, setLinkedInPaste] = useState('');

  const [profileAnalysis, setProfileAnalysis] = useState<string | null>(null);
  const [resumeOptimisation, setResumeOptimisation] = useState<string | null>(null);
  const [resumeOptRole, setResumeOptRole] = useState('');
  const [resumeOptJd, setResumeOptJd] = useState('');
  const [pitches, setPitches] = useState<Array<{ name: string; hook?: string; bullets?: string[] }>>([]);

  const [analyzing, setAnalyzing] = useState(false);
  const [optimisingResume, setOptimisingResume] = useState(false);
  const [loadingPitches, setLoadingPitches] = useState(false);

  const hasResume = !!(resumeFile || resumePaste.trim());
  const hasLinkedIn = !!(linkedInUrl.trim() || linkedInPaste.trim());
  const hasJobInput = hasResume || hasLinkedIn;

  // Scroll to anchor on load (e.g. /resume#speaking-points)
  const scrolled = useRef(false);
  useEffect(() => {
    if (scrolled.current) return;
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (!hash) return;
    const id = hash.slice(1);
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        scrolled.current = true;
      }
    };
    const t = setTimeout(tryScroll, 60);
    return () => clearTimeout(t);
  }, []);

  const extractResumeText = async (): Promise<string> => {
    let text = resumePaste.trim();
    if (!text && resumeFile) {
      try {
        const fd = new FormData();
        fd.set('file', resumeFile);
        const r = await fetch('/api/interview/extract-resume', { method: 'POST', body: fd });
        const d = await r.json();
        if (r.ok && d.text) text = d.text;
      } catch {
        return '';
      }
    }
    return text;
  };

  const handleAnalyzeProfile = async () => {
    if (!hasJobInput) return;
    setAnalyzing(true);
    setProfileAnalysis(null);
    try {
      const formData = new FormData();
      if (resumeFile) formData.set('resumeFile', resumeFile);
      else if (resumePaste.trim()) formData.set('resume', resumePaste.trim());
      if (linkedInUrl.trim()) formData.set('linkedInUrl', linkedInUrl.trim());
      else if (linkedInPaste.trim()) formData.set('linkedIn', linkedInPaste.trim());
      const res = await fetch('/api/interview/analyze-profile', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setProfileAnalysis(data.analysis || 'Analysis complete.');
    } catch (e) {
      setProfileAnalysis(e instanceof Error ? e.message : 'Could not analyse. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOptimizeResume = async () => {
    const resumeText = await extractResumeText();
    if (!resumeText) return;
    setOptimisingResume(true);
    setResumeOptimisation(null);
    try {
      const res = await fetch('/api/interview/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: resumeText,
          ...(resumeOptRole.trim() && { role: resumeOptRole.trim() }),
          ...(resumeOptJd.trim() && { jd: resumeOptJd.trim() }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Optimisation failed');
      setResumeOptimisation(data.analysis || 'Analysis complete.');
    } catch (e) {
      setResumeOptimisation(e instanceof Error ? e.message : 'Could not sharpen. Please try again.');
    } finally {
      setOptimisingResume(false);
    }
  };

  const handleGeneratePitches = async () => {
    const resumeText = await extractResumeText();
    if (!resumeText) return;
    setLoadingPitches(true);
    setPitches([]);
    try {
      const formData = new FormData();
      if (resumeFile) formData.set('resumeFile', resumeFile);
      else formData.set('resume', resumeText);
      const res = await fetch('/api/interview/core-positioning', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && Array.isArray(data.pitches)) setPitches(data.pitches);
    } catch {
      /* ignore */
    } finally {
      setLoadingPitches(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60">
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <header className="mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Build my resume</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Drop your resume and LinkedIn once. Sharpen them, align them, and pull out the
              stories you&rsquo;ll actually tell in interviews.
            </p>
          </header>

          {/* Inputs */}
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">Your context</h2>
            <p className="mt-1 text-sm text-slate-500">
              Every tool below uses what you add here.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <FormField label="Resume" hint=".pdf, .docx, .txt — or paste below.">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setResumeFile(f || null);
                    setProfileAnalysis(null);
                    setResumeOptimisation(null);
                    setPitches([]);
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
                    onChange={(e) => {
                      setResumePaste(e.target.value);
                      setProfileAnalysis(null);
                      setResumeOptimisation(null);
                      setPitches([]);
                    }}
                    placeholder="Paste resume text..."
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </details>
              </FormField>

              <FormField label="LinkedIn profile" hint="Public URL — or paste your About section.">
                <input
                  type="url"
                  value={linkedInUrl}
                  onChange={(e) => {
                    setLinkedInUrl(e.target.value);
                    setProfileAnalysis(null);
                  }}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <details className="mt-2">
                  <summary className="cursor-pointer select-none text-xs text-slate-400 hover:text-slate-600">
                    Or paste your About section
                  </summary>
                  <textarea
                    value={linkedInPaste}
                    onChange={(e) => {
                      setLinkedInPaste(e.target.value);
                      setProfileAnalysis(null);
                    }}
                    placeholder="Paste LinkedIn About, headline, or key sections..."
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </details>
              </FormField>
            </div>

            {hasJobInput && (
              <button
                type="button"
                onClick={() => {
                  setResumeFile(null);
                  setResumePaste('');
                  setLinkedInUrl('');
                  setLinkedInPaste('');
                  setProfileAnalysis(null);
                  setResumeOptimisation(null);
                  setPitches([]);
                }}
                className="mt-4 text-xs text-slate-400 hover:text-slate-700"
              >
                Clear all
              </button>
            )}
          </section>

          <div className="space-y-6">
            <ActionCard
              id="profile-alignment"
              step={1}
              title="Profile alignment"
              description="Resume vs LinkedIn — gaps, missing keywords, and quick wins."
              disabled={!hasJobInput}
              disabledReason="Add a resume or LinkedIn above."
              actionLabel={analyzing ? 'Analysing…' : 'Align my profile'}
              onAction={handleAnalyzeProfile}
              pending={analyzing}
              output={profileAnalysis}
            />

            <ActionCard
              id="resume-optimisation"
              step={2}
              title="Sharpen my resume"
              description="Strengths, gaps, story bank, and a one-line pitch. Optionally target a role."
              disabled={!hasResume}
              disabledReason="Add your resume above."
              actionLabel={optimisingResume ? 'Sharpening…' : 'Sharpen resume'}
              onAction={handleOptimizeResume}
              pending={optimisingResume}
              output={resumeOptimisation}
              extra={
                <details className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <summary className="cursor-pointer select-none text-xs font-medium text-slate-600 hover:text-slate-900">
                    Target a specific role (optional)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      value={resumeOptRole}
                      onChange={(e) => setResumeOptRole(e.target.value)}
                      placeholder="e.g. Product Manager"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                    <textarea
                      value={resumeOptJd}
                      onChange={(e) => setResumeOptJd(e.target.value)}
                      placeholder="Paste job description for targeted feedback..."
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </details>
              }
            />

            <ActionCard
              id="speaking-points"
              step={3}
              title="Speaking points"
              description="Punchy interview hooks plus 2-3 supporting bullets per pitch — drawn from your resume."
              disabled={!hasResume}
              disabledReason="Add your resume above."
              actionLabel={loadingPitches ? 'Generating…' : 'Generate speaking points'}
              onAction={handleGeneratePitches}
              pending={loadingPitches}
              customOutput={
                pitches.length > 0 ? (
                  <ul className="space-y-3">
                    {pitches.map((p, i) => (
                      <li key={i} className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                        <h4 className="text-sm font-semibold text-slate-800">{p.name}</h4>
                        {p.hook && (
                          <p className="mt-1 text-sm italic text-slate-600">&ldquo;{p.hook}&rdquo;</p>
                        )}
                        {p.bullets && p.bullets.length > 0 && (
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                            {p.bullets.map((b, j) => (
                              <li key={j} className="leading-relaxed">{b}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null
              }
            />
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

function ActionCard({
  id,
  step,
  title,
  description,
  disabled,
  disabledReason,
  actionLabel,
  onAction,
  pending,
  output,
  customOutput,
  extra,
}: {
  id: string;
  step: number;
  title: string;
  description: string;
  disabled?: boolean;
  disabledReason?: string;
  actionLabel: string;
  onAction: () => void;
  pending?: boolean;
  output?: string | null;
  customOutput?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-start gap-3 px-5 py-4">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
          {step}
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="space-y-3 border-t border-slate-100 bg-slate-50/40 px-5 py-4">
        {extra}
        {disabled ? (
          <p className="text-xs text-slate-400">{disabledReason}</p>
        ) : (
          <button
            type="button"
            onClick={onAction}
            disabled={pending}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {actionLabel}
          </button>
        )}
        {output && (
          <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-4">
            <AnalysisDisplay content={output} />
          </div>
        )}
        {customOutput}
      </div>
    </div>
  );
}
