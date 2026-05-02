import { NextResponse } from 'next/server';
import { getOpenAI, pickModel, type AITask } from '@/lib/openai';
import { getAuthUserId } from '@/lib/session';
import { checkRateLimit } from '@/lib/ratelimit';
import {
  buildPrepPrompt,
  buildConcernsPrompt,
  buildQuestionsPrompt,
  parsePrepOutput,
  parseConcernsOutput,
  parseQuestionsOutput,
  type CoachCommand,
  type InterviewStage,
  type CoachContext,
  type CoachArtifact,
} from '@/lib/coach';
import {
  saveCoachArtifact,
  getCoachArtifact,
  getAllCoachArtifacts,
  deleteCoachArtifact,
  getKickoffState,
  logUsage,
  getPracticeCoachingFocus,
} from '@/lib/db';
import { estimateCost } from '@/lib/costs';

export const runtime = 'nodejs';

const COMMANDS = new Set<CoachCommand>(['prep', 'concerns', 'questions']);
const STAGES = new Set<InterviewStage>([
  'phone_screen',
  'hiring_manager',
  'final_round',
  'peer',
  'panel',
  'unknown',
]);

const TASK_BY_COMMAND: Record<CoachCommand, AITask> = {
  prep: 'coach_prep',
  concerns: 'coach_concerns',
  questions: 'coach_questions',
};

const MAX_TOKENS_BY_COMMAND: Record<CoachCommand, number> = {
  prep: 2400,
  concerns: 1800,
  questions: 1400,
};

function loadCoachApiContext(userId: string): CoachContext {
  const ko = getKickoffState(userId);
  const base: CoachContext = ko
    ? {
        targetRoles: ko.target_roles,
        resumeText: ko.resume_text || undefined,
        linkedInText: ko.linkedin_text || undefined,
        interviewHistory: ko.interview_history,
        stallingStage: ko.stalling_stage || undefined,
        biggestConcern: ko.biggest_concern || undefined,
      }
    : {};
  const pfRow = getPracticeCoachingFocus(userId);
  if (pfRow?.payload_json) {
    try {
      const j = JSON.parse(pfRow.payload_json) as { skillLens?: string };
      if (typeof j.skillLens === 'string' && j.skillLens.trim()) {
        base.practiceSkillLens = j.skillLens.trim();
      }
    } catch {
      /* ignore */
    }
  }
  return base;
}

function withParsed(row: { command: string; payload_json: string; updated_at: string } | undefined) {
  if (!row) return null;
  try {
    return { ...JSON.parse(row.payload_json), updatedAt: row.updated_at } as CoachArtifact & {
      updatedAt: string;
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// GET — return all artifacts for the user (or one by ?command=)
// ─────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const url = new URL(req.url);
  const command = url.searchParams.get('command') as CoachCommand | null;

  if (command) {
    if (!COMMANDS.has(command))
      return NextResponse.json({ error: 'Invalid command' }, { status: 400 });
    return NextResponse.json({ artifact: withParsed(getCoachArtifact(userId, command)) });
  }

  const rows = getAllCoachArtifacts(userId);
  const map: Partial<Record<CoachCommand, ReturnType<typeof withParsed>>> = {};
  for (const cmd of ['prep', 'concerns', 'questions'] as CoachCommand[]) {
    const row = rows.find((r) => r.command === cmd);
    map[cmd] = withParsed(row);
  }

  let practiceFocus: unknown = null;
  const pfRow = getPracticeCoachingFocus(userId);
  if (pfRow?.payload_json) {
    try {
      practiceFocus = JSON.parse(pfRow.payload_json);
    } catch {
      practiceFocus = null;
    }
  }

  return NextResponse.json({ prep: map.prep, concerns: map.concerns, questions: map.questions, practiceFocus });
}

export async function DELETE(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const url = new URL(req.url);
  const command = url.searchParams.get('command') as CoachCommand | null;
  if (!command || !COMMANDS.has(command))
    return NextResponse.json({ error: 'Invalid command' }, { status: 400 });

  deleteCoachArtifact(userId, command);
  return NextResponse.json({ ok: true });
}

// ─────────────────────────────────────────────────────────────
// POST — run a coach command
// ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId)
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.reason },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds || 60) } }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const command = body.command as CoachCommand;
    if (!COMMANDS.has(command))
      return NextResponse.json({ error: 'Invalid command' }, { status: 400 });

    const ctx = loadCoachApiContext(userId);
    if (!ctx.resumeText && !ctx.targetRoles) {
      return NextResponse.json(
        {
          error:
            'Run kickoff first. The coach needs your resume and target role to give grounded advice.',
        },
        { status: 400 }
      );
    }

    const model = pickModel(TASK_BY_COMMAND[command]);
    let system = '';
    let user = '';
    let parser: ((raw: unknown) => CoachArtifact | null) | null = null;

    if (command === 'prep') {
      const company = String(body.company || '').trim();
      const role = String(body.role || ctx.targetRoles || '').trim();
      const jd = String(body.jd || '').trim();
      const stage =
        body.stage && STAGES.has(body.stage as InterviewStage)
          ? (body.stage as InterviewStage)
          : 'unknown';

      if (!company) return NextResponse.json({ error: 'company is required' }, { status: 400 });
      if (!role) return NextResponse.json({ error: 'role is required' }, { status: 400 });
      if (!jd || jd.length < 50)
        return NextResponse.json(
          { error: 'Paste the full job description so the brief can be specific.' },
          { status: 400 }
        );

      ({ system, user } = buildPrepPrompt({ ...ctx, company, role, jd, stage }));
      parser = (raw) => parsePrepOutput(raw, company, role);
    } else if (command === 'concerns') {
      ({ system, user } = buildConcernsPrompt(ctx));
      parser = parseConcernsOutput;
    } else {
      const stage =
        body.stage && STAGES.has(body.stage as InterviewStage)
          ? (body.stage as InterviewStage)
          : 'hiring_manager';
      const company = String(body.company || '').trim();
      ({ system, user } = buildQuestionsPrompt({ ...ctx, stage, company: company || undefined }));
      parser = (raw) => parseQuestionsOutput(raw, stage, company);
    }

    const response = await getOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
      max_tokens: MAX_TOKENS_BY_COMMAND[command],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty coach response');

    let raw: unknown;
    try {
      raw = JSON.parse(content);
    } catch {
      throw new Error('Coach returned invalid JSON');
    }

    const artifact = parser?.(raw) ?? null;
    if (!artifact) throw new Error('Coach response did not match expected schema');

    saveCoachArtifact(userId, command, artifact);

    const usage = response.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    try {
      logUsage({
        userId,
        endpoint: `/api/coach/${command}`,
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: estimateCost(model, promptTokens, completionTokens),
      });
    } catch (logErr) {
      console.error('Failed to log usage:', logErr);
    }

    return NextResponse.json({ artifact });
  } catch (err) {
    console.error('Coach error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to run coach command';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
