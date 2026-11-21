// Wander Index, server-side. Seven components, each scored as the percentile of today's reading among its own
// previous five years (at least 250 trading days), then averaged. Scores use only data up to each day, never later.
// 15 Nov 2026: the put/call volume ratio was dropped and both VIX readings are taken against their own
// 50-day average. FII long share of index futures (participant_oi.csv) was tested as a replacement and not added:
// its fit with the other components fell from 0.65 to 0.20 between halves, and its level has drifted to record lows.
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
const vix = indexSeries("indiavix").values, usvix = worldOnNseDays("usvix").values;
/** A reading against its own n-day average (today included), as CNN scores the VIX: removes slow drift in the level. */
const vsAvg = (a: Raw, n: number): Raw => a.map((x, i) => { const m = avg(a, i, n); return x != null && m ? x / m - 1 : null; });
const aboveBelow = (v: number) => `${Math.abs(v * 100).toFixed(1)}% ${v >= 0 ? "above" : "below"}`;
const pct1 = (v: number) =>`${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v * 100).toFixed(1)}%`;

const DEFS: Def[] = [
  {
    id: "vol", name: "Volatility", metric: "India VIX against its 50-day average", term: "vix", papers: ["whaley2000"], src: ["D1"], dir: -1,
    how: "100 − percentile of India VIX ÷ its 50-day average − 1, as CNN scores the VIX",
    raw: () => vsAvg(vix, 50),
    show: (v, t) => `India VIX ${vix[t]!.toFixed(2)}, ${aboveBelow(v)} its 50-day average`,
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
    id: "trend", name: "Trend vs average", metric: "Nifty 50 distance from its 200-day average", term: "trend", papers: ["bll1992", "mop2012"], src: ["D1"], dir: 1,
    how: "Percentile of Nifty 50 ÷ its 200-day average − 1", raw: () => days.map((_, i) => { const a = avg(nifty, i, 200), x = nifty[i]; return a && x ? x / a - 1 : null; }),
    show: (v) => `Nifty 50 ${Math.abs(v * 100).toFixed(1)}% ${v >= 0 ? "above" : "below"} its 200-day average`,
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
    id: "gvol", name: "Global risk appetite", metric: "US VIX against its 50-day average", term: "vix", papers: ["whaley2000"], src: ["D5"], dir: -1,
    how: "100 − percentile of the US VIX ÷ its 50-day average − 1, as CNN scores the VIX",
    raw: () => vsAvg(usvix, 50),
    show: (v, t) => `US VIX ${usvix[t]!.toFixed(2)}, ${aboveBelow(v)} its 50-day average`,
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
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** The session the history-based readings really describe, as "Thu 19 Nov". */
export const asOfLabel = (() => { const t = new Date(asOf + "T00:00:00Z"); return `${DOW[t.getUTCDay()]} ${t.getUTCDate()} ${MON[t.getUTCMonth()]}`; })();
/** Set when the brief describes a later session than the history store holds. */
export const behindNote = asOf < B.sessionDate ? `Readings as of ${asOfLabel}; ${B.session} is not in yet.` : null;

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

/** A day enters the chart once most components score: at least 60% of them (5 of 7 or 8). */
const MIN_COMPS = Math.ceil(DEFS.length * 0.6);
/** Daily Wander Index for the chart: days with at least MIN_COMPS scored components. */
export const moodSeries = days.map((d, i) => {
  const s = computed.map((c) => c.score[i]).filter((x): x is number => x != null);
  return s.length >= MIN_COMPS ?{ date: d, score: Math.round(s.reduce((a, b) => a + b, 0) / s.length * 10) / 10, n: s.length } : null;
}).filter((x): x is { date: string; score: number; n: number } => !!x && x.date <= asOf);

/** Nifty 50 closes on each day of a Wander Index series, for the overlay. */
export const niftyOn = (dates: string[]) => { const ix = new Map(days.map((d, i) => [d, i])); return dates.map((d) => nifty[ix.get(d) ?? -1] ?? null); };

const corr = (xs: number[], ys: number[]) => {
  const n = xs.length; if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let k = 0; k < n; k++) { const dx = xs[k] - mx, dy = ys[k] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
};

/** How the Wander Index has lined up with Nifty 50 over a series: the 20 sessions before each reading,
 *  and the 20 sessions after it (only readings whose next 20 sessions have closed by `asOf`). */
export function wanderVsNifty(series: { date: string; score: number }[], horizon = 20) {
  const ix = new Map(days.map((d, i) => [d, i]));
  const back: [number, number][] = [], fwd: [number, number][] = [];
  for (const p of series) {
    const i = ix.get(p.date)!;
    const b = ret(nifty, i, horizon); if (b != null) back.push([p.score, b]);
    if (i + horizon <= T) { const f = ret(nifty, i + horizon, horizon); if (f != null) fwd.push([p.score, f]); }
  }
  const avgWhere = (f: (s: number) => boolean) => { const r = fwd.filter(([s]) => f(s)).map(([, x]) => x); return { n: r.length, avg: r.length ? r.reduce((a, b) => a + b, 0) / r.length : null }; };
  return {
    horizon, nBack: back.length, nFwd: fwd.length,
    rBack: corr(back.map((x) => x[0]), back.map((x) => x[1])),
    rFwd: corr(fwd.map((x) => x[0]), fwd.map((x) => x[1])),
    greed: avgWhere((s) => s >= 75), fear: avgWhere((s) => s < 25), all: avgWhere(() => true),
  };
}

// Macro pressure: a separate, fundamental reading from the brief. 0 = low, 1 = elevated, 2 = high per indicator.
export const pressure = B.pressure.reduce((a, p) => a + p.lv, 0) / (B.pressure.length * 2);
export const pressureName = pressure >= 0.66 ? "High" : pressure >= 0.4 ? "Elevated" : "Low";
/** Macro pressure on the same 0–100 scale as the Wander Index (0 low, 100 high). */
export const pressureScore = Math.round(pressure * 100);
export const pressureHigh = B.pressure.filter((p) => p.lv === 2).length;
export const pressureTone = (lv: number): [string, Tone] => (lv === 2 ? ["High", "loss"] : lv === 1 ? ["Elevated", "mixed"] : ["Low", "gain"]);

export { QUADS };
export const quad = score >= 50 ? (pressure >= 0.5 ? QUADS.fragile : QUADS.supportive) : pressure >= 0.5 ? QUADS.stress : QUADS.calm;

export const vars: MoodVars = { score, band, press: pressureName.toLowerCase() };
export const fill = (t: string) => fillWith(t, vars);

export const METHOD = { lookbackYears: 5, minDays: MIN, minComps: MIN_COMPS };
