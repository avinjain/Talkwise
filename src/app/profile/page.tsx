'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import RadarChart from '@/components/RadarChart';
import { DIMENSIONS, ProfileResult } from '@/lib/personality-test';

function getStrength(value: number): string {
  if (value >= 8) return 'Very Strong';
  if (value >= 6) return 'Strong';
  if (value >= 4) return 'Moderate';
  if (value >= 2) return 'Developing';
  return 'Needs Work';
}

function getStrengthColor(value: number): string {
  if (value >= 8) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (value >= 6) return 'text-brand-600 bg-brand-50 border-brand-200';
  if (value >= 4) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-500 bg-red-50 border-red-200';
}

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

  // No test taken yet
  if (!hasResult || !scores) {
    return (
      <div className="min-h-screen py-8 px-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/')}
              className="text-slate-400 hover:text-slate-700 text-sm transition-colors"
            >
              &larr; Home
            </button>
            <Logo size={48} />
          </div>

          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-500/20">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-3">
              Discover Your Communication Style
            </h1>
            <p className="text-slate-500 mb-2 max-w-md mx-auto leading-relaxed">
              Take a quick 10-minute personality test to understand your
              communication strengths and growth areas.
            </p>
            <p className="text-sm text-slate-400 mb-8">
              24 questions &middot; 6 dimensions &middot; Instant results
            </p>

            <button
              onClick={() => router.push('/profile/test')}
              className="px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-lg shadow-brand-500/25 text-lg"
            >
              Start the Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sort dimensions by score for the breakdown
  const sortedDims = [...DIMENSIONS].sort((a, b) => {
    const scoreA = (scores as unknown as Record<string, number>)[a.key] ?? 0;
    const scoreB = (scores as unknown as Record<string, number>)[b.key] ?? 0;
    return scoreB - scoreA;
  });

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-slate-700 text-sm transition-colors"
          >
            &larr; Home
          </button>
          <Logo size={48} />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Your Communication Profile
          </h1>
          {updatedAt && (
            <p className="text-xs text-slate-400">
              Last taken: {new Date(updatedAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          )}
        </div>

        {/* Radar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
          <RadarChart scores={scores} size={360} />
        </div>

        {/* Dimension Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            Dimension Breakdown
          </h2>
          <div className="space-y-4">
            {sortedDims.map((dim) => {
              const value = (scores as unknown as Record<string, number>)[dim.key] ?? 0;
              const strength = getStrength(value);
              const strengthColor = getStrengthColor(value);

              return (
                <div key={dim.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: dim.color }}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {dim.label}
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${strengthColor}`}>
                      {strength} &middot; {value.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(value / 10) * 100}%`,
                        backgroundColor: dim.color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{dim.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center pb-8">
          <button
            onClick={() => router.push('/profile/test')}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-md shadow-brand-500/20"
          >
            Retake Test
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 rounded-lg text-sm border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
