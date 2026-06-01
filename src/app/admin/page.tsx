'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Logo from '@/components/Logo';
import { ADMIN_WINDOWS, type AdminWindow } from '@/lib/adminWindow';

// ─────────────────────────────────────────────────────────────
// DTOs (mirror /api/admin/usage)
// ─────────────────────────────────────────────────────────────

interface Overview {
  requests: number;
  tokens: number;
  cost: number;
  totalUsers: number;
  activeUsers: number;
  totalConversations: number;
  logins: number;
  uniqueLogins: number;
}
interface UserRow {
  userId: string;
  email: string;
  name: string;
  requests: number;
  tokens: number;
  cost: number;
  conversations: number;
  lastActive: string | null;
}
interface BreakdownRow {
  key: string;
  requests: number;
  tokens: number;
  cost: number;
}
interface DayRow {
  day: string;
  requests: number;
  tokens: number;
  cost: number;
}
interface Budget {
  monthlyBudgetUsd: number;
  monthSpendUsd: number;
  monthTokens: number;
  monthRequests: number;
  percentUsed: number;
  enforced: boolean;
}
interface UsageResponse {
  window: AdminWindow;
  windowLabel: string;
  overview: Overview;
  budget: Budget;
  byUser: UserRow[];
  byModel: BreakdownRow[];
  byEndpoint: BreakdownRow[];
  daily: DayRow[];
  generatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────────────────────

const nf = new Intl.NumberFormat('en-US');

function fmtNum(n: number): string {
  return nf.format(Math.round(n || 0));
}

function fmtTokens(n: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtUsd(n: number): string {
  const v = n || 0;
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(3)}`;
  return `$${v.toFixed(4)}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.replace(' ', 'T') + (iso.includes('T') ? '' : 'Z'));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function AdminUsagePage() {
  const router = useRouter();
  const { status } = useSession();
  const [window, setWindow] = useState<AdminWindow>('30d');
  const [data, setData] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/usage?window=${window}`, { cache: 'no-store' });
      if (res.status === 401) {
        router.replace('/auth?callbackUrl=/admin');
        return;
      }
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (!res.ok) throw new Error('Failed to load usage');
      setData((await res.json()) as UsageResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load usage');
    } finally {
      setLoading(false);
    }
  }, [router, window]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/auth?callbackUrl=/admin');
      return;
    }
    load();
  }, [status, load, router]);

  if (status === 'loading' || (loading && !data && !forbidden)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/60">
        <Logo size={72} className="animate-pulse" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/60 px-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">Admin access required</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your account isn&rsquo;t on the admin allowlist. Set <code className="rounded bg-slate-100 px-1">ADMIN_EMAILS</code> to grant access.
          </p>
          <button
            onClick={() => router.push('/home')}
            className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to app
          </button>
        </div>
      </div>
    );
  }

  const period = data?.windowLabel ?? 'Last 30 days';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60">
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">Admin</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Usage &amp; cost tracking</h1>
              <p className="mt-1 text-sm text-slate-500">
                AI token usage across all users — monitor spend, cap budgets, and spot heavy consumers.
              </p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </header>

          {/* Global time filter */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Time range</p>
              <p className="text-sm font-medium text-slate-800">Showing data for {period.toLowerCase()}</p>
            </div>
            <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {ADMIN_WINDOWS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWindow(w.id)}
                  disabled={loading && window === w.id}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                    window === w.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {data && (
            <div className={`space-y-6 ${loading ? 'opacity-60' : ''}`}>
              <BudgetCard budget={data.budget} period={period} periodSpend={data.overview.cost} />

              {/* Top-line metrics — scoped to selected window */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                <Metric label="Logins" value={fmtNum(data.overview.logins)} sub={`${fmtNum(data.overview.uniqueLogins)} unique users`} />
                <Metric label="Registered users" value={fmtNum(data.overview.totalUsers)} sub="All time" />
                <Metric label="Active users" value={fmtNum(data.overview.activeUsers)} sub="Used AI in period" />
                <Metric label="Conversations" value={fmtNum(data.overview.totalConversations)} />
                <Metric label="AI requests" value={fmtNum(data.overview.requests)} />
                <Metric label="Tokens" value={fmtTokens(data.overview.tokens)} />
                <Metric label="Spend" value={fmtUsd(data.overview.cost)} accent />
                <Metric
                  label="Avg / request"
                  value={fmtUsd(data.overview.requests ? data.overview.cost / data.overview.requests : 0)}
                />
              </div>

              <Card title="Daily cost" subtitle={`${period} · hover bars for detail`}>
                <DailyChart daily={data.daily} />
              </Card>

              <Card title="By user" subtitle={`${period} · ranked by spend`}>
                <UserTable
                  rows={data.byUser}
                  emptyMessage={
                    data.window === 'all'
                      ? 'No users yet.'
                      : data.window === 'today'
                      ? 'No AI usage today.'
                      : `No AI usage in ${period.toLowerCase()}.`
                  }
                />
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card title="By model" subtitle={period}>
                  <BreakdownTable rows={data.byModel} keyHeader="Model" />
                </Card>
                <Card title="By feature" subtitle={`${period} · endpoint / AI task`}>
                  <BreakdownTable rows={data.byEndpoint} keyHeader="Feature" />
                </Card>
              </div>

              <p className="text-center text-xs text-slate-400">
                {period} · generated {fmtDate(data.generatedAt)} · costs are estimates from model pricing
              </p>
            </div>
          )}
        </div>
      </main>
      <footer className="border-t border-slate-100 bg-white px-6 py-4 text-center text-xs text-slate-400">
        TalkWise · Admin
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pieces
// ─────────────────────────────────────────────────────────────

function BudgetCard({
  budget,
  period,
  periodSpend,
}: {
  budget: Budget;
  period: string;
  periodSpend: number;
}) {
  const pct = Math.min(100, budget.percentUsed);
  const over = budget.percentUsed >= 100;
  const warn = budget.percentUsed >= 80;
  const barColor = over ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Monthly AI budget</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                budget.enforced ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {budget.enforced ? 'Cap enforced' : 'Monitoring only'}
            </span>
          </div>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {fmtUsd(budget.monthSpendUsd)}
            <span className="ml-2 text-sm font-medium text-slate-400">/ {fmtUsd(budget.monthlyBudgetUsd)} this month</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Selected period ({period.toLowerCase()}): <span className="font-semibold text-slate-700">{fmtUsd(periodSpend)}</span>
          </p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-semibold ${over ? 'text-red-600' : warn ? 'text-amber-600' : 'text-emerald-600'}`}>
            {budget.percentUsed.toFixed(1)}% of monthly budget
          </p>
          <p className="text-xs text-slate-400">
            {fmtTokens(budget.monthTokens)} tokens · {fmtNum(budget.monthRequests)} requests this month
          </p>
        </div>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      {over && (
        <p className="mt-2 text-xs font-medium text-red-600">
          Over monthly budget. Tighten rate limits or model tiers to control spend.
        </p>
      )}
    </div>
  );
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent ? 'text-brand-700' : 'text-slate-900'}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function DailyChart({ daily }: { daily: DayRow[] }) {
  if (daily.length === 0) {
    return <p className="text-sm text-slate-400">No usage recorded for this period.</p>;
  }
  const max = Math.max(...daily.map((d) => d.cost), 0.0001);
  return (
    <div className="flex h-40 items-end gap-1">
      {daily.map((d) => {
        const h = Math.max(2, (d.cost / max) * 100);
        return (
          <div key={d.day} className="group flex flex-1 flex-col items-center justify-end">
            <div
              className="w-full rounded-t bg-brand-400 transition-colors group-hover:bg-brand-600"
              style={{ height: `${h}%` }}
              title={`${d.day}: ${fmtUsd(d.cost)} · ${fmtTokens(d.tokens)} tokens · ${fmtNum(d.requests)} reqs`}
            />
          </div>
        );
      })}
    </div>
  );
}

function UserTable({ rows, emptyMessage = 'No users yet.' }: { rows: UserRow[]; emptyMessage?: string }) {
  if (rows.length === 0) return <p className="text-sm text-slate-400">{emptyMessage}</p>;
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400">
            <th className="px-5 py-2 font-semibold">User</th>
            <th className="px-3 py-2 text-right font-semibold">Conversations</th>
            <th className="px-3 py-2 text-right font-semibold">Requests</th>
            <th className="px-3 py-2 text-right font-semibold">Tokens</th>
            <th className="px-3 py-2 text-right font-semibold">Spend</th>
            <th className="px-5 py-2 text-right font-semibold">Last active</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.userId} className="border-b border-slate-50 last:border-0">
              <td className="px-5 py-2.5">
                <p className="font-medium text-slate-800">{u.name || '—'}</p>
                <p className="text-xs text-slate-400">{u.email}</p>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{fmtNum(u.conversations)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{fmtNum(u.requests)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{fmtTokens(u.tokens)}</td>
              <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">{fmtUsd(u.cost)}</td>
              <td className="px-5 py-2.5 text-right text-xs text-slate-400">{fmtDate(u.lastActive)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BreakdownTable({ rows, keyHeader }: { rows: BreakdownRow[]; keyHeader: string }) {
  if (rows.length === 0) return <p className="text-sm text-slate-400">No data for this period.</p>;
  const totalCost = rows.reduce((s, r) => s + r.cost, 0) || 1;
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.key}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{r.key.replace(/_/g, ' ')}</span>
            <span className="tabular-nums text-slate-500">
              {fmtUsd(r.cost)} · {fmtTokens(r.tokens)} · {fmtNum(r.requests)} reqs
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-400" style={{ width: `${(r.cost / totalCost) * 100}%` }} />
          </div>
        </div>
      ))}
      <p className="pt-1 text-right text-[11px] text-slate-400">{keyHeader} ranked by spend</p>
    </div>
  );
}
