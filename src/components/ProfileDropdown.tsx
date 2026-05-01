'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ProfileDropdownProps {
  /** Compact: avatar + chevron only (no name) */
  compact?: boolean;
}

export default function ProfileDropdown({ compact = false }: ProfileDropdownProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!session?.user) return null;

  const handleSignOut = () => {
    setMenuOpen(false);
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
          {(session.user?.name || session.user?.email || '?')[0].toUpperCase()}
        </div>
        {!compact && (
          <span className="text-sm font-medium text-slate-700 hidden sm:inline">
            {session.user?.name || session.user?.email}
          </span>
        )}
        {compact && <span className="sr-only">Profile menu</span>}
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50 z-20 py-1 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900 truncate">{session.user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{session.user?.email}</p>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false);
                router.push('/profile');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
              Know yourself
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                router.push('/usage');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              My usage
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                router.push('/home');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Home
            </button>
            <div className="border-t border-slate-100" />
            <button
              onClick={handleSignOut}
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
  );
}
