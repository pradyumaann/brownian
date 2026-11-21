"use client";
import { useEffect, useLayoutEffect, type RefObject } from "react";

/** Drives the header's progress, --p (0 = full header, 1 = slim bar), and --k (how much of the full header's
 *  height has been given up). CSS does the rest with transforms, so nothing here reads layout while scrolling.
 *  - On Markets, Overnight, the full header stays (no scroll-linked shrink; it scrolls away with the page).
 *  - Moving between views plays the glide as Web Animations: --p and --k jump to the new state, and each moving
 *    element (wordmark, bars, switch, day line, tagline, plus-mark field) animates its transform and opacity from where
 *    it was, with the header's height following. No inherited custom property changes per frame, so nothing is
 *    restyled while it plays (animating --p/--k restyled the whole header, 240 marks included, every frame).
 *  - While the header is off screen its quiet loops are paused (data-idle). */
const num = (s: string) => parseFloat(s) || 0;
const clamp = (v: number) => Math.min(1, Math.max(0, v));

const MOVERS = ".mast-mark, .mast-logo, .mast-dl, .mast-tog, .mast-art, .mast-tag, .mast-field, .mast-hours, .mast-bar text";
const STEPS = 2; // from, halfway (every fade is done by then), to: each sample restyles the header once
type Host = HTMLElement & { __g?: Animation[] };

/** Plays the change of view from progress `from` to `to` (0 full, 1 slim). The element's CSS is already at the end
 *  state (p = to); this samples the computed transform and opacity of each moving element at a few points between
 *  the two states and animates from there. Only transform and opacity per element run; the header's height follows. */
function glide(el: Host, from: number, to: number) {
  el.__g?.forEach((a) => a.cancel());
  const nodes = Array.from(el.querySelectorAll<HTMLElement>(MOVERS)).filter((n) => n.getClientRects().length > 0);
  const frames: { transform: string; opacity: string }[][] = nodes.map(() => []);
  const host: { height: string; top: string }[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const p = from + (to - from) * (i / STEPS);
    el.style.setProperty("--p", String(p)); el.style.setProperty("--k", String(p));
    nodes.forEach((n, j) => { const cs = getComputedStyle(n); frames[j].push({ transform: cs.transform, opacity: cs.opacity }); });
    const hs = getComputedStyle(el); host.push({ height: hs.height, top: hs.top });
  }
  el.style.setProperty("--p", String(to)); el.style.setProperty("--k", String(to));
  const opts: KeyframeAnimationOptions = { duration: 550, easing: "cubic-bezier(.4, 0, .2, 1)" };
  const anims: Animation[] = [];
  nodes.forEach((n, j) => {
    const fr = frames[j];
    const moves = fr.some((f) => f.transform !== fr[0].transform), fades = fr.some((f) => f.opacity !== fr[0].opacity);
    if (!moves && !fades) return;
    const keep = n.matches(".mast-tag, .mast-field"); // hidden by data-away at the end; stay visible while they fade
    anims.push(n.animate(fr.map((f) => ({ ...(moves ? { transform: f.transform } : {}), ...(fades ? { opacity: f.opacity } : {}), ...(keep ? { visibility: "visible" } : {}) })), opts));
  });
  anims.push(el.animate(host, opts));
  el.setAttribute("data-morph", "");
  el.__g = anims;
  Promise.all(anims.map((a) => a.finished)).then(() => { if (el.__g === anims) el.removeAttribute("data-morph"); }, () => {});
}

export function useMastProgress(ref: RefObject<HTMLElement | null>, home: boolean) {
  const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;
  const state = ref as RefObject<HTMLElement | null> & { current: (HTMLElement & { __s?: { home: boolean; last: number } }) | null };

  // Measure what CSS cannot know: the wordmark's real font size, the bars' real box and the switch's width.
  useIso(() => {
    const el = ref.current;
    if (!el) return;
    const q = (s: string) => el.querySelector<HTMLElement>(s);
    const measure = () => {
      const cs = getComputedStyle(el);
      const mark = q(".mast-mark"), tog = q(".mast-tog .tsw");
      const bars = [q(".mast-art-w"), q(".mast-art-c")].find((b) => b && b.offsetHeight > 0);
      if (mark) el.style.setProperty("--m-s-mark", String(num(cs.getPropertyValue("--m-mark-fs")) / num(getComputedStyle(mark).fontSize)));
      if (bars) {
        const s = num(cs.getPropertyValue("--m-mini-h")) / bars.offsetHeight;
        el.style.setProperty("--m-s-bars", String(s));
        el.style.setProperty("--m-mini-w", `${(bars.offsetWidth * s).toFixed(1)}px`);
      }
      if (tog) el.style.setProperty("--m-tog-w", `${tog.offsetWidth}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  useIso(() => {
    const el = state.current;
    if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const dist = () => Math.max(1, num(getComputedStyle(el).getPropertyValue("--m-H")) - num(getComputedStyle(el).getPropertyValue("--m-bar")));
    const set = (p: number, k: number) => { el.style.setProperty("--p", String(p)); el.style.setProperty("--k", String(k)); };
    // Markets, Overnight keeps the full header and lets it scroll away; no scroll-linked shrink there (17 Nov 2026 decision).
    const prog = () => 0;
    const stuck = () => { el.toggleAttribute("data-stuck", el.dataset.away !== undefined && scrollY > 2); };

    const s = el.__s;
    el.__s = { home, last: s ? s.last : scrollY };
    if (!s) set(home ? prog() : 1, home ? 0 : 1);
    else if (s.home !== home && !reduced.matches) glide(el, home ? 1 : 0, home ? prog() : 1);
    else set(home ? prog() : 1, home ? 0 : 1);
    stuck();

    let raf = 0;
    const onScroll = () => {
      if (el.__s) el.__s.last = scrollY;
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; if (home && !el.hasAttribute("data-morph")) set(prog(), 0); stuck(); });
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    reduced.addEventListener("change", onScroll);
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); reduced.removeEventListener("change", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [home, ref]);

  // Pause the header's quiet loops while it is off screen (Markets, Overnight scrolls it away).
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((e) => { const on = e[e.length - 1].isIntersecting; el.toggleAttribute("data-idle", !on); });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);

  // The bars' colour roll (30 s a lap; each bar a fifth of a lap behind its neighbour; text colour switches, never blends).
  // Written a few times a second as inline fill, not as a CSS animation, which would tick the main thread every frame.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const rects = Array.from(el.querySelectorAll<SVGElement>(".mast-bar rect"));
    const texts = Array.from(el.querySelectorAll<SVGElement>(".mast-bar text"));
    const idx = (e: Element) => Number(e.closest<SVGElement>(".mast-bar")?.style.getPropertyValue("--i")) || 0;
    const rI = rects.map(idx), tI = texts.map(idx);
    const clear = () => { rects.forEach((r) => r.style.removeProperty("fill")); texts.forEach((r) => r.style.removeProperty("fill")); };
    const start = Date.now();
    const tick = () => {
      if (reduced.matches || el.hasAttribute("data-idle") || document.hidden) return;
      const now = Date.now() - start;
      rects.forEach((r, n) => {
        const u = (((now + 6000 * rI[n]) % 30000) / 30000) * 5, a = Math.floor(u) % 5, f = Math.round((u - Math.floor(u)) * 100);
        r.style.fill = `color-mix(in srgb, var(--mast-${((a + 1) % 5) + 1}) ${f}%, var(--mast-${a + 1}))`;
      });
      texts.forEach((r, n) => {
        const pc = (((now + 6000 * tI[n]) % 30000) / 30000) * 100;
        const k = pc < 10 ? 1 : pc < 30 ? 2 : pc < 50 ? 3 : pc < 70 ? 4 : pc < 90 ? 5 : 1;
        r.style.fill = `var(--mast-ink-${k})`;
      });
    };
    const onReduce = () => { if (reduced.matches) clear(); else tick(); };
    tick();
    const iv = setInterval(tick, 250);
    reduced.addEventListener("change", onReduce);
    return () => { clearInterval(iv); reduced.removeEventListener("change", onReduce); clear(); };
  }, [ref]);
}
