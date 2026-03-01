'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import AppHeader from '@/components/AppHeader';
import RadarChart from '@/components/RadarChart';
import ProfileDetailsPanel from '@/components/ProfileDetailsPanel';
import { ProfileResult } from '@/lib/personality-test';

export default function ProfilePage() {
  const router = useRouter();
  const [scores, setScores] = useState<ProfileResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasResult, setHasResult] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
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
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Logo size={80} className="animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader backHref="/" backLabel="Home" />
      <div className="flex-1 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Profile</h1>
          <p className="text-sm text-slate-500 mb-8">
            Take the personality test and enter your resume & LinkedIn to get AI-powered analysis and speaking points.
          </p>

          {/* 1. Take personality test */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">1. Take personality test</h2>
            {!hasResult || !scores ? (
              <div className="bg-gradient-to-br from-brand-50 to-accent-50 border border-brand-200/50 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
                  </svg>
                </div>
                <p className="text-slate-600 mb-4 max-w-md mx-auto">
                  Discover your personality profile with 9 key traits that predict professional effectiveness.
                </p>
                <p className="text-xs text-slate-500 mb-6">27 questions &middot; 5-point scale &middot; AI-powered feedback</p>
                <button
                  onClick={() => router.push('/profile/test')}
                  className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all"
                >
                  Start the Test
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <RadarChart scores={scores} size={220} />
                  </div>
                  <div className="flex flex-col gap-2">
                    {updatedAt && (
                      <p className="text-xs text-slate-500">
                        Last updated {new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                    <button
                      onClick={() => router.push('/profile/test')}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100"
                    >
                      Retake Test
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Enter details — resume, LinkedIn, Analysis & Core positioning */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">2. Enter details</h2>
            <ProfileDetailsPanel />
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2.5 rounded-lg text-sm border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
