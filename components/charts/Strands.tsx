"use client";
import { useEffect, useRef } from "react";
import { crore } from "@/lib/format";
import { useWidth } from "./usePlot";

export interface FlowItem { label: string; value: number }
interface FNode { label: string; value: number; members?: FlowItem[]; kind: "sector" | "group" | "net" }

/** Warm to cool, left to right: red, coral, orange, amber, pale yellow, white (design/brownian.css, --flow-s1…6).
 *  With more sources than stops, a source takes the mix between its two nearest stops. Net new money is dawn. */
const tone = (i: number, n: number) => {
  const t = n <= 1 ? 0 : (i / (n - 1)) * 5, k = Math.min(4, Math.floor(t)), f = Math.round((t - k) * 100);
  return f === 0 ? `var(--flow-s${k + 1})` : f === 100 ? `var(--flow-s${k + 2})` : `color-mix(in oklab, var(--flow-s${k + 1}) ${100 - f}%, var(--flow-s${k + 2}))`;
};

/** A small seeded random source, so every thread falls the same way on every render. */
const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

/** Name the largest items (up to `max`, each at least `share` of the side) and group the rest into one node. */
function group(xs: FlowItem[], max: number, share: number, total: number): FNode[] {
  const named = xs.filter((x, i) => i < max && x.value >= total * share);
  const rest = xs.slice(named.length);
  const out: FNode[] = named.map((x) => ({ ...x, kind: "sector" }));
  if (rest.length === 1) out.push({ ...rest[0], kind: "sector" });
  else if (rest.length) out.push({ label: `${rest.length} other sectors`, value: rest.reduce((s, x) => s + x.value, 0), members: rest, kind: "group" });
  return out;
}

const UNITS = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000];
const CH = 6.3; // average glyph width at the label sizes, for fitting labels

/** Where foreign money went, after a woven flow map: the sectors FPIs net sold sit across the top as bars whose width
 *  is the amount, and hairlines fall from them in long curves to the sectors they net bought (and to the net outflow)
 *  scattered below. One hairline is a fixed ₹ amount, stated under the chart. A sector's selling is shared out over the
 *  destinations in proportion to their size: it is an allocation, not traced trades. Each destination carries a row of
 *  squares, one per source, sized (by area) by the amount allocated from that source. Hover, tap or tab to a sector
 *  for its value; the other threads dim. */
export function Strands({ sold, bought, net, month, label }: { sold: FlowItem[]; bought: FlowItem[]; net: number; month: string; label: string }) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const svg = useRef<SVGSVGElement>(null);
  useFocus(svg);
  const W = w || 960, phone = W < 560;
  const fmt = (v: number) => crore(v, false);

  // ---- Nodes ------------------------------------------------------------------------------------------------
  const soldT = sold.reduce((s, x) => s + x.value, 0), boughtT = bought.reduce((s, x) => s + x.value, 0);
  const src = group(sold, phone ? 7 : 10, phone ? 0.03 : 0.02, soldT);
  if (net > 0) src.push({ label: "Net new money", value: net, kind: "net" });
  const dst = group(bought, phone ? 3 : 6, phone ? 0.04 : 0.01, boughtT);
  if (net < 0) dst.push({ label: "Net outflow", value: -net, kind: "net" });
  const T = src.reduce((s, x) => s + x.value, 0) || 1;
  const nSec = src.filter((n) => n.kind !== "net").length;
  const colour = src.map((n, i) => (n.kind === "net" ? "var(--plot-dawn)" : tone(i, nSec)));

  // ---- Unit and threads: one hairline = `unit` ₹ crore, split over the pairs by largest remainder -----------
  const unit = UNITS.find((u) => T / u <= (phone ? 340 : 1150)) ?? 100000;
  const pairs = src.flatMap((s, i) => dst.map((d, j) => ({ i, j, amt: (s.value * d.value) / T })));
  const N = Math.round(T / unit);
  const base = pairs.map((p) => Math.floor(p.amt / unit));
  let left = N - base.reduce((a, b) => a + b, 0);
  [...pairs.keys()].sort((a, b) => (pairs[b].amt / unit - base[b]) - (pairs[a].amt / unit - base[a])).forEach((k) => { if (left > 0) { base[k]++; left--; } });

  // ---- Sources across the top --------------------------------------------------------------------------------
  const pad = phone ? 10 : 20, gap = phone ? 3 : 5, barH = phone ? 9 : 12;
  const span = W - 2 * pad - gap * (src.length - 1), k = span / T;
  let x = pad;
  const sx = src.map((n) => { const r = { x, w: Math.max(1, n.value * k) }; x += r.w + gap; return r; });
  const srcText = (n: FNode) => [n.label, fmt(n.value)];
  const labLen = Math.max(...src.map((n) => srcText(n).join("  ").length * CH));
  const top = Math.ceil(labLen) + 18, y0 = top + barH;
  // Rotated labels: centred on their bar, then pushed apart (at least one line height) and kept inside the panel.
  const LS = 13, lx = sx.map((r) => r.x + r.w / 2);
  for (let a = 1; a < lx.length; a++) lx[a] = Math.max(lx[a], lx[a - 1] + LS);
  lx[lx.length - 1] = Math.min(lx[lx.length - 1], W - pad / 2 - 4);
  for (let a = lx.length - 2; a >= 0; a--) lx[a] = Math.min(lx[a], lx[a + 1] - LS);

  // ---- Destinations scattered below: fixed slots by size, nudged down until no two boxes overlap -------------
  const sqMax = phone ? 12 : 16, maxPair = Math.max(...pairs.map((p) => p.amt));
  const side = (amt: number) => (amt <= 0 ? 0 : Math.max(2, Math.sqrt(amt / maxPair) * sqMax));
  const field = phone ? 470 : Math.max(470, Math.min(640, W * 0.52));
  const SLOTS = phone
    ? [[0.5, 0.92], [0.06, 0.42], [0.94, 0.3], [0.1, 0.72], [0.9, 0.62], [0.5, 0.55]]
    : [[0.5, 0.94], [0.1, 0.36], [0.86, 0.26], [0.28, 0.7], [0.74, 0.6], [0.04, 0.9], [0.95, 0.86], [0.5, 0.45]];
  const order = [...dst.keys()].sort((a, b) => dst[b].value - dst[a].value);
  const boxes: { x: number; y: number; w: number; h: number; base: number; sq: { i: number; x: number; s: number }[] }[] = [];
  for (const [rank, j] of order.entries()) {
    const d = dst[j], sizes = src.map((_, i) => side(pairs[i * dst.length + j].amt));
    const rowW = sizes.reduce((a, s) => a + s + (s ? 2 : 0), 0);
    const tw = Math.max(d.label.length, (fmt(d.value) + (d.kind === "net" ? " left India" : " bought")).length) * CH;
    const bw = Math.max(rowW, tw), bh = sqMax + 34;
    const [fx, fy] = SLOTS[rank % SLOTS.length];
    const bx = pad + fx * (W - 2 * pad - bw);
    let by = y0 + 70 + fy * (field - 70 - bh);
    const hit = (y: number) => boxes.some((b) => bx < b.x + b.w + 16 && bx + bw + 16 > b.x && y < b.y + b.h + 12 && y + bh + 12 > b.y);
    while (hit(by)) by += 8;
    let cx = bx;
    const sq = sizes.map((s, i) => { const r = { i, x: cx, s }; cx += s + (s ? 2 : 0); return r; });
    boxes[j] = { x: bx, y: by, w: bw, h: bh, base: by + sqMax, sq };
  }
  const H = Math.ceil(Math.max(y0 + field, ...boxes.map((b) => b.y + b.h)) + 10);

  // ---- Threads ------------------------------------------------------------------------------------------------
  // Each source's threads leave its bar evenly spaced across its width, in a fixed shuffled order so the bundles
  // interleave, then fall in long curves that sweep in from the side of their source onto the square for that
  // source in the destination's row. The crossings make the woven texture.
  const threads = pairs.map((p, n) => ({ ...p, c: base[n], paths: [] as string[] }));
  src.forEach((_, i) => {
    const mine = threads.filter((t) => t.i === i && t.c > 0);
    const total = mine.reduce((s, t) => s + t.c, 0), shuffle = rng(i * 31 + 7);
    const slot = Array.from({ length: total }, (_, q) => q);
    for (let q = total - 1; q > 0; q--) { const z = Math.floor(shuffle() * (q + 1)); [slot[q], slot[z]] = [slot[z], slot[q]]; }
    let q = 0;
    for (const t of mine) {
      const r = rng(i * 7919 + t.j * 104729 + 1), b = boxes[t.j], sq = b.sq[i];
      for (let m = 0; m < t.c; m++, q++) {
        const xs = sx[i].x + ((slot[q] + 0.5) / total) * sx[i].w;
        const xe = sq.x + (0.1 + 0.8 * r()) * Math.max(sq.s, 1), ye = b.base - sq.s;
        const dy = ye - y0, sideways = xs - xe;
        const c1x = xs + (r() - 0.5) * 36, c1y = y0 + dy * (0.3 + 0.45 * r());
        const c2x = xe + sideways * (0.25 + 0.6 * r()), c2y = ye - dy * (-0.12 + 0.4 * r());
        t.paths.push(`M${xs.toFixed(1)} ${y0}C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${xe.toFixed(1)} ${ye.toFixed(1)}`);
      }
    }
  });

  const tipSrc = (n: FNode) => n.kind === "net" ? "Net new money into Indian equities" : n.members ? `Net sold · ${n.label}: ${n.members.map((m) => m.label).join(", ")}` : `Net sold · ${n.label}`;
  const tipDst = (n: FNode) => n.kind === "net" ? "Net outflow from Indian equities" : n.members ? `Net bought · ${n.label}: ${n.members.map((m) => m.label).join(", ")}` : `Net bought · ${n.label}`;
  return (
    <div ref={ref}>
      <div className="bw-plot fm">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`${label} One hairline is ₹${unit.toLocaleString("en-IN")} crore.`}>
          <g className="fm-threads">
            {threads.filter((t) => t.c > 0).map((t) => (
              <g key={`${t.i}-${t.j}`} className="fm-pair" data-pair={`${t.i}-${t.j}`} style={{ color: colour[t.i], "--d": `${(t.i * 0.09).toFixed(2)}s` } as React.CSSProperties}
                data-tip-v={fmt(t.amt)} data-tip-l={`${src[t.i].label} → ${dst[t.j].label}, allocated in proportion`}>
                {t.paths.map((d, m) => <path key={m} d={d} pathLength={1} className="fm-thread" />)}
              </g>
            ))}
          </g>
          {src.map((n, i) => (
            <g key={n.label} className="fm-src" data-sn={i} tabIndex={0} style={{ color: colour[i] }} data-tip-v={fmt(n.value)} data-tip-l={`${tipSrc(n)}, ${month}`}>
              <rect x={sx[i].x} y={top} width={sx[i].w} height={barH} className="fm-bar" />
              {Math.abs(lx[i] - (sx[i].x + sx[i].w / 2)) > Math.max(2, sx[i].w / 2) &&
                <path d={`M${sx[i].x + sx[i].w / 2} ${top - 1}L${lx[i]} ${top - 9}`} className="fm-leader" />}
              <text transform={`translate(${(lx[i] + 4).toFixed(1)} ${top - 10}) rotate(-90)`} className="bw-label fm-slab">
                {n.label}<tspan className="fm-sval" dx={6}>{fmt(n.value)}</tspan>
              </text>
            </g>
          ))}
          {dst.map((n, j) => {
            const b = boxes[j];
            return (
              <g key={n.label} className="fm-dst" data-dn={j} tabIndex={0} data-tip-v={fmt(n.value)} data-tip-l={`${tipDst(n)}, ${month}`}>
                <rect x={b.x - 4} y={b.y - 4} width={b.w + 8} height={b.h + 4} fill="transparent" />
                {b.sq.filter((s) => s.s > 0).map((s) => (
                  <rect key={s.i} x={s.x} y={b.base - s.s} width={s.s} height={s.s} className="fm-sq" style={{ color: colour[s.i] }}
                    data-sq={`${s.i}-${j}`} data-tip-v={fmt(pairs[s.i * dst.length + j].amt)} data-tip-l={`${src[s.i].label} → ${n.label}, allocated in proportion`} />
                ))}
                <text x={b.x} y={b.base + 15} className="bw-label fm-dlab">{n.label}</text>
                <text x={b.x} y={b.base + 28} className="bw-tick">{fmt(n.value)}{n.kind === "net" ? " left India" : " bought"}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="fm-key">
        <span><i className="fm-key-line" aria-hidden="true" />One hairline = ₹{unit.toLocaleString("en-IN")} crore</span>
        <span><i className="fm-key-bar" aria-hidden="true" />Top: sectors net sold, bar width is the amount</span>
        <span><i className="fm-key-sq" aria-hidden="true" />Below: where it went, one square per source, area is the amount</span>
      </p>
    </div>
  );
}

/** Hovering, tapping or focusing a source, a destination, a square or a thread lights its threads and dims the rest.
 *  Leaving with the pointer keeps the highlight of whatever still has keyboard focus. */
function useFocus(svg: React.RefObject<SVGSVGElement | null>) {
  useEffect(() => {
    const s = svg.current;
    if (!s) return;
    const light = (t: Element | null) => {
      const g = t?.closest?.("[data-sn],[data-dn],[data-sq],[data-pair]") ?? null;
      const keys = new Set<string>();
      if (g) {
        const all = [...s.querySelectorAll<SVGElement>("[data-pair]")].map((e) => e.dataset.pair!);
        const sn = g.getAttribute("data-sn"), dn = g.getAttribute("data-dn"), one = g.getAttribute("data-sq") ?? g.getAttribute("data-pair");
        for (const k of all) { const [i, j] = k.split("-"); if ((sn != null && i === sn) || (dn != null && j === dn) || k === one) keys.add(k); }
        if (one) keys.add(one);
      }
      s.classList.toggle("has-focus", !!g);
      const ins = new Set([...keys].map((k) => k.split("-")[0])), outs = new Set([...keys].map((k) => k.split("-")[1]));
      s.querySelectorAll<SVGElement>("[data-pair]").forEach((e) => e.classList.toggle("is-focus", keys.has(e.dataset.pair!)));
      s.querySelectorAll<SVGElement>("[data-sq]").forEach((e) => e.classList.toggle("is-focus", keys.has(e.dataset.sq!)));
      s.querySelectorAll<SVGElement>("[data-sn]").forEach((e) => e.classList.toggle("is-focus", ins.has(e.dataset.sn!)));
      s.querySelectorAll<SVGElement>("[data-dn]").forEach((e) => e.classList.toggle("is-focus", outs.has(e.dataset.dn!)));
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
