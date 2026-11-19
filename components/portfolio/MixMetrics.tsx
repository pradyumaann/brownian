"use client";
import { beta, blendSeries, correlation, extremePairs, fmtR, normalise, pairwise, PROXY_IDS, SHORT, HOLDING_IDS, type Weights } from "@/lib/portfolioMath";
import type { PortfolioSeries } from "@/lib/portfolioTypes";
import { DataTable } from "../DataTable";
import { Src } from "../Src";
import { dateOf } from "./Day";

const na = <span className="bw-na">n/a</span>;
const num2 = (v: number) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(2);

/** Co-movement facts for the mix, from the daily changes already sent for "Your mix over the year" (no new props): the mix's
 *  correlation with Nifty 50 and its beta, the most and least correlated pair of held types, and each type's own figures.
 *  Same blend as the year: weights constant each day, the covered types re-weighted to 100%. A figure that cannot be worked
 *  out honestly (a type with no series, a short or flat series) is n/a, never estimated. */
export function MixMetrics({ w, series }: { w: Weights; series: PortfolioSeries }) {
  const bh = blendSeries(w, series.types);
  const nifty = series.nifty;
  const hasNifty = nifty.some((v) => v != null);
  const nm = normalise(w);
  const held = HOLDING_IDS.filter((id) => nm.shares[id] > 0);
  if (!bh) {
    return (
      <>
        <h3 className="sub gap-top">Moves with Nifty 50</h3>
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
      <h3 className="sub gap-top">Moves with Nifty 50</h3>
      <p className="bw-meta">
        Covers {Math.round(bh.covered)}% of your mix, re-weighted to 100% among the covered types
        {bh.left.length > 0 && <>; {bh.left.map((x) => SHORT[x.id]).join(", ")} left out (n/a)</>}. Window: {window}, weights held constant each day.
      </p>
      <dl className="cfacts mfacts">
        <div>
          <dt>Correlation with Nifty 50<span className="dts">How closely the mix&apos;s daily changes moved with Nifty 50&apos;s, from −1 (opposite) to 1 (the same).</span></dt>
          <dd className="bw-mono">{corr ? fmtR(corr.r) : na}</dd>
        </div>
        <div>
          <dt>Beta to Nifty 50<span className="dts">The mix&apos;s average daily change for each 1% change in Nifty 50. A beta of 0.80 is 0.8%.</span></dt>
          <dd className="bw-mono">{bet ? num2(bet.b) : na}</dd>
        </div>
        <div>
          <dt>Most correlated pair of types<span className="dts">The two held types whose daily changes moved most closely together.</span></dt>
          <dd className="bw-mono">{ex ? <>{pairName(ex.high)} <span className="mval">{fmtR(ex.high.r)}</span></> : na}</dd>
        </div>
        <div>
          <dt>Least correlated pair of types<span className="dts">The two held types whose daily changes moved least closely together.</span></dt>
          <dd className="bw-mono">{ex ? <>{pairName(ex.low)} <span className="mval">{fmtR(ex.low.r)}</span></> : na}</dd>
        </div>
      </dl>
      <p className="bw-source mfsrc">
        Pearson correlation and beta of daily % changes over the days both have a change{corr ? <> ({corr.n} days)</> : null}; Nifty 50 is the market line in section 05<Src k={srcs} />
      </p>
      {nTypes < 2 && <p className="note">One type with a series carries the weight, so there is no pair to compare.</p>}
      {nTypes >= 2 && !ex && <p className="note">The held types do not share enough days to compare in pairs: n/a.</p>}
      <DataTable stack label="Each held type against Nifty 50 over the same window"
        head={[["Type"], ["Share", "r"], ["Correlation", "r"], ["Beta", "r"], ["Source"]]} rows={rows} />
      <p className="note after-plot">
        Annualised volatility against Nifty 50 is in section 05, Your mix over the year. Gold is approximate (COMEX gold in USD × USD/INR; excludes duties and premiums)<Src k={["D5"]} />; types with no series (silver, debt) have no figure here.
      </p>
      <p className="bw-disclaimer">Interpretation, not a forecast. These describe how daily changes moved together in this window; they say nothing about the next one. US-traded series are paired by date, and their sessions close after India&apos;s, so their figures with Nifty 50 are only partly simultaneous.</p>
    </>
  );
}
