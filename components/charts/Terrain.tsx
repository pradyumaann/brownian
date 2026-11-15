"use client";
import { crore } from "@/lib/format";
import { useWidth } from "./usePlot";

/** The neon ramp (design/brownian.css, --neon-0…6): violet → magenta → orange → yellow → white on Night; on Paper the
 *  same hues, darker, so the largest flows read as the strongest marks. t in [0, 1]. */
const neon = (t: number) => {
  const u = Math.max(0, Math.min(1, t)) * 6, k = Math.min(5, Math.floor(u)), f = Math.round((u - k) * 100);
  return f === 0 ? `var(--neon-${k})` : `color-mix(in oklab, var(--neon-${k}) ${100 - f}%, var(--neon-${k + 1}))`;
};

/** Sector × fortnight flow terrain in an oblique 3D projection. Each bar is one sector's net FPI equity flow for one
 *  fortnight: it rises above the floor for net buying and hangs below it for net selling, so direction is read from
 *  position, not colour. Colour runs the neon ramp by size (the largest flow, either way, is the brightest), on a
 *  restrained glow on Night and crisp on Paper. Rows are drawn back to front. Hover or tap a bar for its value; tab to
 *  a sector row for its total. Phones draw the eight largest sectors (the table under the chart has every one). */
export function Terrain({ sectors, labels, z, label }: { sectors: string[]; labels: string[]; z: (number | null)[][]; label: string }) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const W = w || 720, phone = W < 480;
  const ns = phone ? Math.min(8, sectors.length) : sectors.length, nt = labels.length;
  const S = sectors.slice(0, ns), Z = z.slice(0, ns);
  const max = Math.max(1, ...Z.flat().filter((v): v is number => v != null).map(Math.abs));
  const left = phone ? 6 : 12, right = phone ? 120 : 132, b = phone ? 6 : 11, c = phone ? 15 : 22, zh = phone ? 72 : 140;
  const a = (W - left - right - (ns - 1) * b) / Math.max(1, nt - 1);
  const top = 22 + zh, floorFront = top + (ns - 1) * c, H = floorFront + zh + 34;
  const P = (t: number, s: number) => [left + t * a + s * b, floorFront - s * c];
  const k = zh / max, bw = Math.max(1.4, Math.min(a * 0.72, 8));
  // Date labels at least 72px apart, always including the first and the last.
  const ticks: number[] = [];
  for (let t = 0; t < nt; t++) if (!ticks.length || P(t, 0)[0] - P(ticks.at(-1)!, 0)[0] >= (phone ? 100 : 72)) ticks.push(t);
  if (ticks.at(-1) !== nt - 1) { if (P(nt - 1, 0)[0] - P(ticks.at(-1)!, 0)[0] < (phone ? 100 : 72)) ticks.pop(); ticks.push(nt - 1); }
  const total = (s: number) => Z[s].reduce<number>((x, v) => x + (v ?? 0), 0);
  return (
    <div className="bw-plot" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" className="terrain" aria-label={label}>
        <defs>
          <filter id="terrain-glow" x="-50%" y="-20%" width="200%" height="140%">
            <feGaussianBlur stdDeviation={phone ? 1.2 : 1.8} result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* floor: one hairline per sector row, plus the front and back edges of the time axis */}
        {S.map((_, s) => { const [x1, y1] = P(0, s), [x2, y2] = P(nt - 1, s); return <line key={s} x1={x1} y1={y1} x2={x2} y2={y2} className="bw-grid" />; })}
        {[0, nt - 1].map((t) => { const [x1, y1] = P(t, 0), [x2, y2] = P(t, ns - 1); return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} className="bw-grid" />; })}
        {[...S.keys()].reverse().map((s) => (
          <g key={s} className="tr-row" data-row={S[s]} tabIndex={0} style={{ "--r": ns - 1 - s } as React.CSSProperties}
            data-tip-v={crore(total(s))} data-tip-l={`${S[s]} · ${labels[0]} to ${labels[nt - 1]}, net`}>
            <g className="tr-bars" filter="url(#terrain-glow)">
              {Z[s].map((v, t) => {
                if (v == null || v === 0) return null;
                const [x, y] = P(t, s);
                return <line key={t} x1={x} x2={x} y1={y} y2={y - v * k} strokeWidth={bw} stroke={neon(Math.abs(v) / max)} className={v > 0 ? "tb up" : "tb down"} />;
              })}
            </g>
            {/* Wider invisible targets, so a thin bar can be hovered or tapped */}
            {Z[s].map((v, t) => {
              if (v == null || v === 0) return null;
              const [x, y] = P(t, s);
              return <line key={t} x1={x} x2={x} y1={y + (v > 0 ? 2 : -2)} y2={y - v * k} strokeWidth={Math.max(a, 6)} stroke="transparent" className="tr-hit"
                data-tip-v={crore(v)} data-tip-l={`${S[s]} · ${labels[t]}`} />;
            })}
          </g>
        ))}
        {S.map((name, s) => { const [x, y] = P(nt - 1, s); return <text key={name} x={x + 8} y={y + 3} className="bw-label">{name}</text>; })}
        {ticks.map((t) => (
          <text key={t} x={P(t, 0)[0]} y={floorFront + zh + 24} textAnchor={t === nt - 1 ? "end" : t === 0 ? "start" : "middle"} className="bw-tick">{labels[t].replace(/^[\d–]+ /, "")}</text>
        ))}
        <text x={left} y={14} className="bw-axis">{phone ? `↑ buying · ↓ selling · max ${crore(max, false)}` : `↑ net buying · ↓ net selling · ₹ crore, largest ${crore(max, false)}`}</text>
      </svg>
    </div>
  );
}
