'use client';

import { useState } from 'react';

interface ResumeLinkedInSectionProps {
  role?: string;
  jd?: string;
  /** Compact mode for profile page (no role/jd) */
  compact?: boolean;
}

export default function ResumeLinkedInSection({ role = '', jd = '', compact = false }: ResumeLinkedInSectionProps) {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePaste, setResumePaste] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [linkedInPaste, setLinkedInPaste] = useState('');
  const [profileAnalysis, setProfileAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyzeProfile = async () => {
    const hasResume = resumeFile || resumePaste.trim();
    const hasLinkedIn = linkedInUrl.trim() || linkedInPaste.trim();
    if (!hasResume && !hasLinkedIn) return;
    setAnalyzing(true);
    setProfileAnalysis(null);
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
    } catch (e) {
      setProfileAnalysis(e instanceof Error ? e.message : 'Could not analyze. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const hasInput = resumeFile || resumePaste.trim() || linkedInUrl.trim() || linkedInPaste.trim();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Resume</label>
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setResumeFile(f || null);
            setProfileAnalysis(null);
            e.target.value = '';
          }}
          className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
        />
        {resumeFile && <p className="mt-1 text-xs text-slate-500">{resumeFile.name}</p>}
        <details className="mt-2">
          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">Or paste your resume</summary>
          <textarea
            value={resumePaste}
            onChange={(e) => { setResumePaste(e.target.value); setProfileAnalysis(null); }}
            placeholder="Paste resume text..."
            rows={4}
            className="mt-2 w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-sm"
          />
        </details>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn profile</label>
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

      {hasInput && (
        <div>
          <button
            type="button"
            onClick={handleAnalyzeProfile}
            disabled={analyzing}
            className="px-4 py-2 rounded-lg text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 disabled:opacity-50"
          >
            {analyzing ? 'Analyzing...' : 'Analyze profile & get improvement tips'}
          </button>
          {profileAnalysis && (
            <div className="mt-3 p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">
              {profileAnalysis}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
