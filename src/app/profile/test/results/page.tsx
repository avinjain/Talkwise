'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import AppHeader from '@/components/AppHeader';
import RadarChart from '@/components/RadarChart';
import { ProfileResult, DIMENSIONS } from '@/lib/personality-test';

interface AIFeedback {
  summary?: string;
  topStrengths?: Array<{ dimension: string; insight: string }>;
  growthAreas?: Array<{ dimension: string; insight: string; tip: string }>;
  professionInsight?: string;
  fastestGrowthTips?: string[];
  professionalInsight?: string;
  personalInsight?: string;
  practiceScenario?: string;
}

export default function PersonalityResultsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    scores: ProfileResult;
    userContext: { role?: string; experience?: string; goal?: string; focus?: string };
    aiFeedback: AIFeedback | null;
    updatedAt: string;
  } | null>(null);

  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/auth?callbackUrl=/profile/test/results');
      return;
    }
    if (session) fetchResult();
  }, [session, status, router]);

  const fetchResult = async () => {
    try {
      const res = await fetch('/api/profile', { cache: 'no-store' });
      const data = await res.json();
      if (data.hasResult && data.scores) {
        setResult({
          scores: data.scores,
          userContext: data.userContext || {},
          aiFeedback: data.aiFeedback || null,
          updatedAt: data.updatedAt || '',
        });
      } else {
        router.push('/profile/test');
      }
    } catch (err) {
      console.error('Failed to fetch profile result:', err);
      router.push('/profile');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Logo size={80} className="animate-pulse" />
      </div>
    );
  }

  if (!result) return null;

  const { scores, userContext, aiFeedback, updatedAt } = result;
  const ctx = userContext;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <AppHeader backHref="/profile" backLabel="Back" />
      <div className="flex-1 py-8 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Header: radar + role + summary */}
          <div className="mb-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
              <RadarChart scores={scores} size={120} />
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Your communication profile</h1>
                {ctx?.role && (
                  <p className="text-sm text-brand-600 font-medium mb-1">
                    {ctx.role}
                    {ctx.experience && ` · ${ctx.experience}`}
                  </p>
                )}
                {updatedAt && (
                  <p className="text-xs text-slate-500 mb-3">
                    Completed {new Date(updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
                {aiFeedback?.summary && (
                  <p className="text-slate-600 leading-relaxed">{aiFeedback.summary}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/profile/test')}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/50 transition-colors"
              >
                Retake test
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Back to profile
              </button>
            </div>
          </div>

          {/* Fastest growth tips — profession-tied */}
          {aiFeedback?.fastestGrowthTips && aiFeedback.fastestGrowthTips.length > 0 && (
            <div className="mb-10 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
                <span className="text-xl">🚀</span>
                Changes that will help you grow fastest
              </h2>
              {ctx?.role && (
                <p className="text-sm text-slate-500 mb-4">Tailored to your role as {ctx.role}</p>
              )}
              <ol className="space-y-3">
                {aiFeedback.fastestGrowthTips.map((tip, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-slate-700">{tip}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Profession insight */}
          {aiFeedback?.professionInsight && (
            <div className="mb-10 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">How your profile fits your profession</h2>
              <p className="text-slate-600 leading-relaxed">{aiFeedback.professionInsight}</p>
            </div>
          )}

          {/* Top strengths */}
          {aiFeedback?.topStrengths && aiFeedback.topStrengths.length > 0 && (
            <div className="mb-10 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Your strengths</h2>
              <div className="space-y-4">
                {aiFeedback.topStrengths.map((s, i) => {
                  const dim = DIMENSIONS.find((d) => d.label === s.dimension || d.key === s.dimension);
                  return (
                    <div
                      key={i}
                      className="p-4 rounded-xl border-l-4"
                      style={{ borderLeftColor: dim?.color || '#2563eb', backgroundColor: `${dim?.color || '#2563eb'}08` }}
                    >
                      <p className="text-sm font-semibold text-slate-800 mb-1">{s.dimension}</p>
                      <p className="text-slate-600 text-sm leading-relaxed">{s.insight}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Growth areas */}
          {aiFeedback?.growthAreas && aiFeedback.growthAreas.length > 0 && (
            <div className="mb-10 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Areas to grow</h2>
              <div className="space-y-4">
                {aiFeedback.growthAreas.map((g, i) => {
                  const dim = DIMENSIONS.find((d) => d.label === g.dimension || d.key === g.dimension);
                  return (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50"
                    >
                      <p className="text-sm font-semibold text-slate-800 mb-1">{g.dimension}</p>
                      <p className="text-slate-600 text-sm leading-relaxed mb-2">{g.insight}</p>
                      <p className="text-sm font-medium text-brand-500">
                        💡 <span className="text-brand-700">Tip:</span> {g.tip}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Practice scenario */}
          {aiFeedback?.practiceScenario && (
            <div className="mb-10 p-6 bg-brand-50/50 rounded-2xl border border-brand-100">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Suggested TalkWise practice</h2>
              <p className="text-slate-600 leading-relaxed">{aiFeedback.practiceScenario}</p>
              <button
                onClick={() => router.push('/configure')}
                className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-colors"
              >
                Start a practice conversation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
