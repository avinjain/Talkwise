// Bridges kickoff plan actions → persisted practice lens for chat/feedback (interview-coach-skill alignment).

import { canonicalKickoffPlanCommand, normalizeKickoffPlanCommand } from '@/lib/kickoff';

export interface PracticeCoachingFocusPayload {
  source: 'kickoff_go';
  /** Raw normalized token from the plan item */
  kickoffCommand: string;
  /** Canonical tag after aliases */
  canonicalCommand: string;
  planItemText: string;
  /** Paragraph injected into persona + feedback prompts */
  skillLens: string;
  targetRolesHint?: string;
  biggestConcernHint?: string;
}

export function buildPracticeCoachingFocusPayload(
  kickoffCommandRaw: unknown,
  planItemText: string,
  kickoff?: {
    target_roles?: string;
    biggest_concern?: string;
  } | null
): PracticeCoachingFocusPayload {
  const canonical = canonicalKickoffPlanCommand(kickoffCommandRaw);
  const rawTok = normalizeKickoffPlanCommand(kickoffCommandRaw);
  const lens = buildSkillLens(canonical, planItemText, kickoff?.target_roles, kickoff?.biggest_concern);

  return {
    source: 'kickoff_go',
    kickoffCommand: rawTok || canonical || 'practice',
    canonicalCommand: canonical || 'practice',
    planItemText: planItemText.trim().slice(0, 600),
    skillLens: lens,
    targetRolesHint: kickoff?.target_roles?.trim().slice(0, 320) || undefined,
    biggestConcernHint: kickoff?.biggest_concern?.trim().slice(0, 320) || undefined,
  };
}

function buildSkillLens(
  canonical: string,
  planItemText: string,
  targetRoles?: string,
  biggestConcern?: string
): string {
  const task = planItemText.trim().slice(0, 450);
  const roleLine = targetRoles?.trim()
    ? ` Target direction: ${targetRoles.trim().slice(0, 220)}.`
    : '';
  const worry =
    biggestConcern?.trim()
      ? ` Likely worry to reflect in realistic friction (without naming it as 'their concern'): ${biggestConcern.trim().slice(0, 180)}.`
      : '';

  const guides: Record<string, string> = {
    speaking_points:
      'Structured behavioural answers — concise headline, proof, outcome; avoid rambling.',
    pitch: 'Positioning impact, scope, and differentiation versus generic platitudes.',
    stories: 'STAR-style specifics — metrics, conflict, decisions — not hypotheticals.',
    hype: 'Confident framing grounded in evidence — credible energy without arrogance.',
    optimise_resume: 'Signals hiring managers scan for — relevance, metrics, keywords.',
    decode:
      'Question decoding — map each prompt to what they are evaluating; answer with structure.',
    analyse_profile: 'Consistency across resume, LinkedIn, and story choices vs target role.',
    concerns: 'Pushback on gaps — let them practise acknowledging and reframing with proof.',
    practice: 'Live conversational rehearsal — pacing, recovery after hesitation, clarity.',
    mock: 'Mock-interview realism — follow-ups, interruptions, bar-raising probes.',
    research: 'Company- and role-aware answers — tie specifics to constraints you infer.',
  };

  const guide = guides[canonical] ?? guides.practice;
  return `${guide}${roleLine}${worry} Kickoff plan item they chose to practise now: "${task}".`;
}
