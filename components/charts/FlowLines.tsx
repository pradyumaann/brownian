"use client";
import { crore } from "@/lib/format";
import { useWidth } from "./usePlot";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (d: string) => `${Number(d.slice(8))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
const month = (d: string) => `${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;

export interface Line { name: string; cat: number; values: (number | null)[] }
export interface Note { i: number; line: number; text: string }

/** Cumulative flows drawn as a metro map, after the Intel "Internet of Things" inspiration. Each line is sampled at
 *  month ends (stations) and runs between them only horizontally or at 45°, so the vertical distance between two
 *  stations is the month's net flow, exactly to scale. Notes sit in pill labels on leader lines (three at most).
 *  Hover or tap any month for every line's value; stations at line ends are keyboard-reachable. */
export function FlowLines({ dates, lines, notes = [], label }: { dates: string[]; lines: Line[]; notes?: Note[]; label: string }) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const W = w || 720, phone = W < 480, H = phone ? 340 : 420, l = phone ? 8 : 12, r = phone ? 104 : 148, t = 26, b = 34;
  // Month-end stations: the last reporting day of each month.
  const st = dates.map((d, i) => ({ d, i })).filter(({ d, i }) => i === dates.length - 1 || dates[i + 1].slice(0, 7) !== d.slice(0, 7));
  const all = lines.flatMap((s) => st.map(({ i }) => s.values[i]).filter((v): v is number => v != null));
  const lo = Math.min(0, ...all), hi = Math.max(0, ...all), span = hi - lo || 1;
  const n = st.length, X = (k: number) => l + (k / Math.max(1, n - 1)) * (W - l - r), Y = (v: number) => t + ((hi - v) / span) * (H - t - b);
  const raw = span / 4, mag = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const grid: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) grid.push(v);
  // Metro routing between stations: level first, then 45°, then straight down or up for any remainder.
  const route = (pts: [number, number][]) => pts.map(([x, y], k) => {
    if (!k) return `M${x.toFixed(1)} ${y.toFixed(1)}`;
    const [px, py] = pts[k - 1], dx = x - px, dy = y - py, dd = Math.min(Math.abs(dy), dx);
    return `H${(x - dd).toFixed(1)}L${x.toFixed(1)} ${(py + Math.sign(dy) * dd).toFixed(1)}V${y.toFixed(1)}`;
  }).join("");
  const ends = lines.map((s, k) => { const j = st.findLastIndex(({ i }) => s.values[i] != null); const v = s.values[st[j].i]!; return { k, j, v, y: Y(v) }; }).sort((a, c) => a.y - c.y);
  for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 30) ends[k].y = ends[k - 1].y + 30;
  const years = st.map(({ d }, k) => ({ d, k })).filter(({ d, k }) => k > 0 && d.slice(0, 4) !== st[k - 1].d.slice(0, 4));
  const quarters = st.map(({ d }, k) => ({ d, k })).filter(({ d }) => ["03", "06", "09", "12"].includes(d.slice(5, 7)));
  const nearest = (i: number) => { let best = 0; st.forEach((s, k) => { if (Math.abs(s.i - i) < Math.abs(st[best].i - i)) best = k; }); return best; };
  return (
    <div className="bw-plot" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img"
        aria-label={`${label}. ${lines.map((s) => { const j = s.values.findLastIndex((v) => v != null); return `${s.name} ${crore(s.values[j]!)} by ${day(dates[j])}`; }).join("; ")}.`}>
        <defs>
          <filter id="metro-glow" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="2.6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {quarters.map(({ d, k }) => <line key={d} x1={X(k)} x2={X(k)} y1={t} y2={H - b} className="bw-grid" />)}
        {grid.map((v) => (
          <g key={v}>
            <line x1={l} x2={W - r} y1={Y(v)} y2={Y(v)} className={v === 0 ? "bw-base" : "bw-grid"} />
            <text x={l + 2} y={Y(v) - 5} className="bw-tick">{v === 0 ? "0" : crore(v)}</text>
          </g>
        ))}
        {years.map(({ d, k }) => (
          <text key={d} x={X(k)} y={H - 12} textAnchor="middle" className="bw-label">{d.slice(0, 4)}</text>
        ))}
        {st.map(({ d, i }, k) => (
          <rect key={d} x={X(k) - (W - l - r) / n / 2} y={t} width={(W - l - r) / n} height={H - t - b} fill="transparent"
            data-tip-v={month(d)} data-tip-l={lines.map((s) => `${s.name} ${s.values[i] == null ? "n/a" : crore(s.values[i]!)}`).join(" · ")} />
        ))}
        {lines.map((s, li) => {
          const pts = st.map(({ i }, k) => (s.values[i] == null ? null : ([X(k), Y(s.values[i]!)] as [number, number]))).filter((p): p is [number, number] => !!p);
          return <path key={s.name} d={route(pts)} className="bw-glowline" stroke={`var(--cat-${s.cat})`} filter="url(#metro-glow)" pathLength={1} style={{ strokeWidth: phone ? 2.2 : 3, "--d": `${li * 0.35}s` } as React.CSSProperties} />;
        })}
        {lines.map((s) => st.map(({ d, i }, k) => (s.values[i] == null || !["03", "06", "09", "12"].includes(d.slice(5, 7)) ? null : (
          <circle key={s.name + d} cx={X(k)} cy={Y(s.values[i]!)} r={phone ? 2.5 : 3.2} className="bw-station pop" stroke={`var(--cat-${s.cat})`} />
        ))))}
        {notes.slice(0, 3).map((nt, ni) => {
          const k = nearest(nt.i), v = lines[nt.line].values[nt.i]!, x = X(k), y = Y(lines[nt.line].values[st[k].i]!);
          const up = ni % 2 === 0 ? y > t + 70 : false, ly = up ? y - 40 : y + 44, tw = nt.text.length * 6 + 20, bx = Math.min(Math.max(x - tw / 2, l), W - r - tw);
          return (
            <g key={nt.text}>
              <line x1={x} x2={x} y1={y} y2={up ? ly + 11 : ly - 11} stroke={`var(--cat-${lines[nt.line].cat})`} strokeWidth={1.25} />
              <circle cx={x} cy={y} r={5} className="bw-station" stroke={`var(--cat-${lines[nt.line].cat})`} tabIndex={0} data-tip-v={crore(v)} data-tip-l={nt.text} />
              <rect x={bx} y={ly - 11} width={tw} height={22} rx={11} className="bw-pill-box" stroke={`var(--cat-${lines[nt.line].cat})`} />
              <text x={bx + tw / 2} y={ly + 4} textAnchor="middle" className="bw-pill-text">{nt.text}</text>
            </g>
          );
        })}
        {ends.map((e) => (
          <g key={e.k}>
            <circle cx={X(e.j)} cy={Y(e.v)} r={6} className="bw-station" stroke={`var(--cat-${lines[e.k].cat})`} tabIndex={0}
              data-tip-v={crore(e.v)} data-tip-l={`${lines[e.k].name}, cumulative to ${day(st[e.j].d)}`} />
            <text x={X(e.j) + 12} y={e.y - 2} className="bw-label" style={{ fontWeight: 600 }}>{lines[e.k].name}</text>
            <text x={X(e.j) + 12} y={e.y + 12} className="bw-tick">{crore(e.v)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
