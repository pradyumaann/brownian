"use client";
import { useEffect, useState } from "react";
import Brownian from "@/design/brownian-charts";
import { crore } from "@/lib/format";
import { useWidth } from "./usePlot";

/** Sector × fortnight flow terrain in an oblique 3D projection. Each bar is one sector's net FPI equity flow for one
 *  fortnight: it rises for net buying and hangs below the floor for net selling, and its colour runs the `spec` ramp
 *  from the largest sale (dark violet) to the largest purchase (light gold). Rows are drawn back to front. */
export function Terrain({ sectors, labels, z, label }: { sectors: string[]; labels: string[]; z: (number | null)[][]; label: string }) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const [ramp, setRamp] = useState<((t: number) => string) | null>(null);
  useEffect(() => { setRamp(() => (t: number) => Brownian.ramp("spec", t)); }, []);
  const W = w || 720, phone = W < 480;
  const ns = sectors.length, nt = labels.length;
  const all = z.flat().filter((v): v is number => v != null), lo = Math.min(...all), hi = Math.max(...all), max = Math.max(Math.abs(lo), Math.abs(hi)) || 1;
  const left = phone ? 14 : 12, right = phone ? 92 : 132, b = phone ? 5 : 11, c = phone ? 14 : 22, zh = phone ? 80 : 140;
  const a = (W - left - right - (ns - 1) * b) / Math.max(1, nt - 1);
  const top = 20 + zh, floorFront = top + (ns - 1) * c, H = floorFront + zh + 40;
  const P = (t: number, s: number) => [left + t * a + s * b, floorFront - s * c];
  const k = zh / max, bw = Math.max(1.2, Math.min(a * 0.72, 8));
  // Date labels at least 72px apart, always including the first and the last.
  const ticks: number[] = [];
  for (let t = 0; t < nt; t++) if (!ticks.length || P(t, 0)[0] - P(ticks.at(-1)!, 0)[0] >= 72) ticks.push(t);
  if (ticks.at(-1) !== nt - 1) { if (P(nt - 1, 0)[0] - P(ticks.at(-1)!, 0)[0] < 72) ticks.pop(); ticks.push(nt - 1); }
  return (
    <div className="bw-plot" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" className="terrain" aria-label={label}>
        <defs>
          <filter id="terrain-glow" x="-50%" y="-20%" width="200%" height="140%">
            <feGaussianBlur stdDeviation={phone ? 1.6 : 2.4} result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* floor: one hairline per sector row, plus the front and back edges of the time axis */}
        {sectors.map((_, s) => { const [x1, y1] = P(0, s), [x2, y2] = P(nt - 1, s); return <line key={s} x1={x1} y1={y1} x2={x2} y2={y2} className="bw-grid" />; })}
        {[0, nt - 1].map((t) => { const [x1, y1] = P(t, 0), [x2, y2] = P(t, ns - 1); return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} className="bw-grid" />; })}
        {ramp && [...sectors.keys()].reverse().map((s) => (
          <g key={s} data-row={sectors[s]} filter="url(#terrain-glow)">
            {z[s].map((v, t) => {
              if (v == null || v === 0) return null;
              const [x, y] = P(t, s), up = v > 0;
              return <line key={t} x1={x} x2={x} y1={y} y2={y - v * k} strokeWidth={bw} stroke={ramp((v - lo) / (hi - lo || 1))}
                className={up ? "tb up" : "tb down"} opacity={up ? 1 : 0.8} data-tip-v={crore(v)} data-tip-l={`${sectors[s]} · ${labels[t]}`} />;
            })}
          </g>
        ))}
        {sectors.map((name, s) => { const [x, y] = P(nt - 1, s); return <text key={name} x={x + 8} y={y + 3} className="bw-label">{name}</text>; })}
        {ticks.map((t) => (
          <text key={t} x={P(t, 0)[0]} y={floorFront + zh + 26} textAnchor={t === nt - 1 ? "end" : t === 0 ? "start" : "middle"} className="bw-tick">{labels[t].replace(/^[\d–]+ /, "")}</text>
        ))}
        <text x={left} y={14} className="bw-axis">{phone ? `↑ buying · ↓ selling · max ${crore(max, false)}` : `↑ net buying · ↓ net selling · ₹ crore, largest ${crore(max, false)}`}</text>
      </svg>
    </div>
  );
}
