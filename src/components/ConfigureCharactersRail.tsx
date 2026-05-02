'use client';

import type { SavedPersona } from '@/lib/types';

const RAIL_EDIT_ICON = (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
    />
  </svg>
);

/** Compact list for the app side nav on /configure (Work + Life personas only). */
export function ConfigureCharactersRail({
  personas,
  loading,
  currentEditId,
  onEditPersona,
  onStartConversation,
}: {
  personas: SavedPersona[];
  loading: boolean;
  currentEditId: string | null;
  onEditPersona: (p: SavedPersona) => void;
  onStartConversation: (p: SavedPersona) => void;
}) {
  const workLife = personas.filter((p) => p.track === 'professional' || p.track === 'personal');

  if (loading) {
    return <p className="px-3 text-xs text-slate-400">Loading…</p>;
  }

  if (workLife.length === 0) {
    return (
      <p className="px-3 text-[11px] leading-relaxed text-slate-500">
        No saved Work or Life characters yet. Save one after you finish building.
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {workLife.map((p) => {
        const life = p.track === 'personal';
        const selected = currentEditId === p.id;
        const startTone = life
          ? 'bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600'
          : 'bg-brand-600 hover:bg-brand-700';

        return (
          <li key={p.id}>
            <div
              className={`flex min-w-0 items-center gap-1 rounded-lg px-2 py-1.5 transition-colors ${
                selected ? 'bg-slate-100 ring-1 ring-slate-200/80' : 'hover:bg-slate-50'
              }`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full shadow-sm ${
                  life
                    ? 'bg-gradient-to-br from-pink-500 to-orange-400'
                    : 'bg-gradient-to-br from-brand-500 to-accent-500'
                }`}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800" title={p.name}>
                {p.name}
              </span>
              <button
                type="button"
                onClick={() => onEditPersona(p)}
                className="touch-manipulation shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
                aria-label={`Edit ${p.name}`}
                title="Edit persona"
              >
                {RAIL_EDIT_ICON}
              </button>
              <button
                type="button"
                onClick={() => onStartConversation(p)}
                className={`touch-manipulation shrink-0 rounded-md px-2 py-1 text-center text-[11px] font-semibold text-white transition-colors ${startTone}`}
                aria-label={`Start conversation with ${p.name}`}
                title="Start conversation"
              >
                Start
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
