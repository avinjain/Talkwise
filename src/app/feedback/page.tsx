'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import AppHeader from '@/components/AppHeader';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Logo size={80} className="animate-pulse" />
          </div>
          <div className="inline-flex items-center gap-2 text-brand-600 mb-4">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing your conversation...
          </div>
          <p className="text-slate-400 text-sm">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1 className="text-lg font-bold text-red-600 mb-2">Analysis Failed</h1>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button
            onClick={handleNewSession}
            className="px-5 py-2.5 rounded-lg text-sm text-white font-medium bg-gradient-brand hover:bg-gradient-brand-hover transition-all"
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
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex-1 py-8 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
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

        {/* Confidence Score */}
        <div className="flex items-center gap-6 mb-5 p-5 rounded-xl bg-white border border-slate-200">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                className={scoreRingColor}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(feedback.confidenceScore / 100) * circumference} ${circumference}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl font-bold ${scoreColor}`}>
                {feedback.confidenceScore}
              </span>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Confidence Score</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {feedback.confidenceNotes}
            </p>
          </div>
        </div>

        {feedback.interviewDimensions && (
          <div className="mb-4 p-5 rounded-xl bg-white border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Interview dimensions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['substance','structure','relevance','credibility','differentiation'] as const).map((k) => (
                <div key={k} className="text-center p-2 rounded-lg bg-slate-50">
                  <div className="text-lg font-bold text-brand-600">{feedback.interviewDimensions![k]}/10</div>
                  <div className="text-[10px] text-slate-500 capitalize">{k}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Articulation Feedback */}
        <div className="mb-4 p-5 rounded-xl bg-white border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Articulation Feedback
          </h2>
          <ul className="space-y-2">
            {feedback.articulationFeedback.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-600 leading-relaxed">
                <span className="text-brand-500 mt-0.5 flex-shrink-0">&bull;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Persona Reaction */}
        <div className="mb-4 p-5 rounded-xl bg-white border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            How They Perceived You
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {feedback.personaReactionSummary}
          </p>
        </div>

        {/* Alternative Suggestions */}
        <div className="mb-8 p-5 rounded-xl bg-white border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Better Ways to Say It
          </h2>
          <div className="space-y-4">
            {feedback.alternativeSuggestions.map((item, i) => (
              <div key={i}>
                <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 italic mb-1.5">
                  &ldquo;{item.original}&rdquo;
                </div>
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-1.5">
                  &ldquo;{item.suggestion}&rdquo;
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {item.rationale}
                </p>
                {i < feedback.alternativeSuggestions.length - 1 && (
                  <div className="border-t border-slate-100 mt-3" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center pb-8">
          <button
            onClick={handleNewSession}
            className="px-6 py-2.5 rounded-lg text-sm text-white font-medium bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-md shadow-brand-500/20"
          >
            New Session
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 rounded-lg text-sm border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
          >
            Home
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
