import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { getUserById } from './db';
import { adminEmails, isAdminEmail } from './adminEmails';

export { adminEmails, isAdminEmail };

/** Resolve the current session's email, falling back to a DB lookup by id. */
export async function getSessionEmail(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; email?: string } | undefined;
  if (!user) return null;
  if (user.email) return user.email;
  if (user.id) {
    const row = getUserById(user.id);
    return row?.email ?? null;
  }
  return null;
}

/**
 * Result of an admin gate check, so API routes can return the right status.
 *  - 'unauthenticated' → 401
 *  - 'forbidden'       → 403
 *  - 'ok'              → proceed
 */
export type AdminGate = 'ok' | 'unauthenticated' | 'forbidden';

export async function checkAdmin(): Promise<AdminGate> {
  const email = await getSessionEmail();
  if (!email) return 'unauthenticated';
  return isAdminEmail(email) ? 'ok' : 'forbidden';
}
