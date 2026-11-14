// Foreign-flow context and liquidity stress, server-side.
//
// Flow persistence — Froot, O'Connell & Seasholes (2001) found international portfolio flows are persistent (today's
//   flow predicts tomorrow's) and follow past returns. Here: the lag-1 autocorrelation of daily FPI net equity flows,
//   and their correlation with the previous 20 sessions' Nifty 50 return, each over the last 250 reporting days.
// Liquidity stress — Amihud (2002): |return| per rupee traded. The store keeps each day's median across NSE stocks
//   trading at least ₹1 crore; the index is its 20-session average, ranked against the previous three years.
import { history, indexSeries } from "./history";
import { percentile } from "./stats";

const h = history(), days = h.tradingDays;
const corr = (a: number[], b: number[]) => {
  const n = a.length, ma = a.reduce((s, v) => s + v, 0) / n, mb = b.reduce((s, v) => s + v, 0) / n;
  let c = 0, va = 0, vb = 0;
  for (let i = 0; i < n; i++) { c += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; }
  return c / Math.sqrt(va * vb);
};

/** Daily FPI flows (NSDL reporting days) up to a date, with cumulative sums for the flow lines. */
export function fpiDaily(upTo: string) {
  let eq = 0, debt = 0;
  return [...h.fpi.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).filter(([d]) => d <= upTo)
    .map(([date, f]) => ({ date, equity: f.equity, debt: f.total - f.equity, indexFut: f.indexFut, cumEquity: (eq += f.equity), cumDebt: (debt += f.total - f.equity) }));
}

export function flowContext(upTo: string) {
  const rows = fpiDaily(upTo), last = rows.slice(-251);
  const x = last.map((r) => r.equity);
  const persistence = x.length >= 251 ? corr(x.slice(0, -1), x.slice(1)) : null;
  // Feedback: does buying follow a rising market? Flow on each reporting day against Nifty's previous 20 sessions.
  const nifty = indexSeries("nifty50").values;
  const pairs = last.slice(-250).map((r) => {
    const i = days.findLastIndex((d) => d < r.date);
    return i >= 20 && nifty[i] && nifty[i - 20] ? [r.equity, nifty[i]! / nifty[i - 20]! - 1] : null;
  }).filter((p): p is number[] => !!p);
  const feedback = pairs.length >= 200 ? corr(pairs.map((p) => p[0]), pairs.map((p) => p[1])) : null;
  // 20-day sum against the previous three years of 20-day sums.
  const sums: (number | null)[] = rows.map((_, i) => (i >= 19 ? rows.slice(i - 19, i + 1).reduce((s, r) => s + r.equity, 0) : null));
  const cur = sums.at(-1) ?? null, hist = sums.slice(-751, -1).filter((v): v is number => v != null);
  let streak = 0;
  for (let i = rows.length - 1; i >= 0 && Math.sign(rows[i].equity) === Math.sign(rows.at(-1)!.equity); i--) streak++;
  return {
    since: rows[0]?.date, days: rows.length, last: rows.at(-1), sum20: cur, sum20Pct: cur != null && hist.length >= 250 ? percentile(hist, cur) : null,
    persistence, feedback, streak, streakSide: (rows.at(-1)?.equity ?? 0) >= 0 ? "buying" : "selling",
  };
}

export function liquidity(upTo: string) {
  const raw = days.map((d) => h.breadth.get(d)?.illiq ?? null);
  const ma = raw.map((_, i) => {
    if (i < 19) return null;
    const w = raw.slice(i - 19, i + 1);
    return w.some((v) => v == null) ? null : w.reduce((s: number, v) => s + v!, 0) / 20;
  });
  const pct = ma.map((v, i) => {
    if (v == null) return null;
    const hist = ma.slice(Math.max(0, i - 750), i).filter((x): x is number => x != null);
    return hist.length >= 250 ? percentile(hist, v) : null;
  });
  const series = days.map((d, i) => ({ date: d, value: pct[i] })).filter((p) => p.date <= upTo && p.value != null);
  const i = days.indexOf(upTo);
  return { series, level: ma[i], pct: pct[i] };
}
