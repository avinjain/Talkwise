'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { PERSONA_ATTRIBUTES } from '@/lib/types';

export default function ConfigurePage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [editPersonaId, setEditPersonaId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [traits, setTraits] = useState({
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

    // Load pre-filled data if available
    const storedConfig = sessionStorage.getItem('editPersonaData');
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        setName(parsed.name || '');
        setTraits({
          difficultyLevel: parsed.difficultyLevel ?? 5,
          decisionOrientation: parsed.decisionOrientation ?? 5,
          communicationStyle: parsed.communicationStyle ?? 5,
          authorityPosture: parsed.authorityPosture ?? 5,
          temperamentStability: parsed.temperamentStability ?? 5,
          socialPresence: parsed.socialPresence ?? 5,
        });
      } catch {
        // ignore parse errors
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
        name: name.trim(),
        goal: '',
        scenario: '',
        ...traits,
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

      // Clean up and go back to landing page
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
        <p className="text-slate-500 mb-10">
          Give them a name and shape their personality. You&apos;ll pick the
          conversation topic when you start.
        </p>

        <div className="space-y-8">
          {/* ── Persona Name ── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Who is this person?{' '}
              <span className="text-brand-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sarah Chen, VP of Engineering"
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
              Adjust each slider to shape their personality. The trait name
              updates as you drag.
            </p>

            <div className="space-y-7">
              {PERSONA_ATTRIBUTES.map((attr) => {
                const value = traits[attr.key as keyof typeof traits];
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
