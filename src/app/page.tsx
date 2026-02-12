'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session?.user?.name) {
      sessionStorage.setItem('userName', session.user.name);
    }
  }, [session]);

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

  const handleStart = () => {
    sessionStorage.setItem('userName', userName);
    router.push('/configure');
  };

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
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <Logo size={120} />

        <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-2 text-slate-900">
          Welcome back, <span className="text-gradient">{userName}</span>
        </h1>

        <p className="text-base text-slate-500 text-center max-w-md mb-8">
          Ready to practice? Choose a track and start a conversation.
        </p>

        {/* Track selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
          <button
            onClick={handleStart}
            className="group relative p-6 rounded-2xl border border-brand-500/20 bg-white hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/10 transition-all duration-300 text-left cursor-pointer shadow-sm"
          >
            <div className="absolute top-3 right-3 text-xs font-medium text-brand-700 bg-brand-100 px-2.5 py-1 rounded-full">
              Available
            </div>
            <div className="text-2xl mb-3">💼</div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Professional
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Practice promotions, tough feedback, stakeholder negotiations, and
              career conversations.
            </p>
            <div className="mt-4 text-brand-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
              Start practicing &rarr;
            </div>
          </button>

          <div className="relative p-6 rounded-2xl border border-slate-200 bg-white text-left opacity-50 cursor-not-allowed shadow-sm">
            <div className="absolute top-3 right-3 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              Coming Soon
            </div>
            <div className="text-2xl mb-3">💬</div>
            <h2 className="text-lg font-bold text-slate-400 mb-1">Personal</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Improve dating conversation skills, social banter, and
              interpersonal communication.
            </p>
            <div className="mt-4 text-slate-400 text-sm font-medium">
              In development
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-4 text-slate-400 text-xs">
        Built with OpenAI &middot; Talk wisely, talk confidently
      </footer>
    </div>
  );
}
