import { getMBTIQuestions } from '@/lib/db';
import type { MBTIQuestion } from '@/lib/mbti';

export const runtime = 'nodejs';

// GET /api/mbti/questions — return stored MBTI questions
export async function GET() {
  try {
    const rows = getMBTIQuestions();
    const questions: MBTIQuestion[] = rows.map((r) => ({
      id: r.id,
      dimension: r.dimension as MBTIQuestion['dimension'],
      question: r.question_text,
      optionA: r.option_a,
      optionB: r.option_b,
      order: r.question_order,
    }));
    return Response.json({ questions });
  } catch (error) {
    console.error('MBTI questions GET error:', error);
    return Response.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
