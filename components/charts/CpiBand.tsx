"use client";
import { useWidth } from "./usePlot";

/** India CPI against the RBI's 2–6% tolerance band and 4% target, on a linear 0–10% axis. */
export function CpiBand({ sep, oct, food }: { sep: number; oct: number; food: number }) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const W = w || 520, H = 168, l = 20, r = 24, y0 = 82;
  const x = (v: number) => l + (v / 10) * (W - l - r);
  // [value, label, mark class, label above?, readout name]
  const marks: [number, string, string, boolean, string][] = [
    [sep, `Sep ${sep}%`, "bw-comp", false, "September CPI"],
    [oct, `Oct ${oct}%`, "bw-now", true, "October CPI"],
    [food, `Food ${food}%`, "bw-comp", true, "October food inflation"],
  ];
  return (
    <div className="bw-plot" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img"
        aria-label={`India CPI: September ${sep}%, October ${oct}%, food ${food}%, against the RBI band of 2 to 6% and its 4% target`}>
        <rect x={x(2)} y={y0 - 20} width={x(6) - x(2)} height={40} className="cpi-band" />
        <text x={(x(2) + x(6)) / 2} y={y0 - 28} textAnchor="middle" className="bw-tick">RBI tolerance band 2–6%</text>
        <line x1={x(6)} x2={x(6)} y1={y0 - 20} y2={y0 + 20} className="bw-tickline is-edge" />
        <line x1={x(4)} x2={x(4)} y1={y0 - 20} y2={y0 + 20} className="bw-base" />
        <text x={x(4)} y={y0 + 34} textAnchor="middle" className="bw-tick">Target 4%</text>
        <line x1={x(0)} x2={x(10)} y1={y0 + 48} y2={y0 + 48} className="bw-grid" />
        {[0, 2, 4, 6, 8, 10].map((v) => (
          <g key={v}>
            <line x1={x(v)} x2={x(v)} y1={y0 + 45} y2={y0 + 51} className="bw-tickline" />
            <text x={x(v)} y={y0 + 66} textAnchor={v === 0 ? "start" : v === 10 ? "end" : "middle"} className="bw-tick">{v}%</text>
          </g>
        ))}
        {marks.map(([v, lab, cls, up, name]) => (
          <g key={lab}>
            <circle cx={x(v)} cy={y0} r={5} className={cls} tabIndex={0} data-tip-v={`${v}%`} data-tip-l={`${name} · RBI band 2–6%, target 4%`} />
            <text x={x(v)} y={up ? y0 - 12 : y0 + 20} textAnchor="middle" className="bw-label">{lab}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
