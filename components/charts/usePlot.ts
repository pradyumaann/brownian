"use client";
import { useEffect, useRef, useState } from "react";

/** Redraw an imperative chart whenever its container changes width (phones included).
 *  The first draw gets the view's entrance moment via `.rise`; resizes redraw without it. */
export function usePlot(draw: (svg: SVGSVGElement, w: number) => void, deps: unknown[] = []) {
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = box.current, s = svg.current;
    if (!el || !s) return;
    let last = 0, first = true, timer = 0;
    const run = () => {
      const w = Math.floor(el.clientWidth);
      if (!w || w === last) return;
      last = w;
      draw(s, w);
      if (first) {
        first = false;
        el.classList.add("rise");
        timer = window.setTimeout(() => el.classList.remove("rise"), 700);
      }
    };
    run();
    const ro = new ResizeObserver(run);
    ro.observe(el);
    return () => { ro.disconnect(); clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { box, svg };
}

/** Container width for charts drawn as React SVG. 0 until measured. */
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
    return () => ro.disconnect();
  }, []);
  return { ref, w };
}
