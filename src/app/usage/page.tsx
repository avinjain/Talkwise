'use client';

import { useEffect, useState, useCallback } from 'react';
import Logo from '@/components/Logo';
import AppHeader from '@/components/AppHeader';

interface UsageBlock {
  requests: number;
  tokens: number;
  cost: number;
}

interface UsageResponse {
  today: UsageBlock;
  allTime: UsageBlock;
  limits: { requestsPerMinute: number; requestsPerHour: number; requestsPerDay: number };
}

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsage = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/usage', { cache: 'no-store' });
      if (res.ok) setUsage(await res.json());
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Logo size={80} className="animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60">
      <AppHeader backHref="/" backLabel="Home" />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <header className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">My usage</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Your AI usage and billing for TalkWise. Updated after each request.
              </p>
            </div>
            <button
              onClick={fetchUsage}
              disabled={refreshing}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </header>

          {!usage ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-400">
              Could not load usage.
            </div>
          ) : (
            <div className="space-y-6">
              <UsageGroup
                title="Today"
                description="Last 24 hours."
                requests={usage.today.requests}
                tokens={usage.today.tokens}
                cost={usage.today.cost}
              />
              <UsageGroup
                title="All time"
                description="Since you signed up."
                requests={usage.allTime.requests}
                tokens={usage.allTime.tokens}
                cost={usage.allTime.cost}
                subtle
              />
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-slate-900">Rate limits</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Free-tier safeguards to keep costs predictable.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <Limit label="per minute" value={usage.limits.requestsPerMinute} />
                  <Limit label="per hour" value={usage.limits.requestsPerHour} />
                  <Limit label="per day" value={usage.limits.requestsPerDay} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-100 bg-white px-6 py-4 text-center text-xs text-slate-400">
        TalkWise · Practice makes confident
      </footer>
    </div>
  );
}

function UsageGroup({
  title,
  description,
  requests,
  tokens,
  cost,
  subtle,
}: {
  title: string;
  description: string;
  requests: number;
  tokens: number;
  cost: number;
  subtle?: boolean;
}) {
  return (
    <section className={`rounded-2xl border ${subtle ? 'border-slate-100 bg-white/60' : 'border-slate-200 bg-white'} p-5`}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Requests" value={requests.toLocaleString()} />
        <Stat label="Tokens" value={tokens.toLocaleString()} />
        <Stat label="Cost" value={`$${cost.toFixed(4)}`} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Limit({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3">
      <p className="text-base font-semibold text-slate-900">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}
