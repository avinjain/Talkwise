'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { QUESTIONS, DIMENSIONS, LIKERT_OPTIONS, calculateScores } from '@/lib/personality-test';

interface UserContext {
  role: string;
  experience: string;
  goal: string;
  focus: string;
}

const EXPERIENCE_OPTIONS = [
  'Student / Early Career',
  '1-3 years',
  '3-7 years',
  '7-15 years',
  '15+ years',
];

const GOAL_OPTIONS = [
  'Speaking up confidently in meetings',
  'Handling difficult conversations',
  'Networking and building connections',
  'Leading and motivating others',
  'Dating and romantic conversations',
  'Resolving conflicts without stress',
  'Negotiating salary or deals',
  'Making a strong first impression',
  'Managing stress better',
  'Other',
];

export default function PersonalityTestPage() {
  const router = useRouter();

  // Pre-test "About You" state
  const [phase, setPhase] = useState<'about' | 'test'>('about');
  const [userContext, setUserContext] = useState<UserContext>({
    role: '',
    experience: '',
    goal: '',
    focus: 'professional',
  });

  // Test state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = QUESTIONS[currentIndex];
  const total = QUESTIONS.length;
  const progress = ((currentIndex) / total) * 100;
  const answered = answers[question?.id] !== undefined;

  const dimInfo = DIMENSIONS.find((d) => d.key === question?.dimension);

  const handleSelect = (value: number) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
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

  const canStartTest = userContext.role.trim() !== '' && userContext.experience !== '' && userContext.goal !== '';

  const handleStartTest = () => {
    if (canStartTest) {
      setPhase('test');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const unanswered = QUESTIONS.filter((q) => answers[q.id] === undefined);
      if (unanswered.length > 0) {
        setError(`Please answer all questions. ${unanswered.length} remaining.`);
        const firstIdx = QUESTIONS.findIndex((q) => answers[q.id] === undefined);
        setCurrentIndex(firstIdx);
        setSubmitting(false);
        return;
      }

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, userContext }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save results');
      }

      const data = await res.json();
      const scores = data.scores || calculateScores(answers);
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

  // ─── About You Phase ───
  if (phase === 'about') {
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

          {/* Hero */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Tell us about yourself
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
              This helps us personalize your feedback with advice that actually
              applies to your life and goals.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            {/* Role / Occupation */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                What do you do?
              </label>
              <input
                type="text"
                placeholder="e.g. Software Engineer, Student, Sales Manager..."
                value={userContext.role}
                onChange={(e) => setUserContext({ ...userContext, role: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Experience level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setUserContext({ ...userContext, experience: opt })}
                    className={`px-3 py-2 text-xs rounded-lg border-2 font-medium transition-all ${
                      userContext.experience === opt
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* What they want to improve */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                What do you most want to improve?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GOAL_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setUserContext({ ...userContext, goal: opt })}
                    className={`px-3 py-2 text-xs rounded-lg border-2 font-medium text-left transition-all ${
                      userContext.goal === opt
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus area */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Primary focus
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setUserContext({ ...userContext, focus: 'professional' })}
                  className={`px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    userContext.focus === 'professional'
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">💼</span>
                    <span className={`text-sm font-semibold ${userContext.focus === 'professional' ? 'text-brand-700' : 'text-slate-700'}`}>
                      Work
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Workplace, leadership, meetings, negotiations
                  </p>
                </button>
                <button
                  onClick={() => setUserContext({ ...userContext, focus: 'personal' })}
                  className={`px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    userContext.focus === 'personal'
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">💬</span>
                    <span className={`text-sm font-semibold ${userContext.focus === 'personal' ? 'text-pink-700' : 'text-slate-700'}`}>
                      Life
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Dating, friendships, social situations
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Start button */}
          <div className="mt-6 text-center">
            <button
              onClick={handleStartTest}
              disabled={!canStartTest}
              className="px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/25 text-lg"
            >
              Start the Test
            </button>
            <p className="text-xs text-slate-400 mt-2">
              {canStartTest ? '27 questions · ~8 minutes · Personalized AI feedback' : 'Fill in all fields above to continue'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Test Phase ───
  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => currentIndex === 0 ? setPhase('about') : handlePrev()}
            className="text-slate-400 hover:text-slate-700 text-sm transition-colors"
          >
            &larr; {currentIndex === 0 ? 'Edit Profile' : 'Previous'}
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
              {Object.keys(answers).length}/{total} answered
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1 leading-relaxed">
            &ldquo;{question?.question}&rdquo;
          </h2>
          {question?.reversed && (
            <p className="text-[10px] text-slate-300 mt-1">*</p>
          )}
        </div>

        {/* Likert Scale */}
        <div className="mb-8">
          <div className="flex justify-between mb-3 px-1">
            <span className="text-[10px] text-slate-400 font-medium">Strongly Disagree</span>
            <span className="text-[10px] text-slate-400 font-medium">Strongly Agree</span>
          </div>
          <div className="flex gap-2">
            {LIKERT_OPTIONS.map((opt) => {
              const isSelected = answers[question?.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`flex-1 py-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1.5 ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50 shadow-sm scale-105'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <span className={`text-lg font-bold ${
                    isSelected ? 'text-brand-600' : 'text-slate-400'
                  }`}>
                    {opt.value}
                  </span>
                  <span className={`text-[10px] font-medium leading-tight text-center px-1 ${
                    isSelected ? 'text-brand-600' : 'text-slate-400'
                  }`}>
                    {opt.label.split(' ').map((w, i) => <span key={i} className="block">{w}</span>)}
                  </span>
                </button>
              );
            })}
          </div>
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
                {submitting ? 'Analyzing your profile...' : 'See My Results'}
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
