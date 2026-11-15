"use client";
import { FACTORS, FACTOR_OF, fmtBp, fmtPct, SHORT } from "@/lib/portfolioMath";
import type { DriverFact, TypeFact } from "@/lib/portfolioTypes";
import { Change } from "../Change";
import { More } from "../More";
import { Src } from "../Src";

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
export function How({ facts }: { facts: TypeFact[] }) {
  const na = facts.filter((f) => f.d1 == null);
  return (
    <More label="The formula, drivers and what is n/a" className="how">
      <div className="note">
        <p><b>Blended move</b> = Σ (share of your mix × the type&apos;s one-day move), over the types that have a move. If your weights add to more than 100%, each is scaled down to 100% first. Unallocated weight adds nothing.</p>
        <p><b>A type&apos;s move</b> = the equal-weighted average of its drivers&apos; one-day changes, except gold (below). A type with a missing driver has no move; nothing is filled in. Moves are NSE-session changes; overseas series use the last close on or before each NSE day.</p>
        <p><b>Rank</b> = the share of the series&apos; own previous sessions (up to five years, at least 250) whose change was at or below today&apos;s. It uses no later data.</p>
        <p><b>Factors</b> group the types: {FACTORS.map((f, i) => <span key={f.id}>{i ? "; " : ""}{f.name} = {Object.keys(FACTOR_OF).filter((id) => FACTOR_OF[id] === f.id).map((id) => SHORT[id]).join(", ")}</span>)}.</p>
        <p className="bw-disclaimer">Interpretation, not a forecast. A rule-based blend of index and market moves, not the return of any fund or share you own.</p>
      </div>
      <div className="how-types">
        {facts.map((f) => (
          <article key={f.id} className="how-t">
            <h4>{f.n} <span className="how-mv">{f.d1 == null ? <span className="bw-na">n/a</span> : <Change v={fmtPct(f.d1)} />}{f.src.length > 0 && <Src k={f.src} />}</span></h4>
            <p className="note">{f.formula}{f.derived && <> <b>{f.derived[0].toUpperCase() + f.derived.slice(1)}.</b></>}</p>
            {f.note && <p className="note faint">{f.note}</p>}
            {f.drivers.length > 0 && <ul className="hd">{f.drivers.map((d) => <Driver key={d.id} d={d} />)}</ul>}
          </article>
        ))}
      </div>
      <p className="note"><b>n/a today:</b> {na.map((f, i) => <span key={f.id}>{i ? " · " : ""}{SHORT[f.id]}</span>)}. They are named when they carry weight and are never replaced by a guess.</p>
    </More>
  );
}
