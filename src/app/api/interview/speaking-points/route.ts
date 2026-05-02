import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/session';
import {
  getInterviewStories,
  upsertInterviewStories,
  type SpeakingPitchPersisted,
  type StoryDraftPersisted,
} from '@/lib/db';

export const runtime = 'nodejs';

const MAX_PITCHES = 25;
const MAX_NAME = 280;
const MAX_HOOK = 800;
const MAX_BULLET = 900;
const MAX_BULLETS_PER_PITCH = 14;

const MAX_STORY_DRAFTS = 12;
const MAX_PROMPT_LEN = 520;
const MAX_DRAFT_LEN = 12000;

function sanitizePitches(raw: unknown): SpeakingPitchPersisted[] {
  if (!Array.isArray(raw)) return [];
  const out: SpeakingPitchPersisted[] = [];
  for (const item of raw.slice(0, MAX_PITCHES)) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name.trim().slice(0, MAX_NAME) : '';
    if (!name) continue;
    const hook =
      typeof o.hook === 'string' ? o.hook.trim().slice(0, MAX_HOOK) : undefined;
    let bullets: string[] | undefined;
    if (Array.isArray(o.bullets)) {
      bullets = o.bullets
        .filter((b): b is string => typeof b === 'string')
        .slice(0, MAX_BULLETS_PER_PITCH)
        .map((b) => b.trim().slice(0, MAX_BULLET))
        .filter(Boolean);
      if (bullets.length === 0) bullets = undefined;
    }
    out.push({ name, ...(hook ? { hook } : {}), ...(bullets ? { bullets } : {}) });
  }
  return out;
}

function sanitizeStoryDrafts(raw: unknown): StoryDraftPersisted[] {
  if (!Array.isArray(raw)) return [];
  const out: StoryDraftPersisted[] = [];
  for (const item of raw.slice(0, MAX_STORY_DRAFTS)) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const prompt = typeof o.prompt === 'string' ? o.prompt.trim().slice(0, MAX_PROMPT_LEN) : '';
    const draft = typeof o.draft === 'string' ? o.draft.slice(0, MAX_DRAFT_LEN) : '';
    if (!prompt) continue;
    out.push({ prompt, draft });
  }
  return out;
}

function parseStoredDrafts(row: { story_drafts_json?: string } | undefined): StoryDraftPersisted[] {
  if (!row?.story_drafts_json) return [];
  try {
    return sanitizeStoryDrafts(JSON.parse(row.story_drafts_json));
  } catch {
    return [];
  }
}

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const row = getInterviewStories(userId);
  if (!row) {
    return NextResponse.json({
      pitches: [],
      workflowStoriesAck: false,
      storyDrafts: [] as StoryDraftPersisted[],
      updatedAt: null as string | null,
    });
  }

  let pitches: SpeakingPitchPersisted[] = [];
  try {
    const parsed = JSON.parse(row.pitches_json) as unknown;
    pitches = sanitizePitches(parsed);
  } catch {
    pitches = [];
  }

  return NextResponse.json({
    pitches,
    workflowStoriesAck: row.workflow_stories_ack === 1,
    storyDrafts: parseStoredDrafts(row),
    updatedAt: row.updated_at,
  });
}

export async function PUT(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = (await req.json()) as {
      pitches?: unknown;
      workflowStoriesAck?: unknown;
      storyDrafts?: unknown;
    };

    const patch: {
      pitches?: SpeakingPitchPersisted[];
      workflowStoriesAck?: boolean;
      storyDrafts?: StoryDraftPersisted[];
    } = {};

    if ('pitches' in body) {
      patch.pitches = sanitizePitches(body.pitches);
    }
    if (typeof body.workflowStoriesAck === 'boolean') {
      patch.workflowStoriesAck = body.workflowStoriesAck;
    }
    if ('storyDrafts' in body) {
      patch.storyDrafts = sanitizeStoryDrafts(body.storyDrafts);
    }

    if (
      patch.pitches === undefined &&
      patch.workflowStoriesAck === undefined &&
      patch.storyDrafts === undefined
    ) {
      return NextResponse.json(
        { error: 'Provide pitches, workflowStoriesAck, and/or storyDrafts' },
        { status: 400 }
      );
    }

    upsertInterviewStories(userId, patch);

    const row = getInterviewStories(userId);
    let pitches: SpeakingPitchPersisted[] = [];
    if (row?.pitches_json) {
      try {
        pitches = sanitizePitches(JSON.parse(row.pitches_json));
      } catch {
        pitches = [];
      }
    }

    return NextResponse.json({
      ok: true,
      pitches,
      workflowStoriesAck: row?.workflow_stories_ack === 1,
      storyDrafts: parseStoredDrafts(row),
      updatedAt: row?.updated_at ?? null,
    });
  } catch (err) {
    console.error('speaking-points PUT:', err);
    return NextResponse.json({ error: 'Failed to save speaking points' }, { status: 500 });
  }
}
