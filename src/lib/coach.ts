// Adapted from noamseg/interview-coach-skill — prep, concerns, questions commands.
// https://github.com/noamseg/interview-coach-skill

export type CoachCommand = 'prep' | 'concerns' | 'questions';

export type InterviewStage =
  | 'phone_screen'
  | 'hiring_manager'
  | 'final_round'
  | 'peer'
  | 'panel'
  | 'unknown';

const STAGE_LABEL: Record<InterviewStage, string> = {
  phone_screen: 'Phone screen / recruiter call (logistics + role clarity, save deep questions)',
  hiring_manager: 'Hiring manager round (team dynamics + priorities + how they evaluate)',
  final_round: 'Final round / exec (company direction + strategic bets + culture)',
  peer: 'Peer round (collaboration + day-to-day + honest experience)',
  panel: 'Panel interview (multiple personas, energy management)',
  unknown: 'Unknown stage — default to behavioral screen tactics',
};

// ─────────────────────────────────────────────────────────────
// Shared "kickoff context" — passed to all three commands so the
// generated artifacts feel like they remember the candidate.
// ─────────────────────────────────────────────────────────────

export interface CoachContext {
  /** From kickoff state — best to always pass these so output is grounded. */
  targetRoles?: string;
  resumeText?: string;
  linkedInText?: string;
  interviewHistory?: string;
  stallingStage?: string;
  biggestConcern?: string;
}

function contextBlock(ctx: CoachContext): string {
  const parts: string[] = [];
  if (ctx.targetRoles) parts.push(`TARGET ROLE(S): ${ctx.targetRoles}`);
  if (ctx.interviewHistory) parts.push(`INTERVIEW HISTORY: ${ctx.interviewHistory}`);
  if (ctx.stallingStage) parts.push(`WHERE STUCK: ${ctx.stallingStage}`);
  if (ctx.biggestConcern) parts.push(`BIGGEST CONCERN: ${ctx.biggestConcern}`);
  if (ctx.resumeText) parts.push(`\nRESUME (truncated):\n${ctx.resumeText.slice(0, 6000)}`);
  if (ctx.linkedInText) parts.push(`\nLINKEDIN (truncated):\n${ctx.linkedInText.slice(0, 3000)}`);
  return parts.join('\n');
}

// ─────────────────────────────────────────────────────────────
// PREP
// ─────────────────────────────────────────────────────────────

export interface PrepInput extends CoachContext {
  company: string;
  role: string;
  jd: string;
  stage?: InterviewStage;
}

export interface PrepOutput {
  command: 'prep';
  company: string;
  role: string;
  stage: InterviewStage;
  format: { name: string; notes: string };
  topCriteria: string[];
  jdCompetencies: string[];
  candidateStrengths: string[];
  candidateRisks: string[];
  predictedQuestions: Array<{
    text: string;
    competency: string;
    storyHint: string;
  }>;
  questionsToAsk: Array<{ text: string; purpose: string }>;
  prepTips: string[];
}

export function buildPrepPrompt(input: PrepInput): { system: string; user: string } {
  const system = `You are an expert interview coach following the noamseg/interview-coach-skill "prep" workflow.

Generate a focused prep brief for a specific company + role.

Quality bar:
- Parse the JD for top 5-7 competencies (priority order). Read between the lines for "fast-paced" = understaffed, "ambiguity" = self-direction needed, etc.
- Identify the likely interview format and adjust top evaluation criteria accordingly.
- Predict 6-8 likely behavioural / role-specific questions, each tagged with the competency it tests and a short story hint pulled from the candidate's resume.
- Generate 4-5 strong questions for the candidate to ask the interviewer, each with strategic purpose.
- Output STRICT JSON. No markdown, no code fences, no commentary.

JSON schema:
{
  "stage": "phone_screen" | "hiring_manager" | "final_round" | "peer" | "panel" | "unknown",
  "format": { "name": "string", "notes": "string" },
  "topCriteria": ["string", ...],          // 3-5
  "jdCompetencies": ["string", ...],       // 5-7 in priority order
  "candidateStrengths": ["string", ...],   // 2-4 — drawn from resume vs JD
  "candidateRisks": ["string", ...],       // 2-4 — gaps the interviewer will probe
  "predictedQuestions": [
    { "text": "string", "competency": "string", "storyHint": "string" }, ...    // 6-8
  ],
  "questionsToAsk": [
    { "text": "string", "purpose": "information | concern_mitigation | differentiation | rapport" }, ...  // 4-5
  ],
  "prepTips": ["string", ...]               // 3-5 actionable tips for this specific interview
}`;

  const stageLine = input.stage
    ? `\nSTAGE: ${STAGE_LABEL[input.stage]}`
    : `\nSTAGE: not specified — infer from the JD or default to behavioral screen.`;

  const user = `PREP REQUEST

COMPANY: ${input.company}
ROLE: ${input.role}${stageLine}

JOB DESCRIPTION:
${input.jd.slice(0, 6000)}

CANDIDATE CONTEXT:
${contextBlock(input)}

INSTRUCTIONS

1. Identify the interview format and top evaluation criteria for this format + role.
2. Parse the JD for the top 5-7 competencies in priority order. Note any between-the-lines signals.
3. Map candidate strengths and risks against the JD.
4. Predict 6-8 likely questions covering the top competencies. For each, point to a story seed from the resume.
5. Suggest 4-5 strong questions for the candidate to ask the interviewer, each with strategic purpose.
6. End with 3-5 actionable prep tips for THIS specific interview.

Return STRICT JSON only.`;

  return { system, user };
}

export function parsePrepOutput(raw: unknown, company: string, role: string): PrepOutput | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const fmt = r.format as Record<string, unknown> | undefined;
  if (!fmt || typeof fmt.name !== 'string') return null;

  const topCriteria = arrayOfStrings(r.topCriteria);
  const jdCompetencies = arrayOfStrings(r.jdCompetencies);
  const candidateStrengths = arrayOfStrings(r.candidateStrengths);
  const candidateRisks = arrayOfStrings(r.candidateRisks);
  const prepTips = arrayOfStrings(r.prepTips);

  const predictedQuestions = (Array.isArray(r.predictedQuestions) ? r.predictedQuestions : [])
    .map((q) => {
      if (!q || typeof q !== 'object') return null;
      const item = q as Record<string, unknown>;
      if (typeof item.text !== 'string') return null;
      return {
        text: item.text,
        competency: typeof item.competency === 'string' ? item.competency : '',
        storyHint: typeof item.storyHint === 'string' ? item.storyHint : '',
      };
    })
    .filter((q): q is PrepOutput['predictedQuestions'][number] => q !== null);

  const questionsToAsk = (Array.isArray(r.questionsToAsk) ? r.questionsToAsk : [])
    .map((q) => {
      if (!q || typeof q !== 'object') return null;
      const item = q as Record<string, unknown>;
      if (typeof item.text !== 'string') return null;
      return {
        text: item.text,
        purpose: typeof item.purpose === 'string' ? item.purpose : 'information',
      };
    })
    .filter((q): q is PrepOutput['questionsToAsk'][number] => q !== null);

  if (predictedQuestions.length === 0) return null;

  return {
    command: 'prep',
    company,
    role,
    stage: validStage(r.stage),
    format: {
      name: fmt.name,
      notes: typeof fmt.notes === 'string' ? fmt.notes : '',
    },
    topCriteria,
    jdCompetencies,
    candidateStrengths,
    candidateRisks,
    predictedQuestions,
    questionsToAsk,
    prepTips,
  };
}

// ─────────────────────────────────────────────────────────────
// CONCERNS
// ─────────────────────────────────────────────────────────────

export type ConcernsInput = CoachContext;

export type ConcernSeverity = 'dealbreaker' | 'significant' | 'minor';

export interface ConcernItem {
  concern: string;
  severity: ConcernSeverity;
  source: string;
  counters: {
    direct: string;
    subtle: string;
    followUp: string;
  };
  bestStory: string;
}

export interface ConcernsOutput {
  command: 'concerns';
  dealbreakers: ConcernItem[];
  significant: ConcernItem[];
  minor: Array<{ concern: string; source: string; counter: string }>;
  topPriority: { concern: string; recommendation: string };
}

export function buildConcernsPrompt(input: ConcernsInput): { system: string; user: string } {
  const system = `You are an expert interview coach following the noamseg/interview-coach-skill "concerns" workflow.

Surface the concerns a hiring manager will most likely raise about THIS candidate for THEIR target role.

Quality bar:
- Pull from real signals: career gaps, short tenures, domain switches, seniority mismatches, JD-implied gaps, narrative inconsistencies. Do NOT manufacture concerns.
- Rank by severity using these definitions:
    Dealbreaker: could single-handedly end the candidacy if not handled well (missing core required skill, very short tenure that looks like termination)
    Significant: will come up and needs a strong counter, but won't kill the candidacy alone
    Minor: might come up as a probe but unlikely to be decisive
- For each Dealbreaker and Significant concern, prepare THREE framings of the counter:
    direct — for "Why did you leave after 8 months?"
    subtle — for "Tell me about a time things didn't work out" (probing the same concern indirectly)
    followUp — for "But wouldn't that be a risk in this role too?" pushback
- Use Alisa Cohn's framework: observable fact + forward momentum. Lead with what you learned, not the circumstances.
- Output STRICT JSON. No markdown, no code fences, no commentary.

JSON schema:
{
  "dealbreakers": [{
    "concern": "string",
    "source": "string",
    "counters": { "direct": "string", "subtle": "string", "followUp": "string" },
    "bestStory": "string"
  }, ...],   // 0-2 items
  "significant": [ { ...same shape... }, ... ],   // 1-4 items
  "minor": [{ "concern": "string", "source": "string", "counter": "string" }, ...],  // 0-3 items
  "topPriority": { "concern": "string", "recommendation": "string" }
}`;

  const user = `CONCERNS REQUEST

CANDIDATE CONTEXT:
${contextBlock(input)}

INSTRUCTIONS

1. Identify concerns grounded in actual resume / context signals.
2. Rank into Dealbreakers / Significant / Minor.
3. For Dealbreakers + Significant, prepare three counter framings (direct, subtle, follow-up) plus a best supporting story.
4. Pick the single highest-priority concern and recommend how to address it (e.g., specific story to build, drill to run, resume tweak).

Return STRICT JSON only.`;

  return { system, user };
}

export function parseConcernsOutput(raw: unknown): ConcernsOutput | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const parseConcernItem = (severity: ConcernSeverity) => (it: unknown): ConcernItem | null => {
    if (!it || typeof it !== 'object') return null;
    const x = it as Record<string, unknown>;
    if (typeof x.concern !== 'string') return null;
    const c = (x.counters || {}) as Record<string, unknown>;
    return {
      concern: x.concern,
      severity,
      source: typeof x.source === 'string' ? x.source : '',
      counters: {
        direct: typeof c.direct === 'string' ? c.direct : '',
        subtle: typeof c.subtle === 'string' ? c.subtle : '',
        followUp: typeof c.followUp === 'string' ? c.followUp : '',
      },
      bestStory: typeof x.bestStory === 'string' ? x.bestStory : '',
    };
  };

  const dealbreakers = (Array.isArray(r.dealbreakers) ? r.dealbreakers : [])
    .map(parseConcernItem('dealbreaker'))
    .filter((x): x is ConcernItem => x !== null);
  const significant = (Array.isArray(r.significant) ? r.significant : [])
    .map(parseConcernItem('significant'))
    .filter((x): x is ConcernItem => x !== null);

  const minor = (Array.isArray(r.minor) ? r.minor : [])
    .map((it) => {
      if (!it || typeof it !== 'object') return null;
      const x = it as Record<string, unknown>;
      if (typeof x.concern !== 'string') return null;
      return {
        concern: x.concern,
        source: typeof x.source === 'string' ? x.source : '',
        counter: typeof x.counter === 'string' ? x.counter : '',
      };
    })
    .filter((x): x is { concern: string; source: string; counter: string } => x !== null);

  if (dealbreakers.length + significant.length + minor.length === 0) return null;

  const tp = (r.topPriority || {}) as Record<string, unknown>;

  return {
    command: 'concerns',
    dealbreakers,
    significant,
    minor,
    topPriority: {
      concern: typeof tp.concern === 'string' ? tp.concern : significant[0]?.concern || dealbreakers[0]?.concern || '',
      recommendation:
        typeof tp.recommendation === 'string'
          ? tp.recommendation
          : 'Drill this concern under pressure before your next interview.',
    },
  };
}

// ─────────────────────────────────────────────────────────────
// QUESTIONS
// ─────────────────────────────────────────────────────────────

export interface QuestionsInput extends CoachContext {
  stage: InterviewStage;
  company?: string;
}

export type QuestionPurpose =
  | 'information'
  | 'concern_mitigation'
  | 'differentiation'
  | 'rapport';

export interface QuestionItem {
  text: string;
  purpose: QuestionPurpose;
  bestFor: string;
  whyStrong: string;
  likelyFollowUp: string;
  yourResponse: string;
}

export interface QuestionsOutput {
  command: 'questions';
  stage: InterviewStage;
  company: string;
  questions: QuestionItem[];
  toAvoid: string[];
}

export function buildQuestionsPrompt(input: QuestionsInput): { system: string; user: string } {
  const system = `You are an expert interview coach following the noamseg/interview-coach-skill "questions" workflow.

Generate 5 strong questions the candidate should ask the interviewer at this stage.

Each question must serve at least one strategic purpose:
- information: surfaces something the candidate needs to know to evaluate the role
- concern_mitigation: indirectly demonstrates a strength that addresses a known concern
- differentiation: shows depth of thinking that makes the candidate memorable
- rapport: connects with the interviewer's specific interests or background

Questions to AVOID (flag at the end):
- Easily answered by the company website or JD
- Benefits / perks / time off in early rounds
- Insecure questions ("Do you think I'm qualified?")
- Generic questions that could apply to any company
- Questions that put the interviewer on the spot ("What's the worst thing about working here?")

Stage adaptation:
- Phone screen / recruiter: logistics, role clarity, process. Save deep strategic questions.
- Hiring manager: team dynamics, priorities, evaluation criteria.
- Final / exec: company direction, strategic bets, culture.
- Peer: collaboration, day-to-day, honest experience.
- Panel: balance — one question per energy level.

For each question, include the most likely interviewer follow-up AND a 1-2 sentence prepared response so the candidate isn't caught flat-footed.

Output STRICT JSON. No markdown, no code fences.

JSON schema:
{
  "questions": [{
    "text": "string",
    "purpose": "information" | "concern_mitigation" | "differentiation" | "rapport",
    "bestFor": "string",
    "whyStrong": "string",
    "likelyFollowUp": "string",
    "yourResponse": "string"
  }, ...],   // exactly 5
  "toAvoid": ["string", ...]   // 2-3 specific questions to skip this round
}`;

  const stageLine = `STAGE: ${STAGE_LABEL[input.stage]}`;
  const companyLine = input.company ? `\nCOMPANY: ${input.company}` : '';

  const user = `QUESTIONS REQUEST

${stageLine}${companyLine}

CANDIDATE CONTEXT:
${contextBlock(input)}

INSTRUCTIONS

Generate exactly 5 questions tailored to the stage and the candidate's context. Mix strategic purposes (don't use the same purpose for all 5). For each question, prepare a likely follow-up AND a 1-2 sentence response.

Return STRICT JSON only.`;

  return { system, user };
}

export function parseQuestionsOutput(
  raw: unknown,
  stage: InterviewStage,
  company: string
): QuestionsOutput | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const purposeOf = (p: unknown): QuestionPurpose =>
    p === 'concern_mitigation' || p === 'differentiation' || p === 'rapport'
      ? p
      : 'information';

  const questions = (Array.isArray(r.questions) ? r.questions : [])
    .map((q) => {
      if (!q || typeof q !== 'object') return null;
      const x = q as Record<string, unknown>;
      if (typeof x.text !== 'string') return null;
      return {
        text: x.text,
        purpose: purposeOf(x.purpose),
        bestFor: typeof x.bestFor === 'string' ? x.bestFor : '',
        whyStrong: typeof x.whyStrong === 'string' ? x.whyStrong : '',
        likelyFollowUp: typeof x.likelyFollowUp === 'string' ? x.likelyFollowUp : '',
        yourResponse: typeof x.yourResponse === 'string' ? x.yourResponse : '',
      };
    })
    .filter((q): q is QuestionItem => q !== null);

  if (questions.length === 0) return null;

  return {
    command: 'questions',
    stage,
    company,
    questions,
    toAvoid: arrayOfStrings(r.toAvoid),
  };
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function arrayOfStrings(x: unknown): string[] {
  return Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : [];
}

function validStage(x: unknown): InterviewStage {
  return x === 'phone_screen' ||
    x === 'hiring_manager' ||
    x === 'final_round' ||
    x === 'peer' ||
    x === 'panel'
    ? x
    : 'unknown';
}

export type CoachArtifact = PrepOutput | ConcernsOutput | QuestionsOutput;
