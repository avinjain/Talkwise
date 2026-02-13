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

  return `You are an expert communication and personality coach. A user has just completed a communication personality assessment. Based on their profile and personal context, provide deeply personalized, actionable feedback.

USER CONTEXT:
- Role/Occupation: ${context.role || 'Not specified'}
- Experience Level: ${context.experience || 'Not specified'}
- What they want to improve: ${context.goal || 'General communication'}
- Focus area: ${focusLabel}

ASSESSMENT SCORES (0-10 scale):
${scoreLines}

Provide your feedback as valid JSON with this exact schema (no markdown, no code fences):

{
  "summary": "<2-3 sentence overview of their communication personality — warm, direct, and personalized to their role>",
  "topStrengths": [
    { "dimension": "<dimension name>", "insight": "<1-2 sentences about how this strength helps them specifically in their ${context.focus === 'personal' ? 'social life' : 'career'} given their role>" }
  ],
  "growthAreas": [
    { "dimension": "<dimension name>", "insight": "<1-2 sentences about why this matters for them>", "tip": "<specific, actionable advice tailored to their role and goal>" }
  ],
  "personalizedAdvice": "<3-4 sentences of holistic advice connecting their scores to their stated goal. Reference their role and experience level. Be specific, not generic.>",
  "practiceScenario": "<Suggest one specific conversation scenario they should practice on TalkWise, tailored to their weakest area and their focus (${context.focus}). Be specific about the persona traits and scenario setup.>"
}

Rules:
- Include 2-3 items in topStrengths (highest scores)
- Include 2-3 items in growthAreas (lowest scores)
- Be encouraging but honest
- Reference their specific role and goal throughout
- Make tips actionable and specific, not vague platitudes
- The practiceScenario should be something they can directly set up in TalkWise`;
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
        assertiveness: row.assertiveness,
        empathy: row.empathy,
        confidence: row.confidence,
        adaptability: row.adaptability,
        emotionalIntelligence: row.emotional_intelligence,
        socialEnergy: row.social_energy,
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
            content: 'You are a personality and communication expert. Always respond with valid JSON only. No markdown, no code fences.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      aiFeedback = response.choices[0]?.message?.content || '';
    } catch (aiErr) {
      console.error('AI feedback generation failed:', aiErr);
      // Save without feedback — user can still see their scores
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
