'use client';

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
 * On focused, full-screen flows (auth, conversation start, the personality
 * tests themselves) we hide everything so the page can take over.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
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
      <TopBar />
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
          />
        )}
        <main className="flex-1 min-w-0 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
