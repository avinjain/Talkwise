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
  const [resume, setResume] = useState('');
  const [resumeAnalysis, setResumeAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/auth?callbackUrl=/interview/prep');
    }
  }, [session, status, router]);

  if (status === 'loading' || !session) return null;

  const handleAnalyzeResume = async () => {
    if (!resume.trim()) return;
    setAnalyzing(true);
    setResumeAnalysis(null);
    try {
      const res = await fetch('/api/interview/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: resume.trim(),
          role: role.trim() || undefined,
          jd: jd.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setResumeAnalysis(data.analysis || data.error || 'Analysis complete.');
    } catch {
      setResumeAnalysis('Could not analyze. You can still continue.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleContinue = () => {
    if (!company.trim() || !role.trim()) return;
    const prep: import('@/lib/types').InterviewPrepContext = {
      company: company.trim(),
      role: role.trim(),
      format,
      jd: jd.trim() || undefined,
      resume: resume.trim() || undefined,
    };
    sessionStorage.setItem('interviewPrepContext', JSON.stringify(prep));
    sessionStorage.setItem('userName', session.user?.name || 'there');
    sessionStorage.setItem(
      'startPersonaData',
      JSON.stringify({
        track: 'interview',
        name: `Interviewer at ${company.trim()}`,
        difficultyLevel: 5,
        decisionOrientation: 6,
        communicationStyle: 7,
        authorityPosture: 6,
        temperamentStability: 6,
        socialPresence: 5,
      })
    );
    router.push('/start');
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
              <textarea
                value={resume}
                onChange={(e) => { setResume(e.target.value); setResumeAnalysis(null); }}
                placeholder="Paste your resume here. We'll use it for tailored questions and feedback."
                rows={6}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-sm"
              />
              {resume.trim() && (
                <button
                  type="button"
                  onClick={handleAnalyzeResume}
                  disabled={analyzing}
                  className="mt-2 px-4 py-2 rounded-lg text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 disabled:opacity-50"
                >
                  {analyzing ? 'Analyzing...' : 'Analyze resume'}
                </button>
              )}
              {resumeAnalysis && (
                <div className="mt-3 p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">
                  {resumeAnalysis}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleContinue}
            disabled={!company.trim() || !role.trim()}
            className="w-full mt-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue to practice
          </button>
        </div>
      </div>
    </div>
  );
}
