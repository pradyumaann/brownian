"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { BrandMark } from "./BrandMark";
import { Freshness } from "./Freshness";
import { ThemeToggle } from "./ThemeToggle";
import { useMastProgress } from "./useMastProgress";

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

/** The Brownian header: one set of elements for every view, so the full header and the slim bar are the same
 *  wordmark, bars, day line and switch in two states. The header is sticky; `useMastProgress` writes --p (0 full,
 *  1 slim) from the scroll position on Markets, Overnight, and animates it when you move to or from another view.
 *  CSS turns --p into transforms (see "Brownian header" in globals.css). Other views sit at --p: 1 from the first paint. */
export function Masthead(p: MastProps) {
  const path = usePathname() ?? "/";
  const home = path === "/" || path === "";
  const ref = useRef<HTMLElement>(null);
  useMastProgress(ref, home);
  return (
    <header ref={ref} className="mast" data-away={home ? undefined : ""}>
      <div className="mast-in">
        <Field />
        <Link href="/" className="mast-mark" tabIndex={home ? -1 : undefined} aria-current={home ? "page" : undefined}><BrandMark className="mast-logo" />Brownian</Link>
        <p className="mast-tag">Markets wander. You don&apos;t have to.</p>
        <div className="mast-dl"><DayLine {...p} /></div>
        <div className="mast-tog"><ThemeToggle /></div>
        <Bars bars={p.bars} />
        <Bars bars={p.bars} compact />
      </div>
    </header>
  );
}

/** A quiet grid of plus marks over the whole header, as in the design. Each one slowly shrinks and grows, a little
 *  out of step with its neighbours (CSS only, and only when motion is allowed). Each mark is its own tiny box (HTML, because SVG roots are not composited) so the
 *  pulse is a compositor-only transform and opacity animation (one big SVG repainted 240 paths every frame and
 *  restyled them all). The bars sit on top of it, so the marks show above and around them. Decorative: hidden from
 *  assistive technology. Positions are on a 1920x520 grid; CSS scales it to cover the header (see .mast-field). */
const COLS = 30, ROWS = 8, STEP = 64;
function Field() {
  return (
    <div className="mast-field" aria-hidden="true">
      {Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => (
        <i key={`${r}-${c}`} className="mast-plus" style={{ "--i": (c * 7 + r * 13) % 17, "--x": STEP / 2 + c * STEP, "--y": STEP / 2 + r * STEP } as React.CSSProperties} />
      )))}
    </div>
  );
}

/** The Wander Index for the last five sessions as five bars on a 0–100 scale from zero (a taller bar is a higher
 *  reading). Each bar is labelled with its day and value, so the colours only tell the days apart.
 *  Two variants share the data: the wide one (480×200) beside the words, and under 620px a `compact` strip (480×150,
 *  larger in-SVG text so it still reads at phone width). CSS shows one and `display: none` hides the other, which also
 *  removes it from the accessibility tree, so the bars are announced once and tabbed once. */
function Bars({ bars, compact = false }: { bars: MastProps["bars"]; compact?: boolean }) {
  const W = 480, H = compact ? 150 : 200, bw = W / 5;
  const dow = (d: string) => DAY[new Date(d + "T00:00:00Z").getUTCDay()];
  return (
    <svg className={compact ? "mast-art mast-art-c" : "mast-art mast-art-w"} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio={compact ? "xMidYMax meet" : "xMaxYMax meet"} role="img"
      aria-label={`Wander Index, last five sessions: ${bars.map((b) => `${dow(b.date)} ${b.date.slice(8)} ${Math.round(b.score)}`).join(", ")}`}>
      {bars.map((b, i) => {
        const h = (b.score / 100) * H;
        // Compact: the value sits at the top of its bar, but never lower than the day label's line.
        const vy = compact ? Math.min(H - h + 26, H - 38) : H - h + 20;
        return (
          <g key={b.date} className="mast-bar" style={{ "--i": i } as React.CSSProperties} tabIndex={0} data-tip-v={`${Math.round(b.score)}`} data-tip-l={`Wander Index · ${dow(b.date)} ${Number(b.date.slice(8))}`}>
            <rect x={i * bw} y={H - h} width={bw} height={h} fill={FILL[i]} />
            <text x={i * bw + 10} y={vy} className="mast-val" fill={INK[i]}>{Math.round(b.score)}</text>
            <text x={i * bw + 10} y={H - (compact ? 10 : 8)} className="mast-day" fill={INK[i]}>{dow(b.date)} {Number(b.date.slice(8))}</text>
          </g>
        );
      })}
    </svg>
  );
}
