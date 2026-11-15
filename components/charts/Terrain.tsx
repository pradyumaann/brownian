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
  const W = w || 720, H = phone ? 340 : 540;
  const side = phone ? 44 : 120, top = 14, bottom = 24;
  const { yaw, pitch, zoom } = view;
  const cy = Math.cos(rad(yaw)), sy = Math.sin(rad(yaw)), cp = Math.cos(rad(pitch)), sp = Math.sin(rad(pitch));
  const HZ = Math.max(nq, ns) * 0.46; // world height of the largest column
  // Fit a footprint circle (so turning never changes the scale), plus the tallest column up and down. On a phone
  // the sector names may sit over the floor's edge; they keep a halo in the plot colour, so they stay legible.
  const R = Math.hypot(nq / 2, ns / 2), hiZ = Math.max(0, ...all) / max * HZ, loZ = Math.min(0, ...all) / max * HZ;
  const k = Math.min((W - side * 2) / (2 * R), (H - top - bottom) / (2 * R * sp + (hiZ - loZ) * cp)) * zoom;
  const ox = W / 2, oy = top + (H - top - bottom) / 2 + (k * (hiZ + loZ) * cp) / 2;
  // World: x along quarters (oldest at left), y along sectors (largest at the front), z up.
  const P = (x: number, y: number, h: number) => {
    const xr = x * cy - y * sy, yr = x * sy + y * cy;
    return [ox + xr * k, oy + (yr * sp - h * cp) * k, yr * cp + h * sp] as const;
  };
  const wx = (q: number) => q - (nq - 1) / 2, wy = (s: number) => (ns - 1) / 2 - s;
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

  // Labels: sectors beside the floor edge that sits further right on screen; quarters along the nearer floor edge.
  const xe = P(nq / 2 + 0.1, 0, 0)[0] > P(-nq / 2 - 0.1, 0, 0)[0] ? 1 : -1;
  const ye = P(0, ns / 2, 0)[1] > P(0, -ns / 2, 0)[1] ? 1 : -1;
  const sLab: { s: number; x: number; y: number; end: boolean }[] = [];
  S.forEach((_, s) => {
    const p = P(xe * (nq / 2 + 0.25), wy(s), 0), end = p[0] < ox;
    if (sLab.length && Math.abs(p[1] - sLab.at(-1)!.y) < (phone ? 12 : 13) && Math.abs(p[0] - sLab.at(-1)!.x) < 60) return;
    sLab.push({ s, x: p[0] + (end ? -6 : 6), y: p[1] + 3, end });
  });
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
    return x + (Math.max(4, Math.min(W - 4 - wd, x0)) - x0);
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
          {sLab.map(({ s, x, y, end }) => (
            <text key={s} x={inX(x, S[s], end ? "end" : "start", 11)} y={y} textAnchor={end ? "end" : "start"} className={cur?.s === s ? "bw-label t3d-on" : "bw-label"}>{S[s]}</text>
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
