import { getOpenAI } from '@/lib/openai';
import { buildPersonaSystemPrompt } from '@/lib/prompts';
import { PersonaConfig, ChatMessage } from '@/lib/types';
import { truncateMessages, countMessagesTokens } from '@/lib/tokens';
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
    const systemPrompt = buildPersonaSystemPrompt(personaConfig);

    // ── Token management: truncate old messages ──
    const trimmedMessages = truncateMessages(systemPrompt, messages, model);

    const apiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...trimmedMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Count prompt tokens for usage tracking
    const promptTokens = countMessagesTokens(apiMessages, model);

    const response = await getOpenAI().chat.completions.create({
      model,
      messages: apiMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 500,
    });

    let completionText = '';
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              completionText += text;
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          console.error('Stream iteration error:', err);
        } finally {
          controller.close();

          // ── Log usage after stream completes ──
          // Rough estimate: ~0.75 tokens per word for completion
          const completionTokens = Math.ceil(completionText.length / 4);
          const totalTokens = promptTokens + completionTokens;
          const cost = estimateCost(model, promptTokens, completionTokens);

          try {
            logUsage({
              userId,
              endpoint: '/api/chat',
              model,
              promptTokens,
              completionTokens,
              totalTokens,
              estimatedCost: cost,
            });
          } catch (logErr) {
            console.error('Failed to log usage:', logErr);
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    if (error instanceof Response) return error;
    const message =
      error instanceof Error ? error.message : 'Failed to generate response';
    console.error('Chat API error:', error);
    return Response.json({ error: message }, { status: 500 });
  }
}
