import type { Release } from "@/data/types";
import { Src } from "@/components/Src";
import { RiseBox } from "./RiseBox";

const MINUS = "−";
const pc = (v: number) => (v < 0 ? MINUS : "") + Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + "%";
const pp = (d: number) => `${d > 0 ? "▲ +" : d < 0 ? "▼ " + MINUS : ""}${Math.abs(d).toFixed(2)} pp`;
export const IMPACT: Record<string, string> = { gain: "Tailwind for India", loss: "Headwind for India", mixed: "Could go either way", info: "", plain: "" };

/** Scheduled releases as glowing bars: for each, the previous print, the forecast and the latest, from one zero line on
 *  that release's own scale (its largest figure fills the lane). A release not out yet shows when it is due; a figure
 *  the sources do not give is n/a and draws no bar. Every bar is a readout; the figures are printed beside it.
 *  Drawn in HTML, so the lanes fit any width; a container query stacks each row on narrow panels. */
export function ReleaseBars({ rows }: { rows: Release[] }) {
  return (
    <RiseBox className="bw-plot rbars" role="list"
      aria-label={`Releases: ${rows.map((r) => `${r.region} ${r.n}: latest ${r.latest == null ? (r.due ? "due " + r.due : "n/a") : pc(r.latest)}, forecast ${r.forecast == null ? "n/a" : pc(r.forecast)}, ${r.priorLabel} ${r.prior == null ? "n/a" : pc(r.prior)}`).join("; ")}`}>
      <div className="rb-key" aria-hidden="true">
        <span><i className="rb-sw is-prior" />Previous</span>
        <span><i className="rb-sw is-fc" />Forecast</span>
        <span><i className="rb-sw is-latest" />Latest</span>
      </div>
      {rows.map((r) => {
        const vals = [r.prior, r.forecast, r.latest].filter((v): v is number => v != null);
        const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals), span = hi - lo || 1, z = (-lo / span) * 100;
        const bar = (v: number | null, cls: string, name: string, i: number) => {
          if (v == null) return null;
          const a = Math.min(z, ((v - lo) / span) * 100), b = Math.max(z, ((v - lo) / span) * 100);
          const lab = `${r.region} ${r.n}${r.basis ? ", " + r.basis : ""} · ${name}`;
          return <i key={cls} className={`rb-bar ${cls}`} style={{ left: `${a}%`, width: `${Math.max(0.6, b - a)}%`, "--i": i } as React.CSSProperties}
            tabIndex={0} role="img" aria-label={`${pc(v)}, ${lab}`} data-tip-v={pc(v)} data-tip-l={lab} />;
        };
        const label = r.prior != null ? (r.priorLabel === "previous" ? "Previous" : r.priorLabel) : "Previous";
        return (
          <div key={r.region + r.n} className="rb-row" role="listitem">
            <div className="rb-name">
              <b>{r.region === "India" ? "" : r.region + " "}{r.n}</b><Src k={r.src} />
              <span className="rb-basis">{r.region === "India" ? "India" : ""}{r.basis ? `${r.region === "India" ? " · " : ""}${r.basis}` : ""}</span>
            </div>
            <div className="rb-lane">
              {vals.length ? <i className="rb-zero" style={{ left: `${z}%` }} /> : null}
              {bar(r.prior, "is-prior", label, 0)}
              {bar(r.forecast, "is-fc", "Forecast", 1)}
              {bar(r.latest, "is-latest", "Latest", 2)}
              {r.latest == null && (
                <span className={`rb-slot${r.due ? " is-due" : ""}`}>{r.due ? `Latest due ${r.due}` : <><span className="bw-na">n/a</span>{r.note ? ` · ${r.note}` : ""}</>}</span>
              )}
            </div>
            <div className="rb-vals">
              <span className="rb-latest">{r.latest == null ? <span className="bw-na">{r.due ? "Due" : "n/a"}</span> : pc(r.latest)}</span>
              <span className="rb-cmp">
                {r.latest != null && r.forecast != null ? <span>{pp(r.latest - r.forecast)} vs forecast</span> : <span>Forecast {r.forecast == null ? <span className="bw-na">n/a</span> : pc(r.forecast)}</span>}
                {r.latest != null && r.prior != null ? <span>{pp(r.latest - r.prior)} vs {label}</span> : <span>{label} {r.prior == null ? <span className="bw-na">n/a</span> : pc(r.prior)}</span>}
              </span>
            </div>
            <div className={`rb-impact tone-${r.tone}`}>{IMPACT[r.tone]}</div>
          </div>
        );
      })}
    </RiseBox>
  );
}
