// NSE cash-session hours (IST) for the day's brief: the record's own hours when set, else the regular session.
// Client-safe (no history import).
import { B } from "@/data";

export const REGULAR_HOURS = { open: "09:15", close: "15:30" } as const;
export const hours = B.hours ?? REGULAR_HOURS;
/** "09:15" → minutes after midnight. */
export const mins = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
