'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { PersonaConfig, ChatMessage, FeedbackReport } from '@/lib/types';

export default function FeedbackPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const configStr = sessionStorage.getItem('personaConfig');
    const messagesStr = sessionStorage.getItem('chatMessages');
    const storedUserName = sessionStorage.getItem('userName');

    if (!configStr || !messagesStr) {
      router.push('/');
      return;
    }

    const personaConfig: PersonaConfig = JSON.parse(configStr);
    const messages: ChatMessage[] = JSON.parse(messagesStr);

    fetchFeedback(personaConfig, messages, storedUserName || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFeedback = async (
    personaConfig: PersonaConfig,
    messages: ChatMessage[],
    userName?: string
  ) => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaConfig, messages, userName }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate feedback');
      }

      const data: FeedbackReport = await response.json();
      setFeedback(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = () => {
    sessionStorage.removeItem('chatMessages');
    router.push('/');
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Logo size={80} className="animate-pulse" />
          </div>
          <div className="inline-flex items-center gap-2 text-brand-600 mb-4">
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Analyzing your conversation...
          </div>
          <p className="text-slate-400 text-sm">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Analysis Failed
          </h1>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={handleNewSession}
            className="px-6 py-3 rounded-xl text-white font-semibold bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-lg shadow-brand-500/25"
          >
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  if (!feedback) return null;

  const scoreColor =
    feedback.confidenceScore >= 70
      ? 'text-emerald-600'
      : feedback.confidenceScore >= 40
        ? 'text-amber-600'
        : 'text-red-600';

  const scoreRingColor =
    feedback.confidenceScore >= 70
      ? 'stroke-emerald-500'
      : feedback.confidenceScore >= 40
        ? 'stroke-amber-500'
        : 'stroke-red-500';

  const circumference = 2 * Math.PI * 54;

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* ── Header ── */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Logo size={64} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Session Feedback
          </h1>
          <p className="text-slate-500">
            Here&apos;s how you did — and how to improve.
          </p>
        </div>

        {/* ── Confidence Score ── */}
        <div className="flex flex-col items-center mb-10 p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="relative w-32 h-32 mb-4">
            <svg
              className="w-full h-full -rotate-90"
              viewBox="0 0 120 120"
            >
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                className={scoreRingColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(feedback.confidenceScore / 100) * circumference} ${circumference}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-bold ${scoreColor}`}>
                {feedback.confidenceScore}
              </span>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Confidence Score
          </h2>
          <p className="text-sm text-slate-500 text-center max-w-lg leading-relaxed">
            {feedback.confidenceNotes}
          </p>
        </div>

        {/* ── Articulation Feedback ── */}
        <div className="mb-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-accent-50 border border-accent-200 flex items-center justify-center text-accent-600 text-sm">
              &#9998;
            </span>
            Articulation Feedback
          </h2>
          <ul className="space-y-3">
            {feedback.articulationFeedback.map((item, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm text-slate-600 leading-relaxed"
              >
                <span className="text-brand-500 mt-0.5 flex-shrink-0">
                  &bull;
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Persona Reaction ── */}
        <div className="mb-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 text-sm">
              &#127917;
            </span>
            Persona Reaction
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {feedback.personaReactionSummary}
          </p>
        </div>

        {/* ── Alternative Suggestions ── */}
        <div className="mb-12 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 text-sm">
              &#128161;
            </span>
            Better Ways to Say It
          </h2>
          <div className="space-y-6">
            {feedback.alternativeSuggestions.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="text-xs text-slate-400 uppercase tracking-wider">
                  What you said
                </div>
                <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 italic">
                  &ldquo;{item.original}&rdquo;
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mt-2">
                  Try instead
                </div>
                <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  &ldquo;{item.suggestion}&rdquo;
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.rationale}
                </p>
                {i < feedback.alternativeSuggestions.length - 1 && (
                  <div className="border-t border-slate-100 mt-3" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-4 justify-center pb-12">
          <button
            onClick={handleNewSession}
            className="px-8 py-4 rounded-xl text-white font-semibold bg-gradient-brand hover:bg-gradient-brand-hover transition-all text-lg shadow-lg shadow-brand-500/25"
          >
            Start New Session
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-4 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors text-lg"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
