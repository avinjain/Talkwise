'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ProfileTab = 'personality' | 'resume';
type ChatTab = 'work' | 'life';

interface SideNavContextValue {
  variant: 'default' | 'profile' | 'chat';
  profileTab: ProfileTab;
  chatTab: ChatTab;
  setProfileTab: (tab: ProfileTab) => void;
  setChatTab: (tab: ChatTab) => void;
  setVariant: (v: 'default' | 'profile' | 'chat') => void;
  onGetFeedback?: () => void;
  onEditPersonality?: () => void;
  setOnGetFeedback: (fn: (() => void) | undefined) => void;
  setOnEditPersonality: (fn: (() => void) | undefined) => void;
  messagesCount: number;
  setMessagesCount: (n: number) => void;
}

const defaultContext: SideNavContextValue = {
  variant: 'default',
  profileTab: 'personality',
  chatTab: 'work',
  setProfileTab: () => {},
  setChatTab: () => {},
  setVariant: () => {},
  setOnGetFeedback: () => {},
  setOnEditPersonality: () => {},
  messagesCount: 0,
  setMessagesCount: () => {},
};

const SideNavContext = createContext<SideNavContextValue>(defaultContext);

export function SideNavProvider({ children }: { children: ReactNode }) {
  const [variant, setVariant] = useState<'default' | 'profile' | 'chat'>('default');
  const [profileTab, setProfileTab] = useState<ProfileTab>('personality');
  const [chatTab, setChatTab] = useState<ChatTab>('work');
  const [onGetFeedback, setOnGetFeedbackState] = useState<(() => void) | undefined>();
  const [onEditPersonality, setOnEditPersonalityState] = useState<(() => void) | undefined>();
  const [messagesCount, setMessagesCount] = useState(0);

  const setOnGetFeedback = useCallback((fn: (() => void) | undefined) => {
    setOnGetFeedbackState(() => fn);
  }, []);

  const setOnEditPersonality = useCallback((fn: (() => void) | undefined) => {
    setOnEditPersonalityState(() => fn);
  }, []);

  return (
    <SideNavContext.Provider
      value={{
        variant,
        profileTab,
        chatTab,
        setProfileTab,
        setChatTab,
        setVariant,
        onGetFeedback,
        onEditPersonality,
        setOnGetFeedback,
        setOnEditPersonality,
        messagesCount,
        setMessagesCount,
      }}
    >
      {children}
    </SideNavContext.Provider>
  );
}

export function useSideNav() {
  return useContext(SideNavContext);
}
