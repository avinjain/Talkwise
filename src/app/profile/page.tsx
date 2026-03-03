'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import AppHeader from '@/components/AppHeader';
import RadarChart from '@/components/RadarChart';
import ProfileDetailsPanel from '@/components/ProfileDetailsPanel';
import { ProfileResult, DIMENSIONS } from '@/lib/personality-test';
import { useSideNav } from '@/contexts/SideNavContext';

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

  const personalitySection = (
    <section className="w-full">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Discover your personality</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            A psychometric assessment measuring 9 key communication traits
          </p>
        </div>
      </div>

      {/* What this test does */}
      <div className="mb-6 p-6 rounded-2xl bg-white border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">What this test measures</h3>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          27 questions across 9 dimensions, using a 5-point scale. Each dimension measures traits that predict effectiveness in professional and personal communication. You&apos;ll receive AI-powered feedback tailored to your role and goals.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DIMENSIONS.map((d) => (
            <div key={d.key} className="flex gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: d.color }} />
              <div>
                <p className="text-xs font-medium text-slate-800">{d.label}</p>
                <p className="text-[11px] text-slate-500 leading-snug">{d.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!hasResult || !scores ? (
        <div
          onClick={() => router.push('/profile/test')}
          className="group cursor-pointer bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 p-8 text-center transition-all duration-200"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto mb-4 shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium mb-1">Discover your communication personality</p>
          <p className="text-sm text-slate-500 mb-4">27 questions &middot; 9 traits &middot; AI feedback</p>
          <span className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-md shadow-brand-500/25">
            Start the test
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <RadarChart scores={scores} size={180} />
            </div>
            <div className="flex-1 text-center lg:text-left w-full">
              <p className="text-base font-medium text-slate-700 mb-1">Your personality profile</p>
              {updatedAt && (
                <p className="text-sm text-slate-500 mb-4">
                  Last updated {new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Your scores across the 9 dimensions help tailor TalkWise practice scenarios for your growth areas.
              </p>
              <button
                onClick={() => router.push('/profile/test')}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/50 transition-colors"
              >
                Retake test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MBTI section */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">MBTI Type</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Discover your Myers-Briggs type with AI-generated questions
            </p>
          </div>
        </div>
        {!mbtiResult ? (
          <div
            onClick={() => router.push('/profile/mbti')}
            className="group cursor-pointer bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-violet-300 hover:bg-violet-50/30 p-8 text-center transition-all duration-200"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4 shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium mb-1">Discover your MBTI type</p>
            <p className="text-sm text-slate-500 mb-4">AI-generated questions &middot; 4 dichotomies &middot; ~24 questions</p>
            <span className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 transition-all shadow-md shadow-violet-500/25">
              Take MBTI test
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0 w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{mbtiResult.type}</span>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-base font-medium text-slate-700 mb-1">Your MBTI type</p>
                {mbtiResult.createdAt && (
                  <p className="text-sm text-slate-500 mb-2">
                    Completed {new Date(mbtiResult.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
                <button
                  onClick={() => router.push('/profile/mbti')}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200/50 transition-colors"
                >
                  Retake MBTI test
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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

          <div className="mt-10 flex justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-5 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
