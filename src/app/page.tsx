'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { SavedPersona, Track, getPersonaAttributes } from '@/lib/types';

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [personas, setPersonas] = useState<SavedPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTrack, setActiveTrack] = useState<Track>('professional');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Show welcome banner if user hasn't dismissed it yet
  useEffect(() => {
    if (session?.user?.email) {
      const key = `talkwise_welcome_dismissed_${session.user.email}`;
      if (!localStorage.getItem(key)) {
        setShowWelcome(true);
      }
    }
  }, [session]);

  const dismissWelcome = () => {
    setShowWelcome(false);
    if (session?.user?.email) {
      localStorage.setItem(`talkwise_welcome_dismissed_${session.user.email}`, '1');
    }
  };

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
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
              {(session.user?.name || session.user?.email || '?')[0].toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:inline">
              {session.user?.name || session.user?.email}
            </span>
            <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50 z-20 py-1 overflow-hidden">
                {/* User info */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {session.user?.email}
                  </p>
                </div>

                {/* Menu items */}
                <button
                  onClick={() => { setMenuOpen(false); router.push('/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                  My Profile
                </button>

                <div className="border-t border-slate-100" />

                <button
                  onClick={() => { setMenuOpen(false); signOut(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Greeting */}
          <h1 className="text-2xl font-bold text-slate-900 mb-6">
            Welcome back, <span className="text-gradient">{userName}</span>
          </h1>

          {/* ── Welcome Banner ── */}
          {showWelcome && (
            <div className="relative bg-gradient-to-br from-brand-50 via-white to-accent-50 border border-brand-200/50 rounded-2xl p-6 mb-8 shadow-sm">
              <button
                onClick={dismissWelcome}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                title="Dismiss"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </span>
                Here&apos;s what you can do on TalkWise
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">🎭</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Practice Real Conversations</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Chat with AI personas — bosses, clients, dates, and more</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">🎯</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Two Tracks</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Professional (negotiations, reviews) &amp; Personal (dating, social)</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">💾</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Save Your Personas</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Build reusable conversation partners with custom personality traits</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">📊</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Get AI Feedback</p>
                    <p className="text-xs text-slate-500 leading-relaxed">After each chat, receive personalized coaching on what to improve</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">🧠</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Know Your Style</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Take a 10-min personality test to discover your strengths</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">🚀</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Personalized Growth Plan</p>
                    <p className="text-xs text-slate-500 leading-relaxed">AI advice tailored to your role, goals, and personality profile</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Track Selector Cards ── */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Professional */}
            <button
              onClick={() => setActiveTrack('professional')}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                activeTrack === 'professional'
                  ? 'border-brand-500 bg-gradient-to-br from-brand-50 to-accent-50 shadow-md shadow-brand-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                  activeTrack === 'professional'
                    ? 'bg-gradient-to-br from-brand-500 to-accent-500 shadow-sm'
                    : 'bg-slate-100'
                }`}>
                  <span>{activeTrack === 'professional' ? '💼' : '💼'}</span>
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${
                    activeTrack === 'professional' ? 'text-slate-900' : 'text-slate-600'
                  }`}>
                    Professional
                  </h3>
                  <p className={`text-xs ${
                    activeTrack === 'professional' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    Workplace conversations
                  </p>
                </div>
              </div>
              <p className={`text-xs leading-relaxed ${
                activeTrack === 'professional' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Negotiations, reviews, feedback, conflict resolution
              </p>
              {activeTrack === 'professional' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gradient-brand flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>

            {/* Personal */}
            <button
              onClick={() => setActiveTrack('personal')}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                activeTrack === 'personal'
                  ? 'border-pink-400 bg-gradient-to-br from-pink-50 to-orange-50 shadow-md shadow-pink-400/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                  activeTrack === 'personal'
                    ? 'bg-gradient-to-br from-pink-400 to-orange-400 shadow-sm'
                    : 'bg-slate-100'
                }`}>
                  <span>💬</span>
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${
                    activeTrack === 'personal' ? 'text-slate-900' : 'text-slate-600'
                  }`}>
                    Personal
                  </h3>
                  <p className={`text-xs ${
                    activeTrack === 'personal' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    Dating & social
                  </p>
                </div>
              </div>
              <p className={`text-xs leading-relaxed ${
                activeTrack === 'personal' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                First messages, banter, getting to know people
              </p>
              {activeTrack === 'personal' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          </div>

          {/* ── Personas Section ── */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">
              {activeTrack === 'personal' ? 'Your Dating Personas' : 'Your Professional Personas'}
            </h2>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-sm"
            >
              + Create New
            </button>
          </div>

          {/* Persona grid */}
          {loading ? (
            <div className="text-center py-16 text-slate-400">
              Loading personas...
            </div>
          ) : filteredPersonas.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
              <div className="text-4xl mb-3">
                {activeTrack === 'personal' ? '💬' : '💼'}
              </div>
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
              {filteredPersonas.map((persona) => {
                const attrs = getPersonaAttributes(persona.track || 'professional');
                const isPersonal = persona.track === 'personal';
                const accentBorder = isPersonal ? 'border-l-pink-400' : 'border-l-brand-500';

                return (
                  <div
                    key={persona.id}
                    onClick={() => handleSelectPersona(persona)}
                    className={`group relative bg-white rounded-xl border border-slate-200 border-l-4 ${accentBorder} overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-200 cursor-pointer`}
                  >
                    {/* Card header */}
                    <div className="px-5 pt-4 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5 min-w-0 pr-16">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                            isPersonal
                              ? 'bg-pink-50 text-pink-500'
                              : 'bg-brand-50 text-brand-600'
                          }`}>
                            {isPersonal ? '💬' : '💼'}
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {persona.name}
                          </h3>
                        </div>

                        {/* Action buttons */}
                        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditPersona(persona); }}
                            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-brand-100 text-slate-400 hover:text-brand-600 flex items-center justify-center transition-colors"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePersona(persona.id); }}
                            disabled={deleting === persona.id}
                            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
                            title="Delete"
                          >
                            {deleting === persona.id ? (
                              <span className="text-xs">...</span>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Trait mini-bars */}
                    <div className="px-5 pb-3">
                      <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
                        {attrs.slice(0, 3).map((attr) => {
                          const value = (persona as unknown as Record<string, number>)[attr.key] ?? 5;
                          const traitName = attr.traitNames[value];
                          const barColor = isPersonal ? 'bg-pink-400' : 'bg-brand-500';
                          return (
                            <div key={attr.key}>
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[10px] text-slate-400 truncate">{attr.label}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${barColor}`}
                                    style={{ width: `${(value / 10) * 100}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-medium text-slate-500 w-14 text-right truncate">
                                  {traitName}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className={`px-5 py-2.5 border-t border-slate-100 ${
                      isPersonal
                        ? 'bg-gradient-to-r from-pink-50/50 to-transparent'
                        : 'bg-gradient-to-r from-brand-50/50 to-transparent'
                    }`}>
                      <span className={`text-xs font-semibold group-hover:translate-x-1 transition-transform inline-block ${
                        isPersonal ? 'text-pink-500' : 'text-brand-600'
                      }`}>
                        Start conversation &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
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
