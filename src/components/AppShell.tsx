'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SideNav from './SideNav';
import { useSideNav } from '@/contexts/SideNavContext';

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

  const hideSideNav =
    ['/auth', '/configure', '/start'].some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/profile/test') ||
    pathname === '/profile/mbti' || // test only; /profile/mbti/results shows nav
    !session;

  if (hideSideNav) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
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
      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  );
}
