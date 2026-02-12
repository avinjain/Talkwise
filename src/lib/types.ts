export interface PersonaConfig {
  name: string;
  scenario: string;
  userGoal: string;
  difficultyLevel: number;
  decisionOrientation: number;
  communicationStyle: number;
  authorityPosture: number;
  temperamentStability: number;
  socialPresence: number;
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
  alternativeSuggestions: {
    original: string;
    suggestion: string;
    rationale: string;
  }[];
}

// ── Goal options (selectable cards) ──

export const GOAL_OPTIONS = [
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

// ── Personality Matrix with trait names per value ──

export const PERSONA_ATTRIBUTES = [
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

export type PersonaAttributeKey = (typeof PERSONA_ATTRIBUTES)[number]['key'];
