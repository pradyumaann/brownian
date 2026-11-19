import type { Release } from "@/data/types";
import { DataTable } from "@/components/DataTable";
import { Src } from "@/components/Src";
import { IMPACT } from "@/lib/impact";

const MINUS = "−";
const pc = (v: number) => (v < 0 ? MINUS : "") + Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + "%";
const pp = (d: number) => `${d > 0 ? "▲ +" : d < 0 ? "▼ " + MINUS : ""}${Math.abs(d).toFixed(2)} pp`;
const NA = <span className="bw-na">n/a</span>;

/** Scheduled releases as plain metrics: latest, forecast, previous print and the gap to forecast. A release not out
 *  yet shows when it is due; a figure the sources do not give is n/a. The words for India are the brief's reading. */
export function ReleaseMetrics({ rows }: { rows: Release[] }) {
  return (
    <DataTable stack label="Releases: latest against forecast and the previous print"
      head={[["Release"], ["Latest", "r"], ["Forecast", "r"], ["Previous", "r"], ["Versus forecast", "r"], ["Status"], ["Reading"]]}
      rows={rows.map((r) => {
        const due = r.latest == null ? (r.due ? `Due ${r.due}` : r.note ?? "") : "";
        const prev = r.priorLabel === "previous" ? "Previous" : r.priorLabel;
        return [
          <span key="n"><b>{r.region === "India" ? "" : r.region + " "}{r.n}</b><Src k={r.src} />
            <span className="rm-basis">{[r.region === "India" ? "India" : "", r.basis].filter(Boolean).join(" · ")}</span></span>,
          <span key="l" className="bw-mono rm-latest">{r.latest == null ? NA : pc(r.latest)}<span className="rm-lab rm-ph"> latest</span></span>,
          <span key="f" className="bw-mono">{r.forecast == null ? NA : pc(r.forecast)}</span>,
          <span key="p" className="bw-mono">{r.prior == null ? NA : pc(r.prior)}{r.prior != null && r.priorLabel !== "previous" && <span className="rm-lab"> {prev}</span>}</span>,
          <span key="g" className="bw-mono">{r.latest != null && r.forecast != null ? pp(r.latest - r.forecast) : NA}</span>,
          due ? <span key="d" className="rm-due">{due}</span> : "",
          IMPACT[r.tone] ? <span key="i" className={`rm-impact tone-${r.tone}`}>{IMPACT[r.tone]}</span> : "",
        ];
      })} />
  );
}
