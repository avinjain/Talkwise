import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/session';
import {
  getKickoffState,
  savePracticeCoachingFocus,
  getPracticeCoachingFocus,
} from '@/lib/db';
import { buildPracticeCoachingFocusPayload } from '@/lib/practiceCoaching';

export const runtime = 'nodejs';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const row = getPracticeCoachingFocus(userId);
  if (!row) return NextResponse.json({ focus: null });

  try {
    return NextResponse.json({
      focus: JSON.parse(row.payload_json),
      updatedAt: row.updated_at,
    });
  } catch {
    return NextResponse.json({ focus: null });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = (await req.json()) as { kickoffCommand?: unknown; planItemText?: string };
    const planItemText = typeof body.planItemText === 'string' ? body.planItemText : '';
    if (!planItemText.trim()) {
      return NextResponse.json({ error: 'planItemText is required' }, { status: 400 });
    }

    const ko = getKickoffState(userId);
    const payload = buildPracticeCoachingFocusPayload(
      body.kickoffCommand,
      planItemText,
      ko ?? null
    );
    savePracticeCoachingFocus(userId, payload);

    return NextResponse.json({ ok: true, focus: payload });
  } catch (err) {
    console.error('practice-coaching POST:', err);
    return NextResponse.json({ error: 'Failed to save practice focus' }, { status: 500 });
  }
}
