'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import AppHeader from '@/components/AppHeader';
import { MBTI_DIMENSIONS } from '@/lib/mbti';
import type { MBTIQuestion, MBTIAnswers } from '@/lib/mbti';
import MBTIProgressRing from '@/components/MBTIProgressRing';
import MBTIDimensionVisual from '@/components/MBTIDimensionVisual';

export default function MBTITestPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/auth?callbackUrl=/profile/mbti');
    }
  }, [session, status, router]);

  const [questions, setQuestions] = useState<MBTIQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<MBTIAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mbti/questions');
      const data = await res.json();
      if (data.questions?.length) {
        setQuestions(data.questions);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleGenerateQuestions = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/mbti/generate-questions', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate questions');
      }
      // Use questions from response directly (avoids second fetch / serverless DB isolation)
      if (data.questions?.length) {
        setQuestions(data.questions);
      } else {
        await fetchQuestions();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  };

  const question = questions[currentIndex];
  const total = questions.length;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;
  const answered = question ? answers[question.id] !== undefined : false;
  const dimInfo = question ? MBTI_DIMENSIONS.find((d) => d.key === question.dimension) : null;

  const handleSelect = (value: 'A' | 'B') => {
    if (question) setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const unanswered = questions.filter((q) => answers[q.id] === undefined);
      if (unanswered.length > 0) {
        setError(`Please answer all questions. ${unanswered.length} remaining.`);
        const firstIdx = questions.findIndex((q) => answers[q.id] === undefined);
        setCurrentIndex(firstIdx);
        setSubmitting(false);
        return;
      }

      const res = await fetch('/api/mbti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, answers }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save results');
      }

      const data = await res.json();
      sessionStorage.setItem('mbtiResult', JSON.stringify(data));

      router.push('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Logo size={80} className="animate-pulse" />
      </div>
    );
  }

  // No questions yet — show generate UI
  if (!loading && questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader backHref="/profile" backLabel="Back" />
        <div className="flex-1 py-8 px-6">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">MBTI Test</h1>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                ~24 forced-choice questions across 4 dichotomies. Pick the option that describes you better.
              </p>
            </div>
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 text-center">What you&apos;ll discover</h3>
              <MBTIDimensionVisual compact />
            </div>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="text-center">
              <button
                onClick={handleGenerateQuestions}
                disabled={generating}
                className="px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
              >
                {generating ? 'Preparing...' : 'Start Test'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Logo size={80} className="animate-pulse" />
      </div>
    );
  }

  // Test phase
  const isLast = currentIndex === total - 1;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader backHref="/profile" backLabel="Back" />
      <div className="flex-1 py-8 px-6 lg:px-16 xl:px-24">
        <div className="w-full max-w-[min(100%,_1800px)] mx-auto flex flex-col lg:flex-row lg:gap-12">
          {/* Main: question + options */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-6">
              <button
                onClick={() => (currentIndex === 0 ? router.push('/profile') : handlePrev())}
                className="text-slate-400 hover:text-slate-700 text-sm transition-colors"
              >
                &larr; {currentIndex === 0 ? 'Back' : 'Previous'}
              </button>
            </div>

            {dimInfo && (
              <div className="mb-4">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                  {dimInfo.label}
                </span>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-10 mb-6 shadow-sm">
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-6 leading-relaxed">
                &ldquo;{question?.question}&rdquo;
              </h2>
              <p className="text-xs text-slate-500 mb-4">Which describes you better?</p>
              <div className="space-y-3">
                <button
                  onClick={() => handleSelect('A')}
                  className={`w-full px-4 py-4 rounded-xl border-2 text-left transition-all ${
                    answers[question?.id] === 'A'
                      ? 'border-violet-500 bg-violet-50 text-violet-800'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="font-medium">A.</span> {question?.optionA}
                </button>
                <button
                  onClick={() => handleSelect('B')}
                  className={`w-full px-4 py-4 rounded-xl border-2 text-left transition-all ${
                    answers[question?.id] === 'B'
                      ? 'border-violet-500 bg-violet-50 text-violet-800'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="font-medium">B.</span> {question?.optionB}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {!isLast ? (
                  <button
                    onClick={handleNext}
                    disabled={!answered}
                    className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!allAnswered || submitting}
                    className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    {submitting ? 'Saving...' : 'See My Results'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar: progress ring + dimension viz + question grid */}
          <div className="lg:w-80 xl:w-96 shrink-0 mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-8 space-y-6">
              <div className="flex flex-col items-center">
                <MBTIProgressRing
                  current={Object.keys(answers).length}
                  total={total}
                  size={88}
                  strokeWidth={8}
                />
                <p className="text-xs font-medium text-slate-500 mt-2">Answered</p>
              </div>
              {dimInfo && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current dimension</h4>
                  <MBTIDimensionVisual activeKey={dimInfo.key} compact />
                </div>
              )}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Questions</h4>
                <div className="grid grid-cols-6 gap-1.5">
                  {questions.map((q, i) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isCurrent = i === currentIndex;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(i)}
                        className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium transition-all ${
                          isCurrent
                            ? 'bg-violet-500 text-white ring-2 ring-violet-300'
                            : isAnswered
                            ? 'bg-violet-200 text-violet-800'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                        title={`Question ${i + 1}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
