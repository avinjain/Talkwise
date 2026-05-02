import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/session';
import { checkRateLimit } from '@/lib/ratelimit';
import { logUsage } from '@/lib/db';
import { estimateCost } from '@/lib/costs';
import { getOpenAI, pickModel } from '@/lib/openai';

export const runtime = 'nodejs';

const MAX_INPUT = 6000;

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) return NextResponse.json({ error: rateCheck.reason }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const raw = typeof body.bullets === 'string' ? body.bullets.trim() : '';
    if (!raw) return NextResponse.json({ error: 'Add some bullets or rough notes first.' }, { status: 400 });
    if (raw.length > MAX_INPUT)
      return NextResponse.json({ error: 'Notes are too long — try shortening.' }, { status: 400 });

    const prompt = `You are an interview coach. The candidate pasted rough notes or bullets about ONE past experience. Rewrite it into a clear STAR behavioral story they can speak aloud.

STAR definitions:
- Situation: brief context (team, stakes, constraints)
- Task: what they needed to accomplish or decide
- Action: specific steps THEY took (not "we" vague — their moves)
- Result: measurable or qualitative outcome; optional short reflection if relevant

Rules:
- Stay faithful to facts implied in their notes; do not invent employers, metrics, or titles they didn't hint at.
- If notes are thin, mark plausible specifics lightly or suggest what they could quantify in rehearsal — prefer honest wording over fabrication.
- Keep each STAR section tight (2–4 sentences each unless their material warrants more).

Candidate notes:
---
${raw}
---

Respond with ONLY valid JSON (no markdown fences):
{
  "situation": "...",
  "task": "...",
  "action": "...",
  "result": "...",
  "spokenDraft": "One cohesive 45–90 second spoken paragraph combining STAR (still readable if split)."
}`;

    const model = pickModel('story_star');
    const response = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.45,
      max_tokens: 900,
    });

    const text = response.choices[0]?.message?.content?.trim() || '{}';
    let parsed: {
      situation?: string;
      task?: string;
      action?: string;
      result?: string;
      spokenDraft?: string;
    } = {};
    try {
      const clean = text.replace(/```json?\s*/g, '').replace(/```\s*$/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: 'Could not parse STAR output — try again.' }, { status: 502 });
    }

    const usage = response.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    try {
      logUsage({
        userId,
        endpoint: '/api/interview/story-star',
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: estimateCost(model, promptTokens, completionTokens),
      });
    } catch {}

    return NextResponse.json({
      situation: parsed.situation ?? '',
      task: parsed.task ?? '',
      action: parsed.action ?? '',
      result: parsed.result ?? '',
      spokenDraft: parsed.spokenDraft ?? '',
    });
  } catch (err) {
    console.error('story-star:', err);
    const msg = err instanceof Error ? err.message : 'Failed to generate STAR story';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
