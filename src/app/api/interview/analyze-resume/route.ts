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

    const { resume, role, jd } = (await req.json()) as {
      resume: string;
      role?: string;
      jd?: string;
    };
    if (!resume?.trim()) return NextResponse.json({ error: 'Resume is required' }, { status: 400 });

    const prompt = `You are an expert interview coach (aligned with interview-coach-skill framework). Analyze this resume${role ? ` for a ${role} role` : ''}${jd ? '. Use the job description to assess fit.' : ''}

RESUME:
---
${resume.slice(0, 6000)}
---
${jd ? `\nJOB DESCRIPTION:\n---\n${jd.slice(0, 4000)}\n---` : ''}

Provide a concise analysis in **markdown format**. Use:
- ## for section headers
- **bold** for emphasis
- - for bullet points

Sections (use ## for each):
1. **Strengths** — 2–3 standout points that align with${role ? ` a ${role}` : ' most'} roles
2. **Gaps** — Areas to address or clarify (if JD provided, compare against it)
3. **Story bank** — 2–3 experiences from the resume that could answer behavioral questions (brief STAR outline)
4. **One-line pitch** — A sharp positioning statement for "Tell me about yourself"

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
        endpoint: '/api/interview/analyze-resume',
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: estimateCost(model, promptTokens, completionTokens),
      });
    } catch {}

    return NextResponse.json({ analysis: text });
  } catch (err) {
    console.error('Resume analysis error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to analyze resume';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
