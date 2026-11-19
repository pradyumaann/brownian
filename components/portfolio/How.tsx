"use client";
import { FACTORS, FACTOR_OF, fmtBp, fmtPct, SHORT } from "@/lib/portfolioMath";
import type { DriverFact, PortfolioSeries, TypeFact } from "@/lib/portfolioTypes";
import { Change } from "../Change";
import { Src } from "../Src";
import { dateOf } from "./Day";

const show = (v: number | null, unit: "pct" | "bp") => (v == null ? "n/a" : unit === "bp" ? fmtBp(v) : fmtPct(v));

function Driver({ d }: { d: DriverFact }) {
  return (
    <li>
      <span className="hd-n">{d.label}</span>
      <span className="hd-v"><Change v={show(d.d1, d.unit)} /> <span className="faint">1 day</span></span>
      <span className="hd-v"><Change v={show(d.m1, d.unit)} /> <span className="faint">21 sessions</span></span>
      <span className="hd-v bw-mono">{d.pctl == null ? <span className="bw-na">n/a</span> : <>rank {Math.round(d.pctl)}</>}</span>
      <span className="hd-s"><Src k={d.src} /></span>
    </li>
  );
}

/** How it is worked out: the formula, every type's drivers with their tags, and what is n/a and why. */
export function How({ facts, series }: { facts: TypeFact[]; series: PortfolioSeries }) {
  const na = facts.filter((f) => f.d1 == null);
  const noYear = facts.filter((f) => !(f.id in series.types));
  const proxies = facts.filter((f) => f.proxy);
  return (
    <div className="how">
      <div className="note">
        <p><b>Blended move</b> = Σ (share of your mix × the type&apos;s one-day move), over the types that have a move. If your weights add to more than 100%, each is scaled down to 100% first. Unallocated weight adds nothing.</p>
        <p><b>A type&apos;s move</b> = the equal-weighted average of its drivers&apos; one-day changes, except gold (below). A type with a missing driver has no move; nothing is filled in. Moves are NSE-session changes; overseas series use the last close on or before each NSE day.</p>
        <p><b>Rank</b> = the share of the series&apos; own previous sessions (up to five years, at least 250) whose change was at or below today&apos;s. It uses no later data.</p>
        <p><b>Factors</b> group the types: {FACTORS.map((f, i) => <span key={f.id}>{i ? "; " : ""}{f.name} = {Object.keys(FACTOR_OF).filter((id) => FACTOR_OF[id] === f.id).map((id) => SHORT[id]).join(", ")}</span>)}.</p>
        <p><b>Your mix over the year</b> uses the same type definitions for each of the last {series.dates.length} NSE sessions, ending {dateOf(series.asOf)} (the latest session in today's data). Each day&apos;s change = Σ (share ÷ covered share × the type&apos;s change that day): the covered types are re-weighted to 100% and the weights are held constant each day, so the line does not follow any drift in a real mix. The {series.dates.length - 1} daily changes are compounded and both lines are rebased to 100 on the first session. <b>Volatility</b> = the sample standard deviation (n − 1) of the daily changes × √250. <b>Largest fall</b> = the deepest drop below a running peak, with the dates of that peak and low. US and USD/INR closes are carried over on days with no price, so a US holiday shows no change. A type with no series ({noYear.map((f) => SHORT[f.id]).join(", ")}) is left out and named; a type with a missing day in the window would be left out too, never part-filled{series.gaps.length > 0 && <> (this build: {series.gaps.map((id) => SHORT[id]).join(", ")})</>}. Gold is approximate: COMEX gold in USD × USD/INR, excluding duties and premiums. {proxies.length > 0 && <>{proxies.map((f) => SHORT[f.id]).join(" and ")} use Nifty 500 for both the day and the year (proxy: Nifty 500, not the fund&apos;s own returns).</>}</p>
        <p className="bw-disclaimer">Interpretation, not a forecast. A rule-based blend of index and market moves, not the return of any fund or share you own.</p>
      </div>
      <div className="how-types">
        {facts.map((f) => (
          <article key={f.id} className="how-t">
            <h4>{f.n} <span className="how-mv">{f.d1 == null ? <span className="bw-na">n/a</span> : <Change v={fmtPct(f.d1)} />}{f.src.length > 0 && <Src k={f.src} />}</span></h4>
            <p className="note">{f.formula}{f.derived && <> <b>{f.derived[0].toUpperCase() + f.derived.slice(1)}.</b></>}{f.proxy && <> <b>{f.proxy[0].toUpperCase() + f.proxy.slice(1)}.</b></>}</p>
            {f.note && <p className="note faint">{f.note}</p>}
            {f.drivers.length > 0 && <ul className="hd">{f.drivers.map((d) => <Driver key={d.id} d={d} />)}</ul>}
          </article>
        ))}
      </div>
      <p className="note"><b>n/a today:</b> {na.map((f, i) => <span key={f.id}>{i ? " · " : ""}{SHORT[f.id]}</span>)}. They are named when they carry weight and are never replaced by a guess.</p>
    </div>
  );
}
