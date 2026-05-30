import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/session';
import { checkRateLimit } from '@/lib/ratelimit';
import { logUsage, getKickoffState, listStorybankStories } from '@/lib/db';
import { estimateCost } from '@/lib/costs';
import { getOpenAI, pickModel } from '@/lib/openai';
import {
  buildGapsPrompt,
  parseGapsResult,
  parseJsonLoose,
  type StorySummaryForGaps,
} from '@/lib/storybank';

export const runtime = 'nodejs';

// POST — analyse storybank coverage gaps against target role(s).
export async function POST() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) return NextResponse.json({ error: rateCheck.reason }, { status: 429 });

    const kickoff = getKickoffState(userId);
    const stories: StorySummaryForGaps[] = listStorybankStories(userId).map((s) => {
      let secondarySkills: string[] = [];
      try {
        const parsed = JSON.parse(s.secondary_skills) as unknown;
        if (Array.isArray(parsed)) secondarySkills = parsed.filter((x): x is string => typeof x === 'string');
      } catch {
        secondarySkills = [];
      }
      return {
        title: s.title,
        primarySkill: s.primary_skill,
        secondarySkills,
        strength: s.strength,
      };
    });

    const { system, user } = buildGapsPrompt(stories, {
      targetRoles: kickoff?.target_roles,
      resumeText: kickoff?.resume_text,
    });

    const model = pickModel('story_gaps');
    const response = await getOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
      max_tokens: 1100,
    });

    const text = response.choices[0]?.message?.content?.trim() || '{}';
    const result = parseGapsResult(parseJsonLoose(text));
    if (!result) return NextResponse.json({ error: 'Could not analyse gaps — try again.' }, { status: 502 });

    const usage = response.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    try {
      logUsage({
        userId,
        endpoint: '/api/interview/storybank/gaps',
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: estimateCost(model, promptTokens, completionTokens),
      });
    } catch {}

    return NextResponse.json({ gaps: result, hasTargetRole: !!kickoff?.target_roles });
  } catch (err) {
    console.error('storybank gaps:', err);
    const msg = err instanceof Error ? err.message : 'Failed to analyse gaps';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
