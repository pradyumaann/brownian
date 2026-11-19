"use client";
import { useEffect, useRef } from "react";
import { crore } from "@/lib/format";
import { useWidth } from "./usePlot";

export interface FlowItem { label: string; value: number }
interface FNode { label: string; value: number; members?: FlowItem[]; kind: "sector" | "group" | "net" }

/** Left, the sectors FPIs net sold, warm to cool (design/brownian.css, --flow-s1…6). With more sources than stops, a source takes
 *  the mix between its two nearest stops. Net new money and net outflow take the muted plot ink. */
const tone = (i: number, n: number) => {
  const t = n <= 1 ? 0 : (i / (n - 1)) * 4, k = Math.min(3, Math.floor(t)), f = Math.round((t - k) * 100);
  return f === 0 ? `var(--flow-s${k + 1})` : f === 100 ? `var(--flow-s${k + 2})` : `color-mix(in oklab, var(--flow-s${k + 1}) ${100 - f}%, var(--flow-s${k + 2}))`;
};

/** Name the largest items (up to `max`, each at least `share` of the side) and group the rest into one node. */
function group(xs: FlowItem[], max: number, share: number, total: number): FNode[] {
  const named = xs.filter((x, i) => i < max && x.value >= total * share);
  const rest = xs.slice(named.length);
  const out: FNode[] = named.map((x) => ({ ...x, kind: "sector" }));
  if (rest.length === 1) out.push({ ...rest[0], kind: "sector" });
  else if (rest.length) out.push({ label: `${rest.length} other sectors`, value: rest.reduce((s, x) => s + x.value, 0), members: rest, kind: "group" });
  return out;
}

/** Push label centres apart (at least `gap`) and keep them within [lo, hi], in order. */
function spread(ys: number[], gap: number, lo: number, hi: number): number[] {
  const out = ys.map((y) => Math.max(lo, Math.min(hi, y)));
  for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i], out[i - 1] + gap);
  const over = out.length ? out[out.length - 1] - hi : 0;
  if (over > 0) { out[out.length - 1] = hi; for (let i = out.length - 2; i >= 0; i--) out[i] = Math.min(out[i], out[i + 1] - gap); }
  return out;
}

const CH = 6.1; // average glyph width at the label size, for fitting labels
const clip = (s: string, px: number) => { const n = Math.max(6, Math.floor(px / CH)); return s.length <= n ? s : s.slice(0, n - 1) + "…"; };

/** Where foreign money went, left to right: one bar of the sectors FPIs net sold (height is the amount, largest first) and,
 *  from it, a band to each sector they net bought (and to the net outflow), each band as thick as the amount. NSDL reports only
 *  each sector's net, so the bands show how much went to each destination, not which sold sector paid for which. Hover, tap
 *  or tab to a destination to light its band; every sector and band reads out its value. */
export function MoneyFlow({ sold, bought, net, month, label }: { sold: FlowItem[]; bought: FlowItem[]; net: number; month: string; label: string }) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const svg = useRef<SVGSVGElement>(null);
  useFocus(svg);
  const W = w || 960, phone = W < 560;
  const fmt = (v: number) => crore(v, false);

  // ---- Nodes ------------------------------------------------------------------------------------------------
  const soldT = sold.reduce((s, x) => s + x.value, 0), boughtT = bought.reduce((s, x) => s + x.value, 0);
  const src = group(sold, phone ? 4 : 6, phone ? 0.05 : 0.03, soldT);
  if (net > 0) src.push({ label: "Net new money", value: net, kind: "net" });
  const dst = group(bought, phone ? 4 : 5, phone ? 0.05 : 0.03, boughtT);
  if (net < 0) dst.push({ label: "Net outflow", value: -net, kind: "net" });
  const T = src.reduce((s, x) => s + x.value, 0) || 1;
  const nSec = src.filter((n) => n.kind !== "net").length;
  const sCol = src.map((n, i) => (n.kind === "net" ? "var(--plot-muted)" : tone(i, nSec)));
  // Destinations take the categorical colours in order of size; the grouped rest is the pale end of the ramp.
  let cat = 0;
  const dCol = dst.map((n) => (n.kind === "net" ? "var(--plot-muted)" : n.kind === "group" ? "var(--flow-s5)" : `var(--cat-${(cat++ % 6) + 1})`));

  // ---- Geometry -----------------------------------------------------------------------------------------------
  const pad = phone ? 8 : 16, nodeW = phone ? 10 : 12, lab = 8, slot = phone ? 36 : 38, gapY = phone ? 6 : 10;
  const longest = (ns: FNode[], tail: (n: FNode) => string) => Math.max(...ns.map((n) => Math.max(n.label.length, (fmt(n.value) + tail(n)).length) * CH));
  const room = W - 2 * pad - 2 * (nodeW + lab);
  const cap = Math.min(room * 0.42, phone ? 112 : 200);
  const LW = Math.min(cap, Math.ceil(longest(src, (n) => (n.kind === "net" ? "" : " sold")))), RW = Math.min(cap, Math.ceil(longest(dst, (n) => (n.kind === "net" ? "" : " bought"))));
  const xL = pad + LW + lab, xR = W - pad - RW - lab - nodeW, mid = (xL + nodeW + xR) / 2;
  const HB = phone ? 320 : 360;
  // Scale (px per crore): largest that lets every destination fit its label slot inside HB.
  const stack = (k: number) => dst.reduce((s, d) => s + Math.max(d.value * k, slot), 0) + gapY * (dst.length - 1);
  let k = HB / T;
  for (let g = 0; g < 80 && stack(k) > HB; g++) k *= 0.96;
  const rightH = stack(k), leftH = T * k;
  const padY = 12, H = Math.ceil(Math.max(rightH, src.length * slot * 0.9, leftH) + 2 * padY);
  const yL = (H - leftH) / 2;
  let ry = (H - rightH) / 2;
  const dn = dst.map((d) => {
    const hh = Math.max(d.value * k, slot);
    const r = { y: ry, h: hh, c: ry + hh / 2, th: Math.max(d.value * k, 3) };
    ry += hh + gapY;
    return r;
  });
  // Left slices: each destination's band leaves the bar in order, as much of its height as the amount.
  let acc = yL;
  const band = dst.map((d, j) => {
    const a0 = acc, a1 = acc + d.value * k;
    acc = a1;
    const b0 = dn[j].c - dn[j].th / 2, b1 = dn[j].c + dn[j].th / 2;
    const xa = xL + nodeW, xb = xR;
    return `M${xa.toFixed(1)} ${a0.toFixed(1)}C${mid.toFixed(1)} ${a0.toFixed(1)} ${mid.toFixed(1)} ${b0.toFixed(1)} ${xb.toFixed(1)} ${b0.toFixed(1)}L${xb.toFixed(1)} ${b1.toFixed(1)}C${mid.toFixed(1)} ${b1.toFixed(1)} ${mid.toFixed(1)} ${a1.toFixed(1)} ${xa.toFixed(1)} ${a1.toFixed(1)}Z`;
  });
  // Left segments of the bar, top down, and their labels (pushed apart, with a leader where they moved).
  let sy = yL;
  const sg = src.map((n) => { const hh = n.value * k, r = { y: sy, h: hh, c: sy + hh / 2 }; sy += hh; return r; });
  const lyAll = spread(sg.map((s) => s.c), slot * 0.9, padY + 10, H - padY - 10);

  const tipSrc = (n: FNode) => n.kind === "net" ? "Net new money into Indian equities" : n.members ? `Net sold · ${n.label}: ${n.members.map((m) => m.label).join(", ")}` : `Net sold · ${n.label}`;
  const tipDst = (n: FNode) => n.kind === "net" ? "Net outflow from Indian equities" : n.members ? `Net bought · ${n.label}: ${n.members.map((m) => m.label).join(", ")}` : `Net bought · ${n.label}`;
  return (
    <div ref={ref}>
      <div className="bw-plot mf">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={label}>
          <g className="mf-bands">
            {dst.map((d, j) => (
              <g key={d.label} className="mf-dst" data-dn={j} tabIndex={0} style={{ color: dCol[j], "--d": `${(j * 0.12).toFixed(2)}s` } as React.CSSProperties}
                data-tip-v={fmt(d.value)} data-tip-l={`${tipDst(d)}, ${month}`}>
                <path d={band[j]} className="mf-band" />
                <rect x={xR} y={dn[j].c - dn[j].th / 2} width={nodeW} height={dn[j].th} rx={2} className="mf-node" />
                <text x={xR + nodeW + lab} y={dn[j].c - 3} className="bw-label mf-lab">{clip(d.label, RW)}</text>
                <text x={xR + nodeW + lab} y={dn[j].c + 11} className="bw-tick">{clip(`${fmt(d.value)}${d.kind === "net" ? "" : " bought"}`, RW)}</text>
              </g>
            ))}
          </g>
          {src.map((n, i) => {
            const moved = Math.abs(lyAll[i] - sg[i].c) > 3;
            return (
              <g key={n.label} className="mf-src" data-sn={i} tabIndex={0} style={{ color: sCol[i] }} data-tip-v={fmt(n.value)} data-tip-l={`${tipSrc(n)}, ${month}`}>
                <rect x={xL} y={sg[i].y} width={nodeW} height={Math.max(sg[i].h, 2)} className="mf-snode" />
                <rect x={pad} y={lyAll[i] - slot / 2 + 2} width={xL - pad} height={slot - 4} fill="transparent" />
                {moved && <path d={`M${xL - 1} ${sg[i].c.toFixed(1)}L${xL - lab + 2} ${lyAll[i].toFixed(1)}`} className="mf-leader" />}
                <text x={xL - lab - (moved ? 0 : 0)} y={lyAll[i] - 3} textAnchor="end" className="bw-label mf-lab">{clip(n.label, LW)}</text>
                <text x={xL - lab} y={lyAll[i] + 11} textAnchor="end" className="bw-tick">{clip(`${fmt(n.value)}${n.kind === "net" ? "" : " sold"}`, LW)}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mf-key">
        <span><i className="mf-key-bar" aria-hidden="true" />Left: sectors net sold, height is the amount</span>
        <span><i className="mf-key-band" aria-hidden="true" />Bands: how much each sector net bought, thickness is the amount (not which sold sector paid for it)</span>
      </p>
    </div>
  );
}

/** Hovering, tapping or focusing a destination lights its band and dims the rest. Leaving with the pointer keeps the
 *  highlight of whatever still has keyboard focus. */
function useFocus(svg: React.RefObject<SVGSVGElement | null>) {
  useEffect(() => {
    const s = svg.current;
    if (!s) return;
    const light = (t: Element | null) => {
      const g = t?.closest?.("[data-dn]") ?? null;
      s.classList.toggle("has-focus", !!g);
      s.querySelectorAll<SVGElement>("[data-dn]").forEach((e) => e.classList.toggle("is-focus", e === g));
    };
    const on = (e: Event) => light(e.target as Element);
    const off = (e: Event) => {
      const a = document.activeElement;
      if (e.type === "pointerleave" && a && s.contains(a)) { light(a); return; }
      if (e.type === "focusout" && s.contains((e as FocusEvent).relatedTarget as Node | null)) return;
      light(null);
    };
    s.addEventListener("pointerover", on); s.addEventListener("focusin", on);
    s.addEventListener("pointerleave", off); s.addEventListener("focusout", off);
    return () => { s.removeEventListener("pointerover", on); s.removeEventListener("focusin", on); s.removeEventListener("pointerleave", off); s.removeEventListener("focusout", off); };
  }, [svg]);
}
