/** Round a USD amount to cents. */
export function roundUsd(n: number): number {
  return Math.round((n || 0) * 100) / 100;
}

/** Format a USD amount for display (always 2 decimal places). */
export function fmtUsd(n: number): string {
  return `$${roundUsd(n).toFixed(2)}`;
}
