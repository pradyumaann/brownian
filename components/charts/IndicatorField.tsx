"use client";
import { useEffect, useRef, useState } from "react";
import type { FieldBin, FieldRow } from "@/lib/indicatorField";
import { fieldValue } from "@/lib/fieldValue";
import { useWidth } from "./usePlot";

const MINUS = "−";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (d: string) => `${Number(d.slice(8))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
const sign = (v: number) => (v > 0 ? "+" : v < 0 ? MINUS : "");
const arrow = (v: number) => (v > 0 ? "▲" : v < 0 ? "▼" : "");


/** The change on the previous close, signed with ▲/▼ (levels only; flows show their own month instead). */
function change(r: FieldRow) {
  const { v, prev } = r.last;
  if (prev == null || r.kind === "crore") return null;
  const d = v - prev, p = (d / prev) * 100;
  return `${arrow(d)} ${sign(d)}${Math.abs(p).toFixed(2)}%`;
}

/** Five years of the indicators the history store holds, as a lit field: one row per indicator, one column per week
 *  (month on narrow screens). Each column's height and colour are the same number: the share of the five years'
 *  readings at or below that week's (its rank, 0–100), so the rows share one zero-based scale and the brightest,
 *  tallest columns are each indicator's own five-year highs. Every column is a readout (hover, tap, or the arrow keys
 *  within a row); the latest reading per row is printed at the right. A week with no reading draws no column. */
export function IndicatorField({ rows, from, to }: { rows: FieldRow[]; from: string; to: string }) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const W = w || 960;
  const narrow = W < 760, phone = W < 520;
  const R = rows.length;
  // Layout: a left axis for the rank, the field skewed back to the right, the row labels in a column of their own.
  const LW = phone ? 96 : narrow ? 150 : 214, left = phone ? 26 : 32, bottom = 24;
  const skew = phone ? 8 : narrow ? 14 : 22, pitch = phone ? 70 : narrow ? 78 : 88, Zh = phone ? 62 : narrow ? 70 : 80;
  const top = 14 + Math.round(pitch * 0.3);
  const H = top + Zh + (R - 1) * pitch + bottom;
  const binsOf = (r: FieldRow) => (narrow ? r.months : r.weeks);
  const n = binsOf(rows[0]).length;
  const depth = { x: skew * 0.42, y: -pitch * 0.3 };
  const fw = W - LW - left - skew * (R - 1) - depth.x - 10;
  const cw = fw / n, bw = Math.max(1.2, cw * (narrow ? 0.66 : 0.72));
  const floorY = (i: number) => H - bottom - i * pitch;
  const X = (i: number, c: number) => left + i * skew + c * cw;

  // Roving focus: one tab stop per row; arrows move along it (and between rows), Home/End jump to the ends.
  const [cur, setCur] = useState<number[]>(() => rows.map((r) => Math.max(0, binsOf(r).findLastIndex(Boolean))));
  const svg = useRef<SVGSVGElement>(null);
  const moved = useRef<[number, number] | null>(null);
  useEffect(() => { setCur(rows.map((r) => Math.max(0, binsOf(r).findLastIndex(Boolean)))); }, [narrow]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!moved.current) return;
    const [i, c] = moved.current;
    moved.current = null;
    svg.current?.querySelector<SVGGElement>(`[data-cell="${i},${c}"]`)?.focus();
  }, [cur]);
  const onKey = (e: React.KeyboardEvent<SVGSVGElement>) => {
    const t = (e.target as Element).closest?.("[data-cell]");
    if (!t) return;
    const [i, c] = t.getAttribute("data-cell")!.split(",").map(Number);
    const bins = (k: number) => binsOf(rows[k]);
    const step = (k: number, from: number, d: number) => { for (let j = from + d; j >= 0 && j < n; j += d) if (bins(k)[j]) return j; return from; };
    const near = (k: number, at: number) => { for (let d = 0; d < n; d++) { if (bins(k)[at - d]) return at - d; if (bins(k)[at + d]) return at + d; } return at; };
    let ni = i, nc = c;
    if (e.key === "ArrowRight") nc = step(i, c, 1);
    else if (e.key === "ArrowLeft") nc = step(i, c, -1);
    else if (e.key === "End") nc = bins(i).findLastIndex(Boolean);
    else if (e.key === "Home") nc = bins(i).findIndex(Boolean);
    else if (e.key === "ArrowUp" && i < R - 1) { ni = i + 1; nc = near(ni, c); }
    else if (e.key === "ArrowDown" && i > 0) { ni = i - 1; nc = near(ni, c); }
    else return;
    e.preventDefault();
    moved.current = [ni, nc];
    setCur((p) => p.map((v, k) => (k === ni ? nc : v)));
  };

  const colour = (rank: number) => {
    const t = Math.max(0, Math.min(1, rank / 100)) * 5, k = Math.min(4, Math.floor(t)), f = Math.round((t - k) * 100);
    return `color-mix(in oklab, var(--spec-${k + 2}) ${f}%, var(--spec-${k + 1}))`;
  };
  const what = (r: FieldRow, b: FieldBin) => {
    const span = narrow ? (b.toDate ? "month to date" : "month") : b.toDate ? "week to date" : "week";
    const unit = r.kind === "crore" ? `${narrow ? "months" : "weeks"}` : "daily closes";
    return `${r.name} · ${span}${b.toDate ? ", " : " to "}${day(b.end)}${r.kind === "crore" ? " · net" : " · last close"} · higher than ${Math.round(b.rank)}% of the five years' ${unit}`;
  };

  // Year ticks under the front row, at the first column of each year, at least 56px apart on phones.
  const years: { c: number; y: string }[] = [];
  let seen = "";
  binsOf(rows[0]).forEach((b, c) => {
    if (!b) return;
    const y = b.end.slice(0, 4);
    if (seen && y !== seen && (!years.length || X(0, c) - X(0, years.at(-1)!.c) >= (phone ? 56 : 40))) years.push({ c, y });
    seen = y;
  });
  const summary = rows.map((r) => `${r.name} ${fieldValue(r.kind, r.last.v)} (${r.last.label}, ${day(r.last.date)}), higher than ${Math.round(r.last.rank)}% of its five years`).join("; ");

  return (
    <div className="bw-plot ifield" ref={ref}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="group" onKeyDown={onKey}
        aria-label={`Indicator field, ${day(from)} to ${day(to)}: each column is a ${narrow ? "month" : "week"}, its height and colour its rank in the indicator's own five years (0 to 100). Latest: ${summary}.`}>
        <defs>
          <filter id="if-glow" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="2.6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* The floor: one plane under all rows, with each row's base line. */}
        <polygon className="if-floor" points={[[X(0, 0), floorY(0)], [X(0, n) + depth.x, floorY(0)], [X(R - 1, n) + depth.x, floorY(R - 1) + depth.y], [X(R - 1, 0), floorY(R - 1) + depth.y]].map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")} />
        {rows.map((_, i) => <line key={i} x1={X(i, 0)} x2={X(i, n) + depth.x} y1={floorY(i)} y2={floorY(i)} className="bw-grid" />)}
        {/* The rank scale, on the front row: 0, 50 and 100 for every row alike. */}
        {[0, 50, 100].map((v) => {
          const y = floorY(0) - (v / 100) * Zh;
          return (
            <g key={v}>
              {v > 0 && <line x1={X(0, 0)} x2={X(0, n)} y1={y} y2={y} className={v === 50 ? "bw-base" : "bw-grid"} />}
              <text x={left - 6} y={y + 3} textAnchor="end" className="bw-tick">{v}</text>
            </g>
          );
        })}
        {years.map(({ c, y }) => (
          <g key={y}>
            <line x1={X(0, c)} x2={X(0, c)} y1={floorY(0)} y2={floorY(0) + 4} className="bw-tickline" />
            <text x={X(0, c)} y={H - 8} textAnchor={X(0, c) < left + 14 ? "start" : "middle"} className="bw-tick">{y}</text>
          </g>
        ))}
        <g className="if-bars" filter="url(#if-glow)">
          {rows.map((r, ri) => ({ r, i: ri })).reverse().map(({ r, i }) => (
            <g key={r.id} className="if-row" style={{ "--row": R - 1 - i } as React.CSSProperties}>
              {binsOf(r).map((b, c) => {
                if (!b) return null;
                const x = X(i, c), y0 = floorY(i), h = (b.rank / 100) * Zh, y = y0 - h, fill = colour(b.rank);
                const f = (a: number) => a.toFixed(1);
                const lid = `M${f(x)} ${f(y)}H${f(x + bw)}L${f(x + bw + depth.x)} ${f(y + depth.y)}H${f(x + depth.x)}Z`;
                const side = `M${f(x + bw)} ${f(y)}V${f(y0)}L${f(x + bw + depth.x)} ${f(y0 + depth.y)}V${f(y + depth.y)}Z`;
                const v = fieldValue(r.kind, b.v), l = what(r, b), last = c === cur[i];
                return (
                  <g key={c} data-cell={`${i},${c}`} className={`if-bar${b.toDate ? " is-todate" : ""}`} tabIndex={last ? 0 : -1} role="img"
                    aria-label={`${v}, ${l}`} data-tip-v={v} data-tip-l={l}
                    style={{ "--c": fill, "--i": (c / n).toFixed(3) } as React.CSSProperties}>
                    <rect x={x} y={y0 - Math.max(h, 16)} width={cw} height={Math.max(h, 16)} fill="transparent" />
                    <path className="if-side" d={side} />
                    <path className="if-lid" d={lid} />
                    <rect className="if-face" x={x} y={y} width={bw} height={h} />
                  </g>
                );
              })}
            </g>
          ))}
        </g>
        {/* Row labels in their own column at the right, each on a short leader from its row's end. */}
        {rows.map((r, i) => {
          const y = floorY(i) + depth.y / 2, lx = W - LW + 8, ch = change(r);
          const val = fieldValue(r.kind, r.last.v);
          return (
            <g key={r.id} className="if-lab">
              <path d={`M${(X(i, n) + depth.x + 3).toFixed(1)} ${y.toFixed(1)}H${(lx - 4).toFixed(1)}`} className="t3d-leader" />
              <text x={lx} y={y - 15} className="bw-label">{phone ? r.short : r.name.replace(" Treasury yield", " yield")}</text>
              <text x={lx} y={y - 1} className="bw-val if-v">{val}{!phone && ch ? <tspan className="if-ch"> {ch}</tspan> : null}</text>
              <text x={lx} y={y + 13} className="bw-tick">{phone ? `above ${Math.round(r.last.rank)}%` : `${r.kind === "crore" ? "month to date · " : ""}above ${Math.round(r.last.rank)}%`}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
