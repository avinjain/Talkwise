'use client';

import { useState, ReactNode } from 'react';
import AnalysisDisplay from '@/components/AnalysisDisplay';

interface ProfileDetailsPanelProps {
  /** Content for the side pane (e.g. personality test), shown above Resume & LinkedIn */
  sidePaneContent?: ReactNode;
}

/** Profile page: Enter resume + LinkedIn, get Analysis & Core positioning (interview-coach framework) */
export default function ProfileDetailsPanel({ sidePaneContent }: ProfileDetailsPanelProps) {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePaste, setResumePaste] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [linkedInPaste, setLinkedInPaste] = useState('');
  const [profileAnalysis, setProfileAnalysis] = useState<string | null>(null);
  const [pitches, setPitches] = useState<Array<{ name: string; hook?: string; bullets?: string[] }>>([]);
  const [resumeOptimisation, setResumeOptimisation] = useState<string | null>(null);
  const [resumeOptRole, setResumeOptRole] = useState('');
  const [resumeOptJd, setResumeOptJd] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingPitches, setLoadingPitches] = useState(false);
  const [optimisingResume, setOptimisingResume] = useState(false);

  const hasResume = resumeFile || resumePaste.trim();
  const hasLinkedIn = linkedInUrl.trim() || linkedInPaste.trim();
  const hasInput = hasResume || hasLinkedIn;

  const handleAnalyzeProfile = async () => {
    if (!hasInput) return;
    setAnalyzing(true);
    setProfileAnalysis(null);
    try {
      const formData = new FormData();
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
    } catch (e) {
      setProfileAnalysis(e instanceof Error ? e.message : 'Could not analyze. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOptimizeResume = async () => {
    let resumeText = resumePaste.trim();
    if (!resumeText && resumeFile) {
      try {
        const fd = new FormData();
        fd.set('file', resumeFile);
        const r = await fetch('/api/interview/extract-resume', { method: 'POST', body: fd });
        const d = await r.json();
        if (r.ok && d.text) resumeText = d.text;
      } catch {
        return;
      }
    }
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
    let resumeText = resumePaste.trim();
    if (!resumeText && resumeFile) {
      try {
        const fd = new FormData();
        fd.set('file', resumeFile);
        const r = await fetch('/api/interview/extract-resume', { method: 'POST', body: fd });
        const d = await r.json();
        if (r.ok && d.text) resumeText = d.text;
      } catch {
        return;
      }
    }
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

  const clearInputs = () => {
    setResumeFile(null);
    setResumePaste('');
    setLinkedInUrl('');
    setLinkedInPaste('');
    setProfileAnalysis(null);
    setPitches([]);
    setResumeOptimisation(null);
  };

  const resumeLinkedInSection = (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-slate-900">Resume & LinkedIn</h2>
      </div>
      <p className="text-sm text-slate-500 mb-5">
        Add your resume and/or LinkedIn to get AI-powered analysis and speaking points.
      </p>

      <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Resume</label>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setResumeFile(f || null);
                setProfileAnalysis(null);
                setPitches([]);
                setResumeOptimisation(null);
                e.target.value = '';
              }}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 file:cursor-pointer"
            />
            {resumeFile && <p className="mt-1.5 text-xs text-slate-500">{resumeFile.name}</p>}
            <details className="mt-2">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 select-none">
                Or paste resume text
              </summary>
              <textarea
                value={resumePaste}
                onChange={(e) => {
                  setResumePaste(e.target.value);
                  setProfileAnalysis(null);
                  setPitches([]);
                  setResumeOptimisation(null);
                }}
                placeholder="Paste resume text..."
                rows={4}
                className="mt-2 w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-sm"
              />
            </details>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn profile</label>
            <input
              type="url"
              value={linkedInUrl}
              onChange={(e) => {
                setLinkedInUrl(e.target.value);
                setProfileAnalysis(null);
              }}
              placeholder="https://linkedin.com/in/yourprofile"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-sm"
            />
            <details className="mt-2">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 select-none">
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
                className="mt-2 w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-sm"
              />
            </details>
          </div>

          {hasInput && (
            <button
              type="button"
              onClick={clearInputs}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Clear all
            </button>
          )}
        </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Side pane: Personality + Resume & LinkedIn */}
      <aside className="lg:w-[340px] lg:shrink-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
        {sidePaneContent}
        {resumeLinkedInSection}
      </aside>

      {/* Main: Analysis sections */}
      <main className="flex-1 min-w-0">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Section 1: Resume optimisation */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-800">Resume optimisation</h3>
          </div>
          <div className="p-4">
            {hasResume ? (
              <div className="space-y-3">
                <details className="group">
                  <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 select-none">
                    Target a specific role (optional)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={resumeOptRole}
                      onChange={(e) => setResumeOptRole(e.target.value)}
                      placeholder="e.g. Product Manager"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-xs"
                    />
                    <textarea
                      value={resumeOptJd}
                      onChange={(e) => setResumeOptJd(e.target.value)}
                      placeholder="Paste job description for targeted feedback..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-xs"
                    />
                  </div>
                </details>
                <button
                  type="button"
                  onClick={handleOptimizeResume}
                  disabled={optimisingResume}
                  className="w-full py-2 rounded-lg text-xs font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-50 transition-all"
                >
                  {optimisingResume ? 'Optimising...' : 'Optimise resume'}
                </button>
                {resumeOptimisation ? (
                  <div className="max-h-[40vh] overflow-y-auto p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <AnalysisDisplay content={resumeOptimisation} compact />
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-3">
                    Get strengths, gaps, story bank & one-line pitch from the interview coach.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                Add your resume in the side pane to optimise it.
              </p>
            )}
          </div>
        </div>

        {/* Section 2: Analyze profile & improvement tips */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-800">Analyze profile & improvement tips</h3>
          </div>
          <div className="p-4">
            {hasInput ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleAnalyzeProfile}
                  disabled={analyzing}
                  className="w-full py-2 rounded-lg text-xs font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-50 transition-all"
                >
                  {analyzing ? 'Analyzing...' : 'Analyze profile & get tips'}
                </button>
                {profileAnalysis ? (
                  <div className="max-h-[40vh] overflow-y-auto p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <AnalysisDisplay content={profileAnalysis} compact />
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-3">
                    Click the button above to see personalized improvement tips.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                Add your resume and/or LinkedIn in the side pane to get started.
              </p>
            )}
          </div>
        </div>

        {/* Section 3: Core positioning */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-800">Core positioning</h3>
          </div>
          <div className="p-4">
            {hasResume ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGeneratePitches}
                  disabled={loadingPitches}
                  className="w-full py-2 rounded-lg text-xs font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-50 transition-all"
                >
                  {loadingPitches ? 'Generating...' : 'Generate speaking points'}
                </button>
                {pitches.length > 0 ? (
                  <div className="space-y-2 max-h-[35vh] overflow-y-auto">
                    {pitches.map((p, i) => (
                      <div key={i} className="rounded-lg p-2.5 bg-slate-50 border border-slate-100">
                        <h4 className="text-xs font-semibold text-slate-800 mb-1">{p.name}</h4>
                        {p.hook && (
                          <p className="text-xs text-slate-600 mb-1 italic">&ldquo;{p.hook}&rdquo;</p>
                        )}
                        {p.bullets && p.bullets.length > 0 && (
                          <ul className="text-xs text-slate-600 space-y-0.5 list-disc list-inside">
                            {p.bullets.map((b, j) => (
                              <li key={j}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-3">
                    Click the button above to generate speaking points from your resume.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                Add your resume in the side pane to generate speaking points.
              </p>
            )}
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
