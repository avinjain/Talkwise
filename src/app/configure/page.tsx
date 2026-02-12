'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import {
  PersonaConfig,
  PERSONA_ATTRIBUTES,
  GOAL_OPTIONS,
} from '@/lib/types';

export default function ConfigurePage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [editPersonaId, setEditPersonaId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState<PersonaConfig>({
    name: '',
    scenario: '',
    userGoal: '',
    difficultyLevel: 5,
    decisionOrientation: 5,
    communicationStyle: 5,
    authorityPosture: 5,
    temperamentStability: 5,
    socialPresence: 5,
  });

  useEffect(() => {
    const stored = sessionStorage.getItem('userName');
    if (!stored) {
      router.push('/');
      return;
    }
    setUserName(stored);

    // Check if editing an existing persona
    const personaId = sessionStorage.getItem('editPersonaId');
    if (personaId) {
      setEditPersonaId(personaId);
    }

    // Load pre-filled config if available
    const storedConfig = sessionStorage.getItem('personaConfig');
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        setConfig(parsed);
      } catch {
        // ignore parse errors
      }
    }
  }, [router]);

  const handleSliderChange = (key: string, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleStartWithoutSaving = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.name.trim() || !config.userGoal) return;

    sessionStorage.setItem('personaConfig', JSON.stringify(config));
    sessionStorage.removeItem('editPersonaId');
    router.push('/chat');
  };

  const handleSaveAndStart = async () => {
    if (!config.name.trim() || !config.userGoal) return;
    setSaving(true);

    try {
      const body = {
        name: config.name,
        goal: config.userGoal,
        scenario: config.scenario,
        difficultyLevel: config.difficultyLevel,
        decisionOrientation: config.decisionOrientation,
        communicationStyle: config.communicationStyle,
        authorityPosture: config.authorityPosture,
        temperamentStability: config.temperamentStability,
        socialPresence: config.socialPresence,
      };

      let res: Response;
      if (editPersonaId) {
        // Update existing
        res = await fetch(`/api/personas/${editPersonaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        // Create new
        res = await fetch('/api/personas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to save persona. Please try again.');
        setSaving(false);
        return;
      }

      sessionStorage.setItem('personaConfig', JSON.stringify(config));
      sessionStorage.removeItem('editPersonaId');
      router.push('/chat');
    } catch (err) {
      console.error('Failed to save persona:', err);
      alert('Failed to save persona. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isValid = config.name.trim() && config.userGoal;

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

        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {editPersonaId ? (
            <>
              Edit <span className="text-gradient">{config.name || 'Persona'}</span>
            </>
          ) : (
            <>
              Hey <span className="text-gradient">{userName}</span>, set up your
              conversation
            </>
          )}
        </h1>
        <p className="text-slate-500 mb-10">
          {editPersonaId
            ? 'Adjust the settings below and start the conversation.'
            : 'Choose who you want to talk to, what the conversation is about, and how challenging you want it to be.'}
        </p>

        <form onSubmit={handleStartWithoutSaving} className="space-y-8">
          {/* ── Who do you want to talk to ── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Who do you want to talk to?{' '}
              <span className="text-brand-600">*</span>
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) =>
                setConfig((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="e.g., Sarah Chen, VP of Engineering"
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all shadow-sm"
            />
          </div>

          {/* ── Goal selection ── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              What&apos;s the conversation about?{' '}
              <span className="text-brand-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GOAL_OPTIONS.map((goal) => {
                const isSelected = config.userGoal === goal.label;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() =>
                      setConfig((p) => ({ ...p, userGoal: goal.label }))
                    }
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
              value={config.scenario}
              onChange={(e) =>
                setConfig((p) => ({ ...p, scenario: e.target.value }))
              }
              placeholder="e.g., Quarterly review meeting. You've been at the company for 2 years and just shipped a major project."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none shadow-sm"
            />
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-slate-200" />

          {/* ── Personality Matrix ── */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              Personality Matrix
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Adjust each slider to shape their personality. The trait name
              updates as you drag.
            </p>

            <div className="space-y-7">
              {PERSONA_ATTRIBUTES.map((attr) => {
                const value = config[attr.key];
                const traitName = attr.traitNames[value];

                return (
                  <div key={attr.key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-slate-700">
                        {attr.label}
                      </label>
                      <span className="text-sm font-medium text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-full">
                        {value} &mdash; {traitName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                      {attr.description}
                    </p>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={value}
                      onChange={(e) =>
                        handleSliderChange(attr.key, Number(e.target.value))
                      }
                      className="w-full mb-1"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{attr.lowLabel}</span>
                      <span>{attr.highLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleSaveAndStart}
              disabled={!isValid || saving}
              className="flex-1 py-4 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-lg shadow-lg shadow-brand-500/25 hover:shadow-brand-500/35"
            >
              {saving
                ? 'Saving...'
                : editPersonaId
                ? 'Save Changes & Start'
                : 'Save & Start'}
            </button>

            <button
              type="submit"
              disabled={!isValid}
              className="flex-1 py-4 rounded-xl font-semibold text-slate-700 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-lg"
            >
              Start Without Saving
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
