"use client";
import { beta, blendSeries, correlation, extremePairs, fmtR, normalise, pairwise, PROXY_IDS, SHORT, HOLDING_IDS, type Mode, type Weights } from "@/lib/portfolioMath";
import type { PortfolioSeries } from "@/lib/portfolioTypes";
import { DataTable } from "../DataTable";
import { Src } from "../Src";
import { dateOf } from "./Day";
import { NoneNote } from "./NoneNote";

const na = <span className="bw-na">n/a</span>;
const num2 = (v: number) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(2);

/** Co-movement facts for the mix, from the daily changes already sent for "Your mix over the year" (no new props): the mix's
 *  correlation with Nifty 50 and its beta, the most and least correlated pair of held types, and each type's own figures.
 *  Same blend as the year: weights constant each day, the covered types re-weighted to 100%. A figure that cannot be worked
 *  out honestly (a type with no series, a short or flat series) is n/a, never estimated. */
export function MixMetrics({ w, series, mode }: { w: Weights; series: PortfolioSeries; mode: Mode }) {
  if (mode === "none") return <NoneNote line="For a mix, this section shows how its daily changes moved with Nifty 50: correlation, beta and the most and least correlated pair of types. Nothing is owned, so nothing is shown." />;
  const bh = blendSeries(w, series.types);
  const nifty = series.nifty;
  const hasNifty = nifty.some((v) => v != null);
  const nm = normalise(w);
  const held = HOLDING_IDS.filter((id) => nm.shares[id] > 0);
  if (!held.length) return <p className="empty">No weight is set yet. Once a holding type has a weight, how its daily changes moved with Nifty 50 is shown here.</p>;
  if (!bh) {
    return (
      <>
        <p className="empty">None of the types in your mix has a year-long series ({held.map((id) => SHORT[id]).join(", ")}), so no co-movement figure is worked out and none is estimated.</p>
      </>
    );
  }
  const first = series.dates[1], last = series.dates.at(-1)!;
  const corr = hasNifty ? correlation(bh.returns, nifty) : null;
  const bet = hasNifty ? beta(bh.returns, nifty) : null;
  const { types: nTypes, pairs } = pairwise(w, series.types);
  const ex = extremePairs(pairs);
  const srcs = [...new Set([...bh.used.flatMap((u) => series.src[u.id] ?? []), "D1"])].sort();
  const pairName = (p: { a: string; b: string }) => `${SHORT[p.a]} and ${SHORT[p.b]}`;
  const window = `${series.dates.length - 1} daily changes, ${dateOf(first)} to ${dateOf(last)}`;
  const rows = held.map((id) => {
    const ret = series.types[id];
    const c = ret && hasNifty ? correlation(ret, nifty) : null, b = ret && hasNifty ? beta(ret, nifty) : null;
    return [
      <span key="t">{SHORT[id]}{PROXY_IDS.includes(id) && <span className="dts"> proxy: Nifty 500, not the fund&apos;s own returns</span>}</span>,
      <span key="s" className="nv">{Math.round(nm.shares[id])}%</span>,
      <span key="c" className="nv">{c ? fmtR(c.r) : na}</span>,
      <span key="b" className="nv">{b ? num2(b.b) : na}</span>,
      <span key="g">{ret ? <Src k={[...(series.src[id] ?? []), "D1"].filter((x, i, a) => a.indexOf(x) === i)} /> : na}</span>,
    ];
  });
  return (
    <>
      <p className="bw-meta">
        Covers {Math.round(bh.covered)}% of your mix{bh.left.length > 0 && <>; {bh.left.map((x) => SHORT[x.id]).join(", ")} left out (n/a)</>} · {window}
      </p>
      <dl className="mm">
        <div>
          <dt>Correlation with Nifty 50</dt>
          <dd className="bw-mono">{corr ? fmtR(corr.r) : na}</dd>
          <dd className="mm-c">−1 opposite, 1 the same</dd>
        </div>
        <div>
          <dt>Beta to Nifty 50</dt>
          <dd className="bw-mono">{bet ? num2(bet.b) : na}</dd>
          <dd className="mm-c">change per 1% in Nifty 50</dd>
        </div>
        <div>
          <dt>Most correlated pair</dt>
          <dd className="bw-mono">{ex ? fmtR(ex.high.r) : na}</dd>
          <dd className="mm-c">{ex ? pairName(ex.high) : "types share too few days"}</dd>
        </div>
        <div>
          <dt>Least correlated pair</dt>
          <dd className="bw-mono">{ex ? fmtR(ex.low.r) : na}</dd>
          <dd className="mm-c">{ex ? pairName(ex.low) : "types share too few days"}</dd>
        </div>
      </dl>
      {nTypes < 2 && <p className="note">One type with a series carries the weight, so there is no pair to compare.</p>}
      <details className="mm-more">
        <summary>Each held type against Nifty 50</summary>
        <DataTable stack label="Each held type against Nifty 50 over the same window"
          head={[["Type"], ["Share", "r"], ["Correlation", "r"], ["Beta", "r"], ["Source"]]} rows={rows} />
      </details>
      <p className="bw-source mm-src">
        Pearson correlation and beta of daily % changes{corr ? <> ({corr.n} days)</> : null}; weights held constant, covered types re-weighted to 100%. Volatility is in section 05. Gold is approximate (COMEX gold in USD × USD/INR; excludes duties and premiums)<Src k={["D5"]} />. US-traded series are paired by date and close after India, so their figures are only partly simultaneous<Src k={srcs} />
      </p>
      <p className="bw-disclaimer">Interpretation, not a forecast. These describe how daily changes moved together in this window; they say nothing about the next one.</p>
    </>
  );
}
