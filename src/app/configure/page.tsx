'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

function PersonalitySnapshot({
  attributes,
  traits,
  name,
  isLife,
  className = '',
}: {
  attributes: ReturnType<typeof getPersonaAttributes>;
  traits: Record<string, number>;
  name: string;
  isLife: boolean;
  className?: string;
}) {
  const values = attributes.map((a) => traits[a.key] ?? 5);
  const avg = values.reduce((s, v) => s + v, 0) / Math.max(values.length, 1);
  const pct = (avg / 10) * 100;

  let headline = 'Balanced presence';
  let sub =
    'Traits sit near the middle — flexible reactions without leaning hard toward extremes.';
  if (avg <= 3.5) {
    headline = 'Soft baseline';
    sub =
      'Lower-intensity defaults — gentler edges and more forgiving behaviours overall.';
  } else if (avg >= 7) {
    headline = 'Strong signal';
    sub =
      'Higher-intensity tendencies — more decisive flavour and sharper contrasts between behaviours.';
  }

  const shellClass = isLife
    ? 'border-orange-200/90 bg-gradient-to-b from-orange-50/50 via-white to-white shadow-orange-500/10'
    : 'border-brand-200/90 bg-gradient-to-b from-brand-50/50 via-white to-white shadow-brand-500/10';

  const barFill = isLife ? 'bg-gradient-to-r from-pink-400 to-orange-400' : 'bg-gradient-to-r from-brand-400 to-accent-500';

  const label = name.trim() ? name.trim() : 'This character';

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${shellClass} ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Live preview</p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">How they&apos;re shaping up</h2>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        A readout of how sliders combine — it updates as you adjust each trait.
      </p>

      <div className="mt-4 rounded-xl border border-slate-100/90 bg-white/90 px-3 py-3 backdrop-blur-[2px]">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-sm font-semibold text-slate-900">{headline}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">{sub}</p>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <span>Overall intensity</span>
            <span className="tabular-nums text-slate-500">{avg.toFixed(1)} / 10</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-[width] duration-200 ease-out ${barFill}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Trait mix</p>
        {attributes.map((attr) => {
          const v = traits[attr.key] ?? 5;
          const w = (v / 10) * 100;
          return (
            <div key={attr.key}>
              <div className="mb-1 flex justify-between gap-2 text-[11px] text-slate-600">
                <span className="min-w-0 truncate font-medium">{attr.label}</span>
                <span className="shrink-0 tabular-nums text-slate-400">{v}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full opacity-[0.92] transition-[width] duration-150 ease-out ${barFill}`}
                  style={{ width: `${w}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
      router.push('/home');
    } catch (err) {
      console.error('Failed to save persona:', err);
      setSaveError(err instanceof Error ? err.message : 'Network error. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const attributes = getPersonaAttributes(track);
  const isLife = track === 'personal';

  const traitPillClass = isLife
    ? 'bg-gradient-to-r from-pink-50 to-orange-50 text-orange-950 ring-1 ring-orange-200/70'
    : 'bg-brand-50 text-brand-800 ring-1 ring-brand-100/90';

  const sliderThemeClass = isLife ? 'slider-theme-life' : 'slider-theme-work';

  const nameFocusClass = isLife
    ? 'focus:border-orange-400 focus:ring-orange-400/25'
    : 'focus:border-brand-500 focus:ring-brand-500/20';

  const primaryCtaClass = isLife
    ? 'bg-gradient-to-r from-pink-500 to-orange-500 shadow-orange-500/25 hover:from-pink-600 hover:to-orange-600'
    : 'bg-gradient-brand shadow-brand-500/25 hover:bg-gradient-brand-hover';

  const snapshotProps = { attributes, traits, name, isLife };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60">
      <div className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          <div className="min-w-0 flex-1 lg:max-w-xl">
            <header className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Practice conversations
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {editPersonaId ? (
                <>
                  Edit <span className="text-gradient">{name || 'character'}</span>
                </>
              ) : (
                <>Build a character</>
              )}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {track === 'personal'
                ? 'Give them a name and set how they act in social situations.'
                : 'Give them a name and set how they behave at work.'}
            </p>
          </header>

          {!editPersonaId && (
            <div className="mb-8">
              <p className="mb-3 text-xs font-medium text-slate-600">Track</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTrack('professional')}
                  className={`relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                    track === 'professional'
                      ? 'border-brand-500 bg-white shadow-sm ring-1 ring-brand-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      track === 'professional'
                        ? 'bg-gradient-to-br from-brand-500 to-accent-500 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m-12.5 8.006a2.18 2.18 0 00.75-1.661V8.706c0-1.081.768-2.015 1.837-2.175a48.114 48.114 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894" />
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-semibold ${track === 'professional' ? 'text-slate-900' : 'text-slate-600'}`}
                    >
                      Work
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">Career &amp; workplace</span>
                  </span>
                  {track === 'professional' && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTrack('personal')}
                  className={`relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                    track === 'personal'
                      ? 'border-pink-400 bg-white shadow-sm ring-1 ring-pink-400/25'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      track === 'personal'
                        ? 'bg-gradient-to-br from-pink-400 to-orange-400 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.6A7.97 7.97 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-sm font-semibold ${track === 'personal' ? 'text-slate-900' : 'text-slate-600'}`}>
                      Life
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">Dating &amp; social</span>
                  </span>
                  {track === 'personal' && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-orange-400 text-white">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mb-8">
            <label htmlFor="persona-name" className="mb-2 block text-xs font-medium text-slate-600">
              Name
            </label>
            <input
              id="persona-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                track === 'personal'
                  ? 'e.g., Emma — outgoing, values honesty'
                  : 'e.g., Sarah Chen, VP of Engineering'
              }
              className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${nameFocusClass}`}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-sm font-semibold text-slate-900">How do they behave?</h2>

            <div className="space-y-6">
              {attributes.map((attr) => {
                const value = traits[attr.key] ?? 5;
                const traitName = attr.traitNames[value];

                return (
                  <div key={attr.key} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-slate-700">{attr.label}</span>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${traitPillClass}`}>
                        {traitName}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={value}
                      onChange={(e) => handleSliderChange(attr.key, Number(e.target.value))}
                      className={`h-2 w-full cursor-pointer touch-manipulation ${sliderThemeClass}`}
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                      <span>{attr.lowLabel}</span>
                      <span>{attr.highLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <PersonalitySnapshot {...snapshotProps} className="lg:hidden" />

          {saveError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{saveError}</div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className={`mt-6 w-full rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40 ${primaryCtaClass}`}
          >
            {saving ? 'Saving...' : editPersonaId ? 'Save changes' : 'Finish building'}
          </button>
          </div>

          <aside className="mx-auto hidden w-full max-w-md shrink-0 lg:sticky lg:top-[calc(3.5rem+1.5rem)] lg:block lg:max-w-[380px] lg:self-start">
            <PersonalitySnapshot {...snapshotProps} />
          </aside>
        </div>
      </div>
    </div>
  );
}
