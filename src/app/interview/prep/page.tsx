'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';

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
  const [analyzing, setAnalyzing] = useState(false);
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/auth?callbackUrl=/interview/prep');
    }
  }, [session, status, router]);

  if (status === 'loading' || !session) return null;

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

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader backHref="/" backLabel="Home" />
      <div className="flex-1 py-8 px-6">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Interview prep</h1>
          <p className="text-sm text-slate-500 mb-6">
            Share context so the mock interview feels real. We use this (not personality sliders) to shape the interviewer.
          </p>

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

          <button
            onClick={handleContinue}
            disabled={!company.trim() || !role.trim() || continuing}
            className="w-full mt-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {continuing ? 'Preparing...' : 'Continue to practice'}
          </button>
        </div>
      </div>
    </div>
  );
}
