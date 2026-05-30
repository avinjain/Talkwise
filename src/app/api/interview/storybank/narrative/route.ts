import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/session';
import { checkRateLimit } from '@/lib/ratelimit';
import { logUsage, listStorybankStories } from '@/lib/db';
import { estimateCost } from '@/lib/costs';
import { getOpenAI, pickModel } from '@/lib/openai';
import {
  buildNarrativePrompt,
  parseNarrativeResult,
  parseJsonLoose,
  type StoryForNarrative,
} from '@/lib/storybank';

export const runtime = 'nodejs';

const MIN_STORIES = 5;

// POST — extract narrative identity (themes) across the storybank. Needs 5+ stories.
export async function POST() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const rows = listStorybankStories(userId);
    if (rows.length < MIN_STORIES) {
      return NextResponse.json(
        {
          error: `Narrative identity works best with ${MIN_STORIES}+ stories to find patterns across. You have ${rows.length}. Add a few more first.`,
          needMore: MIN_STORIES - rows.length,
        },
        { status: 400 }
      );
    }

    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) return NextResponse.json({ error: rateCheck.reason }, { status: 429 });

    const stories: StoryForNarrative[] = rows.map((s) => ({
      id: s.id,
      title: s.title,
      primarySkill: s.primary_skill,
      earnedSecret: s.earned_secret,
      spokenDraft: s.spoken_draft || [s.situation, s.task, s.action, s.result].filter(Boolean).join(' '),
    }));

    const { system, user } = buildNarrativePrompt(stories);

    const model = pickModel('narrative_identity');
    const response = await getOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.5,
      max_tokens: 1400,
    });

    const text = response.choices[0]?.message?.content?.trim() || '{}';
    const result = parseNarrativeResult(parseJsonLoose(text));
    if (!result) return NextResponse.json({ error: 'Could not extract themes — try again.' }, { status: 502 });

    const usage = response.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    try {
      logUsage({
        userId,
        endpoint: '/api/interview/storybank/narrative',
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: estimateCost(model, promptTokens, completionTokens),
      });
    } catch {}

    return NextResponse.json({ narrative: result });
  } catch (err) {
    console.error('storybank narrative:', err);
    const msg = err instanceof Error ? err.message : 'Failed to extract narrative identity';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
