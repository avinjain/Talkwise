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
  /** Profile: last test date and result */
  lastTestResult?: LastTestResult | null;
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
  lastTestResult = null,
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
          <div className="ml-3 mt-2 pl-3 border-l border-slate-200 space-y-2">
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
              Test your personality
            </button>
            <button
              onClick={() => onProfileTabChange?.('resume')}
              className={`flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                profileTab === 'resume'
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Resume and LinkedIn
            </button>

            {/* Last test result */}
            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last test</p>
              <div className="mt-1.5 px-2 py-2 rounded-lg bg-slate-50 border border-slate-100">
                {lastTestResult?.hasResult && lastTestResult?.date ? (
                  <p className="text-xs text-slate-600">
                    Completed {new Date(lastTestResult.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">Not yet taken</p>
                )}
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
