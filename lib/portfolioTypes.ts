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
}
export interface PortfolioFacts { asOf: string; types: TypeFact[] }

/** The year-long daily changes (lib/portfolioSeries.ts): sent to /portfolio only, never in PortfolioFacts. */
export interface PortfolioSeries extends ReturnSeries {
  asOf: string;
  /** Types that have a series but a missing day inside the window, so they are left out like silver and debt. */
  gaps: string[];
  /** Source tags of each type in `types` (its drivers' tags). */
  src: Record<string, string[]>;
}
