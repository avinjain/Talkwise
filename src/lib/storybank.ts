// Adapted from noamseg/interview-coach-skill — `stories` (storybank) workflow.
// https://github.com/noamseg/interview-coach-skill/blob/main/references/commands/stories.md
//
// Implements: guided STAR construction, 5-dimension strength scoring, the
// structured improve protocol (diagnose gap type → minimum fix), prioritised
// gap analysis against target roles, and narrative-identity theme extraction.

// ─────────────────────────────────────────────────────────────
// Scoring model — 5 dimensions, each 1-5
// ─────────────────────────────────────────────────────────────

export type StoryDimensionKey =
  | 'relevance'
  | 'structure'
  | 'specificity'
  | 'differentiation'
  | 'delivery';

export const STORY_DIMENSIONS: ReadonlyArray<{
  key: StoryDimensionKey;
  label: string;
  desc: string;
}> = [
  { key: 'relevance', label: 'Relevance', desc: 'Does it map to a competency interviewers actually test?' },
  { key: 'structure', label: 'Structure', desc: 'Clear STAR arc with a moment of transformation, no slow setup.' },
  { key: 'specificity', label: 'Specificity', desc: 'Concrete actions YOU took, quantified or vivid results, tradeoffs.' },
  { key: 'differentiation', label: 'Differentiation', desc: 'An earned secret / spiky POV only this candidate could have.' },
  { key: 'delivery', label: 'Delivery', desc: 'Tight, speakable in 60-90s, leads close to the action.' },
];

export type StoryScores = Record<StoryDimensionKey, number>;

export type StoryGapType =
  | 'missing_material' // score 1-2
  | 'missing_proof' // score 3
  | 'missing_differentiation' // score 4
  | 'strong'; // score 5

function clampScore(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(5, Math.round(v)));
}

/** Overall strength = lowest-dimension-weighted average, rounded to 1-5. */
export function overallStrength(scores: StoryScores): number {
  const vals = STORY_DIMENSIONS.map((d) => clampScore(scores[d.key]));
  if (vals.every((v) => v === 0)) return 0;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const min = Math.min(...vals);
  // A story is only as strong as its weakest dimension drags it; blend avg + min.
  return Math.max(1, Math.min(5, Math.round((avg + min) / 2)));
}

export function gapTypeForStrength(strength: number): StoryGapType {
  if (strength <= 2) return 'missing_material';
  if (strength === 3) return 'missing_proof';
  if (strength === 4) return 'missing_differentiation';
  return 'strong';
}

function parseScores(raw: unknown): StoryScores {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    relevance: clampScore(r.relevance),
    structure: clampScore(r.structure),
    specificity: clampScore(r.specificity),
    differentiation: clampScore(r.differentiation),
    delivery: clampScore(r.delivery),
  };
}

function arrayOfStrings(x: unknown): string[] {
  return Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : [];
}

function str(x: unknown): string {
  return typeof x === 'string' ? x : '';
}

function stripFences(text: string): string {
  return text.replace(/```json?\s*/gi, '').replace(/```\s*$/g, '').trim();
}

export function parseJsonLoose(text: string): unknown {
  try {
    return JSON.parse(stripFences(text));
  } catch {
    const clean = stripFences(text);
    const first = clean.indexOf('{');
    const last = clean.lastIndexOf('}');
    if (first !== -1 && last > first) {
      try {
        return JSON.parse(clean.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Shared context (target role grounds relevance scoring)
// ─────────────────────────────────────────────────────────────

export interface StorybankContext {
  targetRoles?: string;
  resumeText?: string;
}

function contextBlock(ctx: StorybankContext): string {
  const parts: string[] = [];
  if (ctx.targetRoles) parts.push(`TARGET ROLE(S): ${ctx.targetRoles}`);
  if (ctx.resumeText) parts.push(`\nRESUME (truncated):\n${ctx.resumeText.slice(0, 5000)}`);
  return parts.join('\n') || 'No target role provided — score against general behavioural-interview standards.';
}

// ─────────────────────────────────────────────────────────────
// BUILD — raw notes → structured STAR story + earned secret + score
// ─────────────────────────────────────────────────────────────

export interface StoryBuildResult {
  title: string;
  primarySkill: string;
  secondarySkills: string[];
  situation: string;
  task: string;
  action: string;
  result: string;
  earnedSecret: string;
  deployUseCase: string;
  spokenDraft: string;
  scores: StoryScores;
  diagnosis: string;
}

export function buildStoryConstructionPrompt(
  rawNotes: string,
  ctx: StorybankContext
): { system: string; user: string } {
  const system = `You are an expert interview coach following the noamseg/interview-coach-skill "stories" workflow.

The candidate gave you rough material about ONE real past experience. Shape it into a memorable interview story and score it.

Apply Matthew Dicks' storytelling principles:
- Every strong story has a moment of transformation ("I used to think X, then Y happened, now I know Z").
- Stories need stakes — what was at risk?
- Start close to the end — don't burn time on setup.
- "But / Therefore" not "and then" — keep cause-and-effect tension.

STAR rules:
- Situation: brief context + stakes (1-3 sentences).
- Task: what THEY had to accomplish or decide.
- Action: specific steps THEY personally took — never vague "we". Include a key tradeoff/constraint.
- Result: quantified or vividly concrete outcome. If no number is implied, say what could be measured rather than inventing one.

Then extract the EARNED SECRET: the non-obvious thing this candidate learned that most people in their role would NOT know. It must be specific to this experience, not a platitude.

Faithfulness: never invent employers, metrics, or titles the notes don't hint at. If material is thin, keep it honest and flag it in the diagnosis.

Score the story 1-5 on each dimension:
- relevance: maps to a competency interviewers test for the target role
- structure: clear arc + transformation, no slow setup
- specificity: concrete personal actions, quantified/vivid result, a tradeoff
- differentiation: a real earned secret / spiky POV
- delivery: tight, speakable in 60-90 seconds

Output STRICT JSON. No markdown, no code fences.

JSON schema:
{
  "title": "short memorable label, 3-6 words",
  "primarySkill": "the main competency this story proves",
  "secondarySkills": ["string", ...],  // 0-3 other competencies it touches
  "situation": "string",
  "task": "string",
  "action": "string",
  "result": "string",
  "earnedSecret": "string",
  "deployUseCase": "one line: which interview question this is the answer to",
  "spokenDraft": "one cohesive 60-90 second spoken paragraph combining STAR",
  "scores": { "relevance": n, "structure": n, "specificity": n, "differentiation": n, "delivery": n },
  "diagnosis": "1-2 sentences: the single biggest thing that would make this story stronger"
}`;

  const user = `CANDIDATE CONTEXT:
${contextBlock(ctx)}

RAW STORY MATERIAL:
---
${rawNotes.slice(0, 6000)}
---

Build the structured story, extract the earned secret, and score it. Return STRICT JSON only.`;

  return { system, user };
}

export function parseStoryBuildResult(raw: unknown): StoryBuildResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const title = str(r.title).trim();
  if (!title) return null;
  return {
    title,
    primarySkill: str(r.primarySkill),
    secondarySkills: arrayOfStrings(r.secondarySkills).slice(0, 3),
    situation: str(r.situation),
    task: str(r.task),
    action: str(r.action),
    result: str(r.result),
    earnedSecret: str(r.earnedSecret),
    deployUseCase: str(r.deployUseCase),
    spokenDraft: str(r.spokenDraft),
    scores: parseScores(r.scores),
    diagnosis: str(r.diagnosis),
  };
}

// ─────────────────────────────────────────────────────────────
// SCORE / IMPROVE — diagnose gap type → minimum targeted fix
// ─────────────────────────────────────────────────────────────

export interface StoryForScoring {
  title: string;
  primarySkill?: string;
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
  earnedSecret?: string;
}

export interface StoryScoreResult {
  scores: StoryScores;
  gapType: StoryGapType;
  diagnosis: string;
  improvementQuestions: string[];
  suggestedFix: { section: string; before: string; after: string; why: string };
}

export function buildStoryScorePrompt(
  story: StoryForScoring,
  ctx: StorybankContext
): { system: string; user: string } {
  const system = `You are an expert interview coach following the noamseg/interview-coach-skill "stories improve" protocol.

Score the candidate's story 1-5 on each dimension, then diagnose the gap and prescribe the MINIMUM fix that moves the score up — do NOT rewrite the whole story.

Dimensions (1-5):
- relevance, structure, specificity, differentiation, delivery (definitions as standard).

Gap diagnosis by overall strength:
- 1-2 (missing_material): not enough to work with. The tension was probably stripped out. Ask what's missing / what was actually hard.
- 3 (missing_proof): good bones, not compelling. Target quantified impact, alternatives considered, or the earned secret.
- 4 (missing_differentiation): credible & structured but anyone could tell it. Target the earned secret / spiky POV — the moment their understanding shifted.
- 5 (strong): keep it; suggest only a micro-polish.

For the single weakest section, give a concrete before→after rewrite of just that section.

Output STRICT JSON. No markdown, no code fences.

JSON schema:
{
  "scores": { "relevance": n, "structure": n, "specificity": n, "differentiation": n, "delivery": n },
  "diagnosis": "what is dragging this story down and why",
  "improvementQuestions": ["string", ...],  // 2-3 questions that surface the missing material
  "suggestedFix": {
    "section": "Situation | Task | Action | Result | Earned Secret",
    "before": "the current weak version (quote or paraphrase)",
    "after": "the improved version of ONLY that section",
    "why": "one line on what this changes"
  }
}`;

  const user = `CANDIDATE CONTEXT:
${contextBlock(ctx)}

STORY TO SCORE:
Title: ${story.title}
Primary skill: ${story.primarySkill || '(unspecified)'}
Situation: ${story.situation || '(empty)'}
Task: ${story.task || '(empty)'}
Action: ${story.action || '(empty)'}
Result: ${story.result || '(empty)'}
Earned secret: ${story.earnedSecret || '(none yet)'}

Score it, diagnose the gap, and prescribe the minimum fix. Return STRICT JSON only.`;

  return { system, user };
}

export function parseStoryScoreResult(raw: unknown): StoryScoreResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const scores = parseScores(r.scores);
  const fix = (r.suggestedFix && typeof r.suggestedFix === 'object' ? r.suggestedFix : {}) as Record<string, unknown>;
  return {
    scores,
    gapType: gapTypeForStrength(overallStrength(scores)),
    diagnosis: str(r.diagnosis),
    improvementQuestions: arrayOfStrings(r.improvementQuestions).slice(0, 3),
    suggestedFix: {
      section: str(fix.section),
      before: str(fix.before),
      after: str(fix.after),
      why: str(fix.why),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// GAPS — prioritised gap analysis vs target roles
// ─────────────────────────────────────────────────────────────

export interface StorySummaryForGaps {
  title: string;
  primarySkill: string;
  secondarySkills: string[];
  strength: number;
}

export interface GapItem {
  competency: string;
  reason: string;
  recommendation: string;
}

export interface GapsResult {
  critical: GapItem[];
  important: GapItem[];
  niceToHave: GapItem[];
  recommendedNext: string;
}

export function buildGapsPrompt(
  stories: StorySummaryForGaps[],
  ctx: StorybankContext
): { system: string; user: string } {
  const system = `You are an expert interview coach following the noamseg/interview-coach-skill "stories find gaps" workflow.

Cross-reference the candidate's storybank coverage against their target role(s) and rank gaps by how much they matter.

Severity definitions:
- critical: this competency WILL be tested and there is no story (not even as a secondary skill).
- important: likely to come up; only a weak story (strength < 3) or secondary-skill-only coverage exists.
- nice-to-have: might come up but won't make or break the interview.

Check BOTH primary and secondary skills before declaring a gap. Common behavioural categories to always check coverage for: leadership/influence without authority, conflict/difficult colleague, failure/learning, giving/receiving feedback, ambiguity, biggest impact.

For each gap, recommend either reframing an existing story or surfacing a new one.

Output STRICT JSON. No markdown, no code fences.

JSON schema:
{
  "critical": [{ "competency": "string", "reason": "string", "recommendation": "string" }, ...],
  "important": [{ ...same shape... }, ...],
  "niceToHave": [{ ...same shape... }, ...],
  "recommendedNext": "one line — the single highest-priority gap to fill next"
}`;

  const storyLines = stories.length
    ? stories
        .map(
          (s) =>
            `- "${s.title}" — primary: ${s.primarySkill || 'n/a'}; secondary: ${
              s.secondarySkills.join(', ') || 'none'
            }; strength: ${s.strength}/5`
        )
        .join('\n')
    : '(storybank is empty)';

  const user = `CANDIDATE CONTEXT:
${contextBlock(ctx)}

CURRENT STORYBANK COVERAGE:
${storyLines}

Identify and rank the gaps. Return STRICT JSON only.`;

  return { system, user };
}

export function parseGapItems(x: unknown): GapItem[] {
  return (Array.isArray(x) ? x : [])
    .map((it) => {
      if (!it || typeof it !== 'object') return null;
      const r = it as Record<string, unknown>;
      const competency = str(r.competency).trim();
      if (!competency) return null;
      return {
        competency,
        reason: str(r.reason),
        recommendation: str(r.recommendation),
      };
    })
    .filter((x): x is GapItem => x !== null);
}

export function parseGapsResult(raw: unknown): GapsResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const critical = parseGapItems(r.critical);
  const important = parseGapItems(r.important);
  const niceToHave = parseGapItems(r.niceToHave);
  if (critical.length + important.length + niceToHave.length === 0) return null;
  return {
    critical,
    important,
    niceToHave,
    recommendedNext: str(r.recommendedNext),
  };
}

// ─────────────────────────────────────────────────────────────
// NARRATIVE IDENTITY — theme extraction across the storybank
// ─────────────────────────────────────────────────────────────

export interface StoryForNarrative {
  id: string;
  title: string;
  primarySkill: string;
  earnedSecret: string;
  spokenDraft: string;
}

export interface NarrativeTheme {
  theme: string;
  description: string;
  storyTitles: string[];
}

export interface NarrativeResult {
  themes: NarrativeTheme[];
  sharpestEdge: string;
  orphanStories: string[];
  fragileThemes: string[];
  howToUse: { inAnswers: string; inQuestions: string; inPositioning: string };
}

export function buildNarrativePrompt(stories: StoryForNarrative[]): { system: string; user: string } {
  const system = `You are an expert interview coach following the noamseg/interview-coach-skill "stories narrative identity" workflow.

Cluster the candidate's stories by UNDERLYING THEME — not surface skill. Surface skills are "leadership" or "communication". Themes are specific patterns like "building systems where none existed", "translating between worlds that don't talk to each other", or "making unpopular bets that paid off". If a theme could describe a generic candidate, go deeper.

Look for the meta-narrative: how has this candidate's understanding of their craft evolved? That evolution IS their narrative identity.

Then:
- Identify 2-3 dominant themes (most candidates have 2; three is rare).
- Name the SHARPEST EDGE — the most distinctive, hardest-to-replicate theme an interviewer would remember.
- Flag ORPHAN stories that connect to no theme (dilute the narrative; retirement/reframe candidates).
- Flag FRAGILE themes supported by only 1 story (anecdote, not a pattern).

Output STRICT JSON. No markdown, no code fences.

JSON schema:
{
  "themes": [{ "theme": "string", "description": "one line", "storyTitles": ["string", ...] }, ...],
  "sharpestEdge": "which theme is most distinctive and why — the highest-leverage positioning move",
  "orphanStories": ["title", ...],
  "fragileThemes": ["theme", ...],
  "howToUse": {
    "inAnswers": "how to connect answers back to themes without being heavy-handed",
    "inQuestions": "how to ask interviewer questions that reinforce the themes",
    "inPositioning": "how themes inform the why-this-role / why-this-company narrative"
  }
}`;

  const storyLines = stories
    .map(
      (s) =>
        `- "${s.title}" (skill: ${s.primarySkill || 'n/a'})\n  earned secret: ${
          s.earnedSecret || '(none)'
        }\n  summary: ${s.spokenDraft.slice(0, 400)}`
    )
    .join('\n');

  const user = `STORYBANK (${stories.length} stories):
${storyLines}

Extract the narrative identity. Return STRICT JSON only.`;

  return { system, user };
}

export function parseNarrativeResult(raw: unknown): NarrativeResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const themes = (Array.isArray(r.themes) ? r.themes : [])
    .map((t) => {
      if (!t || typeof t !== 'object') return null;
      const x = t as Record<string, unknown>;
      const theme = str(x.theme).trim();
      if (!theme) return null;
      return {
        theme,
        description: str(x.description),
        storyTitles: arrayOfStrings(x.storyTitles),
      };
    })
    .filter((t): t is NarrativeTheme => t !== null);
  if (themes.length === 0) return null;
  const how = (r.howToUse && typeof r.howToUse === 'object' ? r.howToUse : {}) as Record<string, unknown>;
  return {
    themes,
    sharpestEdge: str(r.sharpestEdge),
    orphanStories: arrayOfStrings(r.orphanStories),
    fragileThemes: arrayOfStrings(r.fragileThemes),
    howToUse: {
      inAnswers: str(how.inAnswers),
      inQuestions: str(how.inQuestions),
      inPositioning: str(how.inPositioning),
    },
  };
}
