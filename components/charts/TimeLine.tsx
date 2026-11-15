"use client";
import { useWidth } from "./usePlot";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const label = (d: string) => `${Number(d.slice(8))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;

export interface Band { from: number; to: number; name: string }

/** A 0–100 reading over time: one line, named bands as hairlines, today as the dawn dot.
 *  Every day is a hover or tap readout; the latest point is also reachable by keyboard. Gaps stay gaps. */
export function TimeLine({ points, bands = [], label: aria, unit = "", decimals = 0 }: {
  points: { date: string; value: number | null }[]; bands?: Band[]; label: string; unit?: string; decimals?: number;
}) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const W = w || 640, H = W < 480 ? 220 : 260, l = 92, r = 16, t = 14, b = 30;
  const n = points.length, X = (i: number) => l + (i / Math.max(1, n - 1)) * (W - l - r), Y = (v: number) => t + (1 - v / 100) * (H - t - b);
  // The line and the area beneath it: one run per unbroken stretch of data, so gaps stay gaps.
  let d = "", area = "", pen = false, runStart = 0;
  points.forEach((p, i) => {
    if (p.value == null) { if (pen) area += `L${X(i - 1).toFixed(1)} ${Y(0)}L${X(runStart).toFixed(1)} ${Y(0)}Z`; pen = false; return; }
    if (!pen) { runStart = i; area += `M${X(i).toFixed(1)} ${Y(0)}`; }
    d += `${pen ? "L" : "M"}${X(i).toFixed(1)} ${Y(p.value).toFixed(1)}`;
    area += `L${X(i).toFixed(1)} ${Y(p.value).toFixed(1)}`;
    pen = true;
  });
  if (pen) area += `L${X(points.length - 1).toFixed(1)} ${Y(0)}L${X(runStart).toFixed(1)} ${Y(0)}Z`;
  const gid = `tl-${aria.replace(/[^a-z]/gi, "").slice(0, 24)}`;
  const lastI = points.findLastIndex((p) => p.value != null), last = points[lastI];
  // One tick at the first session of each year; quarters too when the window is short.
  const ticks = points.map((p, i) => ({ p, i })).filter(({ p, i }) => i > 0 && (p.date.slice(0, 4) !== points[i - 1].date.slice(0, 4) || (n < 400 && p.date.slice(5, 7) !== points[i - 1].date.slice(5, 7) && ["01", "04", "07", "10"].includes(p.date.slice(5, 7)))));
  const fmt = (v: number) => v.toFixed(decimals) + unit;
  const step = Math.max(1, Math.ceil(n / 260));
  return (
    <div className="bw-plot" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`${aria}. Latest ${last ? fmt(last.value!) + " on " + label(last.date) : "n/a"}.`}>
        {bands.map((bd) => (
          <g key={bd.name}>
            {bd.from > 0 && <line x1={l} x2={W - r} y1={Y(bd.from)} y2={Y(bd.from)} className="bw-grid" />}
            <text x={l - 10} y={Y((bd.from + Math.min(100, bd.to)) / 2) + 3} textAnchor="end" className={last && last.value! >= bd.from && last.value! < bd.to ? "bw-band is-on" : "bw-band"}>{bd.name}</text>
          </g>
        ))}
        {!bands.length && [0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={l} x2={W - r} y1={Y(v)} y2={Y(v)} className={v === 50 ? "bw-base" : "bw-grid"} />
            <text x={l - 10} y={Y(v) + 3} textAnchor="end" className="bw-tick">{v}</text>
          </g>
        ))}
        {ticks.map(({ p, i }) => (
          <g key={p.date}>
            <line x1={X(i)} x2={X(i)} y1={H - b} y2={H - b + 4} className="bw-tickline" />
            <text x={X(i)} y={H - 10} textAnchor="middle" className="bw-tick">{p.date.slice(5, 7) === "01" ? p.date.slice(0, 4) : `${MONTHS[Number(p.date.slice(5, 7)) - 1]} ${p.date.slice(2, 4)}`}</text>
          </g>
        ))}
        <line x1={l} x2={W - r} y1={H - b} y2={H - b} className="bw-grid" />
        <defs>
          {/* Colour encodes the value: the spec ramp runs from 0 (violet) at the floor to 100 (light gold) at the top. */}
          <linearGradient id={`${gid}-line`} gradientUnits="userSpaceOnUse" x1="0" y1={Y(0)} x2="0" y2={Y(100)}>
            {[1, 2, 3, 4, 5, 6].map((k, i) => <stop key={k} offset={i / 5} style={{ stopColor: `var(--spec-${k})` }} />)}
          </linearGradient>
          <linearGradient id={`${gid}-area`} gradientUnits="userSpaceOnUse" x1="0" y1={Y(100)} x2="0" y2={Y(0)}>
            <stop offset="0" style={{ stopColor: "var(--spec-5)", stopOpacity: 0.32 }} />
            <stop offset="1" style={{ stopColor: "var(--spec-1)", stopOpacity: 0 }} />
          </linearGradient>
          <filter id={`${gid}-glow`} x="-5%" y="-20%" width="110%" height="140%">
            <feGaussianBlur stdDeviation="2.4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d={area} fill={`url(#${gid}-area)`} className="tl-area" />
        <path d={d} fill="none" stroke={`url(#${gid}-line)`} strokeWidth={1.75} strokeLinejoin="round" filter={`url(#${gid}-glow)`} pathLength={1} className="tl-line" />
        {points.map((p, i) => (p.value == null || i % step ? null : (
          <rect key={p.date} x={X(i) - (W - l - r) / n * step / 2} y={t} width={Math.max(1, (W - l - r) / n * step)} height={H - t - b}
            fill="transparent" data-tip-v={fmt(p.value)} data-tip-l={label(p.date)} />
        )))}
        {last && <circle cx={X(lastI)} cy={Y(last.value!)} r={4} className="bw-now" tabIndex={0} data-tip-v={fmt(last.value!)} data-tip-l={`${label(last.date)} · latest`} />}
      </svg>
    </div>
  );
}
