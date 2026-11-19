// Server-only: the "Indicators to watch" field on Macro Watch. For each indicator the history store actually holds
// (USD/INR, the US 10-year yield, Brent, the dollar index and gold from Yahoo Finance, D5; FPI net equity flows from NSDL, D4), every week
// and every month of the five years up to the session is ranked against the same five years: the share of the
// window's readings at or below it (0–100). Ranks need no axis break, so the columns start at zero on one shared
// scale. Nothing is filled in: a week or month with no reading is a null and draws no column.
import { history } from "./history";
import { percentile } from "./stats";

export interface FieldBin { end: string; v: number; rank: number; toDate: boolean }
export interface FieldRow {
  id: string; name: string; short: string; kind: "inr" | "pct" | "usd" | "idx" | "crore"; how: string; src: string[];
  /** Weekly and monthly bins over the window; levels take the last close in the bin, flows the sum. */
  weeks: (FieldBin | null)[]; months: (FieldBin | null)[];
  /** Latest reading on or before the session: its date and value, the change on the previous reading, its rank. */
  last: { date: string; v: number; prev: number | null; rank: number; label: string };
}

const isoWeekStart = (d: string) => {
  const t = new Date(d + "T00:00:00Z"), day = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - day);
  return t.toISOString().slice(0, 10);
};

/** Bin keys covering the window, so empty bins stay as nulls in place. */
function keys(from: string, to: string, by: "week" | "month"): string[] {
  const out: string[] = [];
  if (by === "month") {
    let y = Number(from.slice(0, 4)), m = Number(from.slice(5, 7));
    const ey = Number(to.slice(0, 4)), em = Number(to.slice(5, 7));
    while (y < ey || (y === ey && m <= em)) { out.push(`${y}-${String(m).padStart(2, "0")}`); m++; if (m > 12) { m = 1; y++; } }
    return out;
  }
  const t = new Date(isoWeekStart(from) + "T00:00:00Z"), end = to;
  while (t.toISOString().slice(0, 10) <= end) { out.push(t.toISOString().slice(0, 10)); t.setUTCDate(t.getUTCDate() + 7); }
  return out;
}

function bins(pts: { date: string; v: number }[], from: string, to: string, by: "week" | "month", agg: "last" | "sum", ref: number[] | null): (FieldBin | null)[] {
  const key = (d: string) => (by === "month" ? d.slice(0, 7) : isoWeekStart(d));
  const m = new Map<string, { end: string; v: number }>();
  for (const p of pts) {
    const k = key(p.date), cur = m.get(k);
    m.set(k, { end: p.date, v: agg === "sum" ? (cur?.v ?? 0) + p.v : p.v });
  }
  const ks = keys(from, to, by);
  const vals = ks.map((k) => m.get(k) ?? null);
  // Flows are ranked among the window's bins of the same length; levels among the window's daily closes.
  const base = ref ?? vals.filter((b): b is { end: string; v: number } => !!b).map((b) => b.v);
  return vals.map((b, i) => (b ? { end: b.end, v: b.v, rank: percentile(base, b.v), toDate: i === ks.length - 1 && b.end < endOf(ks[i], by) } : null));
}
/** Last calendar day of a bin (Friday for a week); a bin whose last reading falls before it is "to date". */
function endOf(k: string, by: "week" | "month") {
  if (by === "month") { const [y, m] = k.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); }
  const t = new Date(k + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + 4); return t.toISOString().slice(0, 10); // Friday
}

const yearsBack = (d: string, n: number) => `${Number(d.slice(0, 4)) - n}${d.slice(4)}`;

/** The field, read as of `upTo` (the brief's session date). */
export function indicatorField(upTo: string): { from: string; to: string; rows: FieldRow[] } {
  const h = history(), from = yearsBack(upTo, 5);
  const world = (id: string) => [...(h.world.get(id) ?? new Map<string, number>()).entries()]
    .filter(([d]) => d > from && d <= upTo).sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, v]) => ({ date, v }));
  const level = (id: string, name: string, short: string, kind: FieldRow["kind"], how: string): FieldRow => {
    const pts = world(id), daily = pts.map((p) => p.v), l = pts.at(-1)!, p = pts.at(-2);
    return {
      id, name, short, kind, how, src: ["D5"],
      weeks: bins(pts, from, upTo, "week", "last", daily), months: bins(pts, from, upTo, "month", "last", daily),
      last: { date: l.date, v: l.v, prev: p?.v ?? null, rank: percentile(daily, l.v), label: "close" },
    };
  };
  const fpi = [...h.fpi.entries()].filter(([d]) => d > from && d <= upTo).sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, f]) => ({ date, v: f.equity }));
  const fm = bins(fpi, from, upTo, "month", "sum", null), lastM = fm.at(-1);
  const fpiRow: FieldRow = {
    id: "fpi", name: "FPI net equity flows", short: "FPI flows", kind: "crore", how: "net buying (+) or selling (−) in the week or month, summed from NSDL's daily reports",
    src: ["D4"], weeks: bins(fpi, from, upTo, "week", "sum", null), months: fm,
    last: lastM
      ? { date: lastM.end, v: lastM.v, prev: fm.at(-2)?.v ?? null, rank: lastM.rank, label: lastM.toDate ? "month to date" : "month" }
      : { date: upTo, v: 0, prev: null, rank: NaN, label: "n/a" },
  };
  return {
    from, to: upTo,
    // Front to back: the rupee first, then flows, then the two global prices that press on it.
    rows: [
      level("usdinr", "USD/INR", "USD/INR", "inr", "rupees per US dollar; a higher rank is a weaker rupee"),
      fpiRow,
      level("us10y", "US 10-year Treasury yield", "US 10Y", "pct", "yield, %"),
      level("brent", "Brent crude", "Brent", "usd", "US dollars a barrel"),
      // Added 19 Nov 2026: the two series the store already holds that the brief's own macro list also prints (S11).
      level("dxy", "Dollar index", "Dollar index", "idx", "index level; a higher rank is a stronger dollar"),
      level("gold", "Gold futures (COMEX)", "Gold", "usd", "US dollars an ounce, COMEX futures"),
    ],
  };
}
