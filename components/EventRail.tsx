import type { CalendarItem } from "@/data/types";
import { Chip } from "./Chip";
import { Rail } from "./Rail";
import { daysBetween, distanceLabel } from "@/lib/clock";

const LINEAR_DAYS = 7;   // the first week is drawn at one scale ...
const PX_PER_DAY = 14;   // ... 14px of rail per day, floored so cards never touch
const COMPRESS = 0.3;    // ... and beyond it each day counts for 30% as much, with a visible break

/** Rail distance for a day offset from the brief date: linear for the first 7 days, compressed after. */
const railPos = (d: number) => (d <= LINEAR_DAYS ? d : LINEAR_DAYS + (d - LINEAR_DAYS) * COMPRESS);

/** The dates that can move a portfolio, on a vertical rail where position is days from the brief's date. Only rows with a
 *  firm date are plotted; the rest sit in a "No exact date" group beneath, never placed or estimated. Distances are
 *  computed from `briefDate` with UTC arithmetic, never from the build clock. */
export function EventRail({ events, briefDate, extra }: {
  events: CalendarItem[]; briefDate: string;
  /** Optional line under a dated event (Portfolio Lens uses it for neutral relevance chips). Absent on Macro Watch. */
  extra?: (e: CalendarItem) => React.ReactNode;
}) {
  const dated = events.filter((e) => e.date).map((e) => ({ e, d: daysBetween(briefDate, e.date!) }))
    .sort((a, b) => a.d - b.d);
  const undated = events.filter((e) => !e.date);
  const items: React.ReactNode[] = [];
  dated.forEach(({ e, d }, i) => {
    const next = dated[i + 1];
    const crossing = next && d <= LINEAR_DAYS && next.d > LINEAR_DAYS;
    const gap = next ? Math.round(Math.min(64, Math.max(18, (railPos(next.d) - railPos(d)) * PX_PER_DAY))) : 0;
    items.push(
      <li key={e.w + e.t} className={`rail-n is-event${e.today ? " today is-now" : ""}`} style={{ "--gap": `${gap}px`, "--i": i } as React.CSSProperties}>
        <span className="rail-t">
          {(i === 0 || d !== dated[i - 1].d) && <span className="rail-dist">{distanceLabel(d)}</span>}
          <span className="when">{e.w}</span>
        </span>
        <i className="rail-dot" aria-hidden="true" />
        <div className="rail-b">
          <div className="t">{e.t}{e.chip && <Chip tone={e.chip[1]}>{e.chip[0]}</Chip>}</div>
          {e.d && <p className="d">{e.d}</p>}
          {extra?.(e)}
        </div>
      </li>,
    );
    if (crossing) {
      items.push(
        <li key={`break-${i}`} className="rail-n is-break" style={{ "--gap": "18px", "--i": i } as React.CSSProperties}>
          <span className="rail-t bw-mono" />
          <i className="rail-dot" aria-hidden="true" />
          <div className="rail-b"><span className="rail-brk">Spacing is compressed beyond {LINEAR_DAYS} days</span></div>
        </li>,
      );
    }
  });
  return (
    <>
      <Rail className="rail-ev" label="Dated events in order, by days from today">{items}</Rail>
      {undated.length > 0 && (
        <div className="rail-undated">
          <h3 className="sub">No exact date</h3>
          <p className="bw-meta">No firm date has been announced, so these are not placed on the timeline.</p>
          <ul className="tl">
            {undated.map((e) => (
              <li key={e.w + e.t}>
                <span className="when">{e.w}</span>
                <div>
                  <div className="t">{e.t}{e.chip && <Chip tone={e.chip[1]}>{e.chip[0]}</Chip>}</div>
                  {e.d && <p className="d">{e.d}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
