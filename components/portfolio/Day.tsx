"use client";
import { blend, fmtPct, SHORT, weightedRank, type Mode, type Weights } from "@/lib/portfolioMath";
import type { TypeFact } from "@/lib/portfolioTypes";
import { Diverge } from "../charts/Diverge";
import { DataTable } from "../DataTable";
import { More } from "../More";
import { Src } from "../Src";
import { NoneNote } from "./NoneNote";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const dateOf = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

const tone = (v: number) => (v > 0 ? "gain" : v < 0 ? "loss" : "plain");
const arrow = (v: number) => (v > 0 ? "▲ " : v < 0 ? "▼ " : "");

/** Your day: the blended one-day move of the mix and what each type added to it. */
export function Day({ w, facts, asOf, mode }: { w: Weights; facts: TypeFact[]; asOf: string; mode: Mode }) {
  const example = mode === "example";
  if (mode === "none") return <NoneNote full />;
  const b = blend(w, facts);
  const when = dateOf(asOf);
  if (!b.rows.length) {
    return <p className="empty">No weight is set yet. Give a holding type a weight in <a href="#your-mix">Portfolio weights</a> and its move for {when} appears here.</p>;
  }
  const live = b.rows.filter((r) => r.contrib != null);
  const srcs = [...new Set(live.flatMap((r) => facts.find((f) => f.id === r.id)!.src))].sort();
  const rank = weightedRank(w, facts);
  const proxied = b.rows.filter((r) => facts.find((f) => f.id === r.id)?.proxy);
  return (
    <>
      <div className="mixday">
        <p className="bw-label">Blended one-day move of {example ? "the example mix" : "your mix"}, {when}</p>
        {b.move != null ? (
          <p className="md-v"><span className={`md-n tone-${tone(b.move)}`}>{arrow(b.move)}{fmtPct(b.move)}</span><Src k={srcs} /></p>
        ) : <p className="md-v"><span className="md-n bw-na">n/a</span></p>}
        <p className="bw-meta">
          {b.move != null ? <>Covers {Math.round(b.covered)}% of your mix{b.unallocated > 0 && <>; {Math.round(b.unallocated)}% is Unallocated and adds nothing</>}. </> : "No type in your mix has a move for this session. "}
          {b.excluded.length > 0 && <>Not in the blended move: {b.excluded.map((e, i) => <span key={e.id}>{i ? ", " : ""}{SHORT[e.id]} ({Math.round(e.share)}%, n/a)</span>)}. Nothing is estimated for them. </>}
          {proxied.length > 0 && <>{proxied.map((r) => SHORT[r.id]).join(" and ")} {proxied.length > 1 ? "are" : "is"} read through an index (proxy: Nifty 500, not the fund&apos;s own returns).</>}
          {example && <> <a href="#your-mix">Set your own weights</a>.</>}
        </p>
      </div>
      <Diverge phoneRows={6} labelWidth={118}
        rows={b.rows.map((r) => ({ label: `${SHORT[r.id]} ${Math.round(r.share)}%`, value: r.contrib }))}
        label={`What each type added to the blended move, in percentage points of your mix: ${b.rows.map((r) => `${SHORT[r.id]} ${r.contrib == null ? "n/a" : fmtPct(r.contrib)}`).join(", ")}`} />
      <p className="bw-source after-plot">Bars: share of your mix × the type&apos;s move, in percentage points<Src k={srcs} /></p>
      {rank && (
        <p className="note after-plot">
          <b>Interpretation, not a forecast.</b> Weighted by your mix, today&apos;s type moves sit higher than on about {Math.round(rank.value)}% of their own previous sessions&apos; moves (up to five years, no later data used). That is the weighted average of each type&apos;s rank, not a rank of the mix itself<Src k={srcs} />.
        </p>
      )}
      <More label="Each type: weight, move and contribution">
        <DataTable stack label="Each holding type in your mix"
          head={[["Type"], ["Weight", "r"], ["Move", "r"], ["Added", "r"], ["Source"]]}
          rows={b.rows.map((r) => {
            const f = facts.find((x) => x.id === r.id)!;
            return [
              f.proxy ? <>{f.n} <span className="faint">({f.proxy})</span></> : f.n,
              `${Math.round(r.share)}%`,
              r.move == null ? <span className="bw-na">n/a</span> : fmtPct(r.move),
              r.contrib == null ? <span className="bw-na">n/a</span> : fmtPct(r.contrib),
              f.src.length ? <Src k={f.src} /> : <span className="bw-na">n/a</span>,
            ];
          })} />
      </More>
    </>
  );
}
