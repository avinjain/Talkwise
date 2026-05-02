'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { SavedPersona } from '@/lib/types';

export interface ConfigureSidebarSlotValue {
  personas: SavedPersona[];
  loading: boolean;
  currentEditId: string | null;
  onEditPersona: (p: SavedPersona) => void;
  onStartConversation: (p: SavedPersona) => void;
}

const ConfigureSidebarSlotContext = createContext<{
  slot: ConfigureSidebarSlotValue | null;
  setSlot: (value: ConfigureSidebarSlotValue | null) => void;
}>({
  slot: null,
  setSlot: () => {},
});

export function ConfigureSidebarSlotProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<ConfigureSidebarSlotValue | null>(null);
  return (
    <ConfigureSidebarSlotContext.Provider value={{ slot, setSlot }}>{children}</ConfigureSidebarSlotContext.Provider>
  );
}

export function useConfigureSidebarSlot() {
  return useContext(ConfigureSidebarSlotContext);
}
