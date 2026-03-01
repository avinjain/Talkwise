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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,480px] gap-8">
      {/* Left: Enter details */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Enter details</h2>
          <p className="text-sm text-slate-500 mb-4">
            Add your resume and/or LinkedIn to get AI-powered analysis and speaking points (interview-coach framework).
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Resume</label>
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
              onChange={(e) => {
                setResumePaste(e.target.value);
                setProfileAnalysis(null);
                setPitches([]);
              }}
              placeholder="Paste resume text..."
              rows={4}
              className="mt-2 w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-sm"
            />
          </details>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn profile</label>
          <p className="text-xs text-slate-500 mb-1.5">Enter URL to fetch, or paste your About section.</p>
          <input
            type="url"
            value={linkedInUrl}
            onChange={(e) => {
              setLinkedInUrl(e.target.value);
              setProfileAnalysis(null);
            }}
            placeholder="https://linkedin.com/in/yourprofile"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-sm"
          />
          <details className="mt-2">
            <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">Or paste your About section</summary>
            <textarea
              value={linkedInPaste}
              onChange={(e) => {
                setLinkedInPaste(e.target.value);
                setProfileAnalysis(null);
              }}
              placeholder="Paste LinkedIn About, headline, or key sections..."
              rows={3}
              className="mt-2 w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-sm"
            />
          </details>
        </div>

        {hasInput && (
          <button
            type="button"
            onClick={clearInputs}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Right: Analysis & Core positioning tabs */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex border-b border-slate-200 mb-4 -mx-5 px-5">
            <button
              type="button"
              onClick={() => setActiveTab('analysis')}
              className={`py-2.5 px-3 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${
                activeTab === 'analysis'
                  ? 'border-brand-500 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Analyze profile & get improvement tips
              {profileAnalysis && (
                <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-brand-500 align-middle" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('core-positioning')}
              className={`py-2.5 px-3 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${
                activeTab === 'core-positioning'
                  ? 'border-brand-500 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Core positioning
              {pitches.length > 0 && (
                <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-brand-500 align-middle" aria-hidden />
              )}
            </button>
          </div>

          {activeTab === 'analysis' && (
            <>
              <p className="text-xs text-slate-500 mb-3">
                Get tailored feedback on resume and LinkedIn alignment (interview-coach framework).
              </p>
              {hasInput ? (
                <>
                  <button
                    type="button"
                    onClick={handleAnalyzeProfile}
                    disabled={analyzing}
                    className="w-full mb-3 px-4 py-2 rounded-lg text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 disabled:opacity-50"
                  >
                    {analyzing ? 'Analyzing...' : 'Analyze profile & get improvement tips'}
                  </button>
                  {profileAnalysis ? (
                    <div className="max-h-[45vh] overflow-y-auto p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <AnalysisDisplay content={profileAnalysis} className="text-sm" />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Click the button above to see personalized tips.</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400 italic">Add your resume and/or LinkedIn on the left.</p>
              )}
            </>
          )}

          {activeTab === 'core-positioning' && (
            <>
              <p className="text-xs text-slate-500 mb-3">
                Speaking points for interviews. Requires resume.
              </p>
              {hasResume ? (
                <>
                  <button
                    type="button"
                    onClick={handleGeneratePitches}
                    disabled={loadingPitches}
                    className="w-full mb-3 px-4 py-2 rounded-lg text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 disabled:opacity-50"
                  >
                    {loadingPitches ? 'Generating...' : 'Generate speaking points'}
                  </button>
                  {pitches.length > 0 ? (
                    <div className="space-y-3 max-h-[45vh] overflow-y-auto">
                      {pitches.map((p, i) => (
                        <div key={i} className="border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                          <h4 className="text-xs font-semibold text-slate-800 mb-2">{p.name}</h4>
                          {p.hook && (
                            <p className="text-xs text-slate-600 mb-2 italic">&ldquo;{p.hook}&rdquo;</p>
                          )}
                          {p.bullets && p.bullets.length > 0 && (
                            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                              {p.bullets.map((b, j) => (
                                <li key={j}>{b}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Click the button above to generate speaking points.</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400 italic">Add your resume on the left to generate speaking points.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
