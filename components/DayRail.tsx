import { Rail } from "./Rail";
import { Term } from "./Term";
import { hours, mins } from "@/lib/market";
import { clockMins } from "@/lib/clock";

type Row = [string, string, string, string];
type Node = { at: number; time: string; kind: "now" | "mark" | "event"; body: React.ReactNode };

/** One day on a vertical rail, from the brief time: the NSE open and close as markers, then each event at its clock
 *  time (IST; a weekday suffix means the next day). Spacing follows the clock time but is capped, with a floor so
 *  events at the same minute stack cleanly: it is a sequence with proportions, not a scale. Same rows as the table
 *  it replaces: time, event, forecast, previous. The list itself is what a screen reader walks. */
export function DayRail({ rows, briefTime }: { rows: Row[]; briefTime: string }) {
  const nodes: Node[] = [
    { at: clockMins(briefTime) ?? 0, time: briefTime, kind: "now", body: <b>Brief prepared</b> },
    { at: mins(hours.open), time: hours.open, kind: "mark", body: <span>NSE opens</span> },
    { at: mins(hours.close), time: hours.close, kind: "mark", body: <span>NSE closes</span> },
  ];
  rows.forEach(([time, event, fc, prev], i) => {
    const at = clockMins(time);
    if (at == null) return;
    nodes.push({
      at, time, kind: "event",
      body: (
        <>
          <b>{event.includes("PPI") ? <Term id="ppi">{event}</Term> : event}</b>
          {(fc || prev) && (
            <span className="rail-fig">
              {fc && <span>Forecast <span className="bw-mono">{fc}</span></span>}
              {prev && <span>Previous <span className="bw-mono">{prev}</span></span>}
            </span>
          )}
        </>
      ),
    });
    void i;
  });
  nodes.sort((a, b) => a.at - b.at);
  return (
    <Rail className="rail-day" label="The day in IST, from the brief time">
      {nodes.map((n, i) => {
        const next = nodes[i + 1];
        const gap = next ? Math.round(Math.min(56, Math.max(n.kind === "event" ? 16 : 12, (next.at - n.at) * 0.16))) : 0;
        return (
          <li key={i} className={`rail-n is-${n.kind}`} style={{ "--gap": `${gap}px`, "--i": i } as React.CSSProperties}>
            <span className="rail-t bw-mono">{n.time}</span>
            <i className="rail-dot" aria-hidden="true" />
            <div className="rail-b">{n.body}</div>
          </li>
        );
      })}
    </Rail>
  );
}
