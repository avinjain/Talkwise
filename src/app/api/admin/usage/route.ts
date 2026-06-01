import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin';
import {
  adminWindowChartDays,
  adminWindowLabel,
  parseAdminWindow,
} from '@/lib/adminWindow';
import {
  FEATURE_LABELS,
  FEATURE_ORDER,
  featureForEndpoint,
  labelForEndpoint,
  type FeatureId,
} from '@/lib/adminFeatures';
import {
  getAdminOverview,
  getUsageThisMonth,
  getUsageTotals,
  getUsageByUser,
  getUsageByModel,
  getUsageByEndpoint,
  getUsageByDay,
  type UsageBreakdownRow,
} from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface FeatureGroup {
  id: FeatureId;
  label: string;
  requests: number;
  tokens: number;
  cost: number;
  endpoints: Array<UsageBreakdownRow & { label: string }>;
}

function groupByFeature(rows: UsageBreakdownRow[]): FeatureGroup[] {
  const groups = new Map<FeatureId, FeatureGroup>();
  for (const id of FEATURE_ORDER) {
    groups.set(id, { id, label: FEATURE_LABELS[id], requests: 0, tokens: 0, cost: 0, endpoints: [] });
  }
  for (const row of rows) {
    const id = featureForEndpoint(row.key);
    const g = groups.get(id)!;
    g.requests += row.requests;
    g.tokens += row.tokens;
    g.cost += row.cost;
    g.endpoints.push({ ...row, label: labelForEndpoint(row.key) });
  }
  return FEATURE_ORDER.map((id) => groups.get(id)!)
    .filter((g) => g.endpoints.length > 0)
    .map((g) => ({
      ...g,
      endpoints: g.endpoints.sort((a, b) => b.cost - a.cost || b.requests - a.requests),
    }))
    .sort((a, b) => b.cost - a.cost || b.requests - a.requests);
}

export async function GET(req: NextRequest) {
  const gate = await checkAdmin();
  if (gate === 'unauthenticated') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (gate === 'forbidden') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const window = parseAdminWindow(req.nextUrl.searchParams.get('window'));
  const chartDays = adminWindowChartDays(window);

  const monthlyBudgetUsd = Number(process.env.ADMIN_MONTHLY_BUDGET_USD || '50');
  const thisMonth = getUsageThisMonth();
  const overview = getAdminOverview(window);
  const periodTotals = getUsageTotals(window);
  const byEndpoint = getUsageByEndpoint(window);

  return NextResponse.json({
    window,
    windowLabel: adminWindowLabel(window),
    overview,
    budget: {
      monthlyBudgetUsd,
      monthSpendUsd: thisMonth.cost,
      monthTokens: thisMonth.tokens,
      monthRequests: thisMonth.requests,
      percentUsed:
        monthlyBudgetUsd > 0 ? Math.min(999, (thisMonth.cost / monthlyBudgetUsd) * 100) : 0,
      enforced: (process.env.ADMIN_ENFORCE_BUDGET || '').toLowerCase() === 'true',
      periodSpendUsd: periodTotals.cost,
      periodTokens: periodTotals.tokens,
      periodRequests: periodTotals.requests,
    },
    byUser: getUsageByUser(window),
    byModel: getUsageByModel(window),
    byFeature: groupByFeature(byEndpoint),
    daily: getUsageByDay(chartDays),
    generatedAt: new Date().toISOString(),
  });
}
