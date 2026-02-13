import { getAuthUserId } from '@/lib/session';
import { getProfileResult, saveProfileResult } from '@/lib/db';
import { calculateScores, DIMENSIONS } from '@/lib/personality-test';
import { getOpenAI } from '@/lib/openai';

export const runtime = 'nodejs';

interface UserContext {
  role: string;
  experience: string;
  goal: string;
  focus: string;
}

function buildFeedbackPrompt(
  scores: Record<string, number>,
  context: UserContext
): string {
  const scoreLines = DIMENSIONS.map(
    (d) => `- ${d.label}: ${(scores[d.key] ?? 0).toFixed(1)}/10 — ${d.description}`
  ).join('\n');

  const focusLabel = context.focus === 'personal'
    ? 'personal and social life (dating, friendships, social situations)'
    : 'professional career (workplace, leadership, negotiations)';

  return `You are an expert psychologist and communication coach. A user has completed a psychometric personality assessment measuring 9 key constructs. Based on their profile and personal context, provide deeply personalized, actionable feedback.

USER CONTEXT:
- Role/Occupation: ${context.role || 'Not specified'}
- Experience Level: ${context.experience || 'Not specified'}
- What they want to improve: ${context.goal || 'General communication'}
- Focus area: ${focusLabel}

ASSESSMENT SCORES (0-10 scale, Low: 0-3.3, Moderate: 3.4-6.6, High: 6.7-10):
${scoreLines}

The 9 constructs measure:
1. Conscientiousness — reliability, follow-through
2. Emotional Stability — composure under pressure
3. Agreeableness — cooperation, warmth
4. Emotional Intelligence — reading/managing emotions
5. Integrity — honesty, ethical consistency
6. Assertiveness — expressing needs and boundaries
7. Conflict Resolution — constructive disagreement handling
8. Stress Response — managing and recovering from stress
9. Motivation — internal drive and sustained engagement

Provide your feedback as valid JSON with this exact schema (no markdown, no code fences):

{
  "summary": "<3-4 sentence overview of their personality profile. Be warm but honest. Reference their role and how their trait pattern plays out in their ${context.focus === 'personal' ? 'social life' : 'career'}. Mention their strongest and weakest areas naturally.>",
  "topStrengths": [
    { "dimension": "<dimension name>", "insight": "<2 sentences on how this strength specifically benefits them in their ${context.focus === 'personal' ? 'relationships' : 'professional life'}, given their role. Be specific, not generic.>" }
  ],
  "growthAreas": [
    { "dimension": "<dimension name>", "insight": "<1-2 sentences on why this area matters for them specifically>", "tip": "<A specific, behavioral action step they can take this week. Not a vague platitude — something concrete and measurable.>" }
  ],
  "professionalInsight": "<2-3 sentences on how their overall trait pattern impacts their professional effectiveness. Reference specific trait combinations (e.g., 'Your high assertiveness paired with moderate agreeableness means...').>",
  "personalInsight": "<2-3 sentences on how their trait pattern affects personal relationships and social dynamics. Be genuine and helpful.>",
  "practiceScenario": "<Suggest one specific TalkWise conversation scenario they should practice, tailored to their lowest-scoring area and their focus (${context.focus}). Include the persona traits and scenario they should set up.>"
}

Rules:
- Include 2-3 items in topStrengths (highest scores)
- Include 2-3 items in growthAreas (lowest scores)
- Be encouraging but honest — avoid toxic positivity
- Reference their specific role and goal throughout
- Make tips behavioral and actionable ("Practice saying X in situation Y")
- The practiceScenario should be directly actionable in TalkWise
- Consider trait interactions (e.g., low assertiveness + high agreeableness = people-pleasing pattern)`;
}

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
        conscientiousness: row.conscientiousness,
        emotionalStability: row.emotional_stability,
        agreeableness: row.agreeableness,
        emotionalIntelligence: row.emotional_intelligence,
        integrity: row.integrity,
        assertiveness: row.assertiveness,
        conflictStyle: row.conflict_style,
        stressResponse: row.stress_response,
        motivationOrientation: row.motivation_orientation,
      },
      rawAnswers: JSON.parse(row.raw_answers || '{}'),
      userContext: JSON.parse(row.user_context || '{}'),
      aiFeedback: row.ai_feedback ? JSON.parse(row.ai_feedback) : null,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// POST /api/profile — save test results and generate AI feedback
export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { answers, userContext } = await req.json() as {
      answers: Record<number, number>;
      userContext: UserContext;
    };

    if (!answers || typeof answers !== 'object') {
      return Response.json({ error: 'Invalid answers' }, { status: 400 });
    }

    const scores = calculateScores(answers);

    // Generate AI feedback
    let aiFeedback = '';
    try {
      const model = process.env.GPT_MODEL || 'gpt-4o';
      const prompt = buildFeedbackPrompt(scores as unknown as Record<string, number>, userContext || {
        role: '', experience: '', goal: '', focus: 'professional',
      });

      const response = await getOpenAI().chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a personality assessment expert. Always respond with valid JSON only. No markdown, no code fences.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      aiFeedback = response.choices[0]?.message?.content || '';
    } catch (aiErr) {
      console.error('AI feedback generation failed:', aiErr);
    }

    saveProfileResult(userId, scores, answers, (userContext || {}) as unknown as Record<string, string>, aiFeedback);

    return Response.json({
      scores,
      aiFeedback: aiFeedback ? JSON.parse(aiFeedback) : null,
    }, { status: 201 });
  } catch (error) {
    console.error('Profile POST error:', error);
    const message = error instanceof Error ? error.message : 'Failed to save profile';
    return Response.json({ error: message }, { status: 500 });
  }
}
