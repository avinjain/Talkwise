/**
 * Sign-up / login allowlist. Configure via ALLOWED_EMAILS (comma-separated).
 * Falls back to the built-in beta list when unset.
 */
const DEFAULT_ALLOWED_EMAILS = [
  'demotrial@demo.com',
  'baba@demo.com',
  'aditi@demo.com',
  'parul@demo.com',
  'subi@demo.com',
  'chitra@demo.com',
  'avin@demo.com',
  'parul0130@gmail.com',
  'subi.mahapatra@gmail.com',
  'mayank.saraswat05@gmail.com',
  'sauravmit@gmail.com',
];

export function allowedEmails(): string[] {
  const raw = process.env.ALLOWED_EMAILS;
  if (raw?.trim()) {
    return raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }
  return DEFAULT_ALLOWED_EMAILS;
}

export function isAllowedEmail(email?: string | null): boolean {
  if (!email) return false;
  return allowedEmails().includes(email.toLowerCase().trim());
}
