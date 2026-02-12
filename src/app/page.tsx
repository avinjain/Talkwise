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
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
          <Logo size={200} />

          <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-2 text-gradient">
            TalkWise
          </h1>

          <p className="text-sm font-medium tracking-widest uppercase text-slate-400 mb-4">
            Communication Training Platform
          </p>

          <p className="text-base md:text-lg text-slate-500 text-center max-w-lg mb-8 leading-relaxed">
            Simulate high-stakes conversations with AI personas. Practice
            articulation, build confidence, and master your communication —
            before the real thing.
          </p>

          <button
            onClick={() => router.push('/auth')}
            className="px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-lg shadow-brand-500/25 text-lg"
          >
            Get Started
          </button>
        </div>

        <footer className="text-center py-4 text-slate-400 text-xs">
          Built with OpenAI &middot; Talk wisely, talk confidently
        </footer>
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
      <div className="flex-1 flex flex-col items-center px-6 py-8">
        <Logo size={100} />

        <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-2 text-slate-900">
          Welcome back, <span className="text-gradient">{userName}</span>
        </h1>

        <p className="text-base text-slate-500 text-center max-w-md mb-8">
          Select a saved persona or create a new one to start practicing.
        </p>

        {/* Saved Personas */}
        <div className="w-full max-w-3xl">
          {/* Track tabs */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTrack('professional')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTrack === 'professional'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                💼 Professional
              </button>
              <button
                onClick={() => setActiveTrack('personal')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
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
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-sm"
            >
              + Create New
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">
              Loading personas...
            </div>
          ) : filteredPersonas.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
              <div className="text-4xl mb-3">🎭</div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">
                No personas yet
              </h3>
              <p className="text-sm text-slate-400 mb-5">
                Create your first {activeTrack === 'personal' ? 'dating' : 'professional'} persona to start practicing.
              </p>
              <button
                onClick={handleCreateNew}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-md"
              >
                Create Your First Persona
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPersonas.map((persona) => (
                <div
                  key={persona.id}
                  className="group relative p-5 rounded-2xl border border-slate-200 bg-white hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/10 transition-all duration-300 shadow-sm"
                >
                  {/* Action buttons (top right) */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPersona(persona);
                      }}
                      className="w-7 h-7 rounded-full bg-slate-100 hover:bg-brand-100 text-slate-400 hover:text-brand-600 flex items-center justify-center transition-colors"
                      title="Edit persona"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePersona(persona.id);
                      }}
                      disabled={deleting === persona.id}
                      className="w-7 h-7 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
                      title="Delete persona"
                    >
                      {deleting === persona.id ? (
                        <span className="text-xs">...</span>
                      ) : (
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Card content — click to start */}
                  <div
                    className="cursor-pointer"
                    onClick={() => handleSelectPersona(persona)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{persona.track === 'personal' ? '💬' : '💼'}</span>
                      <h3 className="text-base font-bold text-slate-900 truncate pr-16">
                        {persona.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {persona.track === 'personal'
                          ? `Interest: ${persona.interestLevel}/10`
                          : `Difficulty: ${persona.difficultyLevel}/10`}
                      </span>
                    </div>

                    <div className="text-brand-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                      Start conversation &rarr;
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="text-center py-4 text-slate-400 text-xs">
        Built with OpenAI &middot; Talk wisely, talk confidently
      </footer>
    </div>
  );
}
