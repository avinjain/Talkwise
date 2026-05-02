/** Client-side checkpoints for the kickoff → stories → preparation → practice journey. */

export const INTERVIEW_PREP_WORKFLOW = {
  storiesDoneKey: 'talkwise.interviewWorkflow.storiesDone',
  /** Query flag when linking from the workflow stepper */
  queryFlag: 'workflow',
  /** Present after finishing kickoff — resume page shows link back to the plan */
  afterKickoffQuery: 'afterKickoff',
} as const;

/** Prepare — deep-link to Stories to prepare (drafts + STAR), not resume builder. */
export function resumeStoriesWorkflowHref(_options?: { afterKickoff?: boolean }): string {
  return '/prepare#stories-to-prepare';
}

export function markInterviewStoriesStepDone(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(INTERVIEW_PREP_WORKFLOW.storiesDoneKey, '1');
}

export function isInterviewStoriesStepDone(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(INTERVIEW_PREP_WORKFLOW.storiesDoneKey) === '1';
}

/** Used after kickoff — sessionStorage OR saved pitches / ack on server */
export async function userHasPersistedOrAckedStories(): Promise<boolean> {
  if (typeof window !== 'undefined' && isInterviewStoriesStepDone()) return true;
  try {
    const r = await fetch('/api/interview/speaking-points', { cache: 'no-store' });
    if (!r.ok) return false;
    const d = (await r.json()) as {
      pitches?: unknown;
      workflowStoriesAck?: unknown;
    };
    if (d.workflowStoriesAck === true) return true;
    return Array.isArray(d.pitches) && d.pitches.length > 0;
  } catch {
    return false;
  }
}
