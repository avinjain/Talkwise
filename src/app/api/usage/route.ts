import { getAuthUserId } from '@/lib/session';
import { getUserUsageToday, getUserUsageAllTime } from '@/lib/db';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const today = getUserUsageToday(userId);
    const allTime = getUserUsageAllTime(userId);

    return Response.json({
      today: {
        requests: today.totalRequests,
        tokens: today.totalTokens,
        cost: Math.round(today.totalCost * 10000) / 10000,
      },
      allTime: {
        requests: allTime.totalRequests,
        tokens: allTime.totalTokens,
        cost: Math.round(allTime.totalCost * 10000) / 10000,
      },
      limits: {
        requestsPerMinute: 15,
        requestsPerHour: 100,
        requestsPerDay: 500,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch usage';
    return Response.json({ error: message }, { status: 500 });
  }
}
