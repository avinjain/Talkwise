'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import RadarChart from '@/components/RadarChart';
import { ProfileResult, DIMENSIONS } from '@/lib/personality-test';
import { useSideNav } from '@/contexts/SideNavContext';
import MBTIDimensionVisual from '@/components/MBTIDimensionVisual';
import MBTITypeBadge from '@/components/MBTITypeBadge';

export default function ProfilePage() {
  const router = useRouter();
  const { setVariant, setLastPersonalityTest, setLastMbtiTest } = useSideNav();

  useEffect(() => {
    setVariant('profile');
    return () => setVariant('default');
  }, [setVariant]);

  const [scores, setScores] = useState<ProfileResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasResult, setHasResult] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [mbtiResult, setMbtiResult] = useState<{ type: string; createdAt: string } | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.hasResult) {
          setScores(data.scores);
          setHasResult(true);
          setUpdatedAt(data.updatedAt);
          setLastPersonalityTest({ date: data.updatedAt, hasResult: true });
        } else {
          setLastPersonalityTest({ hasResult: false });
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }, [setLastPersonalityTest]);

  const fetchMBTI = useCallback(async () => {
    try {
      const res = await fetch('/api/mbti', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.hasResult) {
          setMbtiResult({ type: data.type, createdAt: data.createdAt });
          setLastMbtiTest({ date: data.createdAt, hasResult: true });
        } else {
          setMbtiResult(null);
          setLastMbtiTest({ hasResult: false });
        }
      }
    } catch (err) {
      console.error('Failed to fetch MBTI:', err);
    }
  }, [setLastMbtiTest]);

  useEffect(() => {
    fetchProfile();
    fetchMBTI();
  }, [fetchProfile, fetchMBTI]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Logo size={80} className="animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60">
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <header className="mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Know yourself</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Two short tests — your communication style and MBTI type. Take both for the fullest picture.
            </p>
          </header>

          <section className="mb-8">
            <SectionHeader
              title="Personality tests"
              description="Two short tests. Together they tell you how you communicate and how you decide."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <TestCard
                tone="brand"
                title="Communication style"
                meta="27 questions · 9 traits"
                badge={
                  hasResult && updatedAt
                    ? `Last taken ${new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : 'Not yet taken'
                }
              >
                {!hasResult || !scores ? (
                  <div className="flex flex-col items-start gap-3">
                    <p className="text-sm text-slate-500">
                      Find your strengths and blind spots across 9 communication dimensions.
                    </p>
                    <button
                      onClick={() => router.push('/profile/test')}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Take the test
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-4">
                      <RadarChart scores={scores} size={88} />
                      <div className="text-xs text-slate-500">
                        Your profile across {DIMENSIONS.length} dimensions.
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => router.push('/profile/test/results')}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        View report
                      </button>
                      <button
                        onClick={() => router.push('/profile/test')}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Retake
                      </button>
                    </div>
                  </div>
                )}
              </TestCard>

              <TestCard
                tone="accent"
                title="MBTI type"
                meta="~24 questions · 4 dichotomies"
                badge={
                  mbtiResult?.createdAt
                    ? `Last taken ${new Date(mbtiResult.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : 'Not yet taken'
                }
              >
                {!mbtiResult ? (
                  <div className="flex flex-col items-start gap-3">
                    <p className="text-sm text-slate-500">
                      Forced-choice questions across 4 axes. AI explanation of how it shows up at work.
                    </p>
                    <button
                      onClick={() => router.push('/profile/mbti')}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Take the test
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <p className="text-sm leading-relaxed text-slate-500 sm:max-w-[min(100%,22rem)] sm:pt-0.5">
                        Preference patterns across four dichotomies, summed up as one type. Open the report for strengths, blind spots, and
                        how your type shows up at work.
                      </p>
                      <div className="flex shrink-0 justify-center sm:justify-end">
                        <div className="flex flex-col items-center gap-1">
                          <MBTITypeBadge type={mbtiResult.type} size="sm" showBreakdown={false} />
                          <span className="text-[10px] font-medium text-slate-500">Your MBTI type</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => router.push('/profile/mbti/results')}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        View report
                      </button>
                      <button
                        onClick={() => router.push('/profile/mbti')}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Retake
                      </button>
                    </div>
                  </div>
                )}
              </TestCard>
            </div>

            <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer select-none text-xs font-medium text-slate-500 hover:text-slate-700">
                What do these tests measure?
              </summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Communication style
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {DIMENSIONS.map((d) => (
                      <div
                        key={d.key}
                        className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                        style={{ borderLeftWidth: 3, borderLeftColor: d.color }}
                      >
                        <p className="text-[11px] font-semibold text-slate-800">{d.label}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{d.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">MBTI</p>
                  <MBTIDimensionVisual />
                </div>
              </div>
            </details>
          </section>

          {/* Cross-link to other top-level pages */}
          <div className="grid gap-3 rounded-xl border border-slate-100 bg-white p-4 sm:grid-cols-2">
            <CrossLink
              title="Prepare for interview"
              description="A 2-minute kickoff turns your resume into a personalised plan."
              onClick={() => router.push('/prepare')}
            />
            <CrossLink
              title="Build my resume"
              description="Sharpen your resume, align it with LinkedIn, and pull out stories."
              onClick={() => router.push('/resume')}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-100 bg-white px-6 py-4 text-center text-xs text-slate-400">
        TalkWise · Practice makes confident
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function TestCard({
  tone,
  title,
  meta,
  badge,
  children,
}: {
  tone: 'brand' | 'accent';
  title: string;
  meta: string;
  badge: string;
  children: React.ReactNode;
}) {
  const accent = tone === 'brand' ? 'bg-brand-500' : 'bg-accent-500';
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 rounded-full ${accent}`} />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{meta}</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
          {badge}
        </span>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

function CrossLink({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between gap-3 rounded-lg border border-transparent bg-slate-50/60 px-4 py-3 text-left transition-all hover:border-slate-200 hover:bg-white"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <span className="text-slate-400">→</span>
    </button>
  );
}
