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
import MBTIDimensionVisual from '@/components/MBTIDimensionVisual';
import MBTITypeBadge from '@/components/MBTITypeBadge';

const TestIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
  </svg>
);

export default function ProfilePage() {
  const router = useRouter();
  const { setVariant, profileTab, setProfileTab, setLastPersonalityTest, setLastMbtiTest } = useSideNav();

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
          setLastPersonalityTest({ date: data.updatedAt, hasResult: true });
        } else {
          setLastPersonalityTest({ hasResult: false });
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
          setLastMbtiTest({ date: data.createdAt, hasResult: true });
        } else {
          setMbtiResult(null);
          setLastMbtiTest({ hasResult: false });
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

  // ─── Communication personality: card + what it measures ───
  const communicationPersonalityBlock = (
    <div className="space-y-4">
      {!hasResult || !scores ? (
        <div
          onClick={() => router.push('/profile/test')}
          className="group flex flex-col cursor-pointer bg-white rounded-2xl border-2 border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 hover:shadow-lg hover:shadow-brand-500/10 p-6 transition-all duration-200"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <TestIcon />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Communication personality</h3>
              <p className="text-sm text-slate-500">27 questions &middot; 9 traits &middot; AI feedback</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 group-hover:text-brand-700 w-fit">
            Start test
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </div>
      ) : (
        <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
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
            className="px-4 py-2 rounded-lg text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/50 transition-colors w-fit"
          >
            Retake test
          </button>
        </div>
      )}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">What this test measures</h4>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          27 questions across 9 dimensions, 5-point scale. Traits that predict effectiveness in professional and personal communication.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DIMENSIONS.map((d) => (
            <div
              key={d.key}
              className="flex gap-3 p-3 rounded-xl bg-white border border-slate-100 overflow-hidden"
              style={{ borderLeftWidth: 4, borderLeftColor: d.color }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate">{d.label}</p>
                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mt-0.5">{d.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── MBTI: card + what it measures ───
  const mbtiBlock = (
    <div className="space-y-4">
      {!mbtiResult ? (
        <div
          onClick={() => router.push('/profile/mbti')}
          className="group flex flex-col cursor-pointer bg-white rounded-2xl border-2 border-slate-200 hover:border-violet-400 hover:bg-violet-50/40 hover:shadow-lg hover:shadow-violet-500/10 p-6 transition-all duration-200"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <TestIcon />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">MBTI type</h3>
              <p className="text-sm text-slate-500">~24 questions &middot; 4 dichotomies &middot; AI-generated</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 group-hover:text-violet-700 w-fit">
            Start test
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </div>
      ) : (
        <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-6 mb-4">
            <MBTITypeBadge type={mbtiResult.type} size="md" showBreakdown />
            <div>
              <h3 className="text-base font-semibold text-slate-900">Your MBTI type</h3>
              {mbtiResult.createdAt && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(mbtiResult.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/profile/mbti')}
            className="px-4 py-2 rounded-lg text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200/50 transition-colors w-fit"
          >
            Retake test
          </button>
        </div>
      )}
      <div className="p-4 rounded-xl bg-violet-50/30 border border-violet-100">
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">What this test measures</h4>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          ~24 forced-choice questions across 4 dichotomies. Pick the option that describes you better.
        </p>
        <MBTIDimensionVisual />
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

      {/* Test blocks — side by side, each with its own "What it measures" */}
      <div className="grid sm:grid-cols-2 gap-6">
        {communicationPersonalityBlock}
        {mbtiBlock}
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
        </div>
      </div>
    </div>
  );
}
