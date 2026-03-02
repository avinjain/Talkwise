import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/session';
import { checkRateLimit } from '@/lib/ratelimit';
import { logUsage } from '@/lib/db';
import { estimateCost } from '@/lib/costs';
import { getOpenAI } from '@/lib/openai';
import { INTERVIEW_GOAL_OPTIONS } from '@/lib/types';

export const runtime = 'nodejs';

const ALL_GOAL_IDS = INTERVIEW_GOAL_OPTIONS.map((g) => g.id);

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.reason }, { status: 429 });
    }

    const { role, resume, format } = (await req.json()) as { role?: string; resume?: string; format?: string };
    const roleStr = (role || '').trim();
    const resumeStr = (resume || '').trim();
    const formatStr = (format || '').trim();

    // No context: return all applicable (but always include format-matching goal)
    if (!roleStr && !resumeStr) {
      const ids = [...ALL_GOAL_IDS];
      if (formatStr === 'case' && !ids.includes('case')) ids.push('case');
      if (formatStr === 'technical' && !ids.includes('system-design')) ids.push('system-design');
      return NextResponse.json({ applicableIds: ids });
    }

    const prompt = `You are an expert interview coach. Given the candidate's target role, resume, and interview format (if any), determine which interview practice topics are applicable.

ROLE: ${roleStr || '(not provided)'}
INTERVIEW FORMAT: ${formatStr || '(not specified)'}

RESUME (excerpt):
---
${resumeStr.slice(0, 3000) || '(not provided)'}
---

AVAILABLE TOPIC IDS: ${ALL_GOAL_IDS.join(', ')}

RULES:
- "system-design" is for technical roles or when format is "technical": software engineer, developer, architect, tech lead, SRE, Technical PM, API PM, Platform PM. Do NOT include for: Sales, Marketing, HR, or other purely non-technical roles (unless format is technical).
- "case" is for case study / problem-solving interviews. Include it when format is "case" or "mixed".
- Include all other topics that make sense for the role and candidate background.
- Return a JSON array of applicable IDs only. Example: ["tmay","conflict","case","behavioral","questions"]

Respond with ONLY the JSON array, no other text.`;

    const model = process.env.GPT_MODEL || 'gpt-4o';
    const response = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 200,
    });

    const text = response.choices[0]?.message?.content?.trim() || '[]';
    let applicableIds: string[] = [];
    try {
      const parsed = JSON.parse(text.replace(/^.*?\[/, '[').replace(/\].*$/, ']'));
      applicableIds = Array.isArray(parsed)
        ? parsed.filter((id: unknown) => typeof id === 'string' && ALL_GOAL_IDS.includes(id as (typeof ALL_GOAL_IDS)[number]))
        : ALL_GOAL_IDS;
    } catch {
      applicableIds = ALL_GOAL_IDS;
    }
    if (applicableIds.length === 0) applicableIds = ALL_GOAL_IDS;

    const usage = response.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    try {
      logUsage({
        userId,
        endpoint: '/api/interview/filter-goals',
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: estimateCost(model, promptTokens, completionTokens),
      });
    } catch {}

    return NextResponse.json({ applicableIds });
  } catch (err) {
    console.error('Filter goals error:', err);
    return NextResponse.json({ applicableIds: ALL_GOAL_IDS });
  }
}
