// MBTI: 4 dichotomies, forced-choice style
// E/I, S/N, T/F, J/P

export const MBTI_DIMENSIONS = [
  { key: 'ei', label: 'Extraversion vs Introversion', a: 'E', b: 'I', aLabel: 'Extraversion', bLabel: 'Introversion' },
  { key: 'sn', label: 'Sensing vs Intuition', a: 'S', b: 'N', aLabel: 'Sensing', bLabel: 'Intuition' },
  { key: 'tf', label: 'Thinking vs Feeling', a: 'T', b: 'F', aLabel: 'Thinking', bLabel: 'Feeling' },
  { key: 'jp', label: 'Judging vs Perceiving', a: 'J', b: 'P', aLabel: 'Judging', bLabel: 'Perceiving' },
] as const;

export type MBTIDimensionKey = (typeof MBTI_DIMENSIONS)[number]['key'];

export interface MBTIQuestion {
  id: string;
  dimension: MBTIDimensionKey;
  question: string;
  optionA: string;
  optionB: string;
  order: number;
}

export interface MBTIAnswers {
  [questionId: string]: 'A' | 'B'; // A = first preference, B = second
}

export interface MBTIResult {
  type: string; // e.g. "INTJ"
  ei: 'E' | 'I';
  sn: 'S' | 'N';
  tf: 'T' | 'F';
  jp: 'J' | 'P';
  scores: { ei: number; sn: number; tf: number; jp: number }; // -1 to 1, negative = first preference
}

export function calculateMBTIResult(
  questions: MBTIQuestion[],
  answers: MBTIAnswers
): MBTIResult {
  const counts: Record<MBTIDimensionKey, { a: number; b: number }> = {
    ei: { a: 0, b: 0 },
    sn: { a: 0, b: 0 },
    tf: { a: 0, b: 0 },
    jp: { a: 0, b: 0 },
  };

  for (const q of questions) {
    const ans = answers[q.id];
    if (ans === 'A') counts[q.dimension].a++;
    else if (ans === 'B') counts[q.dimension].b++;
  }

  const scores: MBTIResult['scores'] = { ei: 0, sn: 0, tf: 0, jp: 0 };
  const dims = ['ei', 'sn', 'tf', 'jp'] as const;

  for (const d of dims) {
    const { a, b } = counts[d];
    const total = a + b;
    if (total > 0) {
      scores[d] = (a - b) / total; // -1 to 1
    }
  }

  const ei: 'E' | 'I' = scores.ei >= 0 ? 'E' : 'I';
  const sn: 'S' | 'N' = scores.sn >= 0 ? 'S' : 'N';
  const tf: 'T' | 'F' = scores.tf >= 0 ? 'T' : 'F';
  const jp: 'J' | 'P' = scores.jp >= 0 ? 'J' : 'P';

  return {
    type: `${ei}${sn}${tf}${jp}`,
    ei,
    sn,
    tf,
    jp,
    scores,
  };
}
