import OpenAI from 'openai';

let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

// ─────────────────────────────────────────────────────────────
// Model routing
// ─────────────────────────────────────────────────────────────
//
// Map each AI task to a model tier so cheap/easy work doesn't run
// on the most expensive model.
//
//   tier:premium → quality matters, user-facing latency-sensitive
//   tier:standard → analysis quality matters but mini is good enough
//   tier:cheap   → classification / format-following / extraction
//
// Per-task override env vars (set on Railway if you want to A/B):
//   GPT_MODEL_CHAT, GPT_MODEL_FEEDBACK, GPT_MODEL_CORE_POSITIONING,
//   GPT_MODEL_ANALYZE_PROFILE, GPT_MODEL_ANALYZE_RESUME,
//   GPT_MODEL_ANALYZE_LINKEDIN, GPT_MODEL_FILTER_GOALS,
//   GPT_MODEL_MBTI_QUESTIONS, GPT_MODEL_PROFILE_TEST, GPT_MODEL_STORY_STAR
//
// Global override (back-compat with old code paths):
//   GPT_MODEL — applies if a task-specific override is not set.

export type AITask =
  | 'chat'
  | 'feedback'
  | 'core_positioning'
  | 'analyze_profile'
  | 'analyze_resume'
  | 'analyze_linkedin'
  | 'filter_goals'
  | 'mbti_questions'
  | 'profile_test'
  | 'coach_prep'
  | 'coach_concerns'
  | 'coach_questions'
  | 'story_star';

const PREMIUM = 'gpt-4o';
const CHEAP = 'gpt-4o-mini';

const TASK_TIER: Record<AITask, 'premium' | 'standard' | 'cheap'> = {
  // High-stakes, user-facing, perceived-quality matters
  chat: 'premium',
  feedback: 'premium',
  core_positioning: 'premium',

  // Coach: prep + concerns are high-stakes (drives interview behaviour);
  // questions is more structured and runs fine on mini.
  coach_prep: 'premium',
  coach_concerns: 'premium',
  coach_questions: 'cheap',
  story_star: 'cheap',

  // Analytical work — mini handles these well, ~17x cheaper
  analyze_profile: 'cheap',
  analyze_resume: 'cheap',
  analyze_linkedin: 'cheap',

  // Pure classification / format-following — cheap is plenty
  filter_goals: 'cheap',
  mbti_questions: 'cheap',
  profile_test: 'cheap',
};

const TIER_MODEL: Record<'premium' | 'standard' | 'cheap', string> = {
  premium: PREMIUM,
  standard: PREMIUM,
  cheap: CHEAP,
};

function envOverride(task: AITask): string | undefined {
  const key = `GPT_MODEL_${task.toUpperCase()}`;
  return process.env[key];
}

/**
 * Choose a model for the given task.
 *
 * Priority: per-task env override → global GPT_MODEL → tier default.
 */
export function pickModel(task: AITask): string {
  const taskOverride = envOverride(task);
  if (taskOverride) return taskOverride;

  const globalOverride = process.env.GPT_MODEL;
  if (globalOverride) return globalOverride;

  return TIER_MODEL[TASK_TIER[task]];
}
