'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { PersonaConfig, Track, getGoalOptions, getPersonaAttributes } from '@/lib/types';

export default function StartPage() {
  const router = useRouter();
  const [personaName, setPersonaName] = useState('');
  const [track, setTrack] = useState<Track>('professional');
  const [traits, setTraits] = useState<Record<string, number>>({});
  const [userGoal, setUserGoal] = useState('');
  const [scenario, setScenario] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('startPersonaData');
    if (!stored) {
      router.push('/');
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setPersonaName(parsed.name || '');
      setTrack(parsed.track || 'professional');
      setTraits(parsed);
    } catch {
      router.push('/');
    }
  }, [router]);

  const handleStart = () => {
    if (!userGoal) return;

    const config: PersonaConfig = {
      track,
      name: personaName,
      scenario,
      userGoal,
      difficultyLevel: traits.difficultyLevel ?? 5,
      decisionOrientation: traits.decisionOrientation ?? 5,
      communicationStyle: traits.communicationStyle ?? 5,
      authorityPosture: traits.authorityPosture ?? 5,
      temperamentStability: traits.temperamentStability ?? 5,
      socialPresence: traits.socialPresence ?? 5,
      interestLevel: traits.interestLevel ?? 5,
      flirtatiousness: traits.flirtatiousness ?? 5,
      communicationEffort: traits.communicationEffort ?? 5,
      emotionalOpenness: traits.emotionalOpenness ?? 5,
      humorStyle: traits.humorStyle ?? 5,
      pickiness: traits.pickiness ?? 5,
    };

    sessionStorage.setItem('personaConfig', JSON.stringify(config));
    sessionStorage.removeItem('startPersonaData');
    router.push('/chat');
  };

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-slate-700 text-sm inline-flex items-center gap-1 transition-colors"
          >
            &larr; Back
          </button>
          <Logo size={48} />
        </div>

        {/* Persona summary */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Talk to <span className="text-gradient">{personaName}</span>
          </h1>
          <p className="text-slate-500 mb-4">
            {track === 'personal'
              ? 'Choose what you want to practice and set the scene.'
              : 'Choose what you want to discuss and describe the situation.'}
          </p>

          {/* Trait pills */}
          <div className="flex flex-wrap gap-2">
            {getPersonaAttributes(track).map((attr) => {
              const value = traits[attr.key] ?? 5;
              const traitName = attr.traitNames[value];
              return (
                <span
                  key={attr.key}
                  className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full"
                >
                  {attr.label}: {traitName}
                </span>
              );
            })}
          </div>
        </div>

        <div className="space-y-8">
          {/* ── Goal selection ── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              What&apos;s the conversation about?{' '}
              <span className="text-brand-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {getGoalOptions(track).map((goal) => {
                const isSelected = userGoal === goal.label;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setUserGoal(goal.label)}
                    className={`relative p-4 rounded-xl border text-left transition-all duration-200 shadow-sm ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0 mt-0.5">
                        {goal.icon}
                      </span>
                      <div>
                        <div
                          className={`text-sm font-medium ${
                            isSelected ? 'text-brand-700' : 'text-slate-800'
                          }`}
                        >
                          {goal.label}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {goal.description}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gradient-brand flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Scenario ── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Describe the scenario{' '}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder={
                track === 'personal'
                  ? "e.g., You matched on Tinder. They have a witty bio about travel and dogs."
                  : "e.g., Quarterly review meeting. You've been at the company for 2 years and just shipped a major project."
              }
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none shadow-sm"
            />
          </div>

          {/* ── Start Button ── */}
          <button
            type="button"
            onClick={handleStart}
            disabled={!userGoal}
            className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-lg shadow-lg shadow-brand-500/25 hover:shadow-brand-500/35"
          >
            Start Conversation
          </button>
        </div>
      </div>
    </div>
  );
}
