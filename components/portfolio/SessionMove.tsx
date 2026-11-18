"use client";
import Link from "next/link";
import { B } from "@/data";
import { blend, fmtPct, SHORT, type Mode, type Weights } from "@/lib/portfolioMath";
import type { SessionTypeFact } from "@/lib/portfolioTypes";
import { Chip } from "../Chip";
import { Src } from "../Src";
import { dateOf } from "./Day";
import { NoneNote } from "./NoneNote";
import { usePort } from "./usePort";

const tone = (v: number) => (v > 0 ? "gain" : v < 0 ? "loss" : "plain");
const arrow = (v: number) => (v > 0 ? "▲ " : v < 0 ? "▼ " : "");
const Move = ({ v }: { v: number }) => <span className={`tone-${tone(v)}`}>{arrow(v)}{fmtPct(v)}</span>;
const NA = () => <span className="bw-na">n/a</span>;

/** Markets, Overnight, first card: the blended one-day move of the mix as one display figure with its caption beside it,
 *  then one ruled line per type with a weight. Same `usePort()` and `blend()` as /portfolio, so the numbers match.
 *  Mix figures wait for `ready`, so a viewer in none or saved mode never sees the example figure first. */
export function SessionMove({ types, asOf }: { types: SessionTypeFact[]; asOf: string }) {
  const port = usePort();
  const when = dateOf(asOf);
  const none = port.ready && port.mode === "none";
  return (
    <div className="smv">
      {!port.ready ? <Wait rows={B.defaultHold.length} /> : none ? <NoneNote full /> : <Mix w={port.w} mode={port.mode} types={types} when={when} />}
      <div className="smv-foot">
        <div className="smv-foot-t">
          <p className="bw-disclaimer">Single days are noise. Interpretation, not a forecast.</p>
          <p className="smv-link"><Link href="/portfolio/">{none ? "Portfolio Lens: the mix, exposure, the year and how it is worked out" : "Your mix, exposure, the year and how it is worked out"}</Link></p>
        </div>
        <Link className="bw-btn bw-btn-dawn" href="/portfolio/">See what it means for you <span className="bw-btn-dot" aria-hidden="true">→</span></Link>
      </div>
    </div>
  );
}

/** The column names over the type lines (the list's own label says the same for screen readers). */
const Head = () => (
  <div className="smv-head" aria-hidden="true"><span>Holding type</span><span /><span className="smv-hr">Share</span><span className="smv-hr">One-day move</span><span /></div>
);

/** Before the stored mix is read: the same blocks with no figures, so nothing flashes and the card does not jump. The example
 *  line and the label keep a second line on phones, where the example's text wraps there. */
function Wait({ rows }: { rows: number }) {
  return (
    <div className="smv-wait" aria-hidden="true">
      <p className="smv-ex">&nbsp;<span className="smv-l2"><br />&nbsp;</span></p>
      <div className="smv-stat">
        <p className="smv-lbl">&nbsp;<span className="smv-l2"><br />&nbsp;</span></p>
        <p className="smv-fig"><span className="smv-num">&nbsp;</span><span className="bw-src smv-hid">D1</span></p>
        <p className="smv-cov">&nbsp;<br />&nbsp;</p>
      </div>
      <Head />
      <ul className="smv-rows">
        {Array.from({ length: rows }, (_, i) => <li key={i}><span className="smv-n">&nbsp;</span><span className="smv-bar" /></li>)}
      </ul>
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
        <p className="smv-ex"><Chip>Example</Chip> This is an example mix. <Link href="/portfolio/">Set your own weights in Portfolio Lens</Link>; they stay on this device.</p>
      )}
      <div className="smv-stat">
        <p className="smv-lbl">Blended one-day move of {whose}, {when}</p>
        {b.move != null ? (
          <p className="smv-fig"><span className={`smv-num tone-${tone(b.move)}`}>{b.move !== 0 && <span className="smv-tri">{b.move > 0 ? "▲" : "▼"}</span>}{fmtPct(b.move)}</span><Src k={srcs} /></p>
        ) : <p className="smv-fig"><span className="smv-num bw-na">n/a</span></p>}
        <p className="smv-cov">
          {b.move != null ? <>Covers {Math.round(b.covered)}% of {whose}{b.unallocated > 0 && <>; {Math.round(b.unallocated)}% is Unallocated and adds nothing</>}. </> : `No type in ${whose} has a move for this session. `}
          {b.excluded.length > 0 && <>Not in the blended move: {b.excluded.map((e, i) => <span key={e.id}>{i ? ", " : ""}{SHORT[e.id]} ({Math.round(e.share)}%, n/a)</span>)}. Nothing is estimated for them.</>}
        </p>
      </div>
      <Head />
      <ul className="smv-rows" aria-label={`Each holding type in ${whose}: its share and its own one-day move, ${when}`}>
        {b.rows.map((r) => {
          const f = fact(r.id);
          return (
            <li key={r.id}>
              <span className="smv-n">{SHORT[r.id]}{f.proxy && <span className="mix-px">{f.proxy}</span>}</span>
              <span className="smv-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, Math.max(0, r.share))}%` }} /></span>
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
