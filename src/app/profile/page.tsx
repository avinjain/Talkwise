'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import AppHeader from '@/components/AppHeader';
import RadarChart from '@/components/RadarChart';
import AnalysisDisplay from '@/components/AnalysisDisplay';
import { ProfileResult, DIMENSIONS } from '@/lib/personality-test';
import { useSideNav } from '@/contexts/SideNavContext';
import MBTIDimensionVisual from '@/components/MBTIDimensionVisual';
import MBTITypeBadge from '@/components/MBTITypeBadge';

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { setVariant, setLastPersonalityTest, setLastMbtiTest } = useSideNav();

  useEffect(() => {
    setVariant('profile');
    return () => setVariant('default');
  }, [setVariant]);

  // Personality + MBTI
  const [scores, setScores] = useState<ProfileResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasResult, setHasResult] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [mbtiResult, setMbtiResult] = useState<{ type: string; createdAt: string } | null>(null);

  // Usage stats
  const [usage, setUsage] = useState<{
    today: { requests: number; tokens: number; cost: number };
    allTime: { requests: number; tokens: number; cost: number };
  } | null>(null);

  // New-job prep (resume + LinkedIn)
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

  // ── data fetch ─────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.hasResult) {
          setScores(data.scores);
          setHasResult(true);
          setUpdatedAt(data.updatedAt);
          setLastPersonalityTest({ date: data.updatedAt, hasResult: true });
        } else {
          setLastPersonalityTest({ hasResult: false });
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }, [setLastPersonalityTest]);

  const fetchMBTI = useCallback(async () => {
    try {
      const res = await fetch('/api/mbti', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.hasResult) {
          setMbtiResult({ type: data.type, createdAt: data.createdAt });
          setLastMbtiTest({ date: data.createdAt, hasResult: true });
        } else {
          setMbtiResult(null);
          setLastMbtiTest({ hasResult: false });
        }
      }
    } catch (err) {
      console.error('Failed to fetch MBTI:', err);
    }
  }, [setLastMbtiTest]);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/usage', { cache: 'no-store' });
      if (res.ok) setUsage(await res.json());
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchMBTI();
    fetchUsage();
  }, [fetchProfile, fetchMBTI, fetchUsage]);

  // ── new-job prep handlers ─────────────────────────────────
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
      setProfileAnalysis(e instanceof Error ? e.message : 'Could not analyze. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const extractResumeText = async (): Promise<string> => {
    let resumeText = resumePaste.trim();
    if (!resumeText && resumeFile) {
      try {
        const fd = new FormData();
        fd.set('file', resumeFile);
        const r = await fetch('/api/interview/extract-resume', { method: 'POST', body: fd });
        const d = await r.json();
        if (r.ok && d.text) resumeText = d.text;
      } catch {
        return '';
      }
    }
    return resumeText;
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
      setResumeOptimisation(e instanceof Error ? e.message : 'Could not optimise. Please try again.');
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Logo size={80} className="animate-pulse" />
      </div>
    );
  }

  // ── UI ────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60">
      <AppHeader backHref="/" backLabel="Home" />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          {/* Page header */}
          <header className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">My profile</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Your communication style, MBTI type, and new-job preparation — all in one place.
            </p>
            {/* Section anchors */}
            <nav className="mt-5 flex flex-wrap gap-2 text-xs">
              <a
                href="#personality"
                className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900"
              >
                Personality tests
              </a>
              <a
                href="#new-job"
                className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900"
              >
                Prepare for a new job
              </a>
              <a
                href="#usage"
                className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900"
              >
                Usage
              </a>
            </nav>
          </header>

          {/* Usage tile — small, calm */}
          {usage && (
            <section id="usage" className="mb-10 scroll-mt-24">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Your AI usage</h2>
                    <p className="text-xs text-slate-500">
                      What you&rsquo;ve spent on TalkWise so far. Updated after each request.
                    </p>
                  </div>
                  <button
                    onClick={fetchUsage}
                    className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  >
                    Refresh
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <UsageStat label="Requests today" value={usage.today.requests.toLocaleString()} />
                  <UsageStat label="Tokens today" value={usage.today.tokens.toLocaleString()} />
                  <UsageStat label="Cost today" value={`$${usage.today.cost.toFixed(4)}`} />
                  <UsageStat label="Requests all-time" value={usage.allTime.requests.toLocaleString()} subtle />
                  <UsageStat label="Tokens all-time" value={usage.allTime.tokens.toLocaleString()} subtle />
                  <UsageStat label="Cost all-time" value={`$${usage.allTime.cost.toFixed(4)}`} subtle />
                </div>
              </div>
            </section>
          )}

          {/* ── Section 1: Personality tests ───────────────── */}
          <section id="personality" className="mb-14 scroll-mt-24">
            <SectionHeader
              title="Personality tests"
              description="Two short tests. Together they tell you how you communicate and how you decide."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Communication personality */}
              <TestCard
                tone="brand"
                title="Communication style"
                meta="27 questions · 9 traits"
                badge={
                  hasResult && updatedAt
                    ? `Last taken ${new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : 'Not yet taken'
                }
              >
                {!hasResult || !scores ? (
                  <div className="flex flex-col items-start gap-3">
                    <p className="text-sm text-slate-500">
                      Find your strengths and blind spots across 9 communication dimensions.
                    </p>
                    <button
                      onClick={() => router.push('/profile/test')}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Take the test
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-4">
                      <RadarChart scores={scores} size={88} />
                      <div className="text-xs text-slate-500">
                        Your profile across {DIMENSIONS.length} dimensions.
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => router.push('/profile/test/results')}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        View report
                      </button>
                      <button
                        onClick={() => router.push('/profile/test')}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Retake
                      </button>
                    </div>
                  </div>
                )}
              </TestCard>

              {/* MBTI */}
              <TestCard
                tone="accent"
                title="MBTI type"
                meta="~24 questions · 4 dichotomies"
                badge={
                  mbtiResult?.createdAt
                    ? `Last taken ${new Date(mbtiResult.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : 'Not yet taken'
                }
              >
                {!mbtiResult ? (
                  <div className="flex flex-col items-start gap-3">
                    <p className="text-sm text-slate-500">
                      Forced-choice questions across 4 axes. AI explanation of how it shows up at work.
                    </p>
                    <button
                      onClick={() => router.push('/profile/mbti')}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Take the test
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-4">
                      <MBTITypeBadge type={mbtiResult.type} size="md" showBreakdown />
                      <div className="text-xs text-slate-500">Your MBTI type</div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => router.push('/profile/mbti/results')}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        View report
                      </button>
                      <button
                        onClick={() => router.push('/profile/mbti')}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Retake
                      </button>
                    </div>
                  </div>
                )}
              </TestCard>
            </div>

            {/* Quiet help — collapsed details */}
            <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer select-none text-xs font-medium text-slate-500 hover:text-slate-700">
                What do these tests measure?
              </summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Communication style
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {DIMENSIONS.map((d) => (
                      <div
                        key={d.key}
                        className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                        style={{ borderLeftWidth: 3, borderLeftColor: d.color }}
                      >
                        <p className="text-[11px] font-semibold text-slate-800">{d.label}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{d.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">MBTI</p>
                  <MBTIDimensionVisual />
                </div>
              </div>
            </details>
          </section>

          {/* ── Section 2: Prepare for a new job ───────────── */}
          <section id="new-job" className="scroll-mt-24">
            <SectionHeader
              title="Prepare for a new job"
              description="Share your resume and LinkedIn. We'll align them, sharpen the wording, and build your interview story bank."
            />

            {/* Inputs */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Resume" hint=".pdf, .docx, or .txt — or paste below.">
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
            </div>

            {/* Action cards */}
            <div className="mt-6 space-y-4">
              <ActionCard
                step={1}
                title="Profile alignment"
                description="Compare resume and LinkedIn. Find gaps, missing keywords, and quick wins."
                disabled={!hasJobInput}
                disabledReason="Add a resume or LinkedIn above to enable this."
                actionLabel={analyzing ? 'Analysing…' : 'Analyse profile'}
                onAction={handleAnalyzeProfile}
                pending={analyzing}
                output={profileAnalysis}
              />

              <ActionCard
                step={2}
                title="Resume optimisation"
                description="Strengths, gaps, story bank, and a one-line pitch. Optionally target a specific role."
                disabled={!hasResume}
                disabledReason="Add your resume above."
                actionLabel={optimisingResume ? 'Optimising…' : 'Optimise resume'}
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
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-100 bg-white px-6 py-4 text-center text-xs text-slate-400">
        TalkWise · Practice makes confident
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Local UI helpers
// ─────────────────────────────────────────────────────────────

function UsageStat({ label, value, subtle }: { label: string; value: string; subtle?: boolean }) {
  return (
    <div className={`rounded-xl border ${subtle ? 'border-slate-100 bg-slate-50/60' : 'border-slate-200 bg-white'} px-4 py-3`}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${subtle ? 'text-slate-700' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function TestCard({
  tone,
  title,
  meta,
  badge,
  children,
}: {
  tone: 'brand' | 'accent';
  title: string;
  meta: string;
  badge: string;
  children: React.ReactNode;
}) {
  const accent = tone === 'brand' ? 'bg-brand-500' : 'bg-accent-500';
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 rounded-full ${accent}`} />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{meta}</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
          {badge}
        </span>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

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
    <div className="rounded-2xl border border-slate-200 bg-white">
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
