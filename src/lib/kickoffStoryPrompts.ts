import type { KickoffSummary } from '@/lib/kickoff';

/** Used when no kickoff summary is available (e.g. Interview prep without Prepare). */
export const GENERIC_STORY_PROMPTS: string[] = [
  'Describe a concrete win from the last 12–18 months: what was at stake, what you did, and the measurable outcome.',
  'Tell about a time you disagreed with a stakeholder or teammate. How did you handle it and what happened?',
  'Describe a tough trade-off or prioritization call you owned.',
  'Why this role at this moment — what are you optimizing for in your next step?',
];

/**
 * Derives a short list of prompts so the candidate drafts rough stories before polish / speaking points.
 */
export function buildKickoffStoryPrompts(summary: KickoffSummary): string[] {
  const out: string[] = [];

  for (const s of summary.profile.storySeeds.slice(0, 4)) {
    const t = s.trim();
    if (t)
      out.push(
        `Build a STAR-style story from this resume seed (situation → task → action → result): "${t}"`
      );
  }
  for (const g of summary.profile.narrativeGaps.slice(0, 3)) {
    const t = g.trim();
    if (t) out.push(`Prepare a concise story that addresses this narrative gap: "${t}"`);
  }
  for (const c of summary.profile.likelyConcerns.slice(0, 2)) {
    const t = c.trim();
    if (t)
      out.push(
        `Anticipate this interviewer concern with proof from your experience — jot bullets first: "${t}"`
      );
  }

  let i = 0;
  while (out.length < 4 && i < GENERIC_STORY_PROMPTS.length) {
    out.push(GENERIC_STORY_PROMPTS[i]);
    i += 1;
  }

  return out.slice(0, 6);
}
