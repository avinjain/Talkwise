'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AnalysisDisplay from '@/components/AnalysisDisplay';
import { KickoffStoryPromptsSection } from '@/components/interviewPrep/KickoffStoryPromptsSection';
import { parseKickoffSummary, type KickoffSummary } from '@/lib/kickoff';
import {
  BEHAVIORAL_ARCHETYPE_PROMPTS,
  buildKickoffStoryPrompts,
  GENERIC_STORY_PROMPTS,
} from '@/lib/kickoffStoryPrompts';

const FORMATS = [
  { id: 'behavioral', label: 'Behavioral', desc: 'STAR-format, past experience' },
  { id: 'technical', label: 'Technical', desc: 'Coding, system design' },
  { id: 'panel', label: 'Panel', desc: 'Multiple interviewers' },
  { id: 'mixed', label: 'Mixed', desc: 'Technical + behavioral' },
  { id: 'case', label: 'Case Study', desc: 'Problem-solving scenarios' },
];

export default function InterviewPrepPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [format, setFormat] = useState('behavioral');
  const [jd, setJd] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePaste, setResumePaste] = useState('');
  const [resumeContent, setResumeContent] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [linkedInPaste, setLinkedInPaste] = useState('');
  const [linkedInContent, setLinkedInContent] = useState('');
  const [profileAnalysis, setProfileAnalysis] = useState<string | null>(null);
  const [pitches, setPitches] = useState<Array<{ name: string; hook?: string; bullets?: string[] }>>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingPitches, setLoadingPitches] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [kickoffSummary, setKickoffSummary] = useState<KickoffSummary | null>(null);

  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/auth?callbackUrl=/interview/prep');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    fetch('/api/kickoff', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.hasResult || !data.summary) {
          setKickoffSummary(null);
          return;
        }
        setKickoffSummary(parseKickoffSummary(data.summary));
      })
      .catch(() => {
        if (!cancelled) setKickoffSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    fetch('/api/interview/speaking-points', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.pitches?.length) return;
        setPitches((prev) => (prev.length > 0 ? prev : data.pitches));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status]);

  const storyPrompts = useMemo(
    () =>
      kickoffSummary
        ? buildKickoffStoryPrompts(kickoffSummary)
        : [...BEHAVIORAL_ARCHETYPE_PROMPTS, ...GENERIC_STORY_PROMPTS],
    [kickoffSummary]
  );

  if (status === 'loading' || !session) return null;

  const handleGeneratePitches = async () => {
    let resumeText = (resumeContent || resumePaste).trim();
    if (!resumeText && resumeFile) {
      try {
        const fd = new FormData();
        fd.set('file', resumeFile);
        const r = await fetch('/api/interview/extract-resume', { method: 'POST', body: fd });
        const d = await r.json();
        if (r.ok && d.text) resumeText = d.text;
      } catch { return; }
    }
    if (!resumeText) return;
    setLoadingPitches(true);
    setPitches([]);
    try {
      const formData = new FormData();
      formData.set('role', role.trim());
      formData.set('jd', jd.trim());
      if (resumeFile) formData.set('resumeFile', resumeFile);
      else formData.set('resume', resumeText);

      const res = await fetch('/api/interview/core-positioning', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && Array.isArray(data.pitches)) {
        setPitches(data.pitches);
        void fetch('/api/interview/speaking-points', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pitches: data.pitches }),
        });
      }
    } catch { /* ignore */ } finally {
      setLoadingPitches(false);
    }
  };

  const handleAnalyzeProfile = async () => {
    const hasResume = resumeFile || resumePaste.trim();
    const hasLinkedIn = linkedInUrl.trim() || linkedInPaste.trim();
    if (!hasResume && !hasLinkedIn) return;
    setAnalyzing(true);
    setProfileAnalysis(null);
    setResumeContent('');
    setLinkedInContent('');
    try {
      const formData = new FormData();
      formData.set('role', role.trim());
      formData.set('jd', jd.trim());
      if (resumeFile) formData.set('resumeFile', resumeFile);
      else if (resumePaste.trim()) formData.set('resume', resumePaste.trim());
      if (linkedInUrl.trim()) formData.set('linkedInUrl', linkedInUrl.trim());
      else if (linkedInPaste.trim()) formData.set('linkedIn', linkedInPaste.trim());

      const res = await fetch('/api/interview/analyze-profile', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setProfileAnalysis(data.analysis || 'Analysis complete.');
      if (data.resumeContent) setResumeContent(data.resumeContent);
      if (data.profileContent) setLinkedInContent(data.profileContent);
    } catch (e) {
      setProfileAnalysis(e instanceof Error ? e.message : 'Could not analyze. You can still continue.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleContinue = async () => {
    if (!company.trim() || !role.trim()) return;
    setContinuing(true);
    try {
      let resumeText = (resumeContent || resumePaste).trim();
      if (!resumeText && resumeFile) {
        try {
          const fd = new FormData();
          fd.set('file', resumeFile);
          const res = await fetch('/api/interview/extract-resume', { method: 'POST', body: fd });
          const data = await res.json();
          if (res.ok && data.text) resumeText = data.text;
        } catch { /* ignore */ }
      }
      const prep: import('@/lib/types').InterviewPrepContext = {
        company: company.trim(),
        role: role.trim(),
        format,
        jd: jd.trim() || undefined,
        resume: resumeText || undefined,
        linkedIn: (linkedInContent || linkedInPaste).trim() || undefined,
      };
      sessionStorage.setItem('interviewPrepContext', JSON.stringify(prep));
      sessionStorage.setItem('userName', session.user?.name || 'there');
      sessionStorage.setItem(
        'startPersonaData',
        JSON.stringify({
          track: 'interview',
          name: `Interviewer at ${company.trim()}`,
          difficultyLevel: 7,
          decisionOrientation: 6,
          communicationStyle: 7,
          authorityPosture: 6,
          temperamentStability: 6,
          socialPresence: 5,
        })
      );
      router.push('/start');
    } finally {
      setContinuing(false);
    }
  };

  const hasResume = resumeFile || resumePaste.trim();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">Interview prep</h1>
          <p className="text-sm text-slate-500 mb-6">
            Share context so the mock interview feels real. We use this (not personality sliders) to shape the interviewer.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr,minmax(300px,420px)] gap-8">
            {/* Left: Form + stories + speaking points */}
            <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Google, Notion"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target role / level</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Senior PM, Staff Engineer"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job description (optional)</label>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the JD here for more tailored questions..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Interview format</label>
              <div className="grid grid-cols-2 gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`p-3 rounded-lg border-2 text-left ${
                      format === f.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm font-medium block">{f.label}</span>
                    <span className="text-[10px] text-slate-500">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Resume (optional)</label>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setResumeFile(f || null);
                  setProfileAnalysis(null);
                  setPitches([]);
                  e.target.value = '';
                }}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />
              {resumeFile && <p className="mt-1 text-xs text-slate-500">{resumeFile.name}</p>}
              <details className="mt-2">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">Or paste your resume</summary>
                <textarea
                  value={resumePaste}
                  onChange={(e) => { setResumePaste(e.target.value); setProfileAnalysis(null); setPitches([]); }}
                  placeholder="Paste resume text..."
                  rows={4}
                  className="mt-2 w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-sm"
                />
              </details>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn profile (optional)</label>
              <p className="text-xs text-slate-500 mb-1.5">Enter URL to fetch, or paste your About section below.</p>
              <input
                type="url"
                value={linkedInUrl}
                onChange={(e) => { setLinkedInUrl(e.target.value); setProfileAnalysis(null); }}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-sm"
              />
              <details className="mt-2">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">Or paste your About section</summary>
                <textarea
                  value={linkedInPaste}
                  onChange={(e) => { setLinkedInPaste(e.target.value); setProfileAnalysis(null); }}
                  placeholder="Paste LinkedIn About, headline, or key sections..."
                  rows={3}
                  className="mt-2 w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-sm"
                />
              </details>
            </div>

            <KickoffStoryPromptsSection
              prompts={storyPrompts}
              intro={
                kickoffSummary
                  ? 'Prompts reflect your Prepare kickoff (resume seeds, gaps, concerns, plus failure / stakeholder / trade-off angles). Rough drafts save to your account; use the STAR guide (info icon) for structure.'
                  : 'Behavioural prompts including failure, stakeholder, and trade-off stories until you complete kickoff on Prepare. Use the STAR guide (info icon) for structure — drafts still save here.'
              }
            />

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold text-slate-900">Speaking points</h2>
              <p className="mt-1 text-sm text-slate-500">
                Uses your resume + role/JD below. Generates concise hooks and bullets — AI-refined output replaces older saved pitches when you run it again.
              </p>
              {!hasResume ? (
                <p className="mt-4 text-sm text-slate-400">Add your resume above to generate speaking points.</p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleGeneratePitches}
                    disabled={loadingPitches}
                    className="mt-4 w-full rounded-xl bg-gradient-brand px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50 sm:w-auto"
                  >
                    {loadingPitches ? 'Generating…' : 'Generate speaking points'}
                  </button>
                  {pitches.length > 0 && (
                    <ul className="mt-5 space-y-3 max-h-[50vh] overflow-y-auto">
                      {pitches.map((p, i) => (
                        <li key={i} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                          <h4 className="text-sm font-semibold text-slate-800">{p.name}</h4>
                          {p.hook && (
                            <p className="mt-1 text-sm italic text-slate-600">&ldquo;{p.hook}&rdquo;</p>
                          )}
                          {p.bullets && p.bullets.length > 0 && (
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                              {p.bullets.map((b, j) => (
                                <li key={j} className="leading-relaxed">
                                  {b}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </section>

            <button
              onClick={handleContinue}
              disabled={!company.trim() || !role.trim() || continuing}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {continuing ? 'Preparing...' : 'Continue to practice'}
            </button>
            </div>

            {/* Right: Analyze profile */}
            <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Analyze profile & improvement tips</h3>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Add resume and/or LinkedIn above, then analyze.
                </p>

                {resumeFile || resumePaste.trim() || linkedInUrl.trim() || linkedInPaste.trim() ? (
                  <>
                    <button
                      type="button"
                      onClick={handleAnalyzeProfile}
                      disabled={analyzing}
                      className="w-full mb-3 px-3 py-2 rounded-lg text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 disabled:opacity-50"
                    >
                      {analyzing ? 'Analyzing...' : 'Analyze profile & get improvement tips'}
                    </button>

                    {profileAnalysis ? (
                      <div className="max-h-[35vh] overflow-y-auto p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <AnalysisDisplay content={profileAnalysis} compact />
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Click the button above to see personalized tips.</p>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Add your resume and/or LinkedIn above.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
