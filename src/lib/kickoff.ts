// Adapted from noamseg/interview-coach-skill — kickoff command.
// https://github.com/noamseg/interview-coach-skill

export type KickoffTrack = 'quick_prep' | 'full_system';
export type KickoffTimeline = 'lt_48h' | '1_2w' | '3plus_w';
export type KickoffTimeMode = 'triage' | 'focused' | 'full';
export type InterviewHistory = 'first_time' | 'active_not_advancing' | 'experienced_rusty';
export type StallingStage = 'first_rounds' | 'final_rounds' | 'no_callbacks' | '';

export interface KickoffInput {
  track: KickoffTrack;
  targetRoles: string;
  timeline: KickoffTimeline;
  feedbackDirectness: number; // 1-5
  biggestConcern?: string;
  interviewHistory: InterviewHistory;
  stallingStage?: StallingStage;
  resumeText?: string;
  linkedInText?: string;
  targetCompanies?: string[];
}

export interface KickoffPlanItem {
  text: string;
  /**
   * Optional command tag the UI uses to render an action button that links
   * the plan item to a TalkWise feature.
   */
  command?:
    | 'speaking_points'
    | 'optimise_resume'
    | 'analyse_profile'
    | 'practice'
    | 'mock'
    | 'research'
    | 'decode'
    | 'concerns'
    | 'hype'
    | 'pitch'
    | 'stories';
}

export interface KickoffSummary {
  trackChoice: KickoffTrack;
  timeMode: KickoffTimeMode;
  seniorityBand?: string;
  profile: {
    positioningStrengths: string[];
    likelyConcerns: string[];
    narrativeGaps: string[];
    storySeeds: string[];
  };
  readiness: {
    current: string;
    biggestRisk: string;
    biggestAsset: string;
  };
  careerTransition: {
    type: string;
    bridgeStoryAdvice: string;
  } | null;
  targetRealityCheck: {
    target: string;
    gap: string;
    gapType: 'seniority' | 'domain' | 'function' | 'hard_skill' | 'other';
    recommendation: string;
  } | null;
  plan: {
    immediate: KickoffPlanItem[];
    thisWeek: KickoffPlanItem[];
    beforeFirstInterview: KickoffPlanItem[];
  };
  recommendedNext: KickoffPlanItem;
}

export function timelineToMode(t: KickoffTimeline): KickoffTimeMode {
  if (t === 'lt_48h') return 'triage';
  if (t === '1_2w') return 'focused';
  return 'full';
}

const HISTORY_LABEL: Record<InterviewHistory, string> = {
  first_time: 'first-time interviewer (needs fundamentals)',
  active_not_advancing: 'actively interviewing but not advancing (needs diagnosis)',
  experienced_rusty: 'experienced but rusty (needs refresh, not rebuild)',
};

const STALLING_LABEL: Record<StallingStage, string> = {
  first_rounds:
    'failing first rounds — most likely Relevance / Structure problems (question decoding, clarity)',
  final_rounds:
    'failing final rounds — most likely Differentiation / Credibility problems (memorability, signal of seniority)',
  no_callbacks:
    'no callbacks at all — likely a positioning / resume / targeting problem, not interview performance',
  '': '',
};

const TIMELINE_LABEL: Record<KickoffTimeline, string> = {
  lt_48h: '≤48 hours (TRIAGE mode — skip storybank building, prep + hype only)',
  '1_2w': '1-2 weeks (FOCUSED mode — prep brief + one targeted drill on weakest dimension)',
  '3plus_w': '3+ weeks (FULL mode — build storybank, run progression drills, develop differentiation)',
};

/**
 * Build the system + user prompt pair that drives the kickoff analysis.
 * Output schema is enforced via response_format JSON object.
 */
export function buildKickoffPrompt(input: KickoffInput): { system: string; user: string } {
  const system = `You are an expert interview and career coach following the noamseg/interview-coach-skill framework's "kickoff" command.

You will analyse a candidate's resume + LinkedIn against their target role, interview history, and timeline, then produce a structured kickoff plan.

Quality bar:
- Be specific and evidence-based. Reference concrete details from the resume.
- High candor with strengths-first delivery. Never be generic.
- Detect career transitions (function change / domain shift / IC↔management / industry pivot / career restart) ONLY if clearly indicated; otherwise return null.
- Run a target reality check ONLY if a clear seniority/domain/function/hard-skill mismatch is visible from the resume; otherwise return null. Do not manufacture concerns.
- Time-aware planning: adjust plan tier sizes and items to the candidate's timeline.
- Every plan item is one short sentence and includes a command tag where it maps to a tool. Available command tags:
    speaking_points, optimise_resume, analyse_profile, practice, mock, research, decode, concerns, hype, pitch, stories.
- recommendedNext must be the single highest-leverage next step right now.

Output format: STRICT JSON. No markdown, no code fences, no commentary outside the JSON.

JSON schema:
{
  "trackChoice": "quick_prep" | "full_system",
  "timeMode": "triage" | "focused" | "full",
  "seniorityBand": "<string e.g. 'Senior IC' or 'Director'>",
  "profile": {
    "positioningStrengths": ["string", ...],   // 2-3 items
    "likelyConcerns": ["string", ...],          // 2-5 items
    "narrativeGaps": ["string", ...],           // 0-3 items
    "storySeeds": ["string", ...]               // 2-5 items
  },
  "readiness": {
    "current": "string",
    "biggestRisk": "string",
    "biggestAsset": "string"
  },
  "careerTransition": null | {
    "type": "string",
    "bridgeStoryAdvice": "string"
  },
  "targetRealityCheck": null | {
    "target": "string",
    "gap": "string",
    "gapType": "seniority" | "domain" | "function" | "hard_skill" | "other",
    "recommendation": "string"
  },
  "plan": {
    "immediate":             [{"text": "string", "command": "<tag>"}, ...],   // 1-2 items
    "thisWeek":              [{"text": "string", "command": "<tag>"}, ...],   // 2-3 items
    "beforeFirstInterview":  [{"text": "string", "command": "<tag>"}, ...]    // 2-3 items
  },
  "recommendedNext": {"text": "string", "command": "<tag>"}
}`;

  const directnessLabel =
    input.feedbackDirectness >= 5
      ? 'Level 5 — high candor, Challenge Protocol active (red-team stories, name avoidance, pre-mortem)'
      : input.feedbackDirectness >= 3
      ? `Level ${input.feedbackDirectness} — direct but supportive`
      : `Level ${input.feedbackDirectness} — gentle, encouraging`;

  const stallingLine =
    input.interviewHistory === 'active_not_advancing' && input.stallingStage
      ? `\nWHERE THEY'RE GETTING STUCK: ${STALLING_LABEL[input.stallingStage]}`
      : '';

  const companiesLine =
    input.targetCompanies && input.targetCompanies.length > 0
      ? `\nTARGET COMPANIES: ${input.targetCompanies.join(', ')}`
      : '';

  const concernLine = input.biggestConcern?.trim()
    ? `\nBIGGEST CONCERN: ${input.biggestConcern.trim()}`
    : '';

  const resumeBlock = input.resumeText?.trim()
    ? `\n\nRESUME (truncated to 6000 chars):\n${input.resumeText.slice(0, 6000)}`
    : '\n\nRESUME: (none provided — note this in likelyConcerns)';

  const linkedInBlock = input.linkedInText?.trim()
    ? `\n\nLINKEDIN (truncated to 4000 chars):\n${input.linkedInText.slice(0, 4000)}`
    : '';

  const user = `KICKOFF INPUTS

TRACK CHOICE: ${input.track === 'quick_prep' ? 'Quick Prep' : 'Full System'}
TARGET ROLE(S): ${input.targetRoles}
TIMELINE: ${TIMELINE_LABEL[input.timeline]}
FEEDBACK DIRECTNESS: ${directnessLabel}
INTERVIEW HISTORY: ${HISTORY_LABEL[input.interviewHistory]}${stallingLine}${concernLine}${companiesLine}${resumeBlock}${linkedInBlock}

INSTRUCTIONS

1. **Resume Analysis** — read the resume and identify:
   - 2-3 positioning strengths (the signals a hiring manager sees in 30 seconds)
   - 2-5 likely interviewer concerns (gaps, short tenures, lateral moves, missing keywords, invisible contributions)
   - 0-3 career narrative gaps (transitions that need a story ready)
   - 2-5 story seeds (resume bullets with rich stories behind them — quantified outcomes, leadership moments)

2. **Career Transition Detection** — fire ONLY if the target role represents a clear function change / domain shift / IC↔mgmt switch / industry pivot / career restart. Otherwise return null.

3. **Target Reality Check** — fire ONLY on clear mismatches: seniority gap of 2+ levels, zero domain experience for a domain-specific role, function switch with no bridge, or hard-skill requirement the candidate clearly lacks. Surface directly without gatekeeping. Otherwise return null.

4. **Time-Aware Plan** — match the candidate's timeline:
   - ≤48h: triage mode. plan.immediate = ["prep", "hype"]. Skip storybank.
   - 1-2w: focused mode. immediate = prep + one practice drill on weakest dimension.
   - 3+w: full mode. Storybank, progression drills, differentiation work.

5. **Plan items** — every item is one short imperative sentence, with a command tag where applicable. recommendedNext is the single highest-leverage move right now.

Return STRICT JSON only.`;

  return { system, user };
}

// ─────────────────────────────────────────────────────────────
// Light-weight schema validator for the LLM output
// ─────────────────────────────────────────────────────────────

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((v) => typeof v === 'string');
}

function isPlanItem(x: unknown): x is KickoffPlanItem {
  return (
    !!x && typeof x === 'object' && typeof (x as KickoffPlanItem).text === 'string'
  );
}

function isPlanItemArray(x: unknown): x is KickoffPlanItem[] {
  return Array.isArray(x) && x.every(isPlanItem);
}

/**
 * Normalize kickoff plan `command` strings from the model (casing, spaces, US spelling).
 */
export function normalizeKickoffPlanCommand(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');
}

/** Alias map so LLM variants resolve to one canonical tag (routes + coaching lens). */
const KICKOFF_COMMAND_ALIASES: Record<string, string> = {
  optimize_resume: 'optimise_resume',
  optimize: 'optimise_resume',
  resume_optimisation: 'optimise_resume',
  resume_optimization: 'optimise_resume',
  analyze_profile: 'analyse_profile',
  profile_alignment: 'analyse_profile',
  speakingpoint: 'speaking_points',
  storybank: 'stories',
  mock_interview: 'mock',
  company_research: 'research',
};

/** Canonical kickoff command tag after normalization + aliases. */
export function canonicalKickoffPlanCommand(raw: unknown): string {
  const n = normalizeKickoffPlanCommand(raw);
  return KICKOFF_COMMAND_ALIASES[n] ?? n;
}

/**
 * Map a plan item command to an in-app route. Unknown tags still go somewhere useful (/resume).
 */
export function routeForKickoffCommand(raw: unknown): string {
  const key = canonicalKickoffPlanCommand(raw);
  switch (key) {
    case 'speaking_points':
    case 'pitch':
    case 'stories':
    case 'hype':
      return '/resume#speaking-points';
    case 'optimise_resume':
    case 'decode':
      return '/resume#resume-optimisation';
    case 'analyse_profile':
    case 'concerns':
      return '/resume#profile-alignment';
    case 'practice':
      return '/configure';
    case 'mock':
    case 'research':
      return '/interview/prep';
    default:
      return '/resume';
  }
}

export function parseKickoffSummary(raw: unknown): KickoffSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const profile = (r.profile as Record<string, unknown>) || {};
  const readiness = (r.readiness as Record<string, unknown>) || {};
  const plan = (r.plan as Record<string, unknown>) || {};

  if (
    (r.trackChoice !== 'quick_prep' && r.trackChoice !== 'full_system') ||
    !['triage', 'focused', 'full'].includes(r.timeMode as string) ||
    !isStringArray(profile.positioningStrengths) ||
    !isStringArray(profile.likelyConcerns) ||
    !isStringArray(profile.storySeeds) ||
    typeof readiness.current !== 'string' ||
    !isPlanItemArray(plan.immediate) ||
    !isPlanItemArray(plan.thisWeek) ||
    !isPlanItemArray(plan.beforeFirstInterview)
  ) {
    return null;
  }

  return {
    trackChoice: r.trackChoice as KickoffTrack,
    timeMode: r.timeMode as KickoffTimeMode,
    seniorityBand: typeof r.seniorityBand === 'string' ? r.seniorityBand : undefined,
    profile: {
      positioningStrengths: profile.positioningStrengths,
      likelyConcerns: profile.likelyConcerns,
      narrativeGaps: isStringArray(profile.narrativeGaps) ? profile.narrativeGaps : [],
      storySeeds: profile.storySeeds,
    },
    readiness: {
      current: readiness.current,
      biggestRisk: typeof readiness.biggestRisk === 'string' ? readiness.biggestRisk : '',
      biggestAsset: typeof readiness.biggestAsset === 'string' ? readiness.biggestAsset : '',
    },
    careerTransition:
      r.careerTransition && typeof r.careerTransition === 'object'
        ? {
            type: String((r.careerTransition as Record<string, unknown>).type ?? ''),
            bridgeStoryAdvice: String(
              (r.careerTransition as Record<string, unknown>).bridgeStoryAdvice ?? ''
            ),
          }
        : null,
    targetRealityCheck:
      r.targetRealityCheck && typeof r.targetRealityCheck === 'object'
        ? {
            target: String((r.targetRealityCheck as Record<string, unknown>).target ?? ''),
            gap: String((r.targetRealityCheck as Record<string, unknown>).gap ?? ''),
            gapType: ((r.targetRealityCheck as Record<string, unknown>).gapType ?? 'other') as
              | 'seniority'
              | 'domain'
              | 'function'
              | 'hard_skill'
              | 'other',
            recommendation: String(
              (r.targetRealityCheck as Record<string, unknown>).recommendation ?? ''
            ),
          }
        : null,
    plan: {
      immediate: plan.immediate,
      thisWeek: plan.thisWeek,
      beforeFirstInterview: plan.beforeFirstInterview,
    },
    recommendedNext: isPlanItem(r.recommendedNext)
      ? r.recommendedNext
      : { text: 'Run prep for your highest-priority interview.', command: 'pitch' },
  };
}
