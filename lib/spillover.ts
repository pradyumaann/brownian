// Global spillover into India, server-side — Diebold & Yilmaz (2012).
// A VAR(2) on daily returns of Nifty 50, S&P 500, STOXX 600 and Nikkei 225 over the previous 200 sessions; the
// generalized forecast-error variance decomposition (10 sessions ahead) gives the share of Nifty's forecast variance
// that comes from shocks in the other three markets.
// Markets close at different times. For an Indian session, the US and European closes used are the previous day's
// (they happen after India closes); Tokyo's is the same day's (it closes before India).
import { history, indexSeries } from "./history";
import { invert } from "./stats";

const WINDOW = 200, LAGS = 2, HORIZON = 10;
export const SPILL_MARKETS = ["Nifty 50", "S&P 500", "STOXX 600", "Nikkei 225"];

const h = history(), days = h.tradingDays;
function before(id: string, strict: boolean) {
  const m = h.world.get(id) ?? new Map<string, number>(), ds = [...m.keys()].sort();
  let j = -1;
  return days.map((d) => { while (j + 1 < ds.length && (strict ? ds[j + 1] < d : ds[j + 1] <= d)) j++; return j >= 0 ? m.get(ds.at(j)!)! : null; });
}
const levels = [indexSeries("nifty50").values, before("sp500", true), before("stoxx600", true), before("nikkei225", false)];
const rets: (number[] | null)[] = days.map((_, i) => {
  if (!i) return null;
  const r = levels.map((s) => (s[i] != null && s[i - 1] != null && s[i - 1] !== s[i] ? Math.log(s[i]! / s[i - 1]!) * 100 : s[i] != null && s[i] === s[i - 1] ? 0 : NaN));
  return r.some(Number.isNaN) ? null : r;
});

const matmul = (a: number[][], b: number[][]) => a.map((r) => b[0].map((_, j) => r.reduce((s, v, k) => s + v * b[k][j], 0)));
const transpose = (a: number[][]) => a[0].map((_, j) => a.map((r) => r[j]));

/** Generalized FEVD (Pesaran–Shin), rows normalized to 1. Returns null when the window is short. */
function fevd(i: number): number[][] | null {
  const w: number[][] = [];
  for (let k = i; k >= 0 && w.length < WINDOW + LAGS; k--) if (rets[k]) w.push(rets[k]!);
  if (w.length < WINDOW + LAGS) return null;
  w.reverse();
  const N = 4, Y: number[][] = [], X: number[][] = [];
  for (let t = LAGS; t < w.length; t++) { Y.push(w[t]); X.push([1, ...w[t - 1], ...w[t - 2]]); }
  const XtX = matmul(transpose(X), X), B = matmul(invert(XtX), matmul(transpose(X), Y)); // (1+N·LAGS) × N
  const E = Y.map((y, t) => y.map((v, j) => v - X[t].reduce((s, x, k) => s + x * B[k][j], 0)));
  const S = matmul(transpose(E), E).map((r) => r.map((v) => v / (E.length - B.length)));
  const A1 = Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => B[1 + c][r]));
  const A2 = Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => B[1 + N + c][r]));
  // Moving-average coefficients: Φ0 = I, Φh = A1 Φh−1 + A2 Φh−2.
  const I: number[][] = Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => (r === c ? 1 : 0)));
  const Phi = [I];
  for (let s = 1; s < HORIZON; s++) {
    const p1 = Phi[s - 1], p2 = s >= 2 ? Phi[s - 2] : null;
    const a = matmul(A1, p1);
    Phi.push(p2 ? a.map((r, x) => r.map((v, y) => v + matmul(A2, p2)[x][y])) : a);
  }
  const theta = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let a = 0; a < N; a++) {
    let den = 0;
    for (const P of Phi) { const PS = matmul(P, S); den += matmul(PS, transpose(P))[a][a]; }
    for (let b = 0; b < N; b++) {
      let num = 0;
      for (const P of Phi) num += matmul(P, S)[a][b] ** 2;
      theta[a][b] = num / S[b][b] / den;
    }
    const rs = theta[a].reduce((s, v) => s + v, 0);
    theta[a] = theta[a].map((v) => v / rs);
  }
  return theta;
}

export interface SpillPoint { date: string; toIndia: number; total: number }
let cache: SpillPoint[] | null = null;
/** Share (%) of Nifty's 10-session forecast variance from overseas shocks, and the system-wide total, per session. */
export function spillSeries(): SpillPoint[] {
  if (cache) return cache;
  cache = [];
  for (let i = 0; i < days.length; i++) {
    if (!rets[i]) continue;
    const th = fevd(i);
    if (!th) continue;
    const off = th.reduce((s, r, a) => s + r.reduce((t, v, b) => t + (a === b ? 0 : v), 0), 0);
    cache.push({ date: days[i], toIndia: (1 - th[0][0]) * 100, total: (off / 4) * 100 });
  }
  return cache;
}
export const SPILL = { window: WINDOW, lags: LAGS, horizon: HORIZON };
