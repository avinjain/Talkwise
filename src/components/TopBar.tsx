'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Logo from './Logo';
import ProfileDropdown from './ProfileDropdown';

/**
 * Global top bar: full-width brand + nav-aware actions.
 * Renders the owl + Talkwise wordmark on the left.
 * On small screens when logged in, a menu button opens the SideNav drawer.
 */
export default function TopBar({ onOpenMobileNav }: { onOpenMobileNav?: () => void }) {
  const router = useRouter();
  const { data: session } = useSession();
  const loggedIn = !!session;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
        {loggedIn && onOpenMobileNav ? (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="touch-manipulation rounded-lg p-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Open navigation menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        ) : null}
        <Link
          href={loggedIn ? '/home' : '/'}
          aria-label="Talkwise home"
          className="group flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-slate-50 sm:gap-2.5 sm:px-1.5"
        >
          <Logo size={28} />
          <span className="truncate text-base font-extrabold tracking-tight text-gradient">Talkwise</span>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {loggedIn ? (
          <ProfileDropdown />
        ) : (
          <>
            <button
              type="button"
              onClick={() => router.push('/auth')}
              className="touch-manipulation rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 sm:px-3.5 sm:py-1.5"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => router.push('/auth?mode=signup')}
              className="touch-manipulation whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 sm:px-3.5 sm:py-1.5 sm:text-sm"
            >
              Get started
            </button>
          </>
        )}
      </div>
    </header>
  );
}
