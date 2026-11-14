// Mood Index, server-side. Nine components, each scored as the percentile of today's reading among its own
// previous five years (at least 250 trading days), then averaged. Scores use only data up to each day, never later.
import { B } from "@/data";
import type { Tone } from "@/data/types";
import { BANDS, QUADS, bandOf, fillWith, type MoodVars } from "./bands";
import { history, indexSeries, worldOnNseDays } from "./history";
import type { PaperId } from "./papers";
import { percentile } from "./stats";

export { BANDS, bandOf };

const LOOKBACK = 1250, MIN = 250;
type Raw = (number | null)[];

interface Def {
  id: string; name: string; metric: string; term: string; papers: PaperId[]; src: string[];
  /** For a measure with no peer-reviewed source: where the method comes from instead. */
  basis?: string;
  /** +1: a higher reading means more greed. −1: a higher reading means more fear, so the percentile is inverted. */
  dir: 1 | -1;
  how: string;
  raw: () => Raw;
  show: (v: number, t: number) => string;
  /** Why the component can be missing, named on the page instead of estimating it. */
  gap?: string;
}

const h = history();
const days = h.tradingDays;
const nifty = indexSeries("nifty50").values;
const at = (a: Raw, i: number) => (i >= 0 ? a[i] : null);
const ret = (a: Raw, i: number, n: number) => { const x = at(a, i), y = at(a, i - n); return x != null && y != null ? x / y - 1 : null; };
const avg = (a: Raw, i: number, n: number) => {
  let s = 0;
  for (let k = i - n + 1; k <= i; k++) { const v = at(a, k); if (v == null) return null; s += v; }
  return s / n;
};
const breadthOf = (f: (b: NonNullable<ReturnType<typeof h.breadth.get>>) => number | null): Raw => days.map((d) => { const b = h.breadth.get(d); return b ? f(b) : null; });
const pct1 = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v * 100).toFixed(1)}%`;

const DEFS: Def[] = [
  {
    id: "vol", name: "Volatility", metric: "India VIX close", term: "vix", papers: ["whaley2000"], src: ["D1"], dir: -1,
    how: "100 − percentile of India VIX among the previous five years", raw: () => indexSeries("indiavix").values,
    show: (v) => `India VIX ${v.toFixed(2)}`,
  },
  {
    id: "breadth", name: "Market breadth", metric: "Share of NSE stocks that rose, 5-day average", term: "breadth", papers: [], src: ["D2"], dir: 1,
    basis: "Practitioner measure (advance–decline breadth), as in published fear-and-greed indices; no single paper",
    how: "Percentile of the 5-day average share of advancing stocks",
    raw: () => { const a = breadthOf((b) => (b.advances / (b.advances + b.declines)) * 100); return days.map((_, i) => avg(a, i, 5)); },
    show: (v) => `${v.toFixed(1)}% of stocks rose, 5-day average`,
  },
  {
    id: "mom", name: "Momentum", metric: "Nifty 50 return over 20 sessions", term: "momentum", papers: ["jt1993"], src: ["D1"], dir: 1,
    how: "Percentile of the 20-session Nifty 50 return", raw: () => days.map((_, i) => ret(nifty, i, 20)),
    show: (v) => `Nifty 50 ${pct1(v)} over 20 sessions`,
  },
  {
    id: "strength", name: "Price strength", metric: "New 52-week highs as a share of highs plus lows, 5 days", term: "strength", papers: ["gh2004"], src: ["D2"], dir: 1,
    how: "Percentile of highs ÷ (highs + lows), stocks at 52-week extremes over 5 sessions",
    raw: () => {
      const hi = breadthOf((b) => b.highs52), lo = breadthOf((b) => b.lows52);
      return days.map((_, i) => { const a = avg(hi, i, 5), b = avg(lo, i, 5); return a != null && b != null && a + b > 0 ? (a / (a + b)) * 100 : null; });
    },
    show: (v) => `${v.toFixed(0)}% of stocks at 52-week extremes were at highs`,
    gap: "52-week counts start a year into the stored bhavcopies",
  },
  {
    id: "trend", name: "Trend vs average", metric: "Nifty 50 distance from its 200-day average", term: "trend", papers: ["bll1992", "mop2012"], src: ["D1"], dir: 1,
    how: "Percentile of Nifty 50 ÷ its 200-day average − 1", raw: () => days.map((_, i) => { const a = avg(nifty, i, 200), x = nifty[i]; return a && x ? x / a - 1 : null; }),
    show: (v) => `Nifty 50 ${Math.abs(v * 100).toFixed(1)}% ${v >= 0 ? "above" : "below"} its 200-day average`,
  },
  {
    id: "pcr", name: "Put/call ratio", metric: "Nifty options put volume ÷ call volume, 5-day average", term: "pcr", papers: ["pp2006"], src: ["D3"], dir: -1,
    how: "100 − percentile of the 5-day average put/call volume ratio",
    raw: () => { const a = days.map((d) => { const o = h.options.get(d); return o && o.callVol ? o.putVol / o.callVol : null; }); return days.map((_, i) => avg(a, i, 5)); },
    show: (v) => `Put/call volume ratio ${v.toFixed(2)}, 5-day average`,
    gap: "options history starts November 2024",
  },
  {
    id: "haven", name: "Safe-haven demand", metric: "Nifty 50 minus gold (in ₹), 20-session returns", term: "haven", papers: [], src: ["D1", "D5"], dir: 1,
    basis: "Practitioner measure: CNN's index compares stocks with bonds; Tickertape's Market Mood Index uses gold for India; no single paper",
    how: "Percentile of the 20-session return gap between Nifty 50 and gold priced in rupees",
    raw: () => {
      const g = worldOnNseDays("gold").values, fx = worldOnNseDays("usdinr").values;
      const gi = g.map((v, i) => (v != null && fx[i] != null ? v * fx[i]! : null));
      return days.map((_, i) => { const a = ret(nifty, i, 20), b = ret(gi, i, 20); return a != null && b != null ? a - b : null; });
    },
    show: (v) => `Stocks ${v >= 0 ? "ahead of" : "behind"} gold by ${Math.abs(v * 100).toFixed(1)} pts over 20 sessions`,
  },
  {
    id: "gvol", name: "Global risk appetite", metric: "US VIX close", term: "vix", papers: ["whaley2000"], src: ["D5"], dir: -1,
    how: "100 − percentile of the US VIX among the previous five years", raw: () => worldOnNseDays("usvix").values,
    show: (v) => `US VIX ${v.toFixed(2)}`,
  },
  {
    id: "fii", name: "Foreign flows", metric: "FPI net equity buying, 20 sessions", term: "fii", papers: ["fos2001"], src: ["D4"], dir: 1,
    how: "Percentile of the 20-session sum of FPI net equity investment",
    // NSDL reporting days don't always match NSE sessions, so sum NSDL's own last 20 reporting days up to each session.
    raw: () => {
      const fd = [...h.fpi.keys()].sort(), fv = fd.map((d) => h.fpi.get(d)!.equity);
      let j = -1;
      return days.map((d) => {
        while (j + 1 < fd.length && fd[j + 1] <= d) j++;
        return j >= 19 ? fv.slice(j - 19, j + 1).reduce((a, b) => a + b, 0) : null;
      });
    },
    show: (v) => `FPIs net ${v >= 0 ? "bought" : "sold"} ₹${Math.abs(Math.round(v)).toLocaleString("en-IN")} cr of equity over 20 reporting days (NSDL)`,
    gap: "no NSDL reporting days for this period",
  },
];

/** Score every component on every trading day, using only that day's lookback window. */
const computed = DEFS.map((d) => {
  const raw = d.raw();
  const score: (number | null)[] = raw.map((v, i) => {
    if (v == null) return null;
    const win: number[] = [];
    for (let k = i - 1; k >= 0 && win.length < LOOKBACK; k--) { const x = raw[k]; if (x != null) win.push(x); }
    if (win.length < MIN) return null;
    const p = percentile(win, v);
    return d.dir === 1 ? p : 100 - p;
  });
  const first = score.findIndex((s) => s != null);
  return { def: d, raw, score, first: first >= 0 ? days[first] : null };
});

/** The day the brief describes: the last session before it was prepared. */
export const asOf = days.filter((d) => d <= B.sessionDate).at(-1)!;
const T = days.indexOf(asOf);

export interface Comp {
  id: string; name: string; metric: string; term: string; papers: PaperId[]; basis?: string; src: string[]; how: string; dir: 1 | -1;
  available: boolean; score: number; value: string; read: string; history: number; since: string | null; reason: string;
}
export const comps: Comp[] = computed.map(({ def, raw, score, first }) => {
  const s = score[T], v = raw[T];
  const n = raw.slice(Math.max(0, T - LOOKBACK), T).filter((x) => x != null).length;
  const available = s != null && v != null;
  const higher = available ? Math.round(def.dir === 1 ? s! : 100 - s!) : 0;
  return {
    id: def.id, name: def.name, metric: def.metric, term: def.term, papers: def.papers, basis: def.basis, src: def.src, how: def.how, dir: def.dir,
    available, score: available ? s! : NaN, value: available ? def.show(v!, T) : "n/a", history: n, since: first,
    read: available ? `Higher than on ${higher}% of the previous ${n.toLocaleString("en-IN")} trading days. ${bandOf(s!).name}.` : "",
    reason: available ? "" : def.gap ? `Not scored: ${def.gap}; it needs ${MIN} days of history.` : "Not scored: no reading for this day.",
  };
});
export const scored = comps.filter((c) => c.available);

/** Unrounded score for the needle; `score` is what the reader sees. */
export const scoreRaw = scored.reduce((a, c) => a + c.score, 0) / scored.length;
export const score = Math.round(scoreRaw);
export const band = bandOf(score).name;

/** Daily Mood Index for the chart: days with at least five scored components. */
export const moodSeries = days.map((d, i) => {
  const s = computed.map((c) => c.score[i]).filter((x): x is number => x != null);
  return s.length >= 5 ? { date: d, score: Math.round(s.reduce((a, b) => a + b, 0) / s.length * 10) / 10, n: s.length } : null;
}).filter((x): x is { date: string; score: number; n: number } => !!x && x.date <= asOf);

// Macro pressure: a separate, fundamental reading from the brief. 0 = low, 1 = elevated, 2 = high per indicator.
export const pressure = B.pressure.reduce((a, p) => a + p.lv, 0) / (B.pressure.length * 2);
export const pressureName = pressure >= 0.66 ? "High" : pressure >= 0.4 ? "Elevated" : "Low";
export const pressureHigh = B.pressure.filter((p) => p.lv === 2).length;
export const pressureTone = (lv: number): [string, Tone] => (lv === 2 ? ["High", "loss"] : lv === 1 ? ["Elevated", "mixed"] : ["Low", "gain"]);

export { QUADS };
export const quad = score >= 50 ? (pressure >= 0.5 ? QUADS.fragile : QUADS.supportive) : pressure >= 0.5 ? QUADS.stress : QUADS.calm;

export const vars: MoodVars = { score, band, press: pressureName.toLowerCase() };
export const fill = (t: string) => fillWith(t, vars);

export const MISSING: [string, string][] = [
  ["Valuation", "Nifty P/E against its own history. Not a sentiment input in CNN's index, but useful context; NSE publishes it daily (D1)."],
];
export const METHOD = { lookbackYears: 5, minDays: MIN };
