// ── Personality Test: 9 constructs, 3 questions each, 27 total ──
// Psychometrically sound, 5-point Likert scale, includes reverse-scored items
// Measures traits predictive of professional effectiveness & personal relationship quality

export const DIMENSIONS = [
  {
    key: 'conscientiousness',
    label: 'Conscientiousness',
    color: '#2563eb',
    description: 'Reliability, organization, and follow-through on commitments',
    highProfessional: 'Dependable team member who consistently meets deadlines and delivers high-quality work. Trusted with important projects.',
    lowProfessional: 'May struggle with time management and follow-through. Could benefit from building systems for accountability.',
    highPersonal: 'A reliable partner and friend who follows through on promises. Others feel secure and valued in the relationship.',
    lowPersonal: 'May come across as flaky or inconsistent. Relationships may suffer from unmet expectations.',
  },
  {
    key: 'emotionalStability',
    label: 'Emotional Stability',
    color: '#0891b2',
    description: 'Composure under pressure and resilience to setbacks',
    highProfessional: 'Stays calm in high-pressure situations. A stabilizing force during crises who makes clear-headed decisions.',
    lowProfessional: 'Stress may lead to reactive decision-making. Could benefit from developing coping strategies for workplace pressure.',
    highPersonal: 'Brings calm and consistency to relationships. Does not escalate conflicts or create unnecessary drama.',
    lowPersonal: 'Emotional volatility may create tension. Partners and friends may feel they need to walk on eggshells.',
  },
  {
    key: 'agreeableness',
    label: 'Agreeableness',
    color: '#059669',
    description: 'Cooperation, warmth, and consideration for others',
    highProfessional: 'Excellent team player who builds harmony. Valued for creating a positive, inclusive work environment.',
    lowProfessional: 'Direct and competitive, which can drive results but may alienate colleagues. Balancing candor with warmth helps.',
    highPersonal: 'Warm, supportive, and easy to be around. Naturally builds deep, trusting relationships.',
    lowPersonal: 'May come across as blunt or self-focused. Investing in active listening can strengthen bonds.',
  },
  {
    key: 'emotionalIntelligence',
    label: 'Emotional Intelligence',
    color: '#7c3aed',
    description: 'Reading emotions, managing your own, and navigating social dynamics',
    highProfessional: 'Excellent at reading the room, managing stakeholders, and navigating office politics constructively.',
    lowProfessional: 'May miss social cues or unintentionally offend. Building awareness of others\' emotional states would help.',
    highPersonal: 'Deeply attuned to partner\'s and friends\' feelings. Creates emotional safety and intimacy.',
    lowPersonal: 'May struggle to understand or validate others\' emotions. Relationships may lack depth.',
  },
  {
    key: 'integrity',
    label: 'Integrity',
    color: '#dc2626',
    description: 'Honesty, ethical consistency, and trustworthiness',
    highProfessional: 'Trusted implicitly by colleagues and leadership. Ethical decision-making builds long-term credibility.',
    lowProfessional: 'May prioritize short-term gains over ethical standards. Rebuilding trust after lapses is costly.',
    highPersonal: 'Others feel completely safe being vulnerable. The foundation of lasting, meaningful relationships.',
    lowPersonal: 'Trust issues may arise. Even small inconsistencies erode the fabric of close relationships over time.',
  },
  {
    key: 'assertiveness',
    label: 'Assertiveness',
    color: '#ea580c',
    description: 'Confidence in expressing needs, opinions, and boundaries',
    highProfessional: 'Advocates effectively for ideas and team. Seen as a leader who speaks up when it matters.',
    lowProfessional: 'Good ideas may go unheard. Developing a voice in meetings and negotiations is key to career growth.',
    highPersonal: 'Sets healthy boundaries and communicates needs clearly. Relationships are balanced and respectful.',
    lowPersonal: 'May suppress needs, leading to resentment. Learning to voice concerns prevents relationship erosion.',
  },
  {
    key: 'conflictStyle',
    label: 'Conflict Resolution',
    color: '#0d9488',
    description: 'How constructively you approach and resolve disagreements',
    highProfessional: 'Resolves disputes efficiently and fairly. A go-to mediator who keeps teams productive through disagreements.',
    lowProfessional: 'Conflict may escalate or go unaddressed. Developing structured resolution approaches would boost effectiveness.',
    highPersonal: 'Navigates disagreements without damaging the relationship. Partners feel heard even during arguments.',
    lowPersonal: 'Arguments may become destructive or get swept under the rug. Both patterns erode relationship quality.',
  },
  {
    key: 'stressResponse',
    label: 'Stress Response',
    color: '#ca8a04',
    description: 'How effectively you manage and recover from stress',
    highProfessional: 'Maintains productivity and judgment under pressure. Recovers quickly from setbacks and models resilience.',
    lowProfessional: 'Stress may impair performance and decision-making. Building stress management habits is essential.',
    highPersonal: 'Doesn\'t bring work stress home. Remains present and engaged with loved ones despite external pressures.',
    lowPersonal: 'Stress spillover may strain relationships. Partners may feel neglected or burdened by your stress.',
  },
  {
    key: 'motivationOrientation',
    label: 'Motivation',
    color: '#be185d',
    description: 'Internal drive, purpose-alignment, and sustained engagement',
    highProfessional: 'Self-driven and purposeful. Pursues growth proactively and inspires others through genuine enthusiasm.',
    lowProfessional: 'May depend on external validation or struggle with sustained effort. Connecting work to personal values helps.',
    highPersonal: 'Brings energy and intentionality to relationships. Actively invests in shared experiences and growth.',
    lowPersonal: 'Relationships may feel stagnant. Actively pursuing shared goals and experiences can reignite connection.',
  },
] as const;

export type DimensionKey = (typeof DIMENSIONS)[number]['key'];

export interface TestQuestion {
  id: number;
  dimension: DimensionKey;
  question: string;
  reversed: boolean; // if true, scoring is inverted (5→1, 4→2, etc.)
}

export interface ProfileResult {
  conscientiousness: number;
  emotionalStability: number;
  agreeableness: number;
  emotionalIntelligence: number;
  integrity: number;
  assertiveness: number;
  conflictStyle: number;
  stressResponse: number;
  motivationOrientation: number;
}

// 5-point Likert scale labels
export const LIKERT_OPTIONS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

export const QUESTIONS: TestQuestion[] = [
  // ── Conscientiousness (3 questions) ──
  {
    id: 1,
    dimension: 'conscientiousness',
    question: 'I finish tasks I start, even when they become tedious or difficult.',
    reversed: false,
  },
  {
    id: 2,
    dimension: 'conscientiousness',
    question: 'I often leave things to the last minute and then rush to get them done.',
    reversed: true,
  },
  {
    id: 3,
    dimension: 'conscientiousness',
    question: 'People around me can count on me to do what I said I would do.',
    reversed: false,
  },

  // ── Emotional Stability (3 questions) ──
  {
    id: 4,
    dimension: 'emotionalStability',
    question: 'Small setbacks during the day tend to throw off my mood for hours.',
    reversed: true,
  },
  {
    id: 5,
    dimension: 'emotionalStability',
    question: 'When plans change unexpectedly, I adjust without getting upset.',
    reversed: false,
  },
  {
    id: 6,
    dimension: 'emotionalStability',
    question: 'I find myself worrying about things that haven\'t happened yet.',
    reversed: true,
  },

  // ── Agreeableness (3 questions) ──
  {
    id: 7,
    dimension: 'agreeableness',
    question: 'When someone asks for help during a busy period, I still try to make time for them.',
    reversed: false,
  },
  {
    id: 8,
    dimension: 'agreeableness',
    question: 'If I disagree with someone, I tend to focus on winning the argument rather than understanding them.',
    reversed: true,
  },
  {
    id: 9,
    dimension: 'agreeableness',
    question: 'I go out of my way to make new people feel included, even when it\'s inconvenient.',
    reversed: false,
  },

  // ── Emotional Intelligence (3 questions) ──
  {
    id: 10,
    dimension: 'emotionalIntelligence',
    question: 'I can usually tell when someone is upset even if they don\'t say anything.',
    reversed: false,
  },
  {
    id: 11,
    dimension: 'emotionalIntelligence',
    question: 'When I\'m frustrated with someone, I sometimes say things I later regret.',
    reversed: true,
  },
  {
    id: 12,
    dimension: 'emotionalIntelligence',
    question: 'Before responding to criticism, I take a moment to consider it objectively.',
    reversed: false,
  },

  // ── Integrity / Honesty (3 questions) ──
  {
    id: 13,
    dimension: 'integrity',
    question: 'I speak up when I see something unethical, even when it\'s uncomfortable.',
    reversed: false,
  },
  {
    id: 14,
    dimension: 'integrity',
    question: 'I sometimes exaggerate my contributions when describing my work to others.',
    reversed: true,
  },
  {
    id: 15,
    dimension: 'integrity',
    question: 'When I make a mistake, I admit it rather than trying to cover it up.',
    reversed: false,
  },

  // ── Assertiveness (3 questions) ──
  {
    id: 16,
    dimension: 'assertiveness',
    question: 'When I feel my boundaries are being crossed, I address it directly.',
    reversed: false,
  },
  {
    id: 17,
    dimension: 'assertiveness',
    question: 'I tend to agree with others in group settings even when I have a different opinion.',
    reversed: true,
  },
  {
    id: 18,
    dimension: 'assertiveness',
    question: 'In negotiations, I state what I need clearly rather than hoping the other person figures it out.',
    reversed: false,
  },

  // ── Conflict Style (3 questions) ──
  {
    id: 19,
    dimension: 'conflictStyle',
    question: 'During disagreements, I focus on the issue at hand rather than bringing up past grievances.',
    reversed: false,
  },
  {
    id: 20,
    dimension: 'conflictStyle',
    question: 'When someone upsets me, I tend to shut down or give the silent treatment.',
    reversed: true,
  },
  {
    id: 21,
    dimension: 'conflictStyle',
    question: 'After a conflict, I take initiative to repair the relationship rather than waiting for the other person.',
    reversed: false,
  },

  // ── Stress Response Pattern (3 questions) ──
  {
    id: 22,
    dimension: 'stressResponse',
    question: 'Under heavy pressure, I can still think clearly and prioritize what matters most.',
    reversed: false,
  },
  {
    id: 23,
    dimension: 'stressResponse',
    question: 'When I\'m stressed, it noticeably affects how I treat the people around me.',
    reversed: true,
  },
  {
    id: 24,
    dimension: 'stressResponse',
    question: 'After a stressful period, I recover my energy and focus within a day or two.',
    reversed: false,
  },

  // ── Motivation Orientation (3 questions) ──
  {
    id: 25,
    dimension: 'motivationOrientation',
    question: 'I pursue goals because they genuinely matter to me, not just because others expect me to.',
    reversed: false,
  },
  {
    id: 26,
    dimension: 'motivationOrientation',
    question: 'I often lose interest in projects once the initial excitement wears off.',
    reversed: true,
  },
  {
    id: 27,
    dimension: 'motivationOrientation',
    question: 'I actively look for ways to grow and challenge myself, even without external pressure.',
    reversed: false,
  },
];

/** Reverse a Likert score (5→1, 4→2, 3→3, 2→4, 1→5) */
function reverseScore(score: number): number {
  return 6 - score;
}

/**
 * Calculate dimension scores (0-10) from raw Likert answers.
 *
 * Scoring framework:
 * 1. For each question, use the raw 1-5 answer. If the item is reverse-scored, flip it.
 * 2. Average the adjusted scores per construct.
 * 3. Map the 1-5 average to a 0-10 scale: score = ((avg - 1) / 4) * 10
 *
 * Interpretation bands:
 * - Low:      0.0 – 3.3
 * - Moderate: 3.4 – 6.6
 * - High:     6.7 – 10.0
 */
export function calculateScores(answers: Record<number, number>): ProfileResult {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const dim of DIMENSIONS) {
    sums[dim.key] = 0;
    counts[dim.key] = 0;
  }

  for (const q of QUESTIONS) {
    const raw = answers[q.id];
    if (raw !== undefined) {
      const adjusted = q.reversed ? reverseScore(raw) : raw;
      sums[q.dimension] += adjusted;
      counts[q.dimension] += 1;
    }
  }

  const result: Record<string, number> = {};
  for (const dim of DIMENSIONS) {
    const count = counts[dim.key];
    if (count === 0) {
      result[dim.key] = 5; // default midpoint
    } else {
      const avg = sums[dim.key] / count; // 1-5 scale
      // Map 1-5 to 0-10
      result[dim.key] = Math.round(((avg - 1) / 4) * 100) / 10;
    }
  }

  return result as unknown as ProfileResult;
}

/** Get interpretation band label */
export function getBand(score: number): 'Low' | 'Moderate' | 'High' {
  if (score <= 3.3) return 'Low';
  if (score <= 6.6) return 'Moderate';
  return 'High';
}
