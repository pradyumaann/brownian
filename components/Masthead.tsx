"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Freshness } from "./Freshness";
import { ThemeToggle } from "./ThemeToggle";

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Night: teal, violet, rose, orange, gold (the header design). Paper: electric azure, violet, hot pink, neon orange,
// neon green (--mast-1…5). At rest each bar takes one colour; with motion allowed the colours roll through the bars
// (bw-mast-hue) and each bar's text colour (--mast-ink-1…5) changes with it so it reads on every colour.
const FILL = ["var(--mast-1)", "var(--mast-2)", "var(--mast-3)", "var(--mast-4)", "var(--mast-5)"];
const INK = ["var(--mast-ink-1)", "var(--mast-ink-2)", "var(--mast-ink-3)", "var(--mast-ink-4)", "var(--mast-ink-5)"];

export interface MastProps {
  /** The Wander Index for the last five sessions (ISO date, 0–100). */
  bars: { date: string; score: number }[];
  dateLabel: string;
  open: string;
  close: string;
}

/** The day line, from the brief: date · brief time (or "as of" after the open) · NSE open · close, all IST. */
function DayLine({ dateLabel, open, close }: Omit<MastProps, "bars">) {
  return (
    <p className="mast-day-line">
      <span>{dateLabel} · <Freshness /></span>
      <span className="mast-hours">Open {open} · Close {close}</span>
    </p>
  );
}

/** The Brownian header. On Markets, Overnight it is the full header of the device showcase: the day line, the
 *  wordmark and the tagline, with the Wander Index's last five sessions as five bars beside them on wider screens. Every other view gets a compact bar: wordmark, day line and the theme switch. */
export function Masthead(p: MastProps) {
  const path = usePathname() ?? "/";
  const home = path === "/" || path === "";
  if (!home) {
    return (
      <header className="mast-c">
        <Link href="/" className="mast-c-mark">Brownian</Link>
        <DayLine {...p} />
        <ThemeToggle />
      </header>
    );
  }
  return (
    <header className="mast is-full">
      <Field />
      <div className="mast-top">
        <DayLine {...p} />
        <ThemeToggle />
      </div>
      <div className="mast-body">
        <div className="mast-text">
          <p className="mast-mark">Brownian</p>
          <p className="mast-tag">Markets wander. You don&apos;t have to.</p>
        </div>
        <Bars bars={p.bars} />
      </div>
    </header>
  );
}

/** A quiet grid of plus marks over the whole header, as in the design. Each one slowly shrinks and grows, a little
 *  out of step with its neighbours (CSS only, and only when motion is allowed). The bars sit on top of it, so the
 *  marks show above and around them. Decorative: hidden from assistive technology. */
const COLS = 30, ROWS = 8, STEP = 64;
function Field() {
  return (
    <svg className="mast-field" viewBox={`0 0 ${COLS * STEP} ${ROWS * STEP + 8}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => {
        const x = STEP / 2 + c * STEP, y = STEP / 2 + r * STEP;
        return <path key={`${r}-${c}`} className="mast-plus" style={{ "--i": (c * 7 + r * 13) % 17 } as React.CSSProperties} d={`M${x - 5} ${y}h10M${x} ${y - 5}v10`} />;
      }))}
    </svg>
  );
}

/** The Wander Index for the last five sessions as five bars on a 0–100 scale from zero (a taller bar is a higher
 *  reading). Each bar is labelled with its day and value, so the colours only tell the days apart. */
function Bars({ bars }: { bars: MastProps["bars"] }) {
  const W = 480, H = 200, bw = W / 5;
  const dow = (d: string) => DAY[new Date(d + "T00:00:00Z").getUTCDay()];
  return (
    <svg className="mast-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMaxYMax meet" role="img"
      aria-label={`Wander Index, last five sessions: ${bars.map((b) => `${dow(b.date)} ${b.date.slice(8)} ${Math.round(b.score)}`).join(", ")}`}>
      {bars.map((b, i) => {
        const h = (b.score / 100) * H;
        return (
          <g key={b.date} className="mast-bar" style={{ "--i": i } as React.CSSProperties} tabIndex={0} data-tip-v={`${Math.round(b.score)}`} data-tip-l={`Wander Index · ${dow(b.date)} ${Number(b.date.slice(8))}`}>
            <rect x={i * bw} y={H - h} width={bw} height={h} fill={FILL[i]} />
            <text x={i * bw + 10} y={H - h + 20} className="mast-val" fill={INK[i]}>{Math.round(b.score)}</text>
            <text x={i * bw + 10} y={H - 8} className="mast-day" fill={INK[i]}>{dow(b.date)} {Number(b.date.slice(8))}</text>
          </g>
        );
      })}
    </svg>
  );
}
