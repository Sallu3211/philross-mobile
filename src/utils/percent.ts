/**
 * One rounding rule for every percentage the app displays.
 *
 * Plain `Math.round` lies at both ends: 99.6% shows as 100%, so someone with
 * an unfinished video reads as finished, and 0.4% shows as 0%, so someone who
 * has genuinely started reads as not started. Both are the cases people check.
 *
 * 0 and 100 are claims about state, not roundings, so they are reserved for
 * the exact values. Everything strictly between clamps into 1–99.
 *
 * Use this anywhere a number is shown to a user. Do not use it for values
 * being *stored* or sent to the API — those should keep their real precision.
 */
export function exactPercent(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 100) return 100;
  return Math.min(Math.max(Math.round(n), 1), 99);
}

export default exactPercent;
