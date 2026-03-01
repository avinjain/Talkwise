'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import AnalysisDisplay from '@/components/AnalysisDisplay';

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
  const [rightTab, setRightTab] = useState<'core-positioning' | 'analysis'>('core-positioning');

  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/auth?callbackUrl=/interview/prep');
    }
  }, [session, status, router]);

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
      if (res.ok && Array.isArray(data.pitches)) setPitches(data.pitches);
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
      setRightTab('analysis');
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
      <AppHeader backHref="/" backLabel="Home" />
      <div className="flex-1 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Interview prep</h1>
          <p className="text-sm text-slate-500 mb-6">
            Share context so the mock interview feels real. We use this (not personality sliders) to shape the interviewer.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-8">
            {/* Left: Form */}
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
            {(resumeFile || resumePaste.trim() || linkedInUrl.trim() || linkedInPaste.trim()) && (
              <button
                type="button"
                onClick={handleAnalyzeProfile}
                disabled={analyzing}
                className="px-4 py-2 rounded-lg text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 disabled:opacity-50"
              >
                {analyzing ? 'Analyzing...' : 'Analyze profile & get improvement tips'}
              </button>
            )}
            <button
              onClick={handleContinue}
              disabled={!company.trim() || !role.trim() || continuing}
              className="w-full mt-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {continuing ? 'Preparing...' : 'Continue to practice'}
            </button>
            </div>

            {/* Right: Tabbed panel - Core positioning | Analysis & Improvement tips */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex border-b border-slate-200 mb-4 -mx-5 px-5">
                  <button
                    type="button"
                    onClick={() => setRightTab('core-positioning')}
                    className={`py-2.5 px-3 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${
                      rightTab === 'core-positioning'
                        ? 'border-brand-500 text-brand-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Core positioning
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightTab('analysis')}
                    className={`py-2.5 px-3 text-sm font-medium border-b-2 -mb-[1px] transition-colors relative ${
                      rightTab === 'analysis'
                        ? 'border-brand-500 text-brand-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Analysis & Improvement tips
                    {profileAnalysis && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand-500" aria-hidden />
                    )}
                  </button>
                </div>

                {rightTab === 'core-positioning' && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">Speaking points</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Speaking points for your interview. Upload your resume and generate pitches.
                    </p>

                    {!hasResume ? (
                      <p className="text-xs text-slate-400 italic">Add your resume above to generate speaking points.</p>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleGeneratePitches}
                          disabled={loadingPitches}
                          className="w-full mb-4 px-4 py-2 rounded-lg text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 disabled:opacity-50"
                        >
                          {loadingPitches ? 'Generating...' : 'Generate speaking points'}
                        </button>

                        {pitches.length > 0 && (
                          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
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
                        )}
                      </>
                    )}
                  </>
                )}

                {rightTab === 'analysis' && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">Profile analysis</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Add resume and/or LinkedIn above, then click &ldquo;Analyze profile & get improvement tips&rdquo;.
                    </p>

                    {profileAnalysis ? (
                      <div className="max-h-[50vh] overflow-y-auto p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <AnalysisDisplay content={profileAnalysis} className="text-sm" />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        {resumeFile || resumePaste.trim() || linkedInUrl.trim() || linkedInPaste.trim()
                          ? 'Click &ldquo;Analyze profile & get improvement tips&rdquo; to see personalized tips.'
                          : 'Add your resume and/or LinkedIn above to get improvement tips.'}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
