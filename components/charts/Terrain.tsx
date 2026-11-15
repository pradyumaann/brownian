"use client";
import { useEffect, useId, useRef, useState } from "react";
import { crore } from "@/lib/format";
import { usePhone, useWidth } from "./usePlot";

export interface Quarter { id: string; label: string; short: string; toDate: boolean }

const YAW = -38, PITCH = 34, PITCH_MIN = 12, PITCH_MAX = 80, ZOOM_MIN = 0.7, ZOOM_MAX = 2.4;
const rad = (d: number) => (d * Math.PI) / 180;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Sector × quarter terrain of net FPI equity flows, drawn as a field of 3D columns in a hand-rolled orthographic
 *  projection (SVG, no 3D library). Height and colour both encode the same value: columns rise for net buying and
 *  hang below the floor for net selling, and the colour diverges from a neutral floor tone to teal (buying) or ember
 *  (selling), deeper with size. Drag to turn it, pinch or the buttons to zoom; arrow keys move a cursor across the
 *  cells and the readout under the chart names sector, quarter and value. A null cell is n/a and draws no column.
 *  Without script the server render is the default view, and the table under the chart carries every value. */
export function Terrain({ sectors, quarters, z, label, phoneSectors = 8 }: {
  sectors: string[]; quarters: Quarter[]; z: (number | null)[][]; label: string; phoneSectors?: number;
}) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const phone = usePhone();
  const uid = useId().replace(/:/g, "");
  const [view, setView] = useState({ yaw: YAW, pitch: PITCH, zoom: 1 });
  const [sel, setSel] = useState<{ s: number; q: number } | null>(null);
  const [grow, setGrow] = useState(1);
  const [drag, setDrag] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ moved: number; pinch: number | null; zoom0: number; down: Element | null }>({ moved: 0, pinch: null, zoom0: 1, down: null });

  // Entrance: the columns rise from the floor once, when the chart first scrolls into view (motion allowed only).
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia("(prefers-reduced-motion: no-preference)").matches || !("IntersectionObserver" in window)) return;
    const box = el.getBoundingClientRect();
    if (box.top < innerHeight && box.bottom > 0) return; // already on screen at load: draw at rest
    setGrow(0);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => { const k = Math.min(1, (t - t0) / 900); setGrow(1 - (1 - k) ** 3); if (k < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.25 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [ref]);

  const ns = phone ? Math.min(phoneSectors, sectors.length) : sectors.length, nq = quarters.length;
  const S = sectors.slice(0, ns), Z = z.slice(0, ns);
  const all = Z.flat().filter((v): v is number => v != null);
  const max = Math.max(1, ...all.map(Math.abs));
  const W = w || 720;
  // Sector names sit in their own column at the right edge, each on a leader line from its row, so they never
  // overlap each other or the columns, at any angle. The terrain is fitted to the rest of the panel.
  const LW = phone ? 110 : 150, pad = 8, top = 12, bottom = 26;
  const { yaw, pitch, zoom } = view;
  const HZ = Math.max(nq, ns) * 0.46; // world height of the largest column
  const wx = (q: number) => q - (nq - 1) / 2, wy = (s: number) => (ns - 1) / 2 - s;
  // Unscaled projection for a view: screen x, screen y (down), depth (toward the viewer).
  const proj = (yw: number, pc: number) => {
    const cy = Math.cos(rad(yw)), sy = Math.sin(rad(yw)), cp = Math.cos(rad(pc)), sp = Math.sin(rad(pc));
    return { cy, sy, U: (x: number, y: number, h: number) => { const xr = x * cy - y * sy, yr = x * sy + y * cy; return [xr, yr * sp - h * cp, yr * cp + h * sp] as const; } };
  };
  // Projected bounds (floor, every column at full height, the quarter-label line) for a view.
  const bounds = (yw: number, pc: number) => {
    const { cy, U } = proj(yw, pc), ye = cy >= 0 ? 1 : -1;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const add = (p: readonly [number, number, number]) => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); };
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) add(U((a * nq) / 2, (b * ns) / 2, 0));
    Z.forEach((row, s) => row.forEach((v, q) => { if (v != null) add(U(wx(q), wy(s), (v / max) * HZ)); }));
    quarters.forEach((_, q) => add(U(wx(q), ye * (ns / 2 + 0.9), 0)));
    return { x0, x1, y0, y1 };
  };
  const aw = W - LW - pad * 2;
  // The panel is as tall as the default view needs at this width (within limits), so no band stays empty;
  // turned views are fitted inside that same panel.
  const d0 = bounds(YAW, PITCH), H = Math.round(Math.min(phone ? 360 : 540, Math.max(phone ? 220 : 380, (d0.y1 - d0.y0) * (aw / (d0.x1 - d0.x0 || 1)) + top + bottom)));
  const ah = H - top - bottom;
  const { cy, sy, U } = proj(yaw, pitch);
  const xe = cy >= 0 ? 1 : -1;           // the quarter-axis end that projects further right takes the leaders
  const ye = cy >= 0 ? 1 : -1;           // the sector-axis edge nearer the viewer takes the quarter labels
  const { x0, x1, y0, y1 } = bounds(yaw, pitch);
  const k = Math.min(aw / (x1 - x0 || 1), ah / (y1 - y0 || 1)) * zoom;
  // Where the terrain leaves width spare, the terrain and its label column are centred together, so leaders stay short.
  const ox0 = pad + aw / 2 - ((x0 + x1) / 2) * k, oy = top + ah / 2 - ((y0 + y1) / 2) * k;
  const shift = Math.max(0, (W - LW + 4 - (ox0 + x1 * k + 28)) / 2), ox = ox0 + shift;
  const lx = Math.min(W - LW + 4, ox + x1 * k + 28);
  const P = (x: number, y: number, h: number) => { const u = U(x, y, h); return [ox + u[0] * k, oy + u[1] * k, u[2]] as const; };
  const pt = (p: readonly [number, number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

  const fillOf = (v: number) => {
    const t = Math.round((Math.abs(v) / max) ** 0.4 * 100);
    return `color-mix(in oklab, var(${v >= 0 ? "--div-gain" : "--div-loss"}) ${t}%, var(--div-mid))`;
  };

  // Columns, far to near.
  const bw = 0.34;
  const cols: { s: number; q: number; v: number; depth: number }[] = [];
  Z.forEach((row, s) => row.forEach((v, q) => { if (v != null && v !== 0) cols.push({ s, q, v, depth: P(wx(q), wy(s), 0)[2] }); }));
  cols.sort((a, b) => a.depth - b.depth);
  const faces = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([nx, ny]) => nx * sy + ny * cy > 0.001);

  // Sector labels: anchored at each row's right-hand end, then spread down the edge column at least `gap` apart
  // (in row order where possible), pushed back up if they run off the bottom.
  const gap = phone ? 14 : 16, minY = top + 8, maxY = H - bottom - 2;
  const sLab = S.map((_, s) => { const a = P(xe * (nq / 2 + 0.1), wy(s), 0); return { s, ax: a[0], ay: a[1], y: a[1] + 3 }; }).sort((a, b) => a.ay - b.ay);
  sLab.forEach((l, i) => { l.y = Math.max(l.y, minY, i ? sLab[i - 1].y + gap : minY); });
  for (let i = sLab.length - 1; i >= 0; i--) sLab[i].y = Math.min(sLab[i].y, i === sLab.length - 1 ? maxY : sLab[i + 1].y - gap);
  const qLab: { q: number; x: number; y: number }[] = [];
  quarters.forEach((_, q) => {
    const p = P(wx(q), ye * (ns / 2 + 0.9), 0);
    if (qLab.length && Math.hypot(p[0] - qLab.at(-1)!.x, p[1] - qLab.at(-1)!.y) < (phone ? 38 : 44) && q !== nq - 1) return;
    if (qLab.length && q === nq - 1 && Math.hypot(p[0] - qLab.at(-1)!.x, p[1] - qLab.at(-1)!.y) < (phone ? 38 : 44)) qLab.pop();
    qLab.push({ q, x: p[0], y: p[1] + 10 });
  });
  const lw = (t: string, px: number) => t.length * px * 0.56;
  const inX = (x: number, t: string, anchor: "start" | "end" | "middle", px: number) => {
    const wd = lw(t, px), x0 = anchor === "start" ? x : anchor === "end" ? x - wd : x - wd / 2;
    return x + (Math.max(4, Math.min(W - LW - wd, x0)) - x0);
  };

  const cur = sel && Z[sel.s] ? { ...sel, v: Z[sel.s][sel.q] } : null;
  const say = cur ? `${S[cur.s]} · ${quarters[cur.q].label} · ${cur.v == null ? "n/a" : `${cur.v >= 0 ? "▲" : "▼"} ${crore(cur.v)} net ${cur.v >= 0 ? "buying" : "selling"}`}` : null;

  // Pointer handling: one pointer turns and tilts, two pinch to zoom; a tap (little movement) picks a cell.
  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture?.(e.pointerId);
    gesture.current.moved = 0;
    gesture.current.down = e.target as Element;
    if (ptrs.current.size === 2) { const [a, b] = [...ptrs.current.values()]; gesture.current.pinch = Math.hypot(a.x - b.x, a.y - b.y); gesture.current.zoom0 = view.zoom; }
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = ptrs.current.get(e.pointerId);
    if (!p) { pick(e); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current.moved += Math.abs(dx) + Math.abs(dy);
    if (ptrs.current.size === 2 && gesture.current.pinch) {
      const [a, b] = [...ptrs.current.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      setView((v) => ({ ...v, zoom: clamp(gesture.current.zoom0 * d / gesture.current.pinch!, ZOOM_MIN, ZOOM_MAX) }));
      return;
    }
    if (gesture.current.moved > 4) {
      if (!drag) setDrag(true);
      // On touch, vertical movement is left to the page scroll (touch-action: pan-y), so only mouse and pen tilt.
      setView((v) => ({ ...v, yaw: ((v.yaw + dx * 0.45 + 540) % 360) - 180, pitch: e.pointerType === "touch" ? v.pitch : clamp(v.pitch + dy * 0.3, PITCH_MIN, PITCH_MAX) }));
    }
  };
  const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size < 2) gesture.current.pinch = null;
    if (!ptrs.current.size) { setDrag(false); if (gesture.current.moved <= 4) pickEl(gesture.current.down); }
  };
  const pick = (e: React.PointerEvent<SVGSVGElement>) => pickEl(e.target as Element);
  // Pointer capture retargets the release to the svg, so a tap reads the element under the finger at pointerdown.
  const pickEl = (el: Element | null) => {
    const t = el?.closest?.("[data-cell]");
    if (!t) return;
    const [s, q] = t.getAttribute("data-cell")!.split(",").map(Number);
    setSel({ s, q });
  };
  const onKey = (e: React.KeyboardEvent<SVGSVGElement>) => {
    const k = e.key;
    if (e.shiftKey && k.startsWith("Arrow")) {
      e.preventDefault();
      setView((v) => k === "ArrowLeft" || k === "ArrowRight" ? { ...v, yaw: ((v.yaw + (k === "ArrowLeft" ? -15 : 15) + 540) % 360) - 180 } : { ...v, pitch: clamp(v.pitch + (k === "ArrowUp" ? 6 : -6), PITCH_MIN, PITCH_MAX) });
      return;
    }
    if (k.startsWith("Arrow")) {
      e.preventDefault();
      setSel((c) => {
        const b = c ?? { s: 0, q: nq - 1 };
        if (!c) return b;
        return { s: clamp(b.s + (k === "ArrowDown" ? 1 : k === "ArrowUp" ? -1 : 0), 0, ns - 1), q: clamp(b.q + (k === "ArrowRight" ? 1 : k === "ArrowLeft" ? -1 : 0), 0, nq - 1) };
      });
    } else if (k === "+" || k === "=") { e.preventDefault(); setView((v) => ({ ...v, zoom: clamp(v.zoom * 1.2, ZOOM_MIN, ZOOM_MAX) })); }
    else if (k === "-" || k === "_") { e.preventDefault(); setView((v) => ({ ...v, zoom: clamp(v.zoom / 1.2, ZOOM_MIN, ZOOM_MAX) })); }
    else if (k === "0") { e.preventDefault(); setView({ yaw: YAW, pitch: PITCH, zoom: 1 }); }
    else if (k === "Escape") setSel(null);
  };
  // Trackpad pinch arrives as a ctrl+wheel; plain wheel scrolls the page as usual.
  useEffect(() => {
    const s = svgRef.current;
    if (!s) return;
    const wheel = (e: WheelEvent) => { if (!e.ctrlKey) return; e.preventDefault(); setView((v) => ({ ...v, zoom: clamp(v.zoom * Math.exp(-e.deltaY * 0.01), ZOOM_MIN, ZOOM_MAX) })); };
    s.addEventListener("wheel", wheel, { passive: false });
    return () => s.removeEventListener("wheel", wheel);
  }, []);

  const turn = (d: number) => setView((v) => ({ ...v, yaw: ((v.yaw + d + 540) % 360) - 180 }));
  const zoomBy = (f: number) => setView((v) => ({ ...v, zoom: clamp(v.zoom * f, ZOOM_MIN, ZOOM_MAX) }));
  const floor = [P(-nq / 2, -ns / 2, 0), P(nq / 2, -ns / 2, 0), P(nq / 2, ns / 2, 0), P(-nq / 2, ns / 2, 0)];
  const gridEvery = phone ? 2 : 1;

  return (
    <div className="t3d">
      <div className="bw-plot" ref={ref}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" tabIndex={0}
          aria-label={label} aria-describedby={`${uid}-help`}
          className={`t3d-svg${drag ? " is-drag" : ""}`}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          onKeyDown={onKey}>
          <defs>
            <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <polygon points={floor.map(pt).join(" ")} className="t3d-floor" />
          {quarters.map((_, q) => (q % gridEvery ? null : <line key={"q" + q} {...xy(P(wx(q), -ns / 2, 0), P(wx(q), ns / 2, 0))} className="bw-grid" />))}
          {S.map((_, s) => (s % gridEvery ? null : <line key={"s" + s} {...xy(P(-nq / 2, wy(s), 0), P(nq / 2, wy(s), 0))} className="bw-grid" />))}
          <g className="t3d-cols" filter={drag ? undefined : `url(#${uid}-glow)`}>
            {cols.map(({ s, q, v }) => {
              const x = wx(q), y = wy(s), h = (v / max) * HZ * grow, c = fillOf(v), lid = Math.max(0, h);
              const corner = (dx: number, dy: number, hh: number) => P(x + dx * bw, y + dy * bw, hh);
              const on = cur && cur.s === s && cur.q === q;
              return (
                <g key={s + "-" + q} data-cell={`${s},${q}`} className={on ? "t3d-col is-on" : "t3d-col"} style={{ "--c": c } as React.CSSProperties}>
                  {faces.map(([nx, ny]) => {
                    const a = nx ? [nx, -1] : [-1, ny], b = nx ? [nx, 1] : [1, ny];
                    return <polygon key={`${nx}${ny}`} points={[corner(a[0], a[1], 0), corner(b[0], b[1], 0), corner(b[0], b[1], h), corner(a[0], a[1], h)].map(pt).join(" ")}
                      className={nx ? "t3d-s1" : "t3d-s2"} />;
                  })}
                  <polygon points={[corner(-1, -1, lid), corner(1, -1, lid), corner(1, 1, lid), corner(-1, 1, lid)].map(pt).join(" ")} className="t3d-lid" />
                </g>
              );
            })}
          </g>
          {sLab.map(({ s, ax, ay, y }) => (
            <g key={s} className={cur?.s === s ? "t3d-lab is-on" : "t3d-lab"}>
              <path d={`M${ax.toFixed(1)} ${ay.toFixed(1)}L${(lx - 10).toFixed(1)} ${(y - 3).toFixed(1)}H${(lx - 4).toFixed(1)}`} className="t3d-leader" />
              <text x={lx} y={y} className={cur?.s === s ? "bw-label t3d-on" : "bw-label"}>{S[s]}</text>
            </g>
          ))}
          {qLab.map(({ q, x, y }) => (
            <text key={q} x={inX(x, quarters[q].short, "middle", 10)} y={Math.min(H - 6, y)} textAnchor="middle" className={cur?.q === q ? "bw-tick t3d-on" : "bw-tick"}>{quarters[q].short}</text>
          ))}
        </svg>
      </div>
      <div className="t3d-bar">
        <p className="t3d-read" aria-live="polite">{say ?? (phone ? "Tap a column for its value." : "Hover or tap a column for its value.")}</p>
        <div className="t3d-ctl" role="group" aria-label="Turn and zoom the terrain">
          <button type="button" className="bw-pill" onClick={() => turn(-30)} aria-label="Turn left">⟲</button>
          <button type="button" className="bw-pill" onClick={() => turn(30)} aria-label="Turn right">⟳</button>
          <button type="button" className="bw-pill" onClick={() => zoomBy(1 / 1.25)} aria-label="Zoom out">−</button>
          <button type="button" className="bw-pill" onClick={() => zoomBy(1.25)} aria-label="Zoom in">+</button>
          <button type="button" className="bw-pill" onClick={() => setView({ yaw: YAW, pitch: PITCH, zoom: 1 })}>Reset</button>
        </div>
      </div>
      <div className="t3d-key" aria-hidden="true">
        <span>▼ {crore(-max)} net selling</span>
        <i className="t3d-ramp" />
        <span>▲ {crore(max)} net buying</span>
      </div>
      <p id={`${uid}-help`} className="bw-meta t3d-help">
        {phone ? "Drag sideways to turn; pinch or + and − to zoom." : "Drag to turn and tilt; pinch, ctrl + scroll or + and − to zoom."} Keyboard: arrows step through the cells, shift + arrows turn and tilt, 0 resets.
        {phone && sectors.length > ns ? ` The ${ns} largest sectors are drawn; the table lists all ${sectors.length}.` : ""}
      </p>
    </div>
  );
}

function xy(a: readonly [number, number, number], b: readonly [number, number, number]) {
  return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
}
