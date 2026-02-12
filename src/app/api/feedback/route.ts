import openai from '@/lib/openai';
import { buildFeedbackPrompt } from '@/lib/prompts';
import { PersonaConfig, ChatMessage, FeedbackReport } from '@/lib/types';
import { getAuthUserId } from '@/lib/session';
import { checkRateLimit } from '@/lib/ratelimit';
import { logUsage } from '@/lib/db';
import { estimateCost } from '@/lib/costs';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // ── Auth check ──
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    // ── Rate limit check ──
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return Response.json(
        { error: rateCheck.reason },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.retryAfterSeconds || 60),
          },
        }
      );
    }

    const { messages, personaConfig } = (await req.json()) as {
      messages: ChatMessage[];
      personaConfig: PersonaConfig;
    };

    const model = process.env.GPT_MODEL || 'gpt-4o';
    const prompt = buildFeedbackPrompt(personaConfig, messages);

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a communication analysis expert. Always respond with valid JSON only. No markdown formatting, no code fences.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // ── Log usage ──
    const usage = response.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    const totalTokens = usage?.total_tokens || 0;
    const cost = estimateCost(model, promptTokens, completionTokens);

    try {
      logUsage({
        userId,
        endpoint: '/api/feedback',
        model,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost: cost,
      });
    } catch (logErr) {
      console.error('Failed to log usage:', logErr);
    }

    const feedback: FeedbackReport = JSON.parse(content);
    return Response.json(feedback);
  } catch (error: unknown) {
    if (error instanceof Response) return error;
    const message =
      error instanceof Error ? error.message : 'Failed to generate feedback';
    console.error('Feedback API error:', error);
    return Response.json({ error: message }, { status: 500 });
  }
}
