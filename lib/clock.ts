// Client-safe clock and calendar arithmetic for the rails. Nothing here reads the system clock: every distance is
// counted from the brief's own date, so a static export never depends on when it was built.

/** "HH:MM" IST, optionally followed by a weekday ("05:30 Sat"), as minutes since 00:00 of the brief's day.
 *  A weekday suffix marks the next day, so 05:30 Sat is 29:30 (1770). Returns null for anything else. */
export function clockMins(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})(?:\s+[A-Za-z]{3})?$/.exec(t.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]) + (/\s[A-Za-z]{3}$/.test(t.trim()) ? 1440 : 0);
}

const DAY_MS = 86_400_000;
/** Whole days from one ISO date to another (UTC arithmetic, so no time zone or build date can shift it). */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso + "T00:00:00Z") - Date.parse(fromIso + "T00:00:00Z")) / DAY_MS);
}

/** "Today", "Tomorrow", "in 3 days", "in 3 weeks" for a distance in whole days. */
export function distanceLabel(days: number): string {
  if (days < 0) return `${-days} day${days === -1 ? "" : "s"} ago`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 14) return `in ${days} days`;
  const w = Math.round(days / 7);
  return `in ${w} weeks`;
}
