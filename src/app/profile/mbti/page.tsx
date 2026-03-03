'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import AppHeader from '@/components/AppHeader';
import { MBTI_DIMENSIONS } from '@/lib/mbti';
import type { MBTIQuestion, MBTIAnswers } from '@/lib/mbti';

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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate questions');
      }
      await fetchQuestions();
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
          <div className="max-w-xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">MBTI Test</h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Generate your personalized MBTI questions using AI. Each run creates a fresh set of questions.
            </p>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}
            <button
              onClick={handleGenerateQuestions}
              disabled={generating}
              className="px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
            >
              {generating ? 'Generating questions...' : 'Generate questions with ChatGPT'}
            </button>
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
      <div className="flex-1 py-8 px-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center mb-6">
            <button
              onClick={() => (currentIndex === 0 ? router.push('/profile') : handlePrev())}
              className="text-slate-400 hover:text-slate-700 text-sm transition-colors"
            >
              &larr; {currentIndex === 0 ? 'Back' : 'Previous'}
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">
                Question {currentIndex + 1} of {total}
              </span>
              <span className="text-xs text-slate-400">
                {Object.keys(answers).length}/{total} answered
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {dimInfo && (
            <div className="mb-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                {dimInfo.label}
              </span>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6 leading-relaxed">
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

          <div className="flex justify-center gap-1 mt-8">
            {questions.map((q, i) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    isCurrent ? 'bg-violet-500 w-4' : isAnswered ? 'bg-violet-300' : 'bg-slate-200'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
