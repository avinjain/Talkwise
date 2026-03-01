'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { PersonaConfig, Track, INTERVIEW_GOAL_OPTIONS, getGoalOptions, getPersonaAttributes } from '@/lib/types';

export default function StartPage() {
  const router = useRouter();
  const [personaName, setPersonaName] = useState('');
  const [track, setTrack] = useState<Track>('professional');
  const [traits, setTraits] = useState<Record<string, number>>({});
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [scenario, setScenario] = useState('');
  const [showTraits, setShowTraits] = useState(false);
  const [interviewPrep, setInterviewPrep] = useState<import('@/lib/types').InterviewPrepContext | null>(null);
  const [applicableGoalIds, setApplicableGoalIds] = useState<string[] | null>(null);

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
      if (parsed.track === 'interview') {
        const raw = sessionStorage.getItem('interviewPrepContext');
        if (raw) setInterviewPrep(JSON.parse(raw));
      }
    } catch {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (track !== 'interview' || !interviewPrep) return;
    const hasContext = (interviewPrep.role || '').trim() || (interviewPrep.resume || '').trim();
    if (!hasContext) {
      setApplicableGoalIds(INTERVIEW_GOAL_OPTIONS.map((g) => g.id));
      return;
    }
    let cancelled = false;
    fetch('/api/interview/filter-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: interviewPrep.role, resume: (interviewPrep.resume || '').slice(0, 3000) }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.applicableIds)) setApplicableGoalIds(data.applicableIds);
        else if (!cancelled) setApplicableGoalIds(INTERVIEW_GOAL_OPTIONS.map((g) => g.id));
      })
      .catch(() => {
        if (!cancelled) setApplicableGoalIds(INTERVIEW_GOAL_OPTIONS.map((g) => g.id));
      });
    return () => { cancelled = true; };
  }, [track, interviewPrep]);

  const handleStart = () => {
    if (selectedGoals.length === 0) return;

    let prepToUse: import('@/lib/types').InterviewPrepContext | undefined = interviewPrep ?? undefined;
    if (track === 'interview') {
      try {
        const raw = sessionStorage.getItem('interviewPrepContext');
        if (raw) { prepToUse = JSON.parse(raw); sessionStorage.removeItem('interviewPrepContext'); }
      } catch { /* ignore */ }
    }

    const config: PersonaConfig = {
      track,
      name: personaName,
      scenario,
      userGoal: selectedGoals.join(', '),
      ...(prepToUse && { interviewPrep: prepToUse }),
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

  const goalOptions =
    track === 'interview' && applicableGoalIds
      ? INTERVIEW_GOAL_OPTIONS.filter((g) => applicableGoalIds.includes(g.id))
      : getGoalOptions(track);
  const personaAttrs = getPersonaAttributes(track);

  const toggleGoal = (label: string) => {
    setSelectedGoals((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader backHref={track === 'interview' ? '/interview/prep' : '/'} backLabel="Back" />
      <div className="flex-1 py-8 px-6">
      <div className="max-w-xl mx-auto">

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            Talk to <span className="text-gradient">{personaName}</span>
          </h1>
          {track !== 'interview' && (
            <button
              onClick={() => setShowTraits(!showTraits)}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showTraits ? 'Hide' : 'Show'} their traits
            </button>
          )}

          {showTraits && track !== 'interview' && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {personaAttrs.map((attr) => {
                const value = traits[attr.key] ?? 5;
                const traitName = attr.traitNames[value];
                return (
                  <span
                    key={attr.key}
                    className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded"
                  >
                    {attr.label}: {traitName}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Goal selection */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-slate-600 mb-2">
            What&apos;s the conversation about? <span className="font-normal text-slate-400">(select one or more)</span>
          </label>
          {track === 'interview' && (interviewPrep?.role || interviewPrep?.resume) && !applicableGoalIds ? (
            <p className="text-sm text-slate-500 py-4">Loading options based on your role and resume…</p>
          ) : (
          <div className="grid grid-cols-2 gap-2">
            {goalOptions.map((goal) => {
              const isSelected = selectedGoals.includes(goal.label);
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.label)}
                  className={`relative p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base flex-shrink-0">{goal.icon}</span>
                    <span className={`text-xs font-medium leading-tight ${
                      isSelected ? 'text-brand-700' : 'text-slate-700'
                    }`}>
                      {goal.label}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-gradient-brand flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          )}
        </div>

        {/* Scenario */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Scenario <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder={
              track === 'personal'
                ? 'e.g., You matched on Tinder. They have a witty bio about travel and dogs.'
                : track === 'interview'
                ? 'e.g., 30-min behavioral screen. First round with the hiring manager.'
                : "e.g., Quarterly review meeting. You've shipped a major project."
            }
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
          />
        </div>

        {/* Start */}
        <button
          type="button"
          onClick={handleStart}
          disabled={selectedGoals.length === 0}
          className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-500/20"
        >
          Start practicing
        </button>
      </div>
      </div>
    </div>
  );
}
