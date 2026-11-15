"use client";
import { useEffect, useRef } from "react";
import Brownian from "@/design/brownian-charts";
import { crore } from "@/lib/format";
import { usePlot, useWidth } from "./usePlot";

interface Node { id: string; label: string; value: number; cat?: string }

/** Each sector thread has its own bright colour: warm for sectors FPIs sold, cool for sectors they bought, a pale one
 *  for the grouped rest, dawn for net new money and grey for a net withdrawal. Night and Paper each have their own
 *  values (design/brownian.css, --flow-*). Colour tells the threads apart; the side and the label name direction. */
const colourOf = (n: Node, i: number, side: "s" | "b") =>
  n.id === "NEW" ? "var(--plot-dawn)" : n.id === "OUT" ? "var(--plot-muted)" : /other sectors$/.test(n.label) ? `var(--flow-${side}0)` : `var(--flow-${side}${(i % 6) + 1})`;

/** Where foreign money went, as unit strands (one hairline = `unit` ₹ crore). Wide screens read left to right:
 *  sectors sold → FPI equity → sectors bought. Phones read top to bottom (a trunk, after the Flow inspiration): sold
 *  sectors enter from the left at the top, pool in the FPI equity trunk, and leave to the right for the sectors bought,
 *  so every label stays horizontal and every sector gets its own row. Hover, tap or tab to a thread for its value. */
export function Strands({ left, right, unit, label }: { left: Node[]; right: Node[]; unit: number; label: string }) {
  const { ref, w } = useWidth<HTMLDivElement>();
  return (
    <div ref={ref}>
      {w && w < 560 ? <Vertical left={left} right={right} unit={unit} label={label} w={w} /> : <Horizontal left={left} right={right} unit={unit} label={label} />}
    </div>
  );
}

/** Hovering or focusing one thread dims the others, so a single sector can be followed across the chart. */
function useFocusThreads(svg: React.RefObject<SVGSVGElement | null>) {
  useEffect(() => {
    const s = svg.current;
    if (!s) return;
    const on = (e: Event) => {
      const g = (e.target as Element).closest?.("[data-link]"), root = s.querySelector(".bw-strands");
      if (!root) return;
      root.querySelectorAll(".is-focus").forEach((n) => n.classList.remove("is-focus"));
      root.classList.toggle("has-focus", !!g);
      g?.classList.add("is-focus");
    };
    const off = (e: Event) => {
      // Leaving with the mouse keeps the highlight of a thread that has keyboard focus.
      if (e.type === "pointerleave" && (document.activeElement as Element | null)?.closest?.("[data-link]") && s.contains(document.activeElement)) { on({ target: document.activeElement } as unknown as Event); return; }
      const root = s.querySelector(".bw-strands"); root?.classList.remove("has-focus"); root?.querySelectorAll(".is-focus").forEach((n) => n.classList.remove("is-focus")); };
    s.addEventListener("pointerover", on); s.addEventListener("focusin", on);
    s.addEventListener("pointerleave", off); s.addEventListener("focusout", off);
    return () => { s.removeEventListener("pointerover", on); s.removeEventListener("focusin", on); s.removeEventListener("pointerleave", off); s.removeEventListener("focusout", off); };
  }, [svg]);
}

function Horizontal({ left, right, unit, label }: { left: Node[]; right: Node[]; unit: number; label: string }) {
  const { box, svg } = usePlot((s, w) => {
    const total = left.reduce((a, n) => a + n.value, 0);
    Brownian.strands(s, {
      columns: [left.map(({ id, label }) => ({ id, label })), [{ id: "FPI", label: "FPI equity" }], right.map(({ id, label }) => ({ id, label }))],
      links: [
        ...left.map((n, i) => ({ source: n.id, target: "FPI", value: n.value, color: colourOf(n, i, "s") })),
        ...right.map((n, i) => ({ source: "FPI", target: n.id, value: n.value, color: colourOf(n, i, "b") })),
      ],
      unit, width: w, height: Math.max(380, Math.min(600, Math.round(w * 0.6))), labelWidth: 150, gap: 22,
      format: (v) => crore(v, false), seed: Math.round(total) % 997,
    });
  }, [JSON.stringify(left), JSON.stringify(right), unit]);
  useFocusThreads(svg);
  return (
    <div className="bw-plot pad flow-neon" ref={box}>
      <svg ref={svg} role="img" aria-label={label} />
    </div>
  );
}

function Vertical({ left, right, unit, label, w: W }: { left: Node[]; right: Node[]; unit: number; label: string; w: number }) {
  const svg = useRef<SVGSVGElement>(null);
  useFocusThreads(svg);
  const LW = 112, xl = LW, xr = W - LW, total = left.reduce((a, n) => a + n.value, 0) || 1;
  const TW = Math.round((xr - xl) * 0.6), tx0 = (xl + xr) / 2 - TW / 2, scale = TW / total, gap = 12, bend = 40, trunkH = 56;
  // Rows: each node gets at least room for its two label lines.
  const place = (ns: Node[], y0: number) => {
    let y = y0;
    return ns.map((n) => { const band = n.value * scale, row = Math.max(band, 30), r = { n, y: y + (row - band) / 2, band }; y += row + gap; return r; });
  };
  const top = place(left, 14), TT = (top.at(-1) ? top.at(-1)!.y + top.at(-1)!.band : 14) + bend, TB = TT + trunkH;
  const bot = place(right, TB + bend), H = Math.round((bot.at(-1) ? bot.at(-1)!.y + bot.at(-1)!.band : TB) + 22);
  // Slices of the trunk: the first node on each side takes the rightmost slice, so no two threads cross.
  const slice = (rows: { band: number }[]) => { let x = tx0 + TW; return rows.map((r) => { const right = x; x -= r.band; return right; }); };
  const sTop = slice(top), sBot = slice(bot);
  const strands = (count: number) => Array.from({ length: count }, (_, j) => (j + 0.5) / count);
  const fmt = (v: number) => crore(v, false);
  const nTrunk = Math.max(1, Math.round(total / unit));
  return (
    <div className="bw-plot pad flow-neon">
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={label}>
        <g className="bw-strands">
          {top.map((r, i) => {
            const c = colourOf(r.n, i, "s"), k = Math.max(1, Math.round(r.n.value / unit));
            return (
              <g key={r.n.id} data-link={`${r.n.id}>FPI`} style={{ color: c, "--d": `${(i * 0.08).toFixed(2)}s` } as React.CSSProperties} tabIndex={0}
                data-tip-v={fmt(r.n.value)} data-tip-l={`${r.n.label} → FPI equity`}>
                {strands(k).map((f) => {
                  const y = r.y + f * r.band, xs = sTop[i] - f * r.band;
                  return <path key={f} d={`M${xl + 2} ${y.toFixed(2)}C${xs.toFixed(2)} ${y.toFixed(2)} ${xs.toFixed(2)} ${y.toFixed(2)} ${xs.toFixed(2)} ${TT}`} stroke={c} pathLength={1} className="bw-strand" />;
                })}
              </g>
            );
          })}
          {bot.map((r, i) => {
            const c = colourOf(r.n, i, "b"), k = Math.max(1, Math.round(r.n.value / unit));
            return (
              <g key={r.n.id} data-link={`FPI>${r.n.id}`} style={{ color: c, "--d": `${((top.length + i) * 0.08).toFixed(2)}s` } as React.CSSProperties} tabIndex={0}
                data-tip-v={fmt(r.n.value)} data-tip-l={`FPI equity → ${r.n.label}`}>
                {strands(k).map((f) => {
                  const y = r.y + f * r.band, xs = sBot[i] - f * r.band;
                  return <path key={f} d={`M${xs.toFixed(2)} ${TB}C${xs.toFixed(2)} ${y.toFixed(2)} ${xs.toFixed(2)} ${y.toFixed(2)} ${xr} ${y.toFixed(2)}`} stroke={c} pathLength={1} className="bw-strand" />;
                })}
              </g>
            );
          })}
        </g>
        {/* The trunk: every unit of FPI equity flow for the month, between what was sold and what was bought. */}
        {Array.from({ length: nTrunk }, (_, j) => { const x = tx0 + ((j + 0.5) / nTrunk) * TW; return <line key={j} x1={x} x2={x} y1={TT} y2={TB} className="flow-trunk" />; })}
        <rect x={tx0} y={TT} width={TW} height={1} className="bw-node" />
        <rect x={tx0} y={TB - 1} width={TW} height={1} className="bw-node" />
        <text x={Math.min(tx0 + TW + 8, W - 92)} y={(TT + TB) / 2 - 1} className="bw-label">FPI equity</text>
        <text x={Math.min(tx0 + TW + 8, W - 92)} y={(TT + TB) / 2 + 11} className="bw-tick">{fmt(total)}</text>
        {top.map((r) => (
          <g key={r.n.id}>
            <rect x={xl} y={r.y} width={2} height={Math.max(1, r.band)} className="bw-node" />
            <text x={xl - 8} y={r.y + r.band / 2 - 1} textAnchor="end" className="bw-label">{r.n.label}</text>
            <text x={xl - 8} y={r.y + r.band / 2 + 11} textAnchor="end" className="bw-tick">{fmt(r.n.value)}</text>
          </g>
        ))}
        {bot.map((r) => (
          <g key={r.n.id}>
            <rect x={xr} y={r.y} width={2} height={Math.max(1, r.band)} className="bw-node" />
            <text x={xr + 8} y={r.y + r.band / 2 - 1} className="bw-label">{r.n.label}</text>
            <text x={xr + 8} y={r.y + r.band / 2 + 11} className="bw-tick">{fmt(r.n.value)}</text>
          </g>
        ))}
        <text x={8} y={TT + trunkH / 2 - 1} className="bw-tick">Sold ↑</text>
        <text x={8} y={TT + trunkH / 2 + 11} className="bw-tick">Bought ↓</text>
      </svg>
    </div>
  );
}
