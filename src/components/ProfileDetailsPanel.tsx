'use client';

import { useState } from 'react';
import AnalysisDisplay from '@/components/AnalysisDisplay';

/** Profile page: Enter resume + LinkedIn, get Analysis & Core positioning (interview-coach framework) */
export default function ProfileDetailsPanel() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePaste, setResumePaste] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [linkedInPaste, setLinkedInPaste] = useState('');
  const [profileAnalysis, setProfileAnalysis] = useState<string | null>(null);
  const [pitches, setPitches] = useState<Array<{ name: string; hook?: string; bullets?: string[] }>>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingPitches, setLoadingPitches] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'core-positioning'>('analysis');

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
      setActiveTab('analysis');
    } catch (e) {
      setProfileAnalysis(e instanceof Error ? e.message : 'Could not analyze. Please try again.');
    } finally {
      setAnalyzing(false);
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
      setActiveTab('core-positioning');
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
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
      {/* Left: Input form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
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

      {/* Right: Results panel */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 py-2.5 px-3 text-xs font-medium transition-colors ${
                activeTab === 'analysis'
                  ? 'bg-white text-brand-700 border-b-2 border-brand-500 -mb-px'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                Analysis
                {profileAnalysis && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" aria-hidden />
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('core-positioning')}
              className={`flex-1 py-2.5 px-3 text-xs font-medium transition-colors ${
                activeTab === 'core-positioning'
                  ? 'bg-white text-brand-700 border-b-2 border-brand-500 -mb-px'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                Core positioning
                {pitches.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" aria-hidden />
                )}
              </span>
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'analysis' && (
              <div className="space-y-3">
                {hasInput ? (
                  <>
                    <button
                      type="button"
                      onClick={handleAnalyzeProfile}
                      disabled={analyzing}
                      className="w-full py-2 rounded-lg text-xs font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-50 transition-all"
                    >
                      {analyzing ? 'Analyzing...' : 'Analyze profile & get tips'}
                    </button>
                    {profileAnalysis ? (
                      <div className="max-h-[35vh] overflow-y-auto p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <AnalysisDisplay content={profileAnalysis} compact />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-3">
                        Click the button above to see personalized improvement tips.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Add your resume and/or LinkedIn on the left to get started.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'core-positioning' && (
              <div className="space-y-3">
                {hasResume ? (
                  <>
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
                  </>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Add your resume on the left to generate speaking points.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
