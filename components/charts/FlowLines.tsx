"use client";
import { crore } from "@/lib/format";
import { useWidth } from "./usePlot";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (d: string) => `${Number(d.slice(8))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;

export interface Line { name: string; cat: number; values: (number | null)[] }
export interface Note { i: number; line: number; text: string }

/** Cumulative flows as lines on one ₹ scale, each named at its end; up to three notes on leader lines.
 *  Hover or tap any day for every line's value; the line ends are keyboard-reachable. */
export function FlowLines({ dates, lines, notes = [], label }: { dates: string[]; lines: Line[]; notes?: Note[]; label: string }) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const W = w || 720, H = W < 480 ? 280 : 340, l = 12, r = W < 480 ? 96 : 132, t = 20, b = 30;
  const all = lines.flatMap((s) => s.values.filter((v): v is number => v != null));
  const lo = Math.min(0, ...all), hi = Math.max(0, ...all), span = hi - lo || 1;
  const n = dates.length, X = (i: number) => l + (i / Math.max(1, n - 1)) * (W - l - r), Y = (v: number) => t + ((hi - v) / span) * (H - t - b);
  // Gridlines at round ₹ steps (1, 2 or 5 × 10^k crore).
  const raw = span / 4, mag = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const grid: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) grid.push(v);
  const years = dates.map((d, i) => ({ d, i })).filter(({ d, i }) => i > 0 && d.slice(0, 4) !== dates[i - 1].slice(0, 4));
  const ends = lines.map((s, k) => { const i = s.values.findLastIndex((v) => v != null); return { k, i, v: s.values[i]!, y: Y(s.values[i]!) }; }).sort((a, c) => a.y - c.y);
  for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 28) ends[k].y = ends[k - 1].y + 28; // keep end labels apart
  const cols = Math.max(1, Math.ceil(n / 300));
  return (
    <div className="bw-plot" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img"
        aria-label={`${label}. ${lines.map((s) => { const i = s.values.findLastIndex((v) => v != null); return `${s.name} ${crore(s.values[i]!)} by ${day(dates[i])}`; }).join("; ")}.`}>
        {grid.map((v) => (
          <g key={v}>
            <line x1={l} x2={W - r} y1={Y(v)} y2={Y(v)} className={v === 0 ? "bw-base" : "bw-grid"} />
            <text x={l + 2} y={Y(v) - 4} className="bw-tick">{v === 0 ? "0" : crore(v).replace(" cr", "")}</text>
          </g>
        ))}
        {years.map(({ d, i }) => (
          <g key={d}>
            <line x1={X(i)} x2={X(i)} y1={H - b} y2={H - b + 4} className="bw-tickline" />
            <text x={X(i)} y={H - 10} textAnchor="middle" className="bw-tick">{d.slice(0, 4)}</text>
          </g>
        ))}
        {dates.map((d, i) => (i % cols ? null : (
          <rect key={d} x={X(i) - ((W - l - r) / n) * cols / 2} y={t} width={Math.max(1, ((W - l - r) / n) * cols)} height={H - t - b} fill="transparent"
            data-tip-v={day(d)} data-tip-l={lines.map((s) => `${s.name} ${s.values[i] == null ? "n/a" : crore(s.values[i]!)}`).join(" · ")} />
        )))}
        {lines.map((s) => {
          let d = "", pen = false;
          s.values.forEach((v, i) => { if (v == null) { pen = false; return; } d += `${pen ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`; pen = true; });
          return <path key={s.name} d={d} fill="none" stroke={`var(--cat-${s.cat})`} strokeWidth={1.5} strokeLinejoin="round" />;
        })}
        {notes.slice(0, 3).map((nt) => {
          const v = lines[nt.line].values[nt.i]!, x = X(nt.i), y = Y(v), up = y > t + 60, ly = up ? y - 34 : y + 38;
          return (
            <g key={nt.text}>
              <line x1={x} x2={x} y1={y} y2={ly + (up ? 6 : -14)} className="bw-leader" />
              <circle cx={x} cy={y} r={2.5} fill={`var(--cat-${lines[nt.line].cat})`} />
              <text x={Math.min(Math.max(x, l + 60), W - r - 60)} y={ly} textAnchor="middle" className="bw-label">{nt.text}</text>
            </g>
          );
        })}
        {ends.map((e) => (
          <g key={e.k}>
            <circle cx={X(e.i)} cy={Y(e.v)} r={3} fill={`var(--cat-${lines[e.k].cat})`} tabIndex={0} data-tip-v={crore(e.v)} data-tip-l={`${lines[e.k].name}, cumulative to ${day(dates[e.i])}`} />
            <text x={X(e.i) + 8} y={e.y - 2} className="bw-label">{lines[e.k].name}</text>
            <text x={X(e.i) + 8} y={e.y + 11} className="bw-tick">{crore(e.v)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
