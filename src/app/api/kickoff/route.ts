import { NextResponse } from 'next/server';
import { getOpenAI, pickModel } from '@/lib/openai';
import { getAuthUserId } from '@/lib/session';
import { checkRateLimit } from '@/lib/ratelimit';
import {
  buildKickoffPrompt,
  parseKickoffSummary,
  type KickoffInput,
  type KickoffTrack,
  type KickoffTimeline,
  type InterviewHistory,
  type StallingStage,
} from '@/lib/kickoff';
import { saveKickoffState, getKickoffState, logUsage, deleteKickoffState } from '@/lib/db';
import { estimateCost } from '@/lib/costs';

export const runtime = 'nodejs';

const TRACKS = new Set<KickoffTrack>(['quick_prep', 'full_system']);
const TIMELINES = new Set<KickoffTimeline>(['lt_48h', '1_2w', '3plus_w']);
const HISTORIES = new Set<InterviewHistory>([
  'first_time',
  'active_not_advancing',
  'experienced_rusty',
]);
const STALLING = new Set<StallingStage>(['first_rounds', 'final_rounds', 'no_callbacks', '']);

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const row = getKickoffState(userId);
  if (!row) return NextResponse.json({ hasResult: false });

  let summary;
  try {
    summary = JSON.parse(row.summary_json);
  } catch {
    summary = null;
  }

  let targetCompanies: string[] = [];
  try {
    targetCompanies = JSON.parse(row.target_companies);
  } catch {
    /* ignore */
  }

  return NextResponse.json({
    hasResult: true,
    inputs: {
      track: row.track,
      targetRoles: row.target_roles,
      timeline: row.timeline,
      feedbackDirectness: row.feedback_directness,
      biggestConcern: row.biggest_concern,
      interviewHistory: row.interview_history,
      stallingStage: row.stalling_stage,
      targetCompanies,
    },
    summary,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  });
}

export async function DELETE() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  deleteKickoffState(userId);
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.reason },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds || 60) } }
      );
    }

    const body = (await req.json()) as Partial<KickoffInput>;

    if (!body.targetRoles?.trim())
      return NextResponse.json({ error: 'targetRoles is required' }, { status: 400 });
    if (!TRACKS.has(body.track as KickoffTrack))
      return NextResponse.json({ error: 'Invalid track' }, { status: 400 });
    if (!TIMELINES.has(body.timeline as KickoffTimeline))
      return NextResponse.json({ error: 'Invalid timeline' }, { status: 400 });
    if (!HISTORIES.has(body.interviewHistory as InterviewHistory))
      return NextResponse.json({ error: 'Invalid interviewHistory' }, { status: 400 });
    if (body.stallingStage && !STALLING.has(body.stallingStage as StallingStage))
      return NextResponse.json({ error: 'Invalid stallingStage' }, { status: 400 });

    const input: KickoffInput = {
      track: body.track as KickoffTrack,
      targetRoles: body.targetRoles.trim(),
      timeline: body.timeline as KickoffTimeline,
      feedbackDirectness: Math.max(1, Math.min(5, Number(body.feedbackDirectness) || 5)),
      biggestConcern: body.biggestConcern?.trim() || '',
      interviewHistory: body.interviewHistory as InterviewHistory,
      stallingStage: (body.stallingStage as StallingStage) || '',
      resumeText: body.resumeText?.trim() || '',
      linkedInText: body.linkedInText?.trim() || '',
      targetCompanies: Array.isArray(body.targetCompanies)
        ? body.targetCompanies.map((s) => String(s).trim()).filter(Boolean).slice(0, 5)
        : [],
    };

    const { system, user } = buildKickoffPrompt(input);

    // Kickoff is high-leverage onboarding — pick the premium model via core_positioning slot.
    const model = pickModel('core_positioning');
    const response = await getOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
      max_tokens: 2200,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty kickoff response');

    let raw: unknown;
    try {
      raw = JSON.parse(content);
    } catch {
      throw new Error('Kickoff returned invalid JSON');
    }

    const summary = parseKickoffSummary(raw);
    if (!summary) throw new Error('Kickoff response did not match expected schema');

    saveKickoffState({
      userId,
      track: input.track,
      targetRoles: input.targetRoles,
      timeline: input.timeline,
      feedbackDirectness: input.feedbackDirectness,
      biggestConcern: input.biggestConcern || '',
      interviewHistory: input.interviewHistory,
      stallingStage: input.stallingStage || '',
      resumeText: input.resumeText || '',
      linkedInText: input.linkedInText || '',
      targetCompanies: input.targetCompanies || [],
      summary,
    });

    const usage = response.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    try {
      logUsage({
        userId,
        endpoint: '/api/kickoff',
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: estimateCost(model, promptTokens, completionTokens),
      });
    } catch (logErr) {
      console.error('Failed to log usage:', logErr);
    }

    return NextResponse.json({ summary });
  } catch (err) {
    console.error('Kickoff error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to run kickoff';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
