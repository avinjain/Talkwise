import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin';
import {
  adminWindowChartDays,
  adminWindowLabel,
  adminWindowSeconds,
  parseAdminWindow,
} from '@/lib/adminWindow';
import {
  getAdminOverview,
  getUsageThisMonth,
  getUsageByUser,
  getUsageByModel,
  getUsageByEndpoint,
  getUsageByDay,
} from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const gate = await checkAdmin();
  if (gate === 'unauthenticated') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (gate === 'forbidden') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const window = parseAdminWindow(req.nextUrl.searchParams.get('window'));
  const windowSeconds = adminWindowSeconds(window);
  const chartDays = adminWindowChartDays(window);

  const monthlyBudgetUsd = Number(process.env.ADMIN_MONTHLY_BUDGET_USD || '50');
  const thisMonth = getUsageThisMonth();

  return NextResponse.json({
    window,
    windowLabel: adminWindowLabel(window),
    overview: getAdminOverview(windowSeconds),
    budget: {
      monthlyBudgetUsd,
      monthSpendUsd: thisMonth.cost,
      monthTokens: thisMonth.tokens,
      monthRequests: thisMonth.requests,
      percentUsed:
        monthlyBudgetUsd > 0 ? Math.min(999, (thisMonth.cost / monthlyBudgetUsd) * 100) : 0,
      enforced: (process.env.ADMIN_ENFORCE_BUDGET || '').toLowerCase() === 'true',
    },
    byUser: getUsageByUser(windowSeconds),
    byModel: getUsageByModel(windowSeconds),
    byEndpoint: getUsageByEndpoint(windowSeconds),
    daily: getUsageByDay(chartDays),
    generatedAt: new Date().toISOString(),
  });
}
