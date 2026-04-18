'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { LastTestResult } from '@/contexts/SideNavContext';

type NavVariant = 'default' | 'profile' | 'chat';

interface SideNavProps {
  variant: NavVariant;
  /** For profile: which sub-tab is active */
  profileTab?: 'personality' | 'resume';
  /** For chat: Work or Life active */
  chatTab?: 'work' | 'life';
  onProfileTabChange?: (tab: 'personality' | 'resume') => void;
  onChatTabChange?: (tab: 'work' | 'life') => void;
  /** Chat-only: show Get Feedback section */
  onGetFeedback?: () => void;
  /** Chat-only: show Edit personality */
  onEditPersonality?: () => void;
  /** Chat: messages count for Get Feedback */
  messagesCount?: number;
  /** Profile: last test results */
  lastPersonalityTest?: LastTestResult | null;
  lastMbtiTest?: LastTestResult | null;
}

export default function SideNav({
  variant,
  profileTab = 'personality',
  chatTab = 'work',
  onProfileTabChange,
  onChatTabChange,
  onGetFeedback,
  onEditPersonality,
  messagesCount = 0,
  lastPersonalityTest = null,
  lastMbtiTest = null,
}: SideNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItem = (
    label: string,
    href: string,
    icon: React.ReactNode,
    active?: boolean
  ) => (
    <button
      key={href}
      onClick={() => router.push(href)}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
        active || pathname === href
          ? 'bg-slate-100 text-slate-900'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {/* Global: Home */}
        {navItem(
          'Home',
          '/',
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        )}

        {/* Profile: My Profile section */}
        {navItem(
          'My Profile',
          '/profile',
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>,
          pathname.startsWith('/profile')
        )}

        {variant === 'profile' && pathname.startsWith('/profile') && (
          <div className="ml-3 mt-2 pl-3 border-l border-slate-200 space-y-4">
            {/* Section 1: Personality test */}
            <div>
              <p className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Personality test</p>
              <div className="mt-1.5 space-y-3">
                <div>
                  <button
                    onClick={() => onProfileTabChange?.('personality')}
                    className={`flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                      profileTab === 'personality'
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5" />
                    </svg>
                    Communication personality
                  </button>
                  <div className="ml-6 pl-2 mt-1 border-l border-slate-200">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Last test</p>
                    {lastPersonalityTest?.hasResult && lastPersonalityTest?.date ? (
                      <button
                        onClick={() => router.push('/profile/test/results')}
                        className="text-xs text-brand-600 hover:text-brand-700 hover:underline text-left"
                      >
                        {new Date(lastPersonalityTest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="ml-1 text-slate-400">→</span>
                      </button>
                    ) : (
                      <p className="text-xs text-slate-600">Not yet taken</p>
                    )}
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => router.push('/profile/mbti')}
                    className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm font-medium transition-colors text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5" />
                    </svg>
                    MBTI test
                  </button>
                  <div className="ml-6 pl-2 mt-1 border-l border-slate-200">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Last test</p>
                    {lastMbtiTest?.hasResult && lastMbtiTest?.date ? (
                      <button
                        onClick={() => router.push('/profile/mbti/results')}
                        className="text-xs text-violet-600 hover:text-violet-700 hover:underline text-left"
                      >
                        {new Date(lastMbtiTest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="ml-1 text-slate-400">→</span>
                      </button>
                    ) : (
                      <p className="text-xs text-slate-600">Not yet taken</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Prepare me for new job */}
            <div>
              <p className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">New job preparation</p>
              <div className="mt-1.5">
                <button
                  onClick={() => onProfileTabChange?.('resume')}
                  className={`flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                    profileTab === 'resume'
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006a2.18 2.18 0 00-.75-1.661M6.75 14.15v4.25c0 1.094.787 2.036 1.872 2.18 2.087.277 4.216.42 6.378.42s4.291-.143 6.378-.42c1.085-.144 1.872-1.086 1.872-2.18v-4.25m-16.5 0a2.18 2.18 0 01-.75-1.661V8.706c0-1.081.768-2.015 1.837-2.175a48.114 48.114 0 013.413-.387m-4.5 8.006a2.18 2.18 0 01.75-1.661" />
                  </svg>
                  Prepare me for new job
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat: Work | Life when on chat */}
        {variant === 'chat' && pathname === '/chat' && (
          <>
            <div className="pt-3 mt-3 border-t border-slate-200">
              <p className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Chat</p>
              <div className="flex gap-1 mt-2 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => onChatTabChange?.('work')}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    chatTab === 'work' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Work
                </button>
                <button
                  onClick={() => onChatTabChange?.('life')}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    chatTab === 'life' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Life
                </button>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-200 space-y-2">
              <button
                onClick={() => onGetFeedback?.()}
                disabled={messagesCount < 2}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-amber-50 text-amber-800 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Get Feedback
                {messagesCount > 0 && (
                  <span className="ml-auto text-xs bg-amber-200/60 px-1.5 py-0.5 rounded-full">
                    {messagesCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => onEditPersonality?.()}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-700 hover:bg-slate-50"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                Edit personality
              </button>
            </div>
          </>
        )}
      </nav>
    </aside>
  );
}
