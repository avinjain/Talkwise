'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Logo from './Logo';
import ProfileDropdown from './ProfileDropdown';

/**
 * Global top bar: full-width brand + nav-aware actions.
 * Always renders the owl + TalkWise wordmark on the left so users
 * never lose orientation as they navigate between pages.
 */
export default function TopBar() {
  const router = useRouter();
  const { data: session } = useSession();
  const loggedIn = !!session;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:px-6">
      <Link
        href={loggedIn ? '/' : '/'}
        aria-label="TalkWise home"
        className="group flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-slate-50"
      >
        <Logo size={28} />
        <div className="flex flex-col leading-none">
          <span className="text-base font-extrabold tracking-tight text-gradient">TalkWise</span>
          <span className="hidden text-[10px] font-medium tracking-wide text-slate-400 sm:block">
            talkwise.life
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {loggedIn ? (
          <ProfileDropdown />
        ) : (
          <>
            <button
              onClick={() => router.push('/auth')}
              className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              Sign in
            </button>
            <button
              onClick={() => router.push('/auth?mode=signup')}
              className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              Get started
            </button>
          </>
        )}
      </div>
    </header>
  );
}
