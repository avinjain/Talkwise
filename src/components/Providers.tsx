'use client';

import { SessionProvider } from 'next-auth/react';
import { SideNavProvider } from '@/contexts/SideNavContext';
import AppShell from './AppShell';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SideNavProvider>
        <AppShell>{children}</AppShell>
      </SideNavProvider>
    </SessionProvider>
  );
}
