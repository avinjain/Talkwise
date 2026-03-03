'use client';

import { useRouter } from 'next/navigation';
import Logo from './Logo';
import ProfileDropdown from './ProfileDropdown';

interface AppHeaderProps {
  backHref?: string;
  backLabel?: string;
}

export default function AppHeader({ backHref, backLabel }: AppHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-white">
      <div className="flex items-center gap-3">
        {backHref ? (
          <button
            onClick={() => router.push(backHref)}
            className="text-slate-400 hover:text-slate-700 text-sm transition-colors"
          >
            &larr; {backLabel || 'Back'}
          </button>
        ) : (
          <Logo size={36} />
        )}
      </div>
      <ProfileDropdown />
    </header>
  );
}
