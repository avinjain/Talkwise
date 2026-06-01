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
  usersWithConversations: number;
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
  logins: number;
  lastActive: string | null;
  lastLogin: string | null;
}
interface BreakdownRow {
  key: string;
  requests: number;
  tokens: number;
  cost: number;
}
interface FeatureGroup {
  id: string;
  label: string;
  requests: number;
  tokens: number;
  cost: number;
  endpoints: Array<BreakdownRow & { label: string }>;
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
  periodSpendUsd: number;
  periodTokens: number;
  periodRequests: number;
}
interface UsageResponse {
  window: AdminWindow;
  windowLabel: string;
  overview: Overview;
  budget: Budget;
  byUser: UserRow[];
  byModel: BreakdownRow[];
  byFeature: FeatureGroup[];
  daily: DayRow[];
  generatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────────────────────

const nf = new Intl.NumberFormat('en-US');
const fmtNum = (n: number) => nf.format(Math.round(n || 0));

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

function mostRecent(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
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
                Usage and budget metrics across all users — everything below respects the time range.
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
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
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
            <div className={`space-y-8 ${loading ? 'opacity-60' : ''}`}>
              {/* ── Budget metrics ── */}
              <SectionHeading title="Budget metrics" hint="Monthly cap is calendar-month; period spend follows the filter." />
              <BudgetCard budget={data.budget} period={period} />

              {/* ── Usage metrics ── */}
              <SectionHeading title="Usage metrics" hint={period} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <Metric label="Total logins" value={fmtNum(data.overview.logins)} />
                <Metric label="Unique logins" value={fmtNum(data.overview.uniqueLogins)} sub={`of ${fmtNum(data.overview.totalUsers)} users`} />
                <Metric label="Active users" value={fmtNum(data.overview.activeUsers)} sub="used AI" />
                <Metric label="Conversations" value={fmtNum(data.overview.totalConversations)} />
                <Metric label="AI requests" value={fmtNum(data.overview.requests)} />
                <Metric label="Total tokens" value={fmtTokens(data.overview.tokens)} sub={fmtNum(data.overview.tokens)} />
                <Metric label="Budget consumed" value={fmtUsd(data.budget.periodSpendUsd)} accent />
                <Metric
                  label="Avg / request"
                  value={fmtUsd(data.overview.requests ? data.overview.cost / data.overview.requests : 0)}
                />
              </div>

              <Card title="Daily cost" subtitle={`${period} · hover bars for detail`}>
                <DailyChart daily={data.daily} />
              </Card>

              {/* ── Breakdowns ── */}
              <SectionHeading title="Breakdowns" hint={period} />

              <Card title="By user" subtitle="Login activity + AI usage, ranked by spend">
                <UserTable
                  rows={data.byUser}
                  emptyMessage={
                    data.window === 'all'
                      ? 'No users yet.'
                      : data.window === 'today'
                      ? 'No activity today.'
                      : `No activity in ${period.toLowerCase()}.`
                  }
                />
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card title="By model">
                  <BreakdownTable rows={data.byModel} keyHeader="Model" />
                </Card>
                <Card title="By feature" subtitle="Expand a feature for API-level detail">
                  <FeatureBreakdown groups={data.byFeature} />
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
// Section heading
// ─────────────────────────────────────────────────────────────

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-1.5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">{title}</h2>
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Budget
// ─────────────────────────────────────────────────────────────

function BudgetCard({ budget, period }: { budget: Budget; period: string }) {
  const p = Math.min(100, budget.percentUsed);
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
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${p}%` }} />
      </div>
      {over && (
        <p className="mt-2 text-xs font-medium text-red-600">
          Over monthly budget. Tighten rate limits or model tiers to control spend.
        </p>
      )}
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
        <MiniStat label={`Spend (${period.toLowerCase()})`} value={fmtUsd(budget.periodSpendUsd)} />
        <MiniStat label="Tokens" value={fmtTokens(budget.periodTokens)} />
        <MiniStat label="Requests" value={fmtNum(budget.periodRequests)} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Generic pieces
// ─────────────────────────────────────────────────────────────

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

  const totalCost = daily.reduce((s, d) => s + d.cost, 0);
  const totalRequests = daily.reduce((s, d) => s + d.requests, 0);
  const max = Math.max(...daily.map((d) => d.cost), 0);
  const barAreaPx = 128; // bar area inside h-40, leaving room for date labels

  return (
    <div>
      <p className="mb-3 text-sm text-slate-600">
        {totalCost > 0 ? (
          <>
            <span className="font-semibold text-slate-900">{fmtUsd(totalCost)}</span>
            <span className="text-slate-400"> total · {fmtNum(totalRequests)} requests · {daily.length} days</span>
          </>
        ) : (
          <span className="text-slate-400">No AI spend in this period ({daily.length} days shown)</span>
        )}
      </p>
      <div className="flex h-48 items-end gap-0.5 border-b border-slate-100 pb-5">
        {daily.map((d) => {
          const barPx =
            max > 0 ? Math.max(3, Math.round((d.cost / max) * barAreaPx)) : 3;
          const label = d.day.slice(5); // MM-DD
          return (
            <div
              key={d.day}
              className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-0.5"
            >
              <span
                className={`max-w-full truncate text-[8px] font-medium tabular-nums leading-none ${
                  d.cost > 0 ? 'text-slate-600' : 'text-slate-300'
                }`}
                title={fmtUsd(d.cost)}
              >
                {fmtUsd(d.cost)}
              </span>
              <div
                className={`w-full rounded-t transition-colors group-hover:bg-brand-600 ${
                  d.cost > 0 ? 'bg-brand-400' : 'bg-slate-200'
                }`}
                style={{ height: `${barPx}px` }}
                title={`${d.day}: ${fmtUsd(d.cost)} · ${fmtTokens(d.tokens)} tokens · ${fmtNum(d.requests)} reqs`}
              />
              {(daily.length <= 14 || d.cost > 0) && (
                <span className="truncate text-[9px] tabular-nums text-slate-400">{label}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const USER_PAGE_SIZE = 10;

function UserTable({ rows, emptyMessage = 'No users yet.' }: { rows: UserRow[]; emptyMessage?: string }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / USER_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [rows]);

  if (rows.length === 0) return <p className="text-sm text-slate-400">{emptyMessage}</p>;

  const pageRows = rows.slice((currentPage - 1) * USER_PAGE_SIZE, currentPage * USER_PAGE_SIZE);
  const from = (currentPage - 1) * USER_PAGE_SIZE + 1;
  const to = Math.min(currentPage * USER_PAGE_SIZE, rows.length);

  return (
    <div>
      <div className="-mx-5 overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400">
              <th className="px-5 py-2 font-semibold">User</th>
              <th className="px-3 py-2 text-right font-semibold">Logins</th>
              <th className="px-3 py-2 text-right font-semibold">Conversations</th>
              <th className="px-3 py-2 text-right font-semibold">Requests</th>
              <th className="px-3 py-2 text-right font-semibold">Tokens</th>
              <th className="px-3 py-2 text-right font-semibold">Spend</th>
              <th className="px-5 py-2 text-right font-semibold">Last active</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((u) => {
              const lastActive = mostRecent(u.lastActive, u.lastLogin);
              return (
                <tr key={u.userId} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-2.5">
                    <p className="font-medium text-slate-800">{u.name || '—'}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{fmtNum(u.logins)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{fmtNum(u.conversations)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{fmtNum(u.requests)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{fmtTokens(u.tokens)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">{fmtUsd(u.cost)}</td>
                  <td className="px-5 py-2.5 text-right text-xs text-slate-400">{fmtDate(lastActive)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length > USER_PAGE_SIZE && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 pt-3">
          <p className="text-xs text-slate-400">
            Showing {from}–{to} of {fmtNum(rows.length)} users
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 text-xs tabular-nums text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
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

function FeatureBreakdown({ groups }: { groups: FeatureGroup[] }) {
  if (groups.length === 0) return <p className="text-sm text-slate-400">No data for this period.</p>;
  const totalCost = groups.reduce((s, g) => s + g.cost, 0) || 1;
  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <FeatureRow key={g.id} group={g} share={(g.cost / totalCost) * 100} />
      ))}
    </div>
  );
}

function FeatureRow({ group, share }: { group: FeatureGroup; share: number }) {
  const [open, setOpen] = useState(false);
  const featureTotal = group.cost || 1;
  return (
    <div className="rounded-xl border border-slate-100">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
          <span className="text-sm font-semibold text-slate-800">{group.label}</span>
          <span className="text-[11px] text-slate-400">{group.endpoints.length} APIs</span>
        </div>
        <span className="tabular-nums text-xs text-slate-500">
          {fmtUsd(group.cost)} · {fmtTokens(group.tokens)} · {fmtNum(group.requests)} reqs
        </span>
      </button>
      <div className="px-3 pb-2.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(2, share)}%` }} />
        </div>
      </div>
      {open && (
        <div className="space-y-2 border-t border-slate-100 px-3 py-3">
          {group.endpoints.map((e) => (
            <div key={e.key}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">{e.label}</span>
                <span className="tabular-nums text-slate-500">
                  {fmtUsd(e.cost)} · {fmtTokens(e.tokens)} · {fmtNum(e.requests)} reqs
                </span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand-300" style={{ width: `${(e.cost / featureTotal) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
