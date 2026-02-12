'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { SavedPersona, Track } from '@/lib/types';

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [personas, setPersonas] = useState<SavedPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTrack, setActiveTrack] = useState<Track>('professional');

  const fetchPersonas = useCallback(async () => {
    try {
      const res = await fetch('/api/personas');
      if (res.ok) {
        const data = await res.json();
        setPersonas(data);
      }
    } catch (err) {
      console.error('Failed to fetch personas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.name) {
      sessionStorage.setItem('userName', session.user.name);
    }
    if (session) {
      fetchPersonas();
    }
  }, [session, fetchPersonas]);

  // Re-fetch personas when the page becomes visible (e.g., navigating back)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && session) {
        fetchPersonas();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Also re-fetch on focus (covers back-navigation within the app)
    const handleFocus = () => {
      if (session) fetchPersonas();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [session, fetchPersonas]);

  const handleDeletePersona = async (id: string) => {
    if (!confirm('Delete this persona?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/personas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPersonas((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete persona:', err);
    } finally {
      setDeleting(null);
    }
  };

  const filteredPersonas = personas.filter(
    (p) => (p.track || 'professional') === activeTrack
  );

  // Click persona → go to /start to pick a scenario
  const handleSelectPersona = (persona: SavedPersona) => {
    sessionStorage.setItem('userName', session?.user?.name || 'there');
    sessionStorage.setItem(
      'startPersonaData',
      JSON.stringify({
        track: persona.track || 'professional',
        name: persona.name,
        difficultyLevel: persona.difficultyLevel,
        decisionOrientation: persona.decisionOrientation,
        communicationStyle: persona.communicationStyle,
        authorityPosture: persona.authorityPosture,
        temperamentStability: persona.temperamentStability,
        socialPresence: persona.socialPresence,
        interestLevel: persona.interestLevel,
        flirtatiousness: persona.flirtatiousness,
        communicationEffort: persona.communicationEffort,
        emotionalOpenness: persona.emotionalOpenness,
        humorStyle: persona.humorStyle,
        pickiness: persona.pickiness,
      })
    );
    router.push('/start');
  };

  // Edit persona → go to /configure to change personality
  const handleEditPersona = (persona: SavedPersona) => {
    sessionStorage.setItem('userName', session?.user?.name || 'there');
    sessionStorage.setItem('editPersonaId', persona.id);
    sessionStorage.setItem(
      'editPersonaData',
      JSON.stringify({
        track: persona.track || 'professional',
        name: persona.name,
        difficultyLevel: persona.difficultyLevel,
        decisionOrientation: persona.decisionOrientation,
        communicationStyle: persona.communicationStyle,
        authorityPosture: persona.authorityPosture,
        temperamentStability: persona.temperamentStability,
        socialPresence: persona.socialPresence,
        interestLevel: persona.interestLevel,
        flirtatiousness: persona.flirtatiousness,
        communicationEffort: persona.communicationEffort,
        emotionalOpenness: persona.emotionalOpenness,
        humorStyle: persona.humorStyle,
        pickiness: persona.pickiness,
      })
    );
    router.push('/configure');
  };

  // Create new → go to /configure with the active track
  const handleCreateNew = () => {
    sessionStorage.setItem('userName', session?.user?.name || 'there');
    sessionStorage.removeItem('editPersonaId');
    sessionStorage.setItem('editPersonaData', JSON.stringify({ track: activeTrack }));
    router.push('/configure');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Logo size={80} className="animate-pulse" />
      </div>
    );
  }

  // ── Not logged in ──
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <Logo size={120} />

          <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-1 text-gradient">
            TalkWise
          </h1>

          <p className="text-xs font-medium tracking-widest uppercase text-slate-400 mb-6">
            Communication Training Platform
          </p>

          <p className="text-sm text-slate-500 text-center max-w-md mb-8 leading-relaxed">
            Simulate high-stakes conversations with AI personas. Build
            confidence before the real thing.
          </p>

          <button
            onClick={() => router.push('/auth')}
            className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-lg shadow-brand-500/25"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  // ── Logged in ──
  const userName = session.user?.name || 'there';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
        <Logo size={36} />
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{session.user?.email}</span>
          <button
            onClick={() => signOut()}
            className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Greeting + Track tabs row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <h1 className="text-xl font-bold text-slate-900">
              Hi, <span className="text-gradient">{userName}</span>
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setActiveTrack('professional')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTrack === 'professional'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  💼 Professional
                </button>
                <button
                  onClick={() => setActiveTrack('personal')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTrack === 'personal'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  💬 Personal
                </button>
              </div>
              <button
                onClick={handleCreateNew}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-sm"
              >
                + New
              </button>
            </div>
          </div>

          {/* Persona grid */}
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Loading...
            </div>
          ) : filteredPersonas.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-sm text-slate-400 mb-4">
                No {activeTrack === 'personal' ? 'dating' : 'professional'} personas yet.
              </p>
              <button
                onClick={handleCreateNew}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-sm"
              >
                Create First Persona
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPersonas.map((persona) => (
                <div
                  key={persona.id}
                  onClick={() => handleSelectPersona(persona)}
                  className="group relative p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-400 hover:shadow-md transition-all cursor-pointer"
                >
                  {/* Action buttons */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPersona(persona);
                      }}
                      className="w-6 h-6 rounded-full bg-slate-100 hover:bg-brand-100 text-slate-400 hover:text-brand-600 flex items-center justify-center transition-colors"
                      title="Edit"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePersona(persona.id);
                      }}
                      disabled={deleting === persona.id}
                      className="w-6 h-6 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
                      title="Delete"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 truncate pr-14 mb-1.5">
                    {persona.name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                      {persona.track === 'personal'
                        ? `Interest ${persona.interestLevel}/10`
                        : `Difficulty ${persona.difficultyLevel}/10`}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                      {persona.track === 'personal'
                        ? `Flirty ${persona.flirtatiousness}/10`
                        : `Direct ${persona.communicationStyle}/10`}
                    </span>
                  </div>
                  <div className="text-xs text-brand-600 font-medium group-hover:translate-x-0.5 transition-transform">
                    Start &rarr;
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
