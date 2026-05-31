/**
 * Pure admin allowlist helpers. Kept dependency-free (env only) so both
 * `lib/auth.ts` (session callback) and `lib/admin.ts` (server gate) can import
 * them without creating a circular import between auth and admin.
 *
 * Configure via the ADMIN_EMAILS env var (comma-separated). Falls back to the
 * project owner so the dashboard works out of the box.
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
