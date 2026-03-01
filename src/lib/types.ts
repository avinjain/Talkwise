export type Track = 'professional' | 'personal' | 'interview';

export const ENABLE_INTERVIEW_PREP = process.env.NEXT_PUBLIC_ENABLE_INTERVIEW_PREP === 'true';

export interface InterviewPrepContext {
  company: string;
  role: string;
  format: string;
  jd?: string;
  resume?: string;
}

export interface PersonaConfig {
  track: Track;
  name: string;
  scenario: string;
  userGoal: string;
  interviewPrep?: InterviewPrepContext;
  // Professional traits
  difficultyLevel: number;
  decisionOrientation: number;
  communicationStyle: number;
  authorityPosture: number;
  temperamentStability: number;
  socialPresence: number;
  // Personal traits
  interestLevel: number;
  flirtatiousness: number;
  communicationEffort: number;
  emotionalOpenness: number;
  humorStyle: number;
  pickiness: number;
}

export interface SavedPersona {
  id: string;
  userId: string;
  track: Track;
  name: string;
  goal: string;
  scenario: string;
  // Professional traits
  difficultyLevel: number;
  decisionOrientation: number;
  communicationStyle: number;
  authorityPosture: number;
  temperamentStability: number;
  socialPresence: number;
  // Personal traits
  interestLevel: number;
  flirtatiousness: number;
  communicationEffort: number;
  emotionalOpenness: number;
  humorStyle: number;
  pickiness: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface FeedbackReport {
  confidenceScore: number;
  confidenceNotes: string;
  articulationFeedback: string[];
  personaReactionSummary: string;
  alternativeSuggestions: { original: string; suggestion: string; rationale: string }[];
  interviewDimensions?: { substance: number; structure: number; relevance: number; credibility: number; differentiation: number };
}

// ── Goal options (selectable cards) ──

export const PROFESSIONAL_GOAL_OPTIONS = [
  {
    id: 'promotion',
    label: 'Asking for a Promotion',
    icon: '🚀',
    description: 'Make your case for a role advancement',
  },
  {
    id: 'salary',
    label: 'Salary Negotiation',
    icon: '💰',
    description: 'Negotiate compensation or a raise',
  },
  {
    id: 'conflict',
    label: 'Conflict Resolution',
    icon: '⚡',
    description: 'Navigate a disagreement or tense situation',
  },
  {
    id: 'growth',
    label: 'Growth Discussion',
    icon: '📈',
    description: 'Discuss career growth and development path',
  },
  {
    id: 'performance',
    label: 'Performance Review',
    icon: '📋',
    description: 'Handle performance feedback conversations',
  },
  {
    id: 'bad-news',
    label: 'Delivering Bad News',
    icon: '🔔',
    description: 'Communicate difficult information tactfully',
  },
  {
    id: 'feedback',
    label: 'Giving Tough Feedback',
    icon: '🎯',
    description: 'Provide constructive but difficult feedback',
  },
  {
    id: 'idea-pitch',
    label: 'Pitching an Idea',
    icon: '💡',
    description: 'Convince a stakeholder of your proposal',
  },
] as const;

export const PERSONAL_GOAL_OPTIONS = [
  {
    id: 'first-message',
    label: 'First Message / Opener',
    icon: '👋',
    description: 'Craft a great opening on Tinder, Bumble, or Hinge',
  },
  {
    id: 'get-number',
    label: 'Getting Their Number',
    icon: '📱',
    description: 'Transition from app chat to real contact',
  },
  {
    id: 'plan-date',
    label: 'Planning the First Date',
    icon: '☕',
    description: 'Suggest and plan an exciting first meetup',
  },
  {
    id: 'keep-convo',
    label: 'Keeping the Conversation Going',
    icon: '💬',
    description: 'Avoid awkward silences and keep things flowing',
  },
  {
    id: 'flirty-banter',
    label: 'Flirty Banter',
    icon: '😏',
    description: 'Practice playful, witty, and flirty exchanges',
  },
  {
    id: 'deep-connection',
    label: 'Deep Conversation',
    icon: '💫',
    description: 'Build emotional connection through meaningful talk',
  },
  {
    id: 'recover-awkward',
    label: 'Recovering from Awkwardness',
    icon: '😅',
    description: 'Bounce back from a cringe moment or dry spell',
  },
  {
    id: 'be-funny',
    label: 'Being Funny & Witty',
    icon: '😂',
    description: 'Practice humor that lands and makes them laugh',
  },
] as const;

export const INTERVIEW_GOAL_OPTIONS = [
  { id: 'tmay', label: 'Tell Me About Yourself', icon: '🎯', description: 'Opening pitch and self-introduction' },
  { id: 'conflict', label: 'Conflict Resolution', icon: '⚡', description: 'Describe a time you handled conflict' },
  { id: 'failure', label: 'Failure / Mistake', icon: '📉', description: 'Describe a failure and what you learned' },
  { id: 'leadership', label: 'Leadership Example', icon: '👥', description: 'Leading a team or influencing without authority' },
  { id: 'salary', label: 'Salary Expectations', icon: '💰', description: 'Discussing compensation and expectations' },
  { id: 'behavioral', label: 'Behavioral Deep Dive', icon: '🔍', description: 'STAR-format behavioral questions' },
  { id: 'system-design', label: 'System Design (Tech)', icon: '🏗️', description: 'Architecture and design discussion' },
  { id: 'questions', label: 'Questions to Ask', icon: '❓', description: 'Prepare strong questions for the interviewer' },
] as const;

export function getGoalOptions(track: Track) {
  if (track === 'personal') return PERSONAL_GOAL_OPTIONS;
  if (track === 'interview') return INTERVIEW_GOAL_OPTIONS;
  return PROFESSIONAL_GOAL_OPTIONS;
}

// ── Personality Matrix with trait names per value ──

export const PROFESSIONAL_PERSONA_ATTRIBUTES = [
  {
    key: 'difficultyLevel' as const,
    label: 'Difficulty Level',
    lowLabel: 'Easy-going',
    highLabel: 'Very Challenging',
    description:
      'Overall difficulty in reaching a consensus or pleasing them.',
    traitNames: [
      'Pushover',        // 0
      'Very Easy',       // 1
      'Easy-going',      // 2
      'Agreeable',       // 3
      'Moderate',        // 4
      'Balanced',        // 5
      'Firm',            // 6
      'Tough',           // 7
      'Very Tough',      // 8
      'Demanding',       // 9
      'Hardball',        // 10
    ],
  },
  {
    key: 'decisionOrientation' as const,
    label: 'Decision Orientation',
    lowLabel: 'Emotional / Intuitive',
    highLabel: 'Rational / Data-driven',
    description: 'How they make decisions — gut feeling vs. hard data.',
    traitNames: [
      'Pure Gut',        // 0
      'Very Intuitive',  // 1
      'Intuitive',       // 2
      'Feeling-led',     // 3
      'Leaning Intuitive', // 4
      'Balanced',        // 5
      'Leaning Analytical', // 6
      'Analytical',      // 7
      'Very Analytical',  // 8
      'Data-focused',    // 9
      'Pure Data',       // 10
    ],
  },
  {
    key: 'communicationStyle' as const,
    label: 'Communication Style',
    lowLabel: 'Flowery / Vague',
    highLabel: 'Concise / Direct',
    description: 'How they speak — elaborate vs. to-the-point.',
    traitNames: [
      'Very Vague',      // 0
      'Vague',           // 1
      'Roundabout',      // 2
      'Indirect',        // 3
      'Leaning Indirect', // 4
      'Balanced',        // 5
      'Leaning Direct',  // 6
      'Direct',          // 7
      'Very Direct',     // 8
      'Blunt',           // 9
      'Razor Sharp',     // 10
    ],
  },
  {
    key: 'authorityPosture' as const,
    label: 'Authority Posture',
    lowLabel: 'Collaborative / Peer-like',
    highLabel: 'Hierarchical / Authoritative',
    description: 'How they exercise authority in the conversation.',
    traitNames: [
      'Very Peer-like',  // 0
      'Peer-like',       // 1
      'Casual',          // 2
      'Friendly',        // 3
      'Approachable',    // 4
      'Balanced',        // 5
      'Slightly Formal', // 6
      'Commanding',      // 7
      'Very Commanding', // 8
      'Dominant',        // 9
      'Authoritarian',   // 10
    ],
  },
  {
    key: 'temperamentStability' as const,
    label: 'Temperament Stability',
    lowLabel: 'Volatile / Easily frustrated',
    highLabel: 'Calm / Composed',
    description: 'How emotionally stable they are under pressure.',
    traitNames: [
      'Explosive',       // 0
      'Very Volatile',   // 1
      'Hot-headed',      // 2
      'Irritable',       // 3
      'Slightly Edgy',   // 4
      'Steady',          // 5
      'Fairly Calm',     // 6
      'Composed',        // 7
      'Very Composed',   // 8
      'Unflappable',     // 9
      'Ice Cold',        // 10
    ],
  },
  {
    key: 'socialPresence' as const,
    label: 'Social Presence',
    lowLabel: 'Cold / Introverted',
    highLabel: 'Warm / Extroverted',
    description: 'How socially engaging and warm they are.',
    traitNames: [
      'Distant',         // 0
      'Very Reserved',   // 1
      'Reserved',        // 2
      'Cool',            // 3
      'Slightly Cool',   // 4
      'Balanced',        // 5
      'Fairly Warm',     // 6
      'Warm',            // 7
      'Very Warm',       // 8
      'Engaging',        // 9
      'Magnetic',        // 10
    ],
  },
] as const;

export const PERSONAL_PERSONA_ATTRIBUTES = [
  {
    key: 'interestLevel' as const,
    label: 'Interest Level',
    lowLabel: 'Not interested',
    highLabel: 'Very into you',
    description: 'How receptive and engaged they are in the conversation.',
    traitNames: [
      'Ghosting',        // 0
      'Cold',            // 1
      'Distant',         // 2
      'Lukewarm',        // 3
      'Curious',         // 4
      'Interested',      // 5
      'Engaged',         // 6
      'Keen',            // 7
      'Eager',           // 8
      'Very Eager',      // 9
      'Hooked',          // 10
    ],
  },
  {
    key: 'flirtatiousness' as const,
    label: 'Flirtatiousness',
    lowLabel: 'Strictly platonic',
    highLabel: 'Very flirty',
    description: 'How much they flirt, tease, and give romantic signals.',
    traitNames: [
      'Platonic',        // 0
      'Reserved',        // 1
      'Polite',          // 2
      'Friendly',        // 3
      'Slightly Flirty', // 4
      'Balanced',        // 5
      'Flirty',          // 6
      'Teasing',         // 7
      'Very Flirty',     // 8
      'Seductive',       // 9
      'Irresistible',    // 10
    ],
  },
  {
    key: 'communicationEffort' as const,
    label: 'Communication Effort',
    lowLabel: 'Dry texter / One-word answers',
    highLabel: 'Expressive / Puts effort in',
    description: 'How much effort they put into their messages.',
    traitNames: [
      'One-word',        // 0
      'Minimal',         // 1
      'Low Effort',      // 2
      'Brief',           // 3
      'Average',         // 4
      'Decent',          // 5
      'Thoughtful',      // 6
      'Engaging',        // 7
      'Expressive',      // 8
      'Enthusiastic',    // 9
      'All In',          // 10
    ],
  },
  {
    key: 'emotionalOpenness' as const,
    label: 'Emotional Openness',
    lowLabel: 'Guarded / Surface-level',
    highLabel: 'Open / Vulnerable',
    description: 'How willing they are to share personal things and go deep.',
    traitNames: [
      'Walled Off',      // 0
      'Very Guarded',    // 1
      'Guarded',         // 2
      'Cautious',        // 3
      'Slightly Open',   // 4
      'Balanced',        // 5
      'Fairly Open',     // 6
      'Open',            // 7
      'Very Open',       // 8
      'Vulnerable',      // 9
      'Heart on Sleeve', // 10
    ],
  },
  {
    key: 'humorStyle' as const,
    label: 'Humor Style',
    lowLabel: 'Dry / Sarcastic',
    highLabel: 'Playful / Silly',
    description: 'Their sense of humor — from deadpan to bubbly.',
    traitNames: [
      'Deadpan',         // 0
      'Very Dry',        // 1
      'Dry',             // 2
      'Sarcastic',       // 3
      'Witty',           // 4
      'Balanced',        // 5
      'Light',           // 6
      'Playful',         // 7
      'Very Playful',    // 8
      'Silly',           // 9
      'Goofy',           // 10
    ],
  },
  {
    key: 'pickiness' as const,
    label: 'Pickiness',
    lowLabel: 'Easy-going / Low standards',
    highLabel: 'High standards / Selective',
    description: 'How selective they are and how much you need to impress.',
    traitNames: [
      'Anything Goes',   // 0
      'Very Chill',      // 1
      'Chill',           // 2
      'Easy-going',      // 3
      'Moderate',        // 4
      'Balanced',        // 5
      'Selective',       // 6
      'Picky',           // 7
      'Very Picky',      // 8
      'High Standards',  // 9
      'Ultra Selective', // 10
    ],
  },
] as const;

export function getPersonaAttributes(track: Track) {
  if (track === 'personal') return PERSONAL_PERSONA_ATTRIBUTES;
  return PROFESSIONAL_PERSONA_ATTRIBUTES; // interview reuses professional
}

// Legacy alias for backward compatibility
export const PERSONA_ATTRIBUTES = PROFESSIONAL_PERSONA_ATTRIBUTES;
export const GOAL_OPTIONS = PROFESSIONAL_GOAL_OPTIONS;

export type PersonaAttributeKey =
  | (typeof PROFESSIONAL_PERSONA_ATTRIBUTES)[number]['key']
  | (typeof PERSONAL_PERSONA_ATTRIBUTES)[number]['key'];
