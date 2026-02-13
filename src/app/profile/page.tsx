'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import RadarChart from '@/components/RadarChart';
import { DIMENSIONS, ProfileResult, getBand } from '@/lib/personality-test';

interface FeedbackStrength {
  dimension: string;
  insight: string;
}

interface FeedbackGrowthArea {
  dimension: string;
  insight: string;
  tip: string;
}

interface AIFeedback {
  summary: string;
  topStrengths: FeedbackStrength[];
  growthAreas: FeedbackGrowthArea[];
  professionalInsight: string;
  personalInsight: string;
  practiceScenario: string;
}

function getBandColor(band: string): string {
  if (band === 'High') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (band === 'Moderate') return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-500 bg-red-50 border-red-200';
}

export default function ProfilePage() {
  const router = useRouter();
  const [scores, setScores] = useState<ProfileResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasResult, setHasResult] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [userContext, setUserContext] = useState<{ role?: string; focus?: string } | null>(null);

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
          if (data.aiFeedback) {
            setFeedback(data.aiFeedback);
          }
          if (data.userContext) {
            setUserContext(data.userContext);
          }
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
              Discover Your Personality Profile
            </h1>
            <p className="text-slate-500 mb-2 max-w-md mx-auto leading-relaxed">
              Take a psychometric personality assessment measuring 9 key traits
              that predict professional effectiveness and relationship quality.
            </p>
            <p className="text-sm text-slate-400 mb-8">
              27 questions &middot; 5-point scale &middot; Reverse-scored items &middot; AI-powered feedback
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

  // Sort dimensions by score
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
            Your Personality Profile
          </h1>
          <div className="flex items-center justify-center gap-3 text-xs text-slate-400 flex-wrap">
            {userContext?.role && (
              <span className="bg-slate-100 px-2 py-0.5 rounded">{userContext.role}</span>
            )}
            {userContext?.focus && (
              <span className={`px-2 py-0.5 rounded ${
                userContext.focus === 'personal' ? 'bg-pink-50 text-pink-600' : 'bg-brand-50 text-brand-600'
              }`}>
                {userContext.focus === 'personal' ? 'Life focus' : 'Work focus'}
              </span>
            )}
            {updatedAt && (
              <span>
                {new Date(updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>

        {/* AI Summary */}
        {feedback?.summary && (
          <div className="bg-gradient-to-br from-brand-50 to-accent-50 border border-brand-200/50 rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">AI Summary</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feedback.summary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Radar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm overflow-visible">
          <RadarChart scores={scores} size={450} />
        </div>

        {/* Top Strengths */}
        {feedback?.topStrengths && feedback.topStrengths.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Your Strengths</h2>
            </div>
            <div className="space-y-3">
              {feedback.topStrengths.map((s, i) => (
                <div key={i} className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">{s.dimension}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Growth Areas */}
        {feedback?.growthAreas && feedback.growthAreas.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Areas to Grow</h2>
            </div>
            <div className="space-y-3">
              {feedback.growthAreas.map((g, i) => (
                <div key={i} className="bg-amber-50/50 border border-amber-100 rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-amber-700 mb-1">{g.dimension}</p>
                  <p className="text-sm text-slate-600 leading-relaxed mb-2">{g.insight}</p>
                  <div className="flex items-start gap-2 bg-white rounded-lg p-2.5 border border-amber-100">
                    <span className="text-amber-500 flex-shrink-0 mt-0.5">💡</span>
                    <p className="text-xs text-slate-600 leading-relaxed">{g.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Professional & Personal Insights */}
        {(feedback?.professionalInsight || feedback?.personalInsight) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {feedback?.professionalInsight && (
              <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200/50 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">💼</span>
                  <h2 className="text-sm font-semibold text-slate-900">At Work</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{feedback.professionalInsight}</p>
              </div>
            )}
            {feedback?.personalInsight && (
              <div className="bg-gradient-to-br from-pink-50 to-slate-50 border border-pink-200/50 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">💬</span>
                  <h2 className="text-sm font-semibold text-slate-900">In Relationships</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{feedback.personalInsight}</p>
              </div>
            )}
          </div>
        )}

        {/* Practice Scenario */}
        {feedback?.practiceScenario && (
          <div className="bg-gradient-to-br from-accent-50 to-brand-50 border border-accent-200/50 rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-accent-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Recommended Practice</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">{feedback.practiceScenario}</p>
            <button
              onClick={() => router.push('/')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Go to conversations &rarr;
            </button>
          </div>
        )}

        {/* Dimension Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            Full Trait Breakdown
          </h2>
          <div className="space-y-4">
            {sortedDims.map((dim) => {
              const value = (scores as unknown as Record<string, number>)[dim.key] ?? 0;
              const band = getBand(value);
              const bandColor = getBandColor(band);

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
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${bandColor}`}>
                      {band} &middot; {value.toFixed(1)}/10
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

        {/* Scoring Guide */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
          <h3 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Scoring Guide</h3>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-white rounded-lg p-2.5 border border-slate-200">
              <span className="font-semibold text-red-500">Low (0-3.3)</span>
              <p className="text-slate-400 mt-0.5">Area needs significant development</p>
            </div>
            <div className="bg-white rounded-lg p-2.5 border border-slate-200">
              <span className="font-semibold text-amber-600">Moderate (3.4-6.6)</span>
              <p className="text-slate-400 mt-0.5">Functional but room to grow</p>
            </div>
            <div className="bg-white rounded-lg p-2.5 border border-slate-200">
              <span className="font-semibold text-emerald-600">High (6.7-10)</span>
              <p className="text-slate-400 mt-0.5">Strong — a natural strength</p>
            </div>
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
