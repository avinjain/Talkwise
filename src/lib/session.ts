import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

/**
 * Get the current authenticated user's ID from the server session.
 * Returns null if not authenticated.
 */
export async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string })?.id || null;
}

/**
 * Require authentication. Returns the user ID or throws a Response.
 */
export async function requireAuth(): Promise<string> {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return userId;
}
