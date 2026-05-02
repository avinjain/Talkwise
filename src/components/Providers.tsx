'use client';

import { SessionProvider } from 'next-auth/react';
import { SideNavProvider } from '@/contexts/SideNavContext';
import { ConfigureSidebarSlotProvider } from '@/contexts/ConfigureSidebarSlotContext';
import AppShell from './AppShell';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SideNavProvider>
        <ConfigureSidebarSlotProvider>
          <AppShell>{children}</AppShell>
        </ConfigureSidebarSlotProvider>
      </SideNavProvider>
    </SessionProvider>
  );
}
