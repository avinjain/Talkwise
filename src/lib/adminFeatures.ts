/**
 * Maps logged API endpoints to product features for the admin dashboard.
 * Pure (no deps) so it can run on server or client.
 */

export type FeatureId = 'conversations' | 'prep' | 'knowYourself' | 'other';

export const FEATURE_ORDER: FeatureId[] = ['conversations', 'prep', 'knowYourself', 'other'];

export const FEATURE_LABELS: Record<FeatureId, string> = {
  conversations: 'Conversations',
  prep: 'Prep interview',
  knowYourself: 'Know yourself',
  other: 'Other',
};

export function featureForEndpoint(endpoint: string): FeatureId {
  const e = (endpoint || '').toLowerCase();
  if (e.startsWith('/api/chat') || e.startsWith('/api/feedback')) return 'conversations';
  if (e.startsWith('/api/profile') || e.startsWith('/api/mbti')) return 'knowYourself';
  if (
    e.startsWith('/api/kickoff') ||
    e.startsWith('/api/coach') ||
    e.startsWith('/api/interview')
  ) {
    return 'prep';
  }
  return 'other';
}

/** Human-friendly label for an endpoint in the API-level breakdown. */
export function labelForEndpoint(endpoint: string): string {
  const cleaned = (endpoint || '').replace(/^\/api\//, '');
  if (!cleaned) return endpoint;
  return cleaned
    .split('/')
    .filter(Boolean)
    .map((seg) => seg.replace(/-/g, ' '))
    .join(' · ');
}
