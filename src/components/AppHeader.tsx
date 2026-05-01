'use client';

import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  /** Optional href for a "← Back" link rendered above the page content. */
  backHref?: string;
  /** Label shown next to the back arrow. Defaults to "Back". */
  backLabel?: string;
}

/**
 * Lightweight in-page sub-header. The global brand chrome (logo,
 * TalkWise wordmark, profile menu) lives in {@link TopBar}, so this
 * component now only renders an optional back affordance for nested
 * routes. Pages that don't need a back link can drop it entirely.
 */
export default function AppHeader({ backHref, backLabel }: AppHeaderProps) {
  const router = useRouter();

  if (!backHref) return null;

  return (
    <div className="border-b border-slate-100 bg-white/80 px-4 py-3 sm:px-6 sm:py-2.5">
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="touch-manipulation min-h-[44px] px-1 text-left text-sm text-slate-400 transition-colors hover:text-slate-700 sm:min-h-0"
      >
        &larr; {backLabel || 'Back'}
      </button>
    </div>
  );
}
