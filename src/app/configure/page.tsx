'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
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
  const [userName, setUserName] = useState('');
  const [editPersonaId, setEditPersonaId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [track, setTrack] = useState<Track>('professional');

  const [name, setName] = useState('');
  const [traits, setTraits] = useState<Record<string, number>>({
    ...DEFAULT_PROFESSIONAL_TRAITS,
    ...DEFAULT_PERSONAL_TRAITS,
  });

  useEffect(() => {
    const stored = sessionStorage.getItem('userName');
    if (!stored) {
      router.push('/');
      return;
    }
    setUserName(stored);

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
  }, [router]);

  const handleSliderChange = (key: string, value: number) => {
    setTraits((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    try {
      const body = {
        track,
        name: name.trim(),
        goal: '',
        scenario: '',
        // Professional traits
        difficultyLevel: traits.difficultyLevel,
        decisionOrientation: traits.decisionOrientation,
        communicationStyle: traits.communicationStyle,
        authorityPosture: traits.authorityPosture,
        temperamentStability: traits.temperamentStability,
        socialPresence: traits.socialPresence,
        // Personal traits
        interestLevel: traits.interestLevel,
        flirtatiousness: traits.flirtatiousness,
        communicationEffort: traits.communicationEffort,
        emotionalOpenness: traits.emotionalOpenness,
        humorStyle: traits.humorStyle,
        pickiness: traits.pickiness,
      };

      let res: Response;
      if (editPersonaId) {
        res = await fetch(`/api/personas/${editPersonaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
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

      sessionStorage.removeItem('editPersonaId');
      sessionStorage.removeItem('editPersonaData');
      router.push('/');
    } catch (err) {
      console.error('Failed to save persona:', err);
      alert('Failed to save persona. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const attributes = getPersonaAttributes(track);

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
              Edit <span className="text-gradient">{name || 'Persona'}</span>
            </>
          ) : (
            <>
              Hey <span className="text-gradient">{userName}</span>, build a persona
            </>
          )}
        </h1>
        <p className="text-slate-500 mb-8">
          {track === 'personal'
            ? "Give them a name and shape their dating personality."
            : "Give them a name and shape their professional personality."}
        </p>

        {/* Track selector (only for new personas) */}
        {!editPersonaId && (
          <div className="flex bg-slate-100 rounded-lg p-1 mb-8">
            <button
              onClick={() => setTrack('professional')}
              className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                track === 'professional'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              💼 Professional
            </button>
            <button
              onClick={() => setTrack('personal')}
              className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                track === 'personal'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              💬 Personal / Dating
            </button>
          </div>
        )}

        <div className="space-y-8">
          {/* ── Persona Name ── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {track === 'personal' ? "Who are they?" : "Who is this person?"}{' '}
              <span className="text-brand-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                track === 'personal'
                  ? 'e.g., Emma, 26, loves hiking and coffee'
                  : 'e.g., Sarah Chen, VP of Engineering'
              }
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all shadow-sm"
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
              {track === 'personal'
                ? 'Shape their dating personality — how interested, flirty, and open they are.'
                : 'Adjust each slider to shape their personality. The trait name updates as you drag.'}
            </p>

            <div className="space-y-7">
              {attributes.map((attr) => {
                const value = traits[attr.key] ?? 5;
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

          {/* ── Save Button ── */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-lg shadow-lg shadow-brand-500/25 hover:shadow-brand-500/35"
          >
            {saving
              ? 'Saving...'
              : editPersonaId
              ? 'Save Changes'
              : 'Save Persona'}
          </button>
        </div>
      </div>
    </div>
  );
}
