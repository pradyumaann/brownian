"use client";

/** Play a chart's entrance once, when it first scrolls into view (at once if it is already on screen).
 *  The animations live in app/globals.css under `.rise` and only inside prefers-reduced-motion: no-preference.
 *  Marks are fully visible before and after; the class is removed when the entrance ends so a resize never replays it. */
export function riseOnView(el: HTMLElement): () => void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  let timer = 0;
  const go = () => {
    el.classList.remove("rise");
    void el.offsetWidth;
    el.classList.add("rise");
    timer = window.setTimeout(() => el.classList.remove("rise"), 3200);
  };
  const r = el.getBoundingClientRect();
  if (r.top < innerHeight * 0.92 && r.bottom > 0) { go(); return () => clearTimeout(timer); }
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { go(); io.disconnect(); } }, { threshold: 0.18 });
  io.observe(el);
  return () => { io.disconnect(); clearTimeout(timer); };
}
