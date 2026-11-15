// Risk-structure indexes, server-side, from daily returns of 15 NSE sectoral indices. Each day uses only past data.
//
// Turbulence — Kritzman & Li (2010): the squared Mahalanobis distance of the day's sector returns from their mean,
//   d_t = (r_t − μ)ᵀ Σ⁻¹ (r_t − μ), with μ and Σ from the previous 750 sessions (about three years).
// Fragility — Kritzman, Li, Page & Rigobon (2011): the absorption ratio, the share of total variance explained by the
//   largest one-fifth of eigenvectors (3 of 15), from a 500-session window weighted with a 250-session half-life.
import { history, indexSeries } from "./history";
import { SECTOR_IDS } from "./sectors";
import { covariance, eigenvalues, invert, mahalanobis2, percentile } from "./stats";

const TURB_WINDOW = 750, AR_WINDOW = 500, AR_HALFLIFE = 250, AR_FACTORS = 3;

const days = history().tradingDays;
const levels = SECTOR_IDS.map((id) => indexSeries(id).values);
/** Daily sector returns; a day with any sector missing is dropped from the windows rather than filled in. */
const rets: (number[] | null)[] = days.map((_, i) => {
  if (i === 0) return null;
  const r = levels.map((s) => (s[i] != null && s[i - 1] != null ? s[i]! / s[i - 1]! - 1 : NaN));
  return r.some(Number.isNaN) ? null : r;
});

function windowRows(i: number, n: number): number[][] {
  const out: number[][] = [];
  for (let k = i - 1; k >= 0 && out.length < n; k--) if (rets[k]) out.push(rets[k]!);
  return out.reverse();
}

/** Turbulence on every day with a full window: the raw distance and its percentile among the previous three years of readings. */
const turbRaw: (number | null)[] = days.map((_, i) => {
  const r = rets[i];
  if (!r) return null;
  const w = windowRows(i, TURB_WINDOW);
  if (w.length < TURB_WINDOW) return null;
  const { mu, cov } = covariance(w);
  return mahalanobis2(r, mu, invert(cov));
});

/** Absorption ratio from an exponentially weighted covariance (weights halve every 250 sessions back). */
const arRaw: (number | null)[] = days.map((_, i) => {
  if (!rets[i]) return null;
  const w = windowRows(i + 1, AR_WINDOW);
  if (w.length < AR_WINDOW) return null;
  const k = w[0].length, wt = w.map((_, j) => Math.pow(0.5, (w.length - 1 - j) / AR_HALFLIFE)), W = wt.reduce((a, b) => a + b, 0);
  const mu = Array.from({ length: k }, (_, a) => w.reduce((s, r, j) => s + wt[j] * r[a], 0) / W);
  const cov = Array.from({ length: k }, () => new Array(k).fill(0));
  w.forEach((r, j) => { for (let a = 0; a < k; a++) for (let b = a; b < k; b++) cov[a][b] += (wt[j] * (r[a] - mu[a]) * (r[b] - mu[b])) / W; });
  for (let a = 0; a < k; a++) for (let b = 0; b < a; b++) cov[a][b] = cov[b][a];
  const ev = eigenvalues(cov), total = ev.reduce((s, v) => s + v, 0);
  return ev.slice(0, AR_FACTORS).reduce((s, v) => s + v, 0) / total;
});

function pctSeries(raw: (number | null)[], lookback: number, min: number) {
  return raw.map((v, i) => {
    if (v == null) return null;
    const win: number[] = [];
    for (let k = i - 1; k >= 0 && win.length < lookback; k--) if (raw[k] != null) win.push(raw[k]!);
    return win.length >= min ? percentile(win, v) : null;
  });
}
const turbPct = pctSeries(turbRaw, TURB_WINDOW, 250);
const arPct = pctSeries(arRaw, TURB_WINDOW, 250);

export interface RiskPoint { date: string; turbulence: number | null; turbPct: number | null; absorption: number | null; arPct: number | null }
export function riskSeries(upTo: string): RiskPoint[] {
  return days.map((d, i) => ({ date: d, turbulence: turbRaw[i], turbPct: turbPct[i], absorption: arRaw[i], arPct: arPct[i] }))
    .filter((p) => p.date <= upTo && (p.turbPct != null || p.arPct != null));
}

/** Turbulence is persistent, so the page also shows its 20-session average percentile. */
export function riskOn(date: string) {
  const i = days.indexOf(date);
  const tp = turbPct.slice(Math.max(0, i - 19), i + 1).filter((x): x is number => x != null);
  // Kritzman et al. watch shifts in the ratio: the 15-session average against the one-year average, in one-year standard deviations.
  const ar = arRaw.slice(Math.max(0, i - 249), i + 1).filter((x): x is number => x != null);
  const ar15 = ar.slice(-15), m = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  const sd = Math.sqrt(m(ar.map((v) => (v - m(ar)) ** 2)));
  return {
    date, sectors: SECTOR_IDS.length,
    turbulence: turbRaw[i], turbPct: turbPct[i], turbPct20: tp.length === 20 ? m(tp) : null,
    absorption: arRaw[i], arPct: arPct[i], arShift: ar.length >= 250 && sd > 0 ? (m(ar15) - m(ar)) / sd : null,
    windows: { turbulence: TURB_WINDOW, absorption: AR_WINDOW, halfLife: AR_HALFLIFE, factors: AR_FACTORS },
  };
}
