"use client";
import { QUADS } from "@/lib/mood";
import { useWidth } from "./usePlot";

type Key = keyof typeof QUADS;

/** Sentiment against macro pressure: four named phases and one dawn dot for today. */
export function Quadrant({ score, pressure, current }: { score: number; pressure: number; current: string }) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const W = w || 480, H = Math.round(Math.min(Math.max(W * 0.58, 220), 300));
  const l = 30, r = 12, t = 12, b = 34, pw = W - l - r, ph = H - t - b;
  const x = l + pressure * pw, y = t + (1 - score / 100) * ph;
  const cells: [Key, number, number, number, number, "start" | "end"][] = [
    ["supportive", l, t, l + 10, t + 18, "start"],
    ["fragile", l + pw / 2, t, l + pw - 10, t + 18, "end"],
    ["calm", l, t + ph / 2, l + 10, t + ph - 10, "start"],
    ["stress", l + pw / 2, t + ph / 2, l + pw - 10, t + ph - 10, "end"],
  ];
  return (
    <div className="bw-plot" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img"
        aria-label={`Sentiment ${score} of 100 against macro pressure ${Math.round(pressure * 100)}%: ${current}`}>
        {cells.map(([k, cx, cy]) => (
          <rect key={k} x={cx} y={cy} width={pw / 2} height={ph / 2} fill="transparent" tabIndex={0}
            data-tip-v={QUADS[k].name} data-tip-l={QUADS[k].short} />
        ))}
        <rect x={l} y={t} width={pw} height={ph} className="bw-grid" />
        <line x1={l + pw / 2} x2={l + pw / 2} y1={t} y2={t + ph} className="bw-grid" />
        <line x1={l} x2={l + pw} y1={t + ph / 2} y2={t + ph / 2} className="bw-grid" />
        {cells.map(([k, , , qx, qy, a]) => (
          <text key={k} x={qx} y={qy} textAnchor={a} className={QUADS[k].name === current ? "bw-label" : "bw-label is-muted"}>
            {QUADS[k].name}
          </text>
        ))}
        <text x={l + pw / 2} y={H - 10} textAnchor="middle" className="bw-axis">Macro pressure →</text>
        <text x={12} y={t + ph / 2} textAnchor="middle" className="bw-axis" transform={`rotate(-90 12 ${t + ph / 2})`}>Sentiment → greed</text>
        <g tabIndex={0} data-tip-v={`Sentiment ${score} · pressure ${Math.round(pressure * 100)}%`} data-tip-l={`Today: ${current}`}>
          <circle cx={x} cy={y} r={10} className="bw-now" opacity={0.25} />
          <circle cx={x} cy={y} r={4.5} className="bw-now" />
        </g>
        <text x={x - 14} y={y + 4} textAnchor="end" className="bw-label">Today</text>
      </svg>
    </div>
  );
}
