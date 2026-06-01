/** Shared time-range keys for the admin usage dashboard. */

export type AdminWindow = 'today' | '7d' | '30d' | 'all';

const DAY = 86400;

export const ADMIN_WINDOWS: { id: AdminWindow; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: 'all', label: 'All time' },
];

export function parseAdminWindow(raw: string | null | undefined): AdminWindow {
  if (raw === 'today' || raw === '7d' || raw === '30d' || raw === 'all') return raw;
  return '30d';
}

export function adminWindowSeconds(window: AdminWindow): number | undefined {
  switch (window) {
    case 'today':
      return DAY;
    case '7d':
      return 7 * DAY;
    case '30d':
      return 30 * DAY;
    case 'all':
      return undefined;
  }
}

export function adminWindowLabel(window: AdminWindow): string {
  switch (window) {
    case 'today':
      return 'Today';
    case '7d':
      return 'Last 7 days';
    case '30d':
      return 'Last 30 days';
    case 'all':
      return 'All time';
  }
}

/** How many daily buckets to show in the trend chart for each window. */
export function adminWindowChartDays(window: AdminWindow): number {
  switch (window) {
    case 'today':
      return 1;
    case '7d':
      return 7;
    case '30d':
      return 30;
    case 'all':
      return 90;
  }
}

/** SQL predicate for filtering a datetime column to the selected admin window. */
export function adminWindowWhere(column: string, window: AdminWindow): string {
  switch (window) {
    case 'today':
      return `date(${column}) = date('now')`;
    case '7d':
      return `${column} >= datetime('now', '-7 days')`;
    case '30d':
      return `${column} >= datetime('now', '-30 days')`;
    case 'all':
      return '1=1';
  }
}
