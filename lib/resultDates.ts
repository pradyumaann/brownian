// Results dates for the watchlist. Pure and client-safe: no imports, so it runs in the browser and under `node --test`.
// A date comes only from the day's own results lists (today's and tomorrow's Indian lists, the US calendar, the reported
// list). Nothing is guessed, no name is matched loosely, and a name the brief does not list shows no date.

/** The fields of the brief this needs, passed in so the module has no imports. */
export interface ResultSource {
  briefDate: string;
  /** Names the watchlist knows (the keys of the brief's stock notes). */
  names: string[];
  /** Lower-case alias → name. */
  aliases: Record<string, string>;
  /** [company, sector, context] */
  erToday: string[][];
  erTom: string[][];
  /** [date, company or companies joined with " · ", timing, why it matters, high impact] */
  erUS: (string | boolean)[][];
  /** [company, market, reported, reaction, tone] */
  erDone: string[][];
}

export interface ResultDate {
  kind: "due" | "reports" | "reported" | "none";
  /** ISO date, when the list gives a firm one. */
  date: string | null;
  /** Words for the watchlist row. */
  text: string;
}

export const NONE: ResultDate = { kind: "none", date: null, text: "No result date found" };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** "Fri 13 Nov" for an ISO date (UTC arithmetic, no time zone or build date involved). */
export function dayLabel(isoDate: string): string {
  const t = new Date(isoDate + "T00:00:00Z");
  return `${DAYS[t.getUTCDay()]} ${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]}`;
}

/** The ISO date `n` days after another. */
export function addDays(isoDate: string, n: number): string {
  const t = new Date(isoDate + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() + n);
  return iso(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
}

/** "Tue 17 Nov" → ISO date, with the year taken from the brief's date (the next year when the month has wrapped). Null when
 *  the weekday does not match that date (a typo somewhere is not guessed at), when it cannot be read, or when it falls
 *  before the brief's date. */
export function parseUsDate(text: string, briefDate: string): string | null {
  const m = /^\s*([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})\s+([A-Za-z]{3})/.exec(text);
  if (!m) return null;
  const wd = DAYS.findIndex((d) => d.toLowerCase() === m[1].toLowerCase()), mo = MONTHS.findIndex((x) => x.toLowerCase() === m[3].toLowerCase());
  const day = Number(m[2]);
  if (wd < 0 || mo < 0 || day < 1 || day > 31) return null;
  const by = Number(briefDate.slice(0, 4)), bm = Number(briefDate.slice(5, 7)) - 1;
  const year = mo < bm - 6 ? by + 1 : mo > bm + 6 ? by - 1 : by;
  const t = new Date(Date.UTC(year, mo, day));
  if (t.getUTCMonth() !== mo || t.getUTCDay() !== wd) return null;
  const out = iso(year, mo, day);
  return out < briefDate ? null : out;
}

/** Resolve typed text to a name in the brief: an alias, then an exact name (case-insensitive); otherwise up to four
 *  suggestions that contain the text or start an alias. No fuzzy matching. */
export function resolveName(q: string, names: string[], aliases: Record<string, string>): { hit?: string; raw?: string; sug?: string[] } {
  const s = q.trim().toLowerCase();
  if (!s) return {};
  if (aliases[s]) return { hit: aliases[s] };
  const exact = names.find((n) => n.toLowerCase() === s);
  if (exact) return { hit: exact };
  const sug = names.filter((n) => n.toLowerCase().includes(s) || Object.entries(aliases).some(([a, v]) => v === n && a.startsWith(s))).slice(0, 4);
  return { raw: q.trim(), sug };
}

/** The key a name is looked up by: its alias or exact name when the brief knows it, else the text as written, lower-case. */
const keyOf = (name: string, names: string[], aliases: Record<string, string>) => (resolveName(name, names, aliases).hit ?? name.trim()).toLowerCase();

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type ResultIndex = Map<string, ResultDate>;

/** Index every company in the brief's results lists by name. The first list to name a company wins: reported, then today,
 *  then tomorrow, then the US calendar. */
export function buildResultIndex(b: ResultSource): ResultIndex {
  const ix: ResultIndex = new Map();
  const put = (name: string, r: ResultDate) => { const k = keyOf(name, b.names, b.aliases); if (!ix.has(k)) ix.set(k, r); };
  for (const r of b.erDone) put(r[0], { kind: "reported", date: null, text: "Reported" });
  for (const r of b.erToday) put(r[0], { kind: "due", date: b.briefDate, text: `Results due ${dayLabel(b.briefDate)}` });
  const tom = addDays(b.briefDate, 1);
  for (const r of b.erTom) put(r[0], { kind: "due", date: tom, text: `Results due ${dayLabel(tom)}` });
  for (const r of b.erUS) {
    const [when, who, timing, why] = [String(r[0]), String(r[1]), String(r[2]), String(r[3])];
    const date = parseUsDate(when, b.briefDate);
    for (const company of who.split(" · ").map((x) => x.trim()).filter(Boolean)) {
      if (!date) { put(company, NONE); continue; }
      const unsure = new RegExp(`${escapeRe(company)} date (?:is )?(?:un|not )confirmed`, "i").test(why);
      put(company, { kind: "reports", date, text: `Reports ${dayLabel(date)}, ${timing}${unsure ? "; the brief says this date is not confirmed" : ""}` });
    }
  }
  return ix;
}

/** The watchlist row's results date for a name: from the lists if the brief names the company, else "No result date". */
export function resultFor(ix: ResultIndex, name: string, names: string[], aliases: Record<string, string>): ResultDate {
  return ix.get(keyOf(name, names, aliases)) ?? NONE;
}
