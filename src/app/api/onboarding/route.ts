import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/session';
import { getOnboardingStatus, completeOnboarding } from '@/lib/db';

export const runtime = 'nodejs';

// GET — check if user has completed onboarding
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const completed = getOnboardingStatus(userId);
  return NextResponse.json({ completed });
}

// POST — mark onboarding as complete
export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  completeOnboarding(userId);
  return NextResponse.json({ completed: true });
}
