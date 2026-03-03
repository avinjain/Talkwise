import { getAuthUserId } from '@/lib/session';
import { getMBTIResult, saveMBTIResult } from '@/lib/db';
import { calculateMBTIResult } from '@/lib/mbti';
import type { MBTIQuestion, MBTIAnswers } from '@/lib/mbti';

export const runtime = 'nodejs';

// GET /api/mbti — get current user's MBTI result
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const row = getMBTIResult(userId);
    if (!row) {
      return Response.json({ hasResult: false });
    }

    const questionsSnapshot = (() => {
      try {
        return JSON.parse(row.questions_snapshot || '[]');
      } catch {
        return [];
      }
    })();

    return Response.json({
      hasResult: true,
      type: row.type_result,
      rawAnswers: JSON.parse(row.raw_answers || '{}'),
      questionsSnapshot,
      createdAt: row.created_at,
    });
  } catch (error) {
    console.error('MBTI GET error:', error);
    return Response.json({ error: 'Failed to fetch MBTI result' }, { status: 500 });
  }
}

// POST /api/mbti — save MBTI test results
export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { questions, answers } = (await req.json()) as {
      questions: MBTIQuestion[];
      answers: MBTIAnswers;
    };

    if (!questions?.length || !answers || typeof answers !== 'object') {
      return Response.json({ error: 'Invalid questions or answers' }, { status: 400 });
    }

    const result = calculateMBTIResult(questions, answers);
    const questionsSnapshot = questions.map((q) => ({
      id: q.id,
      dimension: q.dimension,
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      order: q.order,
    }));
    saveMBTIResult(userId, result.type, answers, questionsSnapshot);

    return Response.json({
      type: result.type,
      ei: result.ei,
      sn: result.sn,
      tf: result.tf,
      jp: result.jp,
      scores: result.scores,
    }, { status: 201 });
  } catch (error) {
    console.error('MBTI POST error:', error);
    const message = error instanceof Error ? error.message : 'Failed to save MBTI result';
    return Response.json({ error: message }, { status: 500 });
  }
}
