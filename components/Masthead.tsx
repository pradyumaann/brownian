import Link from "next/link";
import { moodSeries } from "@/lib/mood";

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Teal, violet, rose, orange, gold: the order and colours of the header design (Correction folder, 14 Nov 2026).
const FILL = ["var(--cat-1)", "var(--spec-2)", "var(--spec-3)", "var(--spec-4)", "var(--spec-5)"];
const INK = ["var(--on-dawn)", "var(--plot-ink)", "var(--on-dawn)", "var(--on-dawn)", "var(--on-dawn)"];

/** The masthead: the wordmark and tagline, beside the Wander Index for the last five sessions as five bars on a
 *  0–100 scale from zero (a taller bar is a higher reading). Each bar is labelled with its day and value, so the
 *  colours only tell the days apart. The dotted field is a quiet grid of plus marks, as in the design. */
export function Masthead() {
  const pts = moodSeries.slice(-5);
  const W = 480, H = 160, bw = W / 5, plus = 48;
  return (
    <div className="mast">
      <div className="mast-text">
        <Link href="/" className="mast-mark">Brownian</Link>
        <p className="mast-tag">Markets wander. You don&apos;t have to.</p>
      </div>
      <svg className="mast-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMaxYMax meet" role="img"
        aria-label={`Wander Index, last five sessions: ${pts.map((p) => `${DAY[new Date(p.date + "T00:00:00Z").getUTCDay()]} ${p.date.slice(8)} ${Math.round(p.score)}`).join(", ")}`}>
        {/* plus marks only where no bar stands */}
        {pts.flatMap((p, i) => Array.from({ length: 4 }, (_, r) => {
          const y = 14 + r * plus * 0.72, bar = H - (p.score / 100) * H;
          return y < bar - 12 ? <path key={`${i}-${r}`} className="mast-plus" style={{ "--i": i * 4 + r } as React.CSSProperties} d={`M${i * bw + bw / 2 - 4} ${y}h8M${i * bw + bw / 2} ${y - 4}v8`} /> : null;
        }))}
        {pts.map((p, i) => {
          const h = (p.score / 100) * H, dow = DAY[new Date(p.date + "T00:00:00Z").getUTCDay()];
          return (
            <g key={p.date} className="mast-bar" style={{ "--i": i } as React.CSSProperties} tabIndex={0} data-tip-v={`${Math.round(p.score)}`} data-tip-l={`Wander Index · ${dow} ${Number(p.date.slice(8))}`}>
              <rect x={i * bw} y={H - h} width={bw} height={h} fill={FILL[i]} />
              <text x={i * bw + 10} y={H - h + 20} className="mast-val" fill={INK[i]}>{Math.round(p.score)}</text>
              <text x={i * bw + 10} y={H - 8} className="mast-day" fill={INK[i]}>{dow} {Number(p.date.slice(8))}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
