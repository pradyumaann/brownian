// Market conditions for the front page's Blended session move card. Server-only (lib/risk.ts and lib/spillover.ts read
// the history store): never import from a client component. The readings are the ones /wander section 04 shows, as of
// the same session as the portfolio facts.
import { turbBand } from "./bands";
import { riskOn } from "./risk";
import { spillSeries } from "./spillover";
import type { SessionConditions } from "./portfolioTypes";

export function sessionConditions(asOf: string): SessionConditions {
  const risk = riskOn(asOf);
  // Same window as /wander: the last 500 readings on or before asOf; the latest counts only if it is asOf itself.
  const spill = spillSeries().filter((p) => p.date <= asOf).slice(-500), now = spill.at(-1)?.date === asOf ? spill.at(-1)! : null;
  const avg = spill.reduce((a, p) => a + p.toIndia, 0) / Math.max(1, spill.length);
  return {
    turb: risk.turbAvgPct == null ? null : { band: turbBand(risk.turbAvgPct), pct: risk.turbAvgPct },
    spill: now ? { now: now.toIndia, avg, n: spill.length } : null,
  };
}
