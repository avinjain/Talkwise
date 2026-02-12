import { getAuthUserId } from '@/lib/session';
import { getProfileResult, saveProfileResult } from '@/lib/db';
import { calculateScores } from '@/lib/personality-test';

export const runtime = 'nodejs';

// GET /api/profile — get current user's profile results
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const row = getProfileResult(userId);
    if (!row) {
      return Response.json({ hasResult: false });
    }

    return Response.json({
      hasResult: true,
      scores: {
        assertiveness: row.assertiveness,
        empathy: row.empathy,
        confidence: row.confidence,
        adaptability: row.adaptability,
        emotionalIntelligence: row.emotional_intelligence,
        socialEnergy: row.social_energy,
      },
      rawAnswers: JSON.parse(row.raw_answers || '{}'),
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// POST /api/profile — save test results
export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { answers } = await req.json() as { answers: Record<number, number> };

    if (!answers || typeof answers !== 'object') {
      return Response.json({ error: 'Invalid answers' }, { status: 400 });
    }

    const scores = calculateScores(answers);
    saveProfileResult(userId, scores, answers);

    return Response.json({ scores }, { status: 201 });
  } catch (error) {
    console.error('Profile POST error:', error);
    const message = error instanceof Error ? error.message : 'Failed to save profile';
    return Response.json({ error: message }, { status: 500 });
  }
}
