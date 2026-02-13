'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { Track, getPersonaAttributes } from '@/lib/types';

const DEFAULT_PROFESSIONAL_TRAITS = {
  difficultyLevel: 5,
  decisionOrientation: 5,
  communicationStyle: 5,
  authorityPosture: 5,
  temperamentStability: 5,
  socialPresence: 5,
};

const DEFAULT_PERSONAL_TRAITS = {
  interestLevel: 5,
  flirtatiousness: 5,
  communicationEffort: 5,
  emotionalOpenness: 5,
  humorStyle: 5,
  pickiness: 5,
};

export default function ConfigurePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [editPersonaId, setEditPersonaId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [track, setTrack] = useState<Track>('professional');

  const [name, setName] = useState('');
  const [traits, setTraits] = useState<Record<string, number>>({
    ...DEFAULT_PROFESSIONAL_TRAITS,
    ...DEFAULT_PERSONAL_TRAITS,
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth?callbackUrl=/configure');
      return;
    }
    // Store userName for downstream pages
    if (session.user?.name) {
      sessionStorage.setItem('userName', session.user.name);
    }

    const personaId = sessionStorage.getItem('editPersonaId');
    if (personaId) {
      setEditPersonaId(personaId);
    }

    const storedConfig = sessionStorage.getItem('editPersonaData');
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        if (parsed.track) setTrack(parsed.track);
        if (parsed.name) setName(parsed.name);
        setTraits((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore
      }
    }
  }, [router, session, status]);

  const handleSliderChange = (key: string, value: number) => {
    setTraits((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaveError(null);

    try {
      const body = {
        track,
        name: name.trim(),
        goal: '',
        scenario: '',
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

      const url = editPersonaId ? `/api/personas/${editPersonaId}` : '/api/personas';
      const method = editPersonaId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
        setSaveError(err.error || `Failed to save (${res.status})`);
        setSaving(false);
        return;
      }

      sessionStorage.removeItem('editPersonaId');
      sessionStorage.removeItem('editPersonaData');
      router.push('/');
    } catch (err) {
      console.error('Failed to save persona:', err);
      setSaveError(err instanceof Error ? err.message : 'Network error. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const attributes = getPersonaAttributes(track);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader backHref="/" backLabel="Back" />
      <div className="flex-1 py-8 px-6">
      <div className="max-w-xl mx-auto">

        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {editPersonaId ? (
            <>Edit <span className="text-gradient">{name || 'character'}</span></>
          ) : (
            <>Create a character</>
          )}
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          {track === 'personal'
            ? 'Give them a name and set how they act in social situations.'
            : 'Give them a name and set how they behave at work.'}
        </p>

        {/* Track selector (new personas only) */}
        {!editPersonaId && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setTrack('professional')}
              className={`relative flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                track === 'professional'
                  ? 'border-brand-500 bg-brand-50/50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                track === 'professional' ? 'bg-gradient-to-br from-brand-500 to-accent-500' : 'bg-slate-100'
              }`}>
                💼
              </div>
              <div>
                <span className={`text-sm font-semibold ${track === 'professional' ? 'text-slate-900' : 'text-slate-600'}`}>
                  Work
                </span>
                <p className={`text-[10px] ${track === 'professional' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Career &amp; workplace
                </p>
              </div>
              {track === 'professional' && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-gradient-brand flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
            <button
              onClick={() => setTrack('personal')}
              className={`relative flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                track === 'personal'
                  ? 'border-pink-400 bg-pink-50/50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                track === 'personal' ? 'bg-gradient-to-br from-pink-400 to-orange-400' : 'bg-slate-100'
              }`}>
                💬
              </div>
              <div>
                <span className={`text-sm font-semibold ${track === 'personal' ? 'text-slate-900' : 'text-slate-600'}`}>
                  Life
                </span>
                <p className={`text-[10px] ${track === 'personal' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Dating &amp; social
                </p>
              </div>
              {track === 'personal' && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Persona Name */}
        <div className="mb-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              track === 'personal'
                ? 'e.g., Emma, 26, loves hiking and coffee'
                : 'e.g., Sarah Chen, VP of Engineering'
            }
            className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>

        {/* Personality Sliders */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            How do they behave?
          </h2>

          <div className="space-y-5">
            {attributes.map((attr) => {
              const value = traits[attr.key] ?? 5;
              const traitName = attr.traitNames[value];

              return (
                <div key={attr.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-600">
                      {attr.label}
                    </span>
                    <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                      {traitName}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={value}
                    onChange={(e) =>
                      handleSliderChange(attr.key, Number(e.target.value))
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>{attr.lowLabel}</span>
                    <span>{attr.highLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {saveError && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {saveError}
          </div>
        )}

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="w-full mt-4 py-3 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-500/20"
        >
          {saving
            ? 'Saving...'
            : editPersonaId
            ? 'Save changes'
            : 'Save character'}
        </button>
      </div>
      </div>
    </div>
  );
}
