'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SideNav from './SideNav';
import TopBar from './TopBar';
import { useSideNav } from '@/contexts/SideNavContext';

/**
 * Layout chrome for the app:
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │  TopBar (logo + TalkWise + profile/auth)               │  ← always
 *   ├──────────┬─────────────────────────────────────────────┤
 *   │ SideNav  │ <main>                                      │
 *   │  (when   │   route content                             │
 *   │  logged  │                                             │
 *   │  in)     │                                             │
 *   └──────────┴─────────────────────────────────────────────┘
 *
 * On mobile, SideNav becomes a drawer toggled from TopBar (< lg breakpoint).
 *
 * On focused, full-screen flows (auth, conversation start, the personality
 * tests themselves) we hide everything so the page can take over.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const {
    variant,
    profileTab,
    chatTab,
    setProfileTab,
    setChatTab,
    onGetFeedback,
    onEditPersonality,
    messagesCount,
    lastPersonalityTest,
    lastMbtiTest,
  } = useSideNav();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen || !session) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen, session]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen]);

  const isFullScreen =
    pathname.startsWith('/auth') ||
    pathname.startsWith('/start') ||
    pathname.startsWith('/profile/test') ||
    pathname === '/profile/mbti';

  if (isFullScreen) {
    return <>{children}</>;
  }

  const showSideNav = !!session;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <TopBar onOpenMobileNav={showSideNav ? () => setMobileNavOpen(true) : undefined} />
      <div className="flex flex-1">
        {showSideNav && (
          <SideNav
            variant={variant}
            profileTab={profileTab}
            chatTab={chatTab}
            onProfileTabChange={setProfileTab}
            onChatTabChange={setChatTab}
            onGetFeedback={onGetFeedback}
            onEditPersonality={onEditPersonality}
            messagesCount={messagesCount}
            lastPersonalityTest={lastPersonalityTest}
            lastMbtiTest={lastMbtiTest}
            mobileOpen={mobileNavOpen}
            onMobileClose={() => setMobileNavOpen(false)}
          />
        )}
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
