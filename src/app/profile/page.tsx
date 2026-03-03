'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import AppHeader from '@/components/AppHeader';
import RadarChart from '@/components/RadarChart';
import ProfileDetailsPanel from '@/components/ProfileDetailsPanel';
import { ProfileResult, DIMENSIONS } from '@/lib/personality-test';
import { MBTI_DIMENSIONS } from '@/lib/mbti';
import { useSideNav } from '@/contexts/SideNavContext';

const TestIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
  </svg>
);

export default function ProfilePage() {
  const router = useRouter();
  const { setVariant, profileTab, setProfileTab, setLastTestResult } = useSideNav();

  useEffect(() => {
    setVariant('profile');
    return () => setVariant('default');
  }, [setVariant]);
  const [scores, setScores] = useState<ProfileResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasResult, setHasResult] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [mbtiResult, setMbtiResult] = useState<{ type: string; createdAt: string } | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchMBTI();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.hasResult) {
          setScores(data.scores);
          setHasResult(true);
          setUpdatedAt(data.updatedAt);
          setLastTestResult({ date: data.updatedAt, hasResult: true });
        } else {
          setLastTestResult({ hasResult: false });
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMBTI = async () => {
    try {
      const res = await fetch('/api/mbti');
      if (res.ok) {
        const data = await res.json();
        if (data.hasResult) {
          setMbtiResult({ type: data.type, createdAt: data.createdAt });
        }
      }
    } catch (err) {
      console.error('Failed to fetch MBTI:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Logo size={80} className="animate-pulse" />
      </div>
    );
  }

  // ─── Test cards (side by side, above) ───
  const personalityTestCard = !hasResult || !scores ? (
    <div
      onClick={() => router.push('/profile/test')}
      className="group h-full min-h-[220px] flex flex-col cursor-pointer bg-white rounded-2xl border-2 border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 hover:shadow-lg hover:shadow-brand-500/10 p-6 transition-all duration-200"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mb-4 shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
        <TestIcon />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">Communication personality</h3>
      <p className="text-sm text-slate-500 mb-4 flex-1">27 questions &middot; 9 traits &middot; AI feedback</p>
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 group-hover:text-brand-700">
        Start test
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </span>
    </div>
  ) : (
    <div className="h-full min-h-[220px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-4 mb-4">
        <RadarChart scores={scores} size={100} />
        <div>
          <h3 className="text-base font-semibold text-slate-900">Your profile</h3>
          {updatedAt && (
            <p className="text-xs text-slate-500">
              {new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => router.push('/profile/test')}
        className="mt-auto px-4 py-2 rounded-lg text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/50 transition-colors w-fit"
      >
        Retake test
      </button>
    </div>
  );

  const mbtiTestCard = !mbtiResult ? (
    <div
      onClick={() => router.push('/profile/mbti')}
      className="group h-full min-h-[220px] flex flex-col cursor-pointer bg-white rounded-2xl border-2 border-slate-200 hover:border-violet-400 hover:bg-violet-50/40 hover:shadow-lg hover:shadow-violet-500/10 p-6 transition-all duration-200"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4 shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
        <TestIcon />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">MBTI type</h3>
      <p className="text-sm text-slate-500 mb-4 flex-1">~24 questions &middot; 4 dichotomies &middot; AI-generated</p>
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 group-hover:text-violet-700">
        Start test
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </span>
    </div>
  ) : (
    <div className="h-full min-h-[220px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-white">{mbtiResult.type}</span>
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">Your MBTI type</h3>
          {mbtiResult.createdAt && (
            <p className="text-xs text-slate-500">
              {new Date(mbtiResult.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => router.push('/profile/mbti')}
        className="mt-auto px-4 py-2 rounded-lg text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200/50 transition-colors w-fit"
      >
        Retake test
      </button>
    </div>
  );

  // ─── What these tests measure (below) ───
  const whatTestsMeasure = (
    <div className="mt-8 p-6 rounded-2xl bg-white border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">What these tests measure</h3>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Personality test dimensions */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Communication personality</h4>
          <p className="text-sm text-slate-600 mb-3 leading-relaxed">
            27 questions across 9 dimensions, 5-point scale. Traits that predict effectiveness in professional and personal communication.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DIMENSIONS.map((d) => (
              <div key={d.key} className="flex gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: d.color }} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{d.label}</p>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{d.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* MBTI dimensions */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">MBTI</h4>
          <p className="text-sm text-slate-600 mb-3 leading-relaxed">
            ~24 forced-choice questions across 4 dichotomies. AI-generated questions for a fresh assessment each time.
          </p>
          <div className="space-y-2">
            {MBTI_DIMENSIONS.map((d) => (
              <div key={d.key} className="flex gap-2 p-2.5 rounded-lg bg-violet-50/50 border border-violet-100">
                <span className="text-xs font-semibold text-violet-600 shrink-0">{d.a}/{d.b}</span>
                <p className="text-xs text-slate-700">{d.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const personalitySection = (
    <section className="w-full">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-sm">
          <TestIcon />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Personality tests</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Discover your communication style and MBTI type
          </p>
        </div>
      </div>

      {/* Test cards — side by side */}
      <div className="grid sm:grid-cols-2 gap-4">
        {personalityTestCard}
        {mbtiTestCard}
      </div>

      {/* What these tests measure — below */}
      {whatTestsMeasure}
    </section>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <AppHeader backHref="/" backLabel="Home" />
      <div className="flex-1 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
            <p className="text-sm text-slate-500 mt-1">
              Your resume, LinkedIn, personality, and interview-ready insights.
            </p>
          </div>

          <ProfileDetailsPanel
            personalityContent={personalitySection}
            activeTab={profileTab}
            onTabChange={setProfileTab}
          />
        </div>
      </div>
    </div>
  );
}
