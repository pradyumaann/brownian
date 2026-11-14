"use client";
import { useEffect, useRef, useState } from "react";
import { riseOnView } from "./rise";

/** Redraw an imperative chart whenever its container changes width (phones included).
 *  The first draw plays the entrance when the chart scrolls into view; later resizes redraw without it. */
export function usePlot(draw: (svg: SVGSVGElement, w: number) => void, deps: unknown[] = []) {
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = box.current, s = svg.current;
    if (!el || !s) return;
    let last = 0, first = true, stop = () => {};
    const run = () => {
      const w = Math.floor(el.clientWidth);
      if (!w || w === last) return;
      last = w;
      draw(s, w);
      if (first) { first = false; stop = riseOnView(el); }
    };
    run();
    const ro = new ResizeObserver(run);
    ro.observe(el);
    return () => { ro.disconnect(); stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { box, svg };
}

/** Container width for charts drawn as React SVG (0 until measured); the entrance plays when it scrolls into view. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const run = () => setW(Math.floor(el.clientWidth));
    run();
    const ro = new ResizeObserver(run);
    ro.observe(el);
    const stop = riseOnView(el);
    return () => { ro.disconnect(); stop(); };
  }, []);
  return { ref, w };
}
