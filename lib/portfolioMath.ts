// Portfolio mix arithmetic. Pure and client-safe: no imports, so it runs in the browser and under `node --test`.
// A mix is a weight in percent for each holding type. Everything here is a fact computed from those weights and from
// each type's move (built at build time in lib/portfolioFacts.ts). Nothing here scores a mix as good or bad.

export const STEP = 5;

/** Type ids that carry a weight. "wallet" is a household-costs note, not a holding. */
export const HOLDING_IDS = ["index", "fin", "mid", "flexi", "elss", "it", "gold", "silver", "debt", "oil", "consumer", "realty"] as const;

/** Fund categories read through an index (Nifty 500): "proxy: Nifty 500, not the fund's own returns". */
export const PROXY_IDS: readonly string[] = ["flexi", "elss"];

/** Short names for bar labels and tight spaces. */
export const SHORT: Record<string, string> = {
  index: "Index funds", fin: "Financials", mid: "Mid & small cap", flexi: "Flexi-cap", elss: "ELSS", it: "IT & US",
  gold: "Gold", silver: "Silver", debt: "Debt & FDs", oil: "Oil & gas", consumer: "Auto & FMCG", realty: "Real estate",
};

export type FactorId = "large" | "broad" | "midsmall" | "itus" | "gold" | "rates" | "oil" | "realty";
export const FACTORS: { id: FactorId; name: string }[] = [
  { id: "large", name: "India large-cap and sector equity" },
  { id: "broad", name: "India broad market (Nifty 500)" },
  { id: "midsmall", name: "Mid and small cap" },
  { id: "itus", name: "IT and US" },
  { id: "gold", name: "Gold and silver" },
  { id: "rates", name: "Rates (debt)" },
  { id: "oil", name: "Oil and commodities" },
  { id: "realty", name: "Real estate" },
];
export const FACTOR_OF: Record<string, FactorId> = {
  index: "large", fin: "large", consumer: "large", flexi: "broad", elss: "broad", mid: "midsmall", it: "itus", gold: "gold", silver: "gold", debt: "rates", oil: "oil", realty: "realty",
};

/** What the page needs of each type for the blend. `d1` is the type's 1-day move in %, or null (n/a). */
export interface MoveFact { id: string; n: string; d1: number | null }

export type Weights = Record<string, number>;

// ---- The stored mix (`ii:port3`) -------------------------------------------------------------------------------------
// components/portfolio/usePort.ts reads and writes the record; the parsing lives here so it is tested without a browser.

/** example: nothing stored, the example mix is shown. migrated: built from the older `ii:held2` picks, not yet saved.
 *  saved: the viewer's own weights (`{ v: 1, w: { [holdingId]: percent } }`). none: the viewer owns nothing yet
 *  (`{ v: 1, w: {}, none: true }`): no example mix and no figures are shown, only what Portfolio Lens does. */
export type Mode = "example" | "migrated" | "saved" | "none";

/** The record stored for "I own nothing yet". */
export const NONE_RECORD = { v: 1, w: {}, none: true } as const;
/** The record stored for a saved mix. It never carries `none`, so saving any weight leaves none mode. */
export const savedRecord = (w: Weights) => ({ v: 1, w });

/** Weights from storage, keeping only known holding ids and whole 5% steps within 0-100. */
export function sanitise(raw: unknown): Weights {
  const out: Weights = {};
  if (raw && typeof raw === "object") {
    for (const id of HOLDING_IDS) {
      const n = Number((raw as Record<string, unknown>)[id]);
      if (Number.isFinite(n) && n > 0) out[id] = Math.min(100, Math.max(STEP, Math.round(n / STEP) * STEP));
    }
  }
  return out;
}

/** A stored `ii:port3` value read back: none mode (stray weights beside `none: true` are dropped), a saved mix, or null
 *  when the value is missing or not a version-1 record (the caller then falls back to `ii:held2`, then the example). */
export function readPort3(raw: unknown): { w: Weights; mode: "saved" | "none" } | null {
  if (!raw || typeof raw !== "object" || (raw as { v?: unknown }).v !== 1) return null;
  const r = raw as { w?: unknown; none?: unknown };
  return r.none === true ? { w: {}, mode: "none" } : { w: sanitise(r.w), mode: "saved" };
}

const clean = (w: Weights) => HOLDING_IDS.map((id) => [id, Math.max(0, Number(w[id]) || 0)] as const).filter(([, v]) => v > 0);

/** Weights after cleaning: total entered, the scale applied (1, or 100/total when over 100) and each type's share of the mix in %. */
export function normalise(w: Weights) {
  const rows = clean(w);
  const total = rows.reduce((s, [, v]) => s + v, 0);
  const over = total > 100;
  const scale = over ? 100 / total : 1;
  return {
    total, over, scale, unallocated: over ? 0 : Math.max(0, 100 - total),
    shares: Object.fromEntries(rows.map(([id, v]) => [id, v * scale])) as Record<string, number>,
  };
}

/** Equal weights for the picked types, in whole steps of 5% (rounded down; the remainder is shown as Unallocated). */
export function equalWeights(ids: string[]): Weights {
  const picked = HOLDING_IDS.filter((id) => ids.includes(id));
  if (!picked.length) return {};
  const each = Math.max(STEP, Math.floor(100 / picked.length / STEP) * STEP);
  return Object.fromEntries(picked.map((id) => [id, each]));
}

/** One weight moved by `dir` steps, kept within 0–100 and in steps of 5. */
export function stepWeight(w: Weights, id: string, dir: 1 | -1): Weights {
  const next = Math.min(100, Math.max(0, Math.round(((w[id] || 0) + dir * STEP) / STEP) * STEP));
  const out = { ...w };
  if (next > 0) out[id] = next; else delete out[id];
  return out;
}

export interface Blend {
  /** Share of the mix covered by types that have a move, in %. */
  covered: number;
  /** Blended 1-day move in % (sum of share × type move), or null when no type in the mix has a move. */
  move: number | null;
  rows: { id: string; n: string; share: number; move: number | null; contrib: number | null }[];
  /** Types in the mix with no move today (n/a), with the share each carries. */
  excluded: { id: string; n: string; share: number }[];
  total: number; over: boolean; unallocated: number;
}

/** Blended day move = Σ share × type move over the types that have a move. Types with n/a are left out and named. */
export function blend(w: Weights, facts: MoveFact[]): Blend {
  const nm = normalise(w);
  const byId = new Map(facts.map((f) => [f.id, f]));
  const rows = HOLDING_IDS.filter((id) => nm.shares[id] > 0).map((id) => {
    const f = byId.get(id), share = nm.shares[id], move = f?.d1 ?? null;
    return { id, n: f?.n ?? id, share, move, contrib: move == null ? null : (share / 100) * move };
  });
  const live = rows.filter((r) => r.contrib != null);
  return {
    covered: live.reduce((s, r) => s + r.share, 0),
    move: live.length ? live.reduce((s, r) => s + r.contrib!, 0) : null,
    rows, excluded: rows.filter((r) => r.move == null).map((r) => ({ id: r.id, n: r.n, share: r.share })),
    total: nm.total, over: nm.over, unallocated: nm.unallocated,
  };
}

/** The mix by factor: the share in each, in %, largest first. Only factors with a share are returned. */
export function exposure(w: Weights) {
  const nm = normalise(w);
  return FACTORS.map((f) => ({
    id: f.id, name: f.name,
    share: Object.entries(nm.shares).filter(([id]) => FACTOR_OF[id] === f.id).reduce((s, [, v]) => s + v, 0),
  })).filter((f) => f.share > 0).sort((a, b) => b.share - a.share);
}

/** Share-weighted average of the types' percentiles (0-100), over the types in the mix that have one. Not the mix's own rank. */
export function weightedRank(w: Weights, ranks: { id: string; pctl: number | null }[]): { value: number; covered: number } | null {
  const nm = normalise(w);
  const live = ranks.filter((r) => r.pctl != null && nm.shares[r.id] > 0);
  const covered = live.reduce((s, r) => s + nm.shares[r.id], 0);
  return covered > 0 ? { value: live.reduce((s, r) => s + nm.shares[r.id] * r.pctl!, 0) / covered, covered } : null;
}

const MINUS = "−";
/** A signed percent with a true minus and en-IN grouping: +1.20%, −0.74%. */
export const fmtPct = (v: number, dp = 2) => (v > 0 ? "+" : v < 0 ? MINUS : "") + Math.abs(v).toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp }) + "%";
/** A signed change in basis points: +6 bp, −3 bp. */
export const fmtBp = (v: number) => (v > 0 ? "+" : v < 0 ? MINUS : "") + Math.abs(Math.round(v)).toLocaleString("en-IN") + " bp";

export interface Concentration {
  count: number;
  /** Largest and second-largest type, as a share of what is allocated, in %. */
  largest: { id: string; share: number } | null;
  topTwo: number | null;
  /** Herfindahl index of the allocated shares: Σ share², 0–1. 1 = everything in one type. */
  hhi: number | null;
  /** 1 ÷ HHI: the number of equal-sized types that would give the same HHI. */
  equivalent: number | null;
  words: string;
}

/** Concentration as facts, over the allocated part of the mix (shares sum to 100 across the types with a weight). */
export function concentration(w: Weights): Concentration {
  const nm = normalise(w);
  const items = Object.entries(nm.shares).map(([id, v]) => ({ id, s: v / nm.total })).sort((a, b) => b.s - a.s || a.id.localeCompare(b.id));
  if (!items.length) return { count: 0, largest: null, topTwo: null, hhi: null, equivalent: null, words: "No weights set." };
  const hhi = items.reduce((s, x) => s + x.s * x.s, 0), eq = 1 / hhi;
  const eqTxt = Math.abs(eq - Math.round(eq)) < 0.05 ? String(Math.round(eq)) : eq.toFixed(1);
  const words = items.length === 1
    ? "All of the allocated weight sits in one type (Herfindahl 1.00)."
    : `Herfindahl ${hhi.toFixed(2)}: the same spread as ${eqTxt} equal-sized type${eqTxt === "1" ? "" : "s"} (from ${(1 / HOLDING_IDS.length).toFixed(2)} when all ${HOLDING_IDS.length} types are equal to 1.00 when everything is in one type).`;
  return {
    count: items.length, largest: { id: items[0].id, share: items[0].s * 100 },
    topTwo: items.length > 1 ? (items[0].s + items[1].s) * 100 : 100, hhi, equivalent: eq, words,
  };
}

// ---- Your mix over the year (blend history) -------------------------------------------------------------------------
// The server (lib/portfolioSeries.ts) sends each type's daily % change for the last SESSIONS sessions; everything below
// is arithmetic on those and the viewer's weights. A day on which any covered type has no change gives no blended change
// and the line stops there: nothing is filled in, and nothing is compounded across a gap.

/** Sessions in the window: SESSIONS closes, so SESSIONS − 1 daily changes (the first session is the base, rebased to 100). */
export const SESSIONS = 250;
/** Trading days per year, used to annualise a daily standard deviation. */
export const ANNUAL = 250;

/** Daily % changes aligned to `dates`; index 0 is the base session and carries no change (null). A type is absent when it
 *  has no series (silver, debt) or has a missing day inside the window. */
export interface ReturnSeries { dates: string[]; types: Record<string, (number | null)[]>; nifty: (number | null)[] }

export interface BlendHistory {
  /** Types in the mix that have a series, with their share of the whole mix in %. */
  used: { id: string; share: number }[];
  /** Types in the mix with no series, with their share of the whole mix in %. */
  left: { id: string; share: number }[];
  /** Share of the whole mix covered by `used`, in %. */
  covered: number;
  /** Daily % change of the covered part, each type re-weighted to 100% among the covered types. */
  returns: (number | null)[];
  /** The same, compounded and rebased to 100 on the first session. */
  levels: (number | null)[];
}

/** Daily % changes compounded and rebased to 100 on the first session. A missing change stops the line: later days are null. */
export function levelsOf(returns: (number | null)[]): (number | null)[] {
  const out: (number | null)[] = [];
  returns.forEach((r, i) => {
    if (i === 0) { out.push(100); return; }
    const prev = out[i - 1];
    out.push(prev == null || r == null ? null : prev * (1 + r / 100));
  });
  return out;
}

/** The mix's daily change = Σ (share ÷ covered share) × the type's daily change, weights held constant each day. Types with
 *  no series are left out and named. Null when no weighted type has a series. */
export function blendSeries(w: Weights, types: Record<string, (number | null)[]>): BlendHistory | null {
  const nm = normalise(w);
  const weighted = HOLDING_IDS.filter((id) => nm.shares[id] > 0).map((id) => ({ id, share: nm.shares[id] }));
  const used = weighted.filter((r) => types[r.id]), left = weighted.filter((r) => !types[r.id]);
  const covered = used.reduce((s, r) => s + r.share, 0);
  if (!used.length) return null;
  const n = types[used[0].id].length;
  const returns = Array.from({ length: n }, (_, i) => {
    if (i === 0) return null;
    let sum = 0;
    for (const r of used) { const v = types[r.id][i]; if (v == null) return null; sum += (r.share / covered) * v; }
    return sum;
  });
  return { used, left, covered, returns, levels: levelsOf(returns) };
}

/** Change from the first to the last level, in %. Null when either end is missing. */
export function changeOver(levels: (number | null)[]): number | null {
  const a = levels[0], b = levels.at(-1);
  return a == null || b == null ? null : (b / a - 1) * 100;
}

/** Annualised volatility in %: the sample standard deviation (n − 1) of the daily % changes times √250. Null under 20 changes. */
export function volatility(returns: (number | null)[]): number | null {
  const v = returns.filter((x): x is number => x != null);
  if (v.length < 20) return null;
  const mean = v.reduce((s, x) => s + x, 0) / v.length;
  const variance = v.reduce((s, x) => s + (x - mean) ** 2, 0) / (v.length - 1);
  return Math.sqrt(variance) * Math.sqrt(ANNUAL);
}

export interface Drawdown { value: number; peak: string | null; trough: string | null }
/** Largest fall from a running peak, in % (0 or negative), with the dates of that peak and its lowest point. The scan stops
 *  at the first missing level. A series that never falls gives 0 with no dates. */
export function maxDrawdown(levels: (number | null)[], dates: string[]): Drawdown | null {
  if (levels[0] == null) return null;
  let peak = levels[0]!, peakI = 0, best = 0, bp = -1, bt = -1;
  for (let i = 0; i < levels.length; i++) {
    const v = levels[i];
    if (v == null) break;
    if (v > peak) { peak = v; peakI = i; }
    const dd = (v / peak - 1) * 100;
    if (dd < best) { best = dd; bp = peakI; bt = i; }
  }
  return { value: best, peak: bp < 0 ? null : dates[bp], trough: bt < 0 ? null : dates[bt] };
}

/** The lowest single-day change in %, with its date. Null when there is no change. */
export function worstDay(returns: (number | null)[], dates: string[]): { value: number; date: string } | null {
  let best: { value: number; date: string } | null = null;
  for (let i = 0; i < returns.length; i++) {
    const r = returns[i];
    if (r != null && (best == null || r < best.value)) best = { value: r, date: dates[i] };
  }
  return best;
}

// ---- Co-movement facts (Exposure section) -----------------------------------------------------------------------------
// Computed on the daily % changes already sent for "Your mix over the year", over the days on which both series have a
// change. A day where either is missing is skipped; nothing is filled in. Facts about the window, not a forecast.

/** Fewest paired daily changes for a correlation or beta to be shown (about a quarter of a 250-session window). */
export const MIN_PAIRS = 60;

function paired(a: (number | null)[], b: (number | null)[]): [number[], number[]] {
  const x: number[] = [], y: number[] = [];
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { const p = a[i], q = b[i]; if (p != null && q != null && Number.isFinite(p) && Number.isFinite(q)) { x.push(p); y.push(q); } }
  return [x, y];
}
const stats = (x: number[], y: number[]) => {
  const n = x.length, mx = x.reduce((s, v) => s + v, 0) / n, my = y.reduce((s, v) => s + v, 0) / n;
  let sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; sxy += (x[i] - mx) * (y[i] - my); }
  return { n, sxx, syy, sxy };
};

/** Pearson correlation (−1 to 1) of two daily-change series over the days both have a change, with the number of days used.
 *  Null when fewer than `minPairs` days are paired or either series does not vary (zero variance). */
export function correlation(a: (number | null)[], b: (number | null)[], minPairs = MIN_PAIRS): { r: number; n: number } | null {
  const [x, y] = paired(a, b);
  if (x.length < Math.max(2, minPairs)) return null;
  const s = stats(x, y);
  if (!(s.sxx > 1e-12) || !(s.syy > 1e-12)) return null;
  return { r: Math.max(-1, Math.min(1, s.sxy / Math.sqrt(s.sxx * s.syy))), n: s.n };
}

/** Beta of `a` to `b`: covariance(a, b) ÷ variance(b), over the days both have a change. Null under `minPairs` days or when `b` does not vary. */
export function beta(a: (number | null)[], b: (number | null)[], minPairs = MIN_PAIRS): { b: number; n: number } | null {
  const [x, y] = paired(a, b);
  if (x.length < Math.max(2, minPairs)) return null;
  const s = stats(y, x);
  if (!(s.sxx > 1e-12)) return null;
  return { b: s.sxy / s.sxx, n: s.n };
}

export interface PairFact { a: string; b: string; r: number; n: number }
/** Correlation of every pair of the weighted types that have a series. `types` counts those; pairs with too little data are left out. */
export function pairwise(w: Weights, types: Record<string, (number | null)[]>): { types: number; pairs: PairFact[] } {
  const nm = normalise(w);
  const ids = HOLDING_IDS.filter((id) => nm.shares[id] > 0 && types[id]);
  const pairs: PairFact[] = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const c = correlation(types[ids[i]], types[ids[j]]);
    if (c) pairs.push({ a: ids[i], b: ids[j], r: c.r, n: c.n });
  }
  return { types: ids.length, pairs };
}

/** The most and least correlated pair (null when there is none; with one pair, `high` and `low` are the same pair). */
export function extremePairs(pairs: PairFact[]): { high: PairFact; low: PairFact } | null {
  if (!pairs.length) return null;
  const s = [...pairs].sort((p, q) => q.r - p.r || (p.a + p.b).localeCompare(q.a + q.b));
  return { high: s[0], low: s[s.length - 1] };
}

/** A correlation printed with a true minus and two decimals: 0.87, −0.12. */
export const fmtR = (r: number) => (r < 0 ? MINUS : "") + Math.abs(r).toFixed(2);
