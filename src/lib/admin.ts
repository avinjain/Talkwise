import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { getUserById } from './db';

/**
 * Admin allowlist. Configure via the ADMIN_EMAILS env var (comma-separated).
 * Falls back to the project owner so the dashboard works out of the box.
 */
export function adminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || 'avin@demo.com';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

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
