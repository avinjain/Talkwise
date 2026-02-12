import { getRecentRequestCount } from './db';

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
 * Check if a user is within rate limits.
 * Uses the usage_logs table as the source of truth.
 */
export function checkRateLimit(userId: string): RateLimitResult {
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
