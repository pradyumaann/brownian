// Server-only (build time): the exposure map for Portfolio Lens. Each holding type maps to the real series in the
// history store that drive it; for the session date it computes the 1-day and 21-session change and the day's percentile
// against the type's own previous sessions (up to 1,250, at least 250, no look-ahead, as in lib/mood.ts).
// A series the store does not hold is n/a; nothing is substituted or estimated. Never import from a client component.
import { B } from "@/data";
import { history, indexSeries, worldOnNseDays } from "./history";
import { FACTOR_OF, SHORT, HOLDING_IDS } from "./portfolioMath";
import type { DriverFact, PortfolioFacts, TypeFact } from "./portfolioTypes";
import { percentile } from "./stats";

const LOOKBACK = 1250, MIN = 250, MONTH = 21;
type Raw = (number | null)[];

interface Src { id: string; label: string; src: string[]; kind: "index" | "world"; unit?: "pct" | "bp" }
const IDX = (id: string, label: string): Src => ({ id, label, src: ["D1"], kind: "index" });
const WLD = (id: string, label: string, unit: "pct" | "bp" = "pct"): Src => ({ id, label, src: ["D5"], kind: "world", unit });

const NIFTY50 = IDX("nifty50", "Nifty 50"), USDINR = WLD("usdinr", "USD/INR"), GOLD = WLD("gold", "COMEX gold (USD)");

interface Def {
  id: string; n: string; drivers: Src[];
  /** "mean": equal-weighted average of the drivers' changes. "gold": (1 + gold) x (1 + USD/INR) - 1. "none": no type move. */
  how: "mean" | "gold" | "none";
  formula: string; note?: string; derived?: string;
}

const DEFS: Def[] = [
  { id: "index", n: "Nifty index funds & large-cap SIPs", drivers: [NIFTY50], how: "mean", formula: "Nifty 50 one-day change." },
  { id: "fin", n: "Bank, NBFC & insurance stocks", how: "mean", formula: "Equal-weighted average of the one-day changes of Nifty Bank, Financial Services, Private Bank and PSU Bank.",
    drivers: [IDX("bank", "Nifty Bank"), IDX("finserv", "Nifty Financial Services"), IDX("pvtbank", "Nifty Private Bank"), IDX("psubank", "Nifty PSU Bank")],
    note: "No insurance-only series is held; insurers are covered only as far as they sit inside Financial Services." },
  { id: "mid", n: "Mid & small-cap funds", how: "mean", formula: "Equal-weighted average of the one-day changes of Nifty Midcap 100 and Nifty Smallcap 100.",
    drivers: [IDX("midcap100", "Nifty Midcap 100"), IDX("smallcap100", "Nifty Smallcap 100")] },
  { id: "it", n: "IT stocks & US/Nasdaq funds", how: "mean", formula: "Equal-weighted average of the one-day changes of Nifty IT, Nasdaq Composite and USD/INR (a weaker rupee counts as a rise in rupee terms).",
    drivers: [IDX("it", "Nifty IT"), WLD("nasdaq", "Nasdaq Composite"), USDINR] },
  { id: "gold", n: "Gold ETFs, SGBs & jewellery", how: "gold", drivers: [GOLD, USDINR],
    formula: "(1 + COMEX gold change in USD) × (1 + USD/INR change) − 1.", derived: "derived; excludes duties and premiums",
    note: "An approximate rupee move from COMEX gold and USD/INR. Indian prices also carry import duty, GST and local premiums, which are not in the store." },
  { id: "silver", n: "Silver ETFs", how: "none", drivers: [], formula: "No move: the history store holds no silver series.",
    note: "No free silver or MCX series is in the store, so silver is n/a. It is not read from gold." },
  { id: "debt", n: "Debt funds & FDs", how: "none", drivers: [IDX("gsec10", "Nifty 10-yr G-Sec index"), WLD("us10y", "US 10-year yield", "bp")],
    formula: "No blended move: shown as the change in the Nifty 10-yr G-Sec index (%) and in the US 10-year yield (basis points).",
    note: "Not in the blended move. A debt fund's price change depends on its duration, which is not known here, so no price move is estimated. FD rates are fixed and have no series." },
  { id: "oil", n: "Oil & gas stocks", how: "mean", formula: "Equal-weighted average of the one-day changes of Nifty Oil & Gas, Nifty Energy and Brent crude.",
    drivers: [IDX("oilgas", "Nifty Oil & Gas"), IDX("energy", "Nifty Energy"), WLD("brent", "Brent crude (USD)")] },
  { id: "consumer", n: "Auto & FMCG stocks", how: "mean", formula: "Equal-weighted average of the one-day changes of Nifty Auto and Nifty FMCG.",
    drivers: [IDX("auto", "Nifty Auto"), IDX("fmcg", "Nifty FMCG")] },
  { id: "realty", n: "Real estate stocks & REITs", how: "mean", formula: "Nifty Realty one-day change.", drivers: [IDX("realty", "Nifty Realty")],
    note: "REITs are not in the index; Nifty Realty covers listed developers." },
];

const h = history();
const days = h.tradingDays;
/** The last NSE session on or before the brief's session date. */
const T = days.map((d, i) => [d, i] as const).filter(([d]) => d <= B.sessionDate).at(-1)![1];

const level = (s: Src): Raw => (s.kind === "index" ? indexSeries(s.id).values : worldOnNseDays(s.id).values);
const have = (a: Raw) => a.some((v) => v != null);
/** Change over n sessions in % (basis points for a yield level), null if either end is missing. */
const chg = (a: Raw, i: number, n: number, bp: boolean) => {
  const x = a[i], y = i - n >= 0 ? a[i - n] : null;
  if (x == null || y == null) return null;
  return bp ? (x - y) * 100 : (x / y - 1) * 100;
};
/** Percentile of day i's value among the previous (up to LOOKBACK) non-null values of `ser`; null under MIN sessions. */
function rank(ser: Raw, i: number): { p: number | null; n: number } {
  const v = ser[i], win: number[] = [];
  for (let k = i - 1; k >= 0 && win.length < LOOKBACK; k--) { const x = ser[k]; if (x != null) win.push(x); }
  return v == null || win.length < MIN ? { p: null, n: win.length } : { p: percentile(win, v), n: win.length };
}
const r2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);
const r1 = (v: number | null) => (v == null ? null : Math.round(v * 10) / 10);

function build(d: Def): TypeFact {
  const lv = new Map(d.drivers.map((s) => [s.id, level(s)]));
  const missing = d.drivers.filter((s) => !have(lv.get(s.id)!));
  const drivers: DriverFact[] = d.drivers.map((s) => {
    const a = lv.get(s.id)!, bp = s.unit === "bp";
    const daily: Raw = days.map((_, i) => chg(a, i, 1, bp));
    return { id: s.id, label: s.label, src: s.src, unit: s.unit ?? "pct", d1: r2(daily[T]), m1: r2(chg(a, T, MONTH, bp)), pctl: r1(rank(daily, T).p) };
  });
  // The type's move over n sessions ending on day i. Needs every driver: a missing driver means no move, never a part-average.
  const move = (i: number, n: number): number | null => {
    if (d.how === "none" || missing.length) return null;
    const vals = d.drivers.map((s) => chg(lv.get(s.id)!, i, n, false));
    if (vals.some((v) => v == null)) return null;
    if (d.how === "gold") return ((1 + vals[0]! / 100) * (1 + vals[1]! / 100) - 1) * 100;
    return vals.reduce((s, v) => s + v!, 0) / vals.length;
  };
  const daily: Raw = d.how === "none" || missing.length ? [] : days.map((_, i) => move(i, 1));
  const r = daily.length ? rank(daily, T) : { p: null, n: 0 };
  return {
    id: d.id, n: d.n, short: SHORT[d.id], factor: FACTOR_OF[d.id], drivers,
    d1: r2(move(T, 1)), m1: r2(move(T, MONTH)), pctl: r1(r.p), pctlN: r.n,
    formula: missing.length ? `n/a: the history store has no series for ${missing.map((s) => s.label).join(", ")}.` : d.formula,
    src: [...new Set(d.drivers.flatMap((s) => s.src))].sort(), note: d.note ?? null, derived: d.derived ?? null,
  };
}

let cached: PortfolioFacts | null = null;
/** The exposure map and the session's moves, ready to pass to the page (a few KB). */
export function portfolioFacts(): PortfolioFacts {
  if (!cached) cached = { asOf: days[T], types: HOLDING_IDS.map((id) => build(DEFS.find((d) => d.id === id)!)) };
  return cached;
}
