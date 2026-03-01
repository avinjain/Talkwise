'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import AppHeader from '@/components/AppHeader';
import { SavedPersona, Track, getPersonaAttributes, ENABLE_INTERVIEW_PREP } from '@/lib/types';

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

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && session) {
        fetchPersonas();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
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
    if (!confirm('Delete this character?')) return;
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

  const handleCreateNew = () => {
    sessionStorage.setItem('userName', session?.user?.name || 'there');
    sessionStorage.removeItem('editPersonaId');
    sessionStorage.setItem('editPersonaData', JSON.stringify({ track: activeTrack }));
    if (activeTrack === 'interview') router.push('/interview/prep');
    else router.push('/configure');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Logo size={80} className="animate-pulse" />
      </div>
    );
  }

  // ════════════════════════════════════════════
  // PUBLIC LANDING PAGE (not logged in)
  // ════════════════════════════════════════════
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
          <Logo size={36} />
          <div className="flex gap-2">
            <button onClick={() => router.push('/auth')} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Sign in</button>
            <button onClick={() => router.push('/auth?mode=signup')} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover">Sign up</button>
          </div>
        </header>
        <div className="flex-shrink-0 px-6 pt-12 pb-10 text-center">
          <Logo size={100} />
          <h1 className="text-4xl md:text-5xl font-extrabold text-gradient mt-2 mb-2">
            TalkWise
          </h1>
          <p className="text-sm font-medium tracking-widest uppercase text-slate-400 mb-4">
            Your AI Communication Coach
          </p>
          <p className="text-base md:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed mb-8">
            Practice tough conversations before they happen — job interviews,
            salary talks, difficult dates, and more. Get real-time feedback
            to communicate with confidence.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <button
              onClick={() => router.push('/auth?callbackUrl=/configure')}
              className="px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-lg shadow-brand-500/25 text-base w-full sm:w-auto"
            >
              Create a character & start
            </button>
            {ENABLE_INTERVIEW_PREP && (
            <button
              onClick={() => router.push('/auth?callbackUrl=/interview/prep')}
              className="px-8 py-3.5 rounded-xl font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all text-base w-full sm:w-auto"
            >
              Interview prep
            </button>
            )}
            <button
              onClick={() => router.push('/auth?callbackUrl=/profile/test')}
              className="px-8 py-3.5 rounded-xl font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-all text-base w-full sm:w-auto"
            >
              Take the personality test
            </button>
          </div>
          <p className="text-xs text-slate-400">Free to use &middot; Sign in to get started</p>
        </div>

        {/* ── How It Works ── */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-12">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            How it works
          </h2>

          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto mb-3 shadow-md shadow-brand-500/20">
                <span className="text-2xl">🎭</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Create a character</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Build someone to practice with — a tough boss, a first date, a client. Set their personality with sliders.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto mb-3 shadow-md shadow-brand-500/20">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Have the conversation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pick a scenario — salary negotiation, conflict, small talk — and chat naturally with the AI character.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto mb-3 shadow-md shadow-brand-500/20">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Get feedback</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                AI reviews your conversation and tells you what you did well, what to improve, and gives a confidence score.
              </p>
            </div>
          </div>
        </div>

        {/* ── Features ── */}
        <div className="px-6 py-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
              What you can do
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xl mt-0.5">💼</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-0.5">Work conversations</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Salary talks, tough feedback, interviews, team conflicts</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xl mt-0.5">💬</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-0.5">Life conversations</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">First dates, awkward chats, making new friends</p>
                </div>
              </div>

              {ENABLE_INTERVIEW_PREP && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xl mt-0.5">🎤</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-0.5">Interview prep</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Mock interviews with 5-dimension scoring (Substance, Structure, Relevance, Credibility, Differentiation)</p>
                </div>
              </div>
              )}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xl mt-0.5">🧠</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-0.5">Personality test</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Discover your communication strengths and blind spots with a quick 8-minute test</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xl mt-0.5">📈</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-0.5">AI growth advice</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Get personalized recommendations based on your role, goals, and personality</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div className="bg-gradient-to-br from-brand-50 via-white to-accent-50 border-t border-brand-100 px-6 py-10 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Ready to practice?</h2>
          <p className="text-sm text-slate-500 mb-5">Sign in and start your first conversation in under a minute.</p>
          <button
            onClick={() => router.push('/auth')}
            className="px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-lg shadow-brand-500/25 text-base"
          >
            Get Started
          </button>
        </div>

        <footer className="text-center py-4 text-slate-400 text-xs">
          Practice makes confident &middot; Powered by AI
        </footer>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // LOGGED-IN DASHBOARD
  // ════════════════════════════════════════════
  const userName = session.user?.name || 'there';

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <div className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">
            Welcome back, <span className="text-gradient">{userName}</span>
          </h1>

          <div className={`grid gap-4 mb-8 ${ENABLE_INTERVIEW_PREP ? 'grid-cols-3' : 'grid-cols-2'}`}>
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
                  <span>💼</span>
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${
                    activeTrack === 'professional' ? 'text-slate-900' : 'text-slate-600'
                  }`}>Work</h3>
                  <p className={`text-xs ${
                    activeTrack === 'professional' ? 'text-slate-500' : 'text-slate-400'
                  }`}>Career &amp; workplace</p>
                </div>
              </div>
              <p className={`text-xs leading-relaxed ${
                activeTrack === 'professional' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Salary talks, tough feedback, interviews, team conflicts
              </p>
              {activeTrack === 'professional' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gradient-brand flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>

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
                  }`}>Life</h3>
                  <p className={`text-xs ${
                    activeTrack === 'personal' ? 'text-slate-500' : 'text-slate-400'
                  }`}>Dating &amp; social</p>
                </div>
              </div>
              <p className={`text-xs leading-relaxed ${
                activeTrack === 'personal' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                First dates, awkward chats, making new friends
              </p>
              {activeTrack === 'personal' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>

            {ENABLE_INTERVIEW_PREP && (
              <button
                onClick={() => setActiveTrack('interview')}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                  activeTrack === 'interview'
                    ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md shadow-amber-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    activeTrack === 'interview' ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm' : 'bg-slate-100'
                  }`}>🎤</div>
                  <div>
                    <h3 className={`text-sm font-bold ${activeTrack === 'interview' ? 'text-slate-900' : 'text-slate-600'}`}>Interview</h3>
                    <p className={`text-xs ${activeTrack === 'interview' ? 'text-slate-500' : 'text-slate-400'}`}>Job interviews</p>
                  </div>
                </div>
                <p className={`text-xs leading-relaxed ${activeTrack === 'interview' ? 'text-slate-500' : 'text-slate-400'}`}>
                  TMAY, behavioral, salary, system design
                </p>
                {activeTrack === 'interview' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            )}
          </div>

          {/* ── Personas Section ── */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">
              People you practice with
            </h2>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-sm"
            >
              + New character
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400">
              Loading...
            </div>
          ) : filteredPersonas.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
              <div className="text-4xl mb-3">
                {activeTrack === 'personal' ? '💬' : activeTrack === 'interview' ? '🎤' : '💼'}
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No one here yet</h3>
              <p className="text-sm text-slate-400 mb-5">
                Create a character to practice {activeTrack === 'personal' ? 'social' : activeTrack === 'interview' ? 'interview' : 'work'} conversations with.
              </p>
              <button
                onClick={handleCreateNew}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover transition-all shadow-md"
              >
                Create your first character
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPersonas.map((persona) => {
                const attrs = getPersonaAttributes(persona.track || 'professional');
                const isPersonal = persona.track === 'personal';
                const isInterview = persona.track === 'interview';
                const accentBorder = isPersonal ? 'border-l-pink-400' : isInterview ? 'border-l-amber-500' : 'border-l-brand-500';

                return (
                  <div
                    key={persona.id}
                    onClick={() => handleSelectPersona(persona)}
                    className={`group relative bg-white rounded-xl border border-slate-200 border-l-4 ${accentBorder} overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-200 cursor-pointer`}
                  >
                    <div className="px-5 pt-4 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5 min-w-0 pr-16">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                            isPersonal ? 'bg-pink-50 text-pink-500' : isInterview ? 'bg-amber-50 text-amber-600' : 'bg-brand-50 text-brand-600'
                          }`}>
                            {isPersonal ? '💬' : isInterview ? '🎤' : '💼'}
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {persona.name}
                          </h3>
                        </div>

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

                    <div className="px-5 pb-3">
                      <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
                        {attrs.slice(0, 3).map((attr) => {
                          const value = (persona as unknown as Record<string, number>)[attr.key] ?? 5;
                          const traitName = attr.traitNames[value];
                          const barColor = isPersonal ? 'bg-pink-400' : isInterview ? 'bg-amber-500' : 'bg-brand-500';
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

                    <div className={`px-5 py-2.5 border-t border-slate-100 ${
                      isPersonal ? 'bg-gradient-to-r from-pink-50/50 to-transparent' : isInterview ? 'bg-gradient-to-r from-amber-50/50 to-transparent' : 'bg-gradient-to-r from-brand-50/50 to-transparent'
                    }`}>
                      <span className={`text-xs font-semibold group-hover:translate-x-1 transition-transform inline-block ${
                        isPersonal ? 'text-pink-500' : isInterview ? 'text-amber-600' : 'text-brand-600'
                      }`}>
                        Start practicing &rarr;
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
        Practice makes confident &middot; Powered by AI
      </footer>
    </div>
  );
}
