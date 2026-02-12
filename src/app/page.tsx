'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { SavedPersona } from '@/lib/types';

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [personas, setPersonas] = useState<SavedPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const handleSelectPersona = (persona: SavedPersona) => {
    sessionStorage.setItem('userName', session?.user?.name || 'there');
    sessionStorage.setItem('editPersonaId', persona.id);
    sessionStorage.setItem(
      'personaConfig',
      JSON.stringify({
        name: persona.name,
        scenario: persona.scenario,
        userGoal: persona.goal,
        difficultyLevel: persona.difficultyLevel,
        decisionOrientation: persona.decisionOrientation,
        communicationStyle: persona.communicationStyle,
        authorityPosture: persona.authorityPosture,
        temperamentStability: persona.temperamentStability,
        socialPresence: persona.socialPresence,
      })
    );
    router.push('/configure');
  };

  const handleCreateNew = () => {
    sessionStorage.setItem('userName', session?.user?.name || 'there');
    sessionStorage.removeItem('editPersonaId');
    sessionStorage.removeItem('personaConfig');
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Your Personas
            </h2>
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
          ) : personas.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
              <div className="text-4xl mb-3">🎭</div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">
                No personas yet
              </h3>
              <p className="text-sm text-slate-400 mb-5">
                Create your first persona to start a practice conversation.
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
              {personas.map((persona) => (
                <div
                  key={persona.id}
                  className="group relative p-5 rounded-2xl border border-slate-200 bg-white hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/10 transition-all duration-300 shadow-sm"
                >
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePersona(persona.id);
                    }}
                    disabled={deleting === persona.id}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
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

                  <div
                    className="cursor-pointer"
                    onClick={() => handleSelectPersona(persona)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🎭</span>
                      <h3 className="text-base font-bold text-slate-900 truncate pr-8">
                        {persona.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full">
                        {persona.goal}
                      </span>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Difficulty: {persona.difficultyLevel}/10
                      </span>
                    </div>

                    {persona.scenario && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {persona.scenario}
                      </p>
                    )}

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
