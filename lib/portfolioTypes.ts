// Shapes passed from the build step (lib/portfolioFacts.ts) to the page. Compact and serialisable; types only.
import type { FactorId, MoveFact, ReturnSeries } from "./portfolioMath";

/** One driver of a type: a real series from the history store. `unit` "bp" is a yield change in basis points. */
export interface DriverFact {
  id: string; label: string; src: string[]; unit: "pct" | "bp";
  d1: number | null; m1: number | null;
  /** Today's one-day change against the driver's own previous sessions, 0-100 (share at or below). */
  pctl: number | null;
}
export interface TypeFact extends MoveFact {
  short: string; factor: FactorId;
  drivers: DriverFact[];
  /** 21-session change of the type, in %. */
  m1: number | null;
  /** Today's type move against its own previous sessions (up to 1,250, at least 250), 0-100. */
  pctl: number | null;
  /** Sessions behind the percentile. */
  pctlN: number;
  /** How the type's move is built, in words. */
  formula: string;
  /** Source tags of the type's move (its drivers' tags). */
  src: string[];
  /** Why the type has no move, or what is left out of it. */
  note: string | null;
  /** Set when the type's move is an approximation built from other series. */
  derived: string | null;
  /** Set when the type's move is an index standing in for a fund category ("proxy: Nifty 500, not the fund's own returns"). */
  proxy: string | null;
}
export interface PortfolioFacts { asOf: string; types: TypeFact[] }

/** What the front page's Blended session move card needs of each type: the move, its tags and its proxy label. */
export type SessionTypeFact = Pick<TypeFact, "id" | "n" | "d1" | "src" | "proxy">;
/** Two market readings for the same session as the facts (lib/sessionConditions.ts, server-only), read as /wander reads them.
 *  `turb`: band and percentile of the 20-session average turbulence. `spill`: the share (%) of Nifty's forecast variance
 *  from overseas on that session, and its average over the same window /wander charts (`n` sessions). null is n/a. */
export interface SessionConditions {
  turb: { band: string; pct: number } | null;
  spill: { now: number; avg: number; n: number } | null;
}

/** The year-long daily changes (lib/portfolioSeries.ts): sent to /portfolio only, never in PortfolioFacts. */
export interface PortfolioSeries extends ReturnSeries {
  asOf: string;
  /** Types that have a series but a missing day inside the window, so they are left out like silver and debt. */
  gaps: string[];
  /** Source tags of each type in `types` (its drivers' tags). */
  src: Record<string, string[]>;
}
