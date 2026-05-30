import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/session';
import { checkRateLimit } from '@/lib/ratelimit';
import {
  logUsage,
  getKickoffState,
  listStorybankStories,
  getStorybankStory,
  insertStorybankStory,
  updateStorybankStory,
  deleteStorybankStory,
  type StorybankStoryRow,
} from '@/lib/db';
import { estimateCost } from '@/lib/costs';
import { getOpenAI, pickModel } from '@/lib/openai';
import {
  buildStoryConstructionPrompt,
  parseStoryBuildResult,
  parseJsonLoose,
  overallStrength,
  type StoryScores,
} from '@/lib/storybank';

export const runtime = 'nodejs';

const MAX_INPUT = 6000;

interface StoryDTO {
  id: string;
  title: string;
  primarySkill: string;
  secondarySkills: string[];
  situation: string;
  task: string;
  action: string;
  result: string;
  earnedSecret: string;
  deployUseCase: string;
  spokenDraft: string;
  strength: number;
  scores: StoryScores | Record<string, never>;
  versionHistory: Array<{ date: string; note: string }>;
  notes: string;
  updatedAt: string;
}

function toDTO(row: StorybankStoryRow): StoryDTO {
  const parse = <T,>(s: string, fallback: T): T => {
    try {
      return JSON.parse(s) as T;
    } catch {
      return fallback;
    }
  };
  return {
    id: row.id,
    title: row.title,
    primarySkill: row.primary_skill,
    secondarySkills: parse<string[]>(row.secondary_skills, []),
    situation: row.situation,
    task: row.task,
    action: row.action,
    result: row.result,
    earnedSecret: row.earned_secret,
    deployUseCase: row.deploy_use_case,
    spokenDraft: row.spoken_draft,
    strength: row.strength,
    scores: parse<StoryScores | Record<string, never>>(row.scores_json, {}),
    versionHistory: parse<Array<{ date: string; note: string }>>(row.version_history, []),
    notes: row.notes,
    updatedAt: row.updated_at,
  };
}

// GET — list all stories for the user
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const stories = listStorybankStories(userId).map(toDTO);
  return NextResponse.json({ stories });
}

// POST — create a story.
//   { rawNotes }            → AI builds STAR + earned secret + score, then saves
//   { manual: {...fields} } → saves exactly what was provided (no AI)
export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // Manual save path — no AI call.
    if (body.manual && typeof body.manual === 'object') {
      const m = body.manual as Record<string, unknown>;
      const title = typeof m.title === 'string' ? m.title.trim() : '';
      if (!title) return NextResponse.json({ error: 'A title is required.' }, { status: 400 });
      const id = insertStorybankStory(userId, {
        title,
        primarySkill: typeof m.primarySkill === 'string' ? m.primarySkill : '',
        secondarySkills: Array.isArray(m.secondarySkills)
          ? m.secondarySkills.filter((s): s is string => typeof s === 'string')
          : [],
        situation: typeof m.situation === 'string' ? m.situation : '',
        task: typeof m.task === 'string' ? m.task : '',
        action: typeof m.action === 'string' ? m.action : '',
        result: typeof m.result === 'string' ? m.result : '',
        earnedSecret: typeof m.earnedSecret === 'string' ? m.earnedSecret : '',
        deployUseCase: typeof m.deployUseCase === 'string' ? m.deployUseCase : '',
        spokenDraft: typeof m.spokenDraft === 'string' ? m.spokenDraft : '',
      });
      const row = getStorybankStory(id, userId);
      return NextResponse.json({ story: row ? toDTO(row) : null });
    }

    // AI build path.
    const rawNotes = typeof body.rawNotes === 'string' ? body.rawNotes.trim() : '';
    if (!rawNotes) return NextResponse.json({ error: 'Add some notes about the experience first.' }, { status: 400 });
    if (rawNotes.length > MAX_INPUT)
      return NextResponse.json({ error: 'Notes are too long — try shortening.' }, { status: 400 });

    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) return NextResponse.json({ error: rateCheck.reason }, { status: 429 });

    const kickoff = getKickoffState(userId);
    const { system, user } = buildStoryConstructionPrompt(rawNotes, {
      targetRoles: kickoff?.target_roles,
      resumeText: kickoff?.resume_text,
    });

    const model = pickModel('story_build');
    const response = await getOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.45,
      max_tokens: 1200,
    });

    const text = response.choices[0]?.message?.content?.trim() || '{}';
    const built = parseStoryBuildResult(parseJsonLoose(text));
    if (!built) return NextResponse.json({ error: 'Could not structure that story — try again.' }, { status: 502 });

    const strength = overallStrength(built.scores);
    const today = new Date().toISOString().slice(0, 10);
    const id = insertStorybankStory(userId, {
      title: built.title,
      primarySkill: built.primarySkill,
      secondarySkills: built.secondarySkills,
      situation: built.situation,
      task: built.task,
      action: built.action,
      result: built.result,
      earnedSecret: built.earnedSecret,
      deployUseCase: built.deployUseCase,
      spokenDraft: built.spokenDraft,
      strength,
      scores: built.scores,
      versionHistory: [{ date: today, note: 'Created from notes' }],
    });

    const usage = response.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    try {
      logUsage({
        userId,
        endpoint: '/api/interview/storybank',
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: estimateCost(model, promptTokens, completionTokens),
      });
    } catch {}

    const row = getStorybankStory(id, userId);
    return NextResponse.json({ story: row ? toDTO(row) : null, diagnosis: built.diagnosis });
  } catch (err) {
    console.error('storybank POST:', err);
    const msg = err instanceof Error ? err.message : 'Failed to save story';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH — edit fields of an existing story (manual edits / accepting a fix)
export async function PATCH(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) return NextResponse.json({ error: 'Missing story id' }, { status: 400 });

    const existing = getStorybankStory(id, userId);
    if (!existing) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

    const u = body.updates as Record<string, unknown> | undefined;
    if (!u || typeof u !== 'object') return NextResponse.json({ error: 'No updates provided' }, { status: 400 });

    updateStorybankStory(id, userId, {
      title: typeof u.title === 'string' ? u.title : undefined,
      primarySkill: typeof u.primarySkill === 'string' ? u.primarySkill : undefined,
      secondarySkills: Array.isArray(u.secondarySkills)
        ? u.secondarySkills.filter((s): s is string => typeof s === 'string')
        : undefined,
      situation: typeof u.situation === 'string' ? u.situation : undefined,
      task: typeof u.task === 'string' ? u.task : undefined,
      action: typeof u.action === 'string' ? u.action : undefined,
      result: typeof u.result === 'string' ? u.result : undefined,
      earnedSecret: typeof u.earnedSecret === 'string' ? u.earnedSecret : undefined,
      deployUseCase: typeof u.deployUseCase === 'string' ? u.deployUseCase : undefined,
      spokenDraft: typeof u.spokenDraft === 'string' ? u.spokenDraft : undefined,
      notes: typeof u.notes === 'string' ? u.notes : undefined,
    });

    const row = getStorybankStory(id, userId);
    return NextResponse.json({ story: row ? toDTO(row) : null });
  } catch (err) {
    console.error('storybank PATCH:', err);
    const msg = err instanceof Error ? err.message : 'Failed to update story';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE — remove a story  (?id=...)
export async function DELETE(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing story id' }, { status: 400 });
  deleteStorybankStory(id, userId);
  return NextResponse.json({ ok: true });
}
