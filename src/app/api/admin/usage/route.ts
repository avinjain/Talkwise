import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin';
import {
  getAdminOverview,
  getUsageThisMonth,
  getUsageTotals,
  getUsageByUser,
  getUsageByModel,
  getUsageByEndpoint,
  getUsageByDay,
} from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY = 86400;

export async function GET() {
  const gate = await checkAdmin();
  if (gate === 'unauthenticated') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (gate === 'forbidden') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const monthlyBudgetUsd = Number(process.env.ADMIN_MONTHLY_BUDGET_USD || '50');
  const thisMonth = getUsageThisMonth();

  return NextResponse.json({
    overview: getAdminOverview(),
    windows: {
      today: getUsageTotals(DAY),
      last7d: getUsageTotals(7 * DAY),
      last30d: getUsageTotals(30 * DAY),
    },
    budget: {
      monthlyBudgetUsd,
      monthSpendUsd: thisMonth.cost,
      monthTokens: thisMonth.tokens,
      monthRequests: thisMonth.requests,
      percentUsed:
        monthlyBudgetUsd > 0 ? Math.min(999, (thisMonth.cost / monthlyBudgetUsd) * 100) : 0,
      enforced: (process.env.ADMIN_ENFORCE_BUDGET || '').toLowerCase() === 'true',
    },
    byUser: {
      today: getUsageByUser(DAY),
      last7d: getUsageByUser(7 * DAY),
      last30d: getUsageByUser(30 * DAY),
      all: getUsageByUser(),
    },
    byModel: getUsageByModel(),
    byEndpoint: getUsageByEndpoint(),
    daily: getUsageByDay(30),
    generatedAt: new Date().toISOString(),
  });
}
