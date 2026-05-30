import { getRecentRequestCount, getUsageThisMonth } from './db';

// Rate limit configuration
const RATE_LIMITS = {
  // Max requests per user per minute
  requestsPerMinute: 15,
  // Max requests per user per hour
  requestsPerHour: 100,
  // Max requests per user per day
  requestsPerDay: 500,
};

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
}

/**
 * Global AI spend kill-switch. Opt-in via ADMIN_ENFORCE_BUDGET=true so a
 * misconfigured budget can never accidentally take AI offline. When enabled
 * and this month's estimated spend has reached ADMIN_MONTHLY_BUDGET_USD,
 * all AI requests are blocked until the next calendar month.
 */
export function checkBudget(): RateLimitResult {
  if ((process.env.ADMIN_ENFORCE_BUDGET || '').toLowerCase() !== 'true') {
    return { allowed: true };
  }
  const budget = Number(process.env.ADMIN_MONTHLY_BUDGET_USD || '50');
  if (!(budget > 0)) return { allowed: true };

  try {
    const spend = getUsageThisMonth().cost;
    if (spend >= budget) {
      return {
        allowed: false,
        reason: 'Monthly AI budget reached. Please try again next month or contact the admin.',
        retryAfterSeconds: 3600,
      };
    }
  } catch {
    // Never let a bookkeeping error block AI — fail open.
    return { allowed: true };
  }
  return { allowed: true };
}

/**
 * Check if a user is within rate limits.
 * Uses the usage_logs table as the source of truth.
 */
export function checkRateLimit(userId: string): RateLimitResult {
  // Global budget kill-switch first — applies to every user.
  const budget = checkBudget();
  if (!budget.allowed) return budget;

  // Check per-minute limit
  const lastMinute = getRecentRequestCount(userId, 60);
  if (lastMinute >= RATE_LIMITS.requestsPerMinute) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${RATE_LIMITS.requestsPerMinute} requests per minute`,
      retryAfterSeconds: 60,
    };
  }

  // Check per-hour limit
  const lastHour = getRecentRequestCount(userId, 3600);
  if (lastHour >= RATE_LIMITS.requestsPerHour) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${RATE_LIMITS.requestsPerHour} requests per hour`,
      retryAfterSeconds: 3600,
    };
  }

  // Check per-day limit
  const lastDay = getRecentRequestCount(userId, 86400);
  if (lastDay >= RATE_LIMITS.requestsPerDay) {
    return {
      allowed: false,
      reason: `Daily limit reached: ${RATE_LIMITS.requestsPerDay} requests per day`,
      retryAfterSeconds: 86400,
    };
  }

  return { allowed: true };
}
