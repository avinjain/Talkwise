import type { KickoffSummary } from '@/lib/kickoff';

/** Behavioral angles recruiters often probe — surfaced explicitly in Stories to prepare. */
export const BEHAVIORAL_ARCHETYPE_PROMPTS: string[] = [
  'Failure / learning moment: a meaningful mistake or setback, what you learned, and how you applied it afterward.',
  'Stakeholder management: conflicting priorities across teams, leadership, or customers — how you aligned people and shipped.',
  'Trade-off or prioritization: a hard scope, timeline, quality, or cost call you owned — what you chose and how you communicated it.',
];

export interface StoryPromptSuggestion {
  /** Short, scannable label shown on the chip. */
  label: string;
  /** Guiding prompt used to prefill the story builder. */
  prompt: string;
}

/**
 * Standard behavioural story types interviewers reach for across roles. Shown in the
 * Story bank so candidates always have a baseline set to prepare, even before kickoff.
 */
export const STANDARD_STORY_TYPES: StoryPromptSuggestion[] = [
  {
    label: 'Biggest impact / project success',
    prompt:
      'A project you drove to a successful outcome — what was at stake, the specific moves you made, and the measurable result.',
  },
  {
    label: 'Failure / learning moment',
    prompt:
      'A meaningful mistake or setback — what went wrong, what you learned, and how you applied it afterward.',
  },
  {
    label: 'Tough stakeholder',
    prompt:
      'A difficult stakeholder or conflicting priorities across teams, leadership, or customers — how you aligned people and still shipped.',
  },
  {
    label: 'Conflict / disagreement',
    prompt: 'A time opinions clashed — how you handled it and what happened next.',
  },
  {
    label: 'Leadership / influence',
    prompt:
      'Leading or influencing without formal authority — how you got others to follow and what changed.',
  },
  {
    label: 'Hard trade-off',
    prompt:
      'A hard scope, timeline, quality, or cost call you owned — what you chose and how you communicated it.',
  },
  {
    label: 'Ambiguity / no playbook',
    prompt:
      'A situation with no clear path — how you created structure, made a decision, and drove progress.',
  },
  {
    label: 'Why this role / now',
    prompt: 'Why this role at this moment — what you are optimizing for in your next step.',
  },
];

/** Used when padding or no kickoff summary is available. */
export const GENERIC_STORY_PROMPTS: string[] = [
  'Concrete win from the last 12–18 months: what was at stake, what you did, and a measurable outcome.',
  'Why this role at this moment — what are you optimizing for in your next step?',
  'Disagreement or conflict: a time opinions clashed — how you handled it and what happened next.',
];

/**
 * Derives prompts so the candidate drafts rough stories before polish / speaking points.
 * Resume seeds stay short (STAR framing lives in the UI guide). Behavioral archetypes are included early.
 */
export function buildKickoffStoryPrompts(summary: KickoffSummary): string[] {
  const out: string[] = [];

  for (const s of summary.profile.storySeeds.slice(0, 2)) {
    const t = s.trim();
    if (t) out.push(t);
  }

  for (const p of BEHAVIORAL_ARCHETYPE_PROMPTS) {
    if (out.length >= 6) break;
    out.push(p);
  }

  for (const g of summary.profile.narrativeGaps.slice(0, 2)) {
    const t = g.trim();
    if (!t || out.length >= 6) continue;
    out.push(`Narrative gap to address with a concise story: "${t}"`);
  }
  for (const c of summary.profile.likelyConcerns.slice(0, 1)) {
    const t = c.trim();
    if (!t || out.length >= 6) continue;
    out.push(`Interviewer concern — jot proof from experience: "${t}"`);
  }

  let i = 0;
  while (out.length < 6 && i < GENERIC_STORY_PROMPTS.length) {
    out.push(GENERIC_STORY_PROMPTS[i]);
    i += 1;
  }

  return out.slice(0, 6);
}
