import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/session';
import { checkRateLimit } from '@/lib/ratelimit';
import {
  logUsage,
  getKickoffState,
  getStorybankStory,
  updateStorybankStory,
} from '@/lib/db';
import { estimateCost } from '@/lib/costs';
import { getOpenAI, pickModel } from '@/lib/openai';
import {
  buildStoryScorePrompt,
  parseStoryScoreResult,
  parseJsonLoose,
  overallStrength,
} from '@/lib/storybank';

export const runtime = 'nodejs';

// POST { id } — re-score a saved story, diagnose the gap, prescribe one fix.
export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) return NextResponse.json({ error: rateCheck.reason }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) return NextResponse.json({ error: 'Missing story id' }, { status: 400 });

    const story = getStorybankStory(id, userId);
    if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

    const kickoff = getKickoffState(userId);
    const { system, user } = buildStoryScorePrompt(
      {
        title: story.title,
        primarySkill: story.primary_skill,
        situation: story.situation,
        task: story.task,
        action: story.action,
        result: story.result,
        earnedSecret: story.earned_secret,
      },
      { targetRoles: kickoff?.target_roles, resumeText: kickoff?.resume_text }
    );

    const model = pickModel('story_score');
    const response = await getOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
      max_tokens: 900,
    });

    const text = response.choices[0]?.message?.content?.trim() || '{}';
    const result = parseStoryScoreResult(parseJsonLoose(text));
    if (!result) return NextResponse.json({ error: 'Could not score that story — try again.' }, { status: 502 });

    const strength = overallStrength(result.scores);

    // Persist the fresh scores + strength, append a version note.
    let versionHistory: Array<{ date: string; note: string }> = [];
    try {
      versionHistory = JSON.parse(story.version_history) as Array<{ date: string; note: string }>;
    } catch {
      versionHistory = [];
    }
    versionHistory.push({
      date: new Date().toISOString().slice(0, 10),
      note: `Re-scored: ${strength}/5 (${result.gapType.replace(/_/g, ' ')})`,
    });
    updateStorybankStory(id, userId, {
      strength,
      scores: result.scores,
      versionHistory,
    });

    const usage = response.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    try {
      logUsage({
        userId,
        endpoint: '/api/interview/storybank/score',
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: estimateCost(model, promptTokens, completionTokens),
      });
    } catch {}

    return NextResponse.json({ strength, ...result });
  } catch (err) {
    console.error('storybank score:', err);
    const msg = err instanceof Error ? err.message : 'Failed to score story';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
