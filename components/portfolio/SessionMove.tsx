"use client";
import Link from "next/link";
import { B } from "@/data";
import { ord } from "@/lib/bands";
import { blend, fmtPct, SHORT, type Mode, type Weights } from "@/lib/portfolioMath";
import type { SessionConditions, SessionTypeFact } from "@/lib/portfolioTypes";
import { Chip } from "../Chip";
import { Src } from "../Src";
import { dateOf } from "./Day";
import { NoneNote } from "./NoneNote";
import { usePort } from "./usePort";

const tone = (v: number) => (v > 0 ? "gain" : v < 0 ? "loss" : "plain");
const arrow = (v: number) => (v > 0 ? "▲ " : v < 0 ? "▼ " : "");
const Move = ({ v }: { v: number }) => <span className={`tone-${tone(v)}`}>{arrow(v)}{fmtPct(v)}</span>;
const NA = () => <span className="bw-na">n/a</span>;

/** Markets, Overnight, first card: the blended one-day move of the mix, one line per type with a weight, and two market
 *  readings for the same session (from the server). Same `usePort()` and `blend()` as /portfolio, so the numbers match.
 *  Mix figures wait for `ready`, so a viewer in none or saved mode never sees the example figure first. */
export function SessionMove({ types, asOf, cond }: { types: SessionTypeFact[]; asOf: string; cond: SessionConditions }) {
  const port = usePort();
  const when = dateOf(asOf);
  const none = port.ready && port.mode === "none";
  return (
    <div className="smv">
      {!port.ready ? <Wait rows={B.defaultHold.length} /> : none ? <NoneNote full /> : <Mix w={port.w} mode={port.mode} types={types} when={when} />}
      <div className="smv-cond">
        <h3 className="sub">Market conditions that session</h3>
        <p className="bw-meta">How the market itself behaved on {when}: conditions of the session, not causes of the move. Both are read as on the <Link href="/wander/">Wander Index</Link>.</p>
        <dl className="smv-kv">
          <div>
            <dt>Turbulence</dt>
            <dd>{cond.turb ? <><b>{cond.turb.band}</b>, <span className="bw-mono">{ord(cond.turb.pct)}</span> percentile of its 20-session average<Src k={["D1"]} /></> : <NA />}</dd>
          </div>
          <div>
            <dt>Global spillover</dt>
            <dd>{cond.spill ? <><span className="bw-mono">{cond.spill.now.toFixed(0)}%</span> from overseas markets, against <span className="bw-mono">{cond.spill.avg.toFixed(0)}%</span> on average over the last {cond.spill.n.toLocaleString("en-IN")} sessions<Src k={["D1", "D5"]} /></> : <NA />}</dd>
          </div>
        </dl>
      </div>
      <p className="bw-disclaimer smv-noise">Single days are noise. Interpretation, not a forecast.</p>
      <p className="bw-meta"><Link href="/portfolio/">{none ? "Portfolio Lens: the mix, exposure, the year and how it is worked out" : "Your mix, exposure, the year and how it is worked out"}</Link></p>
      <div className="actions">
        <Link className="bw-btn bw-btn-dawn" href="/portfolio/">See what it means for you <span className="bw-btn-dot" aria-hidden="true">→</span></Link>
      </div>
    </div>
  );
}

/** Before the stored mix is read: the same lines with no figures, so nothing flashes and the card does not jump. */
function Wait({ rows }: { rows: number }) {
  return (
    <div className="smv-wait" aria-hidden="true">
      <p className="bw-meta">&nbsp;</p>
      <p className="bw-label smv-lbl">&nbsp;</p>
      <p className="md-v"><span className="md-n">&nbsp;</span></p>
      <p className="bw-meta">&nbsp;<br />&nbsp;</p>
      <ul className="smv-rows">{Array.from({ length: rows }, (_, i) => <li key={i}><span className="smv-n">&nbsp;</span></li>)}</ul>
    </div>
  );
}

function Mix({ w, mode, types, when }: { w: Weights; mode: Mode; types: SessionTypeFact[]; when: string }) {
  const example = mode === "example";
  const whose = example ? "the example mix" : "your mix";
  const b = blend(w, types);
  const fact = (id: string) => types.find((f) => f.id === id)!;
  if (!b.rows.length) {
    return <p className="empty">No weight is set yet. Give a holding type a weight in <Link href="/portfolio/">Portfolio Lens</Link> and its move for {when} appears here.</p>;
  }
  const srcs = [...new Set(b.rows.filter((r) => r.contrib != null).flatMap((r) => fact(r.id).src))].sort();
  return (
    <>
      {example && (
        <p className="bw-meta"><Chip>Example</Chip> This is an example mix. <Link href="/portfolio/">Set your own weights in Portfolio Lens</Link>; they stay on this device.</p>
      )}
      <p className="bw-label smv-lbl">Blended one-day move of {whose}, {when}</p>
      {b.move != null ? (
        <p className="md-v"><span className={`md-n tone-${tone(b.move)}`}>{arrow(b.move)}{fmtPct(b.move)}</span><Src k={srcs} /></p>
      ) : <p className="md-v"><span className="md-n bw-na">n/a</span></p>}
      <p className="bw-meta">
        {b.move != null ? <>Covers {Math.round(b.covered)}% of {whose}{b.unallocated > 0 && <>; {Math.round(b.unallocated)}% is Unallocated and adds nothing</>}. </> : `No type in ${whose} has a move for this session. `}
        {b.excluded.length > 0 && <>Not in the blended move: {b.excluded.map((e, i) => <span key={e.id}>{i ? ", " : ""}{SHORT[e.id]} ({Math.round(e.share)}%, n/a)</span>)}. Nothing is estimated for them.</>}
      </p>
      <ul className="smv-rows" aria-label={`Each holding type in ${whose}: its share and its own one-day move, ${when}`}>
        {b.rows.map((r) => {
          const f = fact(r.id);
          return (
            <li key={r.id}>
              <span className="smv-n">{SHORT[r.id]}{f.proxy && <span className="mix-px">{f.proxy}</span>}</span>
              <span className="smv-w">{Math.round(r.share)}%</span>
              <span className="smv-m">{r.move == null ? <NA /> : <Move v={r.move} />}</span>
              <span className="smv-s">{r.move != null && f.src.length > 0 && <Src k={f.src} />}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
