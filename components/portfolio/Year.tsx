"use client";
import { blendSeries, changeOver, fmtPct, levelsOf, maxDrawdown, PROXY_IDS, SHORT, volatility, worstDay, type Mode, type Weights } from "@/lib/portfolioMath";
import type { PortfolioSeries } from "@/lib/portfolioTypes";
import { BlendLine } from "../charts/BlendLine";
import { Chip } from "../Chip";
import { DataTable } from "../DataTable";
import { More } from "../More";
import { Src } from "../Src";
import { dateOf } from "./Day";
import { NoneNote } from "./NoneNote";

const na = <span className="bw-na">n/a</span>;
const pct1 = (v: number | null) => (v == null ? na : fmtPct(v, 1));
const names = (a: { id: string }[]) => a.map((x) => SHORT[x.id]).join(", ");

/** Your mix over the year: the blend of the covered types' index moves, weights held constant each day, beside Nifty 50. */
export function Year({ w, series, mode }: { w: Weights; series: PortfolioSeries; mode: Mode }) {
  const example = mode === "example";
  if (mode === "none") return <NoneNote line="For a mix, this section draws a blend of index moves for its types over the last 250 sessions, beside Nifty 50. Nothing is owned, so no line is drawn." />;
  const bh = blendSeries(w, series.types);
  if (!Object.keys(w).length) {
    return <p className="empty">No weight is set yet. Give a holding type a weight in <a href="#your-mix">Portfolio weights</a> and its year of index moves appears here.</p>;
  }
  if (!bh) {
    const left = Object.keys(w).filter((id) => id in SHORT);
    return (
      <p className="empty">
        None of the types in your mix has a year-long series ({left.map((id) => SHORT[id]).join(", ")} left out). Nothing is drawn, and nothing is estimated for them.
      </p>
    );
  }
  const srcs = [...new Set([...bh.used.flatMap((u) => series.src[u.id] ?? []), "D1"])].sort();
  const nl = series.nifty.some((v) => v != null) ? levelsOf(series.nifty) : null;
  const sessions = series.dates.length, first = series.dates[0], last = series.dates[sessions - 1];
  const mixEnd = bh.levels.at(-1);
  const proxied = bh.used.filter((u) => PROXY_IDS.includes(u.id)).map((u) => SHORT[u.id]);
  const name = example ? "Example mix" : "Your mix";
  const mixChg = changeOver(bh.levels), nChg = nl ? changeOver(nl) : null;
  const mixDd = maxDrawdown(bh.levels, series.dates), nDd = nl ? maxDrawdown(nl, series.dates) : null;
  const mixWd = worstDay(bh.returns, series.dates), nWd = nl ? worstDay(series.nifty, series.dates) : null;
  const mixVol = volatility(bh.returns), nVol = nl ? volatility(series.nifty) : null;
  const dd = (d: ReturnType<typeof maxDrawdown>) => (d == null ? na : <>{fmtPct(d.value, 1)}{d.peak && <span className="dts">peak {dateOf(d.peak)}, low {dateOf(d.trough!)}</span>}{!d.peak && <span className="dts">no fall from a peak</span>}</>);
  const wd = (d: ReturnType<typeof worstDay>) => (d == null ? na : <>{fmtPct(d.value, 2)}<span className="dts">{dateOf(d.date)}</span></>);
  const vol = (v: number | null) => (v == null ? na : `${v.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`);
  return (
    <>
      {example && <p className="bw-meta"><Chip>Example</Chip> This is the example mix.</p>}
      <p className="bw-meta">
        Covers {Math.round(bh.covered)}% of your mix, re-weighted to 100% among the covered types
        {bh.left.length > 0 && <>; {names(bh.left)} left out ({Math.round(bh.left.reduce((s, x) => s + x.share, 0))}%, n/a)</>}
        {bh.left.length === 0 && Math.round(bh.covered) < 100 && <>; the rest is Unallocated</>}. Nothing is estimated for the types left out.
      </p>
      <BlendLine dates={series.dates} mix={bh.levels} nifty={nl} name={name} />
      <p className="bw-source after-plot">
        {sessions} NSE sessions, {dateOf(first)} to {dateOf(last)}, both lines rebased to 100{mixEnd != null && <>; {name.toLowerCase()} ends at {mixEnd.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</>}<Src k={srcs} />
      </p>
      <p className="note after-plot">
        <b>Interpretation, not a forecast.</b> A blend of index moves for the types in your mix, weights held constant each day: not your own holdings&apos; returns. It re-weights the covered types to 100%, so its last day can differ from Your day, which counts Unallocated and left-out weight as zero. Gold is approximate (COMEX gold in USD × USD/INR; excludes duties and premiums)<Src k={["D5"]} />.
        {proxied.length > 0 && <> {proxied.join(" and ")} {proxied.length > 1 ? "are" : "is"} read through an index (proxy: Nifty 500, not the fund&apos;s own returns)<Src k={["D1"]} />.</>}
      </p>
      <More label="Change, volatility, largest fall and worst day">
        <div className="yfacts">
          <DataTable stack label="The year in four facts, your mix beside Nifty 50"
            head={[[`Over ${sessions} sessions`], [name, "r"], ["Nifty 50", "r"]]}
            rows={[
              ["Change over the window", pct1(mixChg), pct1(nChg)],
              ["Volatility, annualised", vol(mixVol), vol(nVol)],
              ["Largest fall from a peak", dd(mixDd), dd(nDd)],
              ["Worst single day", wd(mixWd), wd(nWd)],
            ].map(([l, a, b]) => [l, <span key="a" className="nv"><span className="lbl">{name} </span>{a}</span>, <span key="b" className="nv">{b}</span>])} />
        </div>
        <p className="bw-source">Volatility = sample standard deviation of the daily changes × √250. Largest fall = the deepest drop below a running peak<Src k={srcs} /></p>
      </More>
    </>
  );
}
