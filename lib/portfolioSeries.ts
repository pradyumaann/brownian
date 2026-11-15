// Server-only (build time): the daily changes behind "Your mix over the year". For each holding type that has a series, the
// daily % change for the SESSIONS NSE sessions ending on `asOf` (the last session on or before the brief's session date,
// not the last stored day), built from the same driver definitions as the day's move (DEFS in lib/portfolioFacts.ts).
// A type is left out, never part-filled, when it has no series (silver, debt) or when any of its changes inside the window
// is missing. Never import from a client component. The page passes this to /portfolio only (about 14 KB).
import { DEFS, T, chg, days, level, mover } from "./portfolioFacts";
import { HOLDING_IDS, SESSIONS } from "./portfolioMath";
import type { PortfolioSeries } from "./portfolioTypes";

const r3 = (v: number | null) => (v == null ? null : Math.round(v * 1000) / 1000);

let cached: PortfolioSeries | null = null;
/** Daily % changes per type and for Nifty 50, aligned to the window's dates. Index 0 is the base session (null). */
export function portfolioSeries(): PortfolioSeries {
  if (cached) return cached;
  const from = T - (SESSIONS - 1);
  const dates = days.slice(from, T + 1);
  const types: PortfolioSeries["types"] = {};
  const gaps: string[] = [];
  const src: PortfolioSeries["src"] = {};
  for (const id of HOLDING_IDS) {
    const d = DEFS.find((x) => x.id === id)!;
    if (d.how === "none") continue;
    const m = mover(d);
    if (m.missing.length) continue;
    const ret = dates.map((_, k) => (k === 0 ? null : r3(m.move(from + k, 1))));
    if (ret.slice(1).some((v) => v == null)) { gaps.push(id); continue; }
    types[id] = ret;
    src[id] = [...new Set(d.drivers.flatMap((s) => s.src))].sort();
  }
  const nl = level(DEFS.find((x) => x.id === "index")!.drivers[0]);
  const nifty = dates.map((_, k) => (k === 0 ? null : r3(chg(nl, from + k, 1, false))));
  cached = { asOf: days[T], dates, types, nifty: nifty.slice(1).some((v) => v == null) ? nifty.map(() => null) : nifty, gaps, src };
  return cached;
}
