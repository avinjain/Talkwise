import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/session';
import { checkRateLimit } from '@/lib/ratelimit';
import { logUsage } from '@/lib/db';
import { estimateCost } from '@/lib/costs';
import { getOpenAI } from '@/lib/openai';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.reason }, { status: 429 });
    }

    const { linkedIn, role, jd } = (await req.json()) as {
      linkedIn: string;
      role?: string;
      jd?: string;
    };
    if (!linkedIn?.trim()) return NextResponse.json({ error: 'LinkedIn content is required' }, { status: 400 });

    const prompt = `You are an expert interview coach (aligned with interview-coach-skill framework). Analyze this LinkedIn profile content${role ? ` for a ${role} role` : ''}${jd ? '. Use the job description to assess fit.' : ''}

LINKEDIN PROFILE CONTENT:
---
${linkedIn.slice(0, 6000)}
---
${jd ? `\nJOB DESCRIPTION:\n---\n${jd.slice(0, 4000)}\n---` : ''}

Provide a concise analysis (plain text, no markdown) with:
1. **Profile strengths** — What stands out or differentiates this candidate (headline, about, experience)
2. **Coherence** — How well does the profile tell a consistent story? Any gaps or inconsistencies?
3. **Positioning** — How clearly does the profile convey value and expertise for${role ? ` a ${role}` : ' the target'} role?
4. **Quick improvements** — 2–3 specific tweaks to make the profile stronger${jd ? ' given the job description' : ''}

Keep it actionable and under 400 words.`;

    const model = process.env.GPT_MODEL || 'gpt-4o';
    const response = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 800,
    });

    const text = response.choices[0]?.message?.content || 'No analysis generated.';
    const usage = response.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;

    try {
      logUsage({
        userId,
        endpoint: '/api/interview/analyze-linkedin',
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: estimateCost(model, promptTokens, completionTokens),
      });
    } catch {}

    return NextResponse.json({ analysis: text });
  } catch (err) {
    console.error('LinkedIn analysis error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to analyze LinkedIn';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
