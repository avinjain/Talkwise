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
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <AppHeader backHref="/" backLabel="Home" />
      <div className="flex-1 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
            <p className="text-sm text-slate-500 mt-1">
              Personality insights and profile analysis to help you communicate with confidence.
            </p>
          </div>

          {/* Section 1: Personality test */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-slate-900">Personality test</h2>
            </div>

            {!hasResult || !scores ? (
              <div
                onClick={() => router.push('/profile/test')}
                className="group cursor-pointer bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 p-8 text-center transition-all duration-200"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto mb-4 shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium mb-1">Discover your communication profile</p>
                <p className="text-xs text-slate-500 mb-5">27 questions &middot; 9 traits &middot; AI feedback</p>
                <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-md shadow-brand-500/25">
                  Start the test
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    <RadarChart scores={scores} size={180} />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-sm font-medium text-slate-700 mb-1">Your personality profile</p>
                    {updatedAt && (
                      <p className="text-xs text-slate-500 mb-4">
                        Last updated {new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                    <button
                      onClick={() => router.push('/profile/test')}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/50 transition-colors"
                    >
                      Retake test
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Section 2: Resume & LinkedIn */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-slate-900">Resume & LinkedIn</h2>
            </div>
            <ProfileDetailsPanel />
          </section>

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
