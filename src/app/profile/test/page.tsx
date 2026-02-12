'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { QUESTIONS, DIMENSIONS, calculateScores } from '@/lib/personality-test';

export default function PersonalityTestPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = QUESTIONS[currentIndex];
  const total = QUESTIONS.length;
  const progress = ((currentIndex) / total) * 100;
  const answered = answers[question?.id] !== undefined;

  // Find which dimension this question belongs to
  const dimInfo = DIMENSIONS.find((d) => d.key === question?.dimension);

  const handleSelect = (score: number) => {
    setAnswers((prev) => ({ ...prev, [question.id]: score }));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Verify all questions answered
      const unanswered = QUESTIONS.filter((q) => answers[q.id] === undefined);
      if (unanswered.length > 0) {
        setError(`Please answer all questions. ${unanswered.length} remaining.`);
        // Jump to first unanswered
        const firstIdx = QUESTIONS.findIndex((q) => answers[q.id] === undefined);
        setCurrentIndex(firstIdx);
        setSubmitting(false);
        return;
      }

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save results');
      }

      // Calculate scores for display
      const scores = calculateScores(answers);
      sessionStorage.setItem('profileScores', JSON.stringify(scores));

      router.push('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const isLast = currentIndex === total - 1;
  const allAnswered = QUESTIONS.every((q) => answers[q.id] !== undefined);

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/profile')}
            className="text-slate-400 hover:text-slate-700 text-sm transition-colors"
          >
            &larr; Back
          </button>
          <Logo size={48} />
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              Question {currentIndex + 1} of {total}
            </span>
            <span className="text-xs text-slate-400">
              {Object.keys(answers).length} answered
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Dimension badge */}
        {dimInfo && (
          <div className="mb-4">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                color: dimInfo.color,
                backgroundColor: `${dimInfo.color}15`,
                border: `1px solid ${dimInfo.color}30`,
              }}
            >
              {dimInfo.label}
            </span>
          </div>
        )}

        {/* Question */}
        <h2 className="text-xl font-bold text-slate-900 mb-6 leading-relaxed">
          {question?.question}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {question?.options.map((opt, i) => {
            const isSelected = answers[question.id] === opt.score;
            return (
              <button
                key={i}
                onClick={() => handleSelect(opt.score)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-slate-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm leading-relaxed ${
                    isSelected ? 'text-brand-700 font-medium' : 'text-slate-700'
                  }`}>
                    {opt.text}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Navigation */}
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
                className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {submitting ? 'Saving...' : 'See My Results'}
              </button>
            )}
          </div>
        </div>

        {/* Quick navigation dots */}
        <div className="flex justify-center gap-1 mt-8">
          {QUESTIONS.map((q, i) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = i === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  isCurrent
                    ? 'bg-brand-500 w-4'
                    : isAnswered
                    ? 'bg-brand-300'
                    : 'bg-slate-200'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
