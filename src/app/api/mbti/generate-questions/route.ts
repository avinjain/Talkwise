import { getAuthUserId } from '@/lib/session';
import { getMBTIQuestions, clearMBTIQuestions, insertMBTIQuestions } from '@/lib/db';
import { getOpenAI } from '@/lib/openai';

export const runtime = 'nodejs';

const DIMENSIONS = ['ei', 'sn', 'tf', 'jp'] as const;

interface GeneratedQuestion {
  dimension: string;
  question: string;
  optionA: string;
  optionB: string;
}

// POST /api/mbti/generate-questions — generate MBTI questions via ChatGPT and store them
export async function POST() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const model = process.env.GPT_MODEL || 'gpt-4o';
    const prompt = `You are an expert in Myers-Briggs Type Indicator (MBTI) assessments. Generate 24 forced-choice questions for an MBTI-style personality test.

Requirements:
- 4 dichotomies: E/I (Extraversion vs Introversion), S/N (Sensing vs Intuition), T/F (Thinking vs Feeling), J/P (Judging vs Perceiving)
- 6 questions per dimension (24 total)
- Each question must present two options: the user picks which one describes them better
- Option A should lean toward the first pole (E, S, T, J), Option B toward the second (I, N, F, P)
- Questions should be clear, relatable, and suitable for professional/personal contexts
- Avoid jargon; use everyday language

Respond with valid JSON only (no markdown, no code fences):

{
  "questions": [
    {
      "dimension": "ei",
      "question": "At a party, you tend to...",
      "optionA": "Stay and mingle with many people, energized by the crowd",
      "optionB": "Have deep conversations with a few people or need time alone to recharge"
    },
    ...
  ]
}`;

    const response = await getOpenAI().chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an MBTI assessment expert. Always respond with valid JSON only. No markdown, no code fences.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from ChatGPT');
    }

    const parsed = JSON.parse(content) as { questions?: GeneratedQuestion[] };
    const questions = parsed.questions;
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid question format from ChatGPT');
    }

    // Validate dimensions
    const validDims = new Set(DIMENSIONS);
    const filtered = questions.filter(
      (q) =>
        validDims.has(q.dimension as (typeof DIMENSIONS)[number]) &&
        typeof q.question === 'string' &&
        typeof q.optionA === 'string' &&
        typeof q.optionB === 'string'
    );

    if (filtered.length < 16) {
      throw new Error('Too few valid questions generated');
    }

    // Clear existing and insert new
    clearMBTIQuestions();
    const toInsert = filtered.map((q, i) => ({
      id: crypto.randomUUID(),
      dimension: q.dimension,
      question_text: q.question.trim(),
      option_a: q.optionA.trim(),
      option_b: q.optionB.trim(),
      question_order: i,
    }));
    insertMBTIQuestions(toInsert);

    // Return questions so client can use them immediately (avoids second fetch / serverless DB isolation)
    const questionsForClient = toInsert.map((q) => ({
      id: q.id,
      dimension: q.dimension,
      question: q.question_text,
      optionA: q.option_a,
      optionB: q.option_b,
      order: q.question_order,
    }));

    return Response.json({ count: toInsert.length, questions: questionsForClient });
  } catch (error) {
    console.error('MBTI generate-questions error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate questions';
    return Response.json({ error: message }, { status: 500 });
  }
}

// GET /api/mbti/generate-questions — check if questions exist (optional helper)
export async function GET() {
  const questions = getMBTIQuestions();
  return Response.json({ count: questions.length });
}
