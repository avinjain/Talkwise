'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { LastTestResult } from '@/contexts/SideNavContext';
import { useConfigureSidebarSlot } from '@/contexts/ConfigureSidebarSlotContext';
import { ConfigureCharactersRail } from '@/components/ConfigureCharactersRail';

type NavVariant = 'default' | 'profile' | 'chat';

export interface SideNavProps {
  variant: NavVariant;
  profileTab?: 'personality' | 'resume';
  chatTab?: 'work' | 'life';
  onProfileTabChange?: (tab: 'personality' | 'resume') => void;
  onChatTabChange?: (tab: 'work' | 'life') => void;
  onGetFeedback?: () => void;
  onEditPersonality?: () => void;
  messagesCount?: number;
  lastPersonalityTest?: LastTestResult | null;
  lastMbtiTest?: LastTestResult | null;
  /** Controlled mobile drawer (desktop sidebar unchanged). */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function SideNav({
  mobileOpen,
  onMobileClose,
  variant,
  chatTab = 'work',
  onChatTabChange,
  onGetFeedback,
  onEditPersonality,
  messagesCount = 0,
}: SideNavProps) {
  const panelProps = {
    variant,
    chatTab,
    onChatTabChange,
    onGetFeedback,
    onEditPersonality,
    messagesCount,
  };

  return (
    <>
      {/* Desktop — lg+ */}
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 flex-col self-start border-r border-slate-200 bg-white lg:flex">
        <SideNavPanel {...panelProps} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[1px] lg:hidden"
            aria-label="Close navigation"
            onClick={onMobileClose}
          />
          <aside
            className="fixed left-0 top-14 z-50 flex max-h-[calc(100dvh-3.5rem)] w-[min(17.5rem,88vw)] flex-col border-r border-slate-200 bg-white shadow-2xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-nav-title"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2.5">
              <span id="mobile-nav-title" className="text-sm font-semibold text-slate-800">
                Menu
              </span>
              <button
                type="button"
                className="touch-manipulation rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100"
                aria-label="Close menu"
                onClick={onMobileClose}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,0)]">
              <SideNavPanel {...panelProps} onItemClick={onMobileClose} />
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}

type PanelProps = Omit<SideNavProps, 'mobileOpen' | 'onMobileClose'> & {
  onItemClick?: () => void;
};

function SideNavPanel({
  variant,
  chatTab = 'work',
  onChatTabChange,
  onGetFeedback,
  onEditPersonality,
  messagesCount = 0,
  onItemClick,
}: PanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { slot: configureSlot } = useConfigureSidebarSlot();

  const go = (href: string) => {
    router.push(href);
    onItemClick?.();
  };

  const isHome = pathname === '/home' || pathname === '/';
  const isPractice = pathname.startsWith('/configure');
  const isConversation = pathname === '/chat';
  const isPrepare = pathname.startsWith('/prepare');
  const isResume = pathname.startsWith('/resume');
  const isProfile = pathname.startsWith('/profile');

  const ChatBubbleIcon = (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.6A7.97 7.97 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  const ConversationIcon = (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337L5 21l1.395-3.72C5.512 15.042 5 13.574 5 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto p-3">
      <div className="space-y-0.5">
        <NavLink
          label="Home"
          active={isHome}
          onClick={() => go('/home')}
          icon={
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          }
        />
        <NavLink
          label="Practice conversations"
          active={isPractice}
          onClick={() => go('/configure')}
          icon={ChatBubbleIcon}
        />
        <NavLink
          label="Conversation"
          active={isConversation}
          onClick={() => go('/chat')}
          icon={ConversationIcon}
        />
        <NavLink
          label="Prepare for interview"
          active={isPrepare}
          onClick={() => go('/prepare')}
          icon={
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m-12.5 8.006a2.18 2.18 0 00.75-1.661V8.706c0-1.081.768-2.015 1.837-2.175a48.114 48.114 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894" />
            </svg>
          }
        />
        <NavLink
          label="Build my resume"
          active={isResume}
          onClick={() => go('/resume')}
          icon={
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
        <NavLink
          label="Know yourself"
          active={isProfile}
          onClick={() => go('/profile')}
          icon={
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          }
        />
      </div>

      {isPractice && configureSlot ? (
        <SectionGroup label="Start conversation">
          <ConfigureCharactersRail
            personas={configureSlot.personas}
            loading={configureSlot.loading}
            currentEditId={configureSlot.currentEditId}
            onEditPersona={(p) => {
              configureSlot.onEditPersona(p);
              onItemClick?.();
            }}
            onStartConversation={(p) => {
              configureSlot.onStartConversation(p);
              onItemClick?.();
            }}
          />
        </SectionGroup>
      ) : null}

      {variant === 'chat' && pathname === '/chat' && (
        <>
          <SectionGroup label="Chat">
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  onChatTabChange?.('work');
                }}
                className={`touch-manipulation flex-1 rounded-md px-3 py-2.5 text-xs font-medium transition-colors sm:py-1.5 ${
                  chatTab === 'work' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Work
              </button>
              <button
                type="button"
                onClick={() => {
                  onChatTabChange?.('life');
                }}
                className={`touch-manipulation flex-1 rounded-md px-3 py-2.5 text-xs font-medium transition-colors sm:py-1.5 ${
                  chatTab === 'life' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Life
              </button>
            </div>
          </SectionGroup>

          <SectionGroup label="Actions">
            <button
              type="button"
              onClick={() => {
                onGetFeedback?.();
                onItemClick?.();
              }}
              disabled={messagesCount < 2}
              className="flex w-full min-h-[44px] touch-manipulation items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Get feedback
              {messagesCount > 0 && (
                <span className="ml-auto rounded-full bg-amber-200/60 px-1.5 py-0.5 text-xs">{messagesCount}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                onEditPersonality?.();
                onItemClick?.();
              }}
              className="flex w-full min-h-[44px] touch-manipulation items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:min-h-0"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
              Edit personality
            </button>
          </SectionGroup>
        </>
      )}
    </nav>
  );
}

function NavLink({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full min-h-[44px] touch-manipulation items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors lg:min-h-0 ${
        active ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      <span className="leading-snug">{label}</span>
    </button>
  );
}

function SectionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      {children}
    </div>
  );
}
