'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import AppHeader from '@/components/AppHeader';
import MBTITypeBadge from '@/components/MBTITypeBadge';
import { getMBTITypeInfo } from '@/lib/mbti-types';
import { MBTI_DIMENSIONS } from '@/lib/mbti';

interface QuestionSnapshot {
  id: string;
  dimension: string;
  question: string;
  optionA: string;
  optionB: string;
  order: number;
}

export default function MBTIResultsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    type: string;
    rawAnswers: Record<string, string>;
    questionsSnapshot: QuestionSnapshot[];
    createdAt: string;
  } | null>(null);

  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/auth?callbackUrl=/profile/mbti/results');
      return;
    }
    if (session) fetchResult();
  }, [session, status, router]);

  const fetchResult = async () => {
    try {
      const res = await fetch('/api/mbti');
      const data = await res.json();
      if (data.hasResult) {
        setResult({
          type: data.type,
          rawAnswers: data.rawAnswers || {},
          questionsSnapshot: data.questionsSnapshot || [],
          createdAt: data.createdAt,
        });
      } else {
        router.push('/profile/mbti');
      }
    } catch (err) {
      console.error('Failed to fetch MBTI result:', err);
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

  const typeInfo = getMBTITypeInfo(result.type);
  const questions = [...result.questionsSnapshot].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader backHref="/profile" backLabel="Back" />
      <div className="flex-1 py-8 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          {/* MBTI type + what it means */}
          <div className="mb-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
              <MBTITypeBadge type={result.type} size="lg" showBreakdown />
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  {result.type}
                  {typeInfo && (
                    <span className="text-slate-500 font-normal ml-2">— {typeInfo.name}</span>
                  )}
                </h1>
                {result.createdAt && (
                  <p className="text-sm text-slate-500 mb-4">
                    Completed {new Date(result.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
                {typeInfo?.description && (
                  <p className="text-slate-600 leading-relaxed">
                    {typeInfo.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/profile/mbti')}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200/50 transition-colors"
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

          {/* Questions answered */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Your answers</h2>
            <div className="space-y-4">
              {questions.length > 0 ? (
                questions.map((q, i) => {
                  const answer = result.rawAnswers[q.id];
                  const dim = MBTI_DIMENSIONS.find((d) => d.key === q.dimension);
                  const chosenText = answer === 'A' ? q.optionA : answer === 'B' ? q.optionB : null;
                  if (!chosenText) return null;

                  return (
                    <div
                      key={q.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
                    >
                      {dim && (
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 mb-2">
                          {dim.label}
                        </span>
                      )}
                      <p className="text-slate-800 font-medium mb-2">&ldquo;{q.question}&rdquo;</p>
                      <div className="flex gap-2 text-sm">
                        <span className={`px-2 py-1 rounded ${answer === 'A' ? 'bg-violet-100 text-violet-800 font-medium' : 'text-slate-400'}`}>
                          A. {q.optionA}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className={`px-2 py-1 rounded ${answer === 'B' ? 'bg-violet-100 text-violet-800 font-medium' : 'text-slate-400'}`}>
                          B. {q.optionB}
                        </span>
                      </div>
                      <p className="text-xs text-violet-600 font-medium mt-2">
                        You chose: {chosenText}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-500 text-sm py-8 text-center">
                  Question details are not available for this result. Retake the test to see your answers.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
