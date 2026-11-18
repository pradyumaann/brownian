"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { B } from "@/data";
import { fillWith, type MoodVars } from "@/lib/bands";

const GAP = 8;   // between the term and the pop-up
const EDGE = 16; // viewport gutter
const MAXW = 300;

/** The glossary pop-up. Installed once in the layout, like the Sheet. A tap, click or Enter on any `[data-term]`
 *  button (`<Term>`) opens a small dialog anchored to it: the term, its plain-language `short` definition, today's
 *  number and a link to the full entry on /learn. Placed above the term when there is room, otherwise below, and
 *  clamped inside the viewport with a 16px gutter; it follows the term on scroll and resize. Focus moves into it;
 *  Esc (or Tab past either end) closes it and returns focus to the term; a click or tap outside closes it. One at a time. */
export function TermPop({ vars }: { vars: MoodVars }) {
  const [id, setId] = useState<string | null>(null);
  const [n, setN] = useState(0); // remounts the pop-up per opening, so the entrance plays each time
  const pop = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  const hide = useCallback((refocus: boolean) => {
    const el = opener.current;
    if (!el) return;
    el.setAttribute("aria-expanded", "false");
    opener.current = null;
    setId(null);
    if (refocus) el.focus();
  }, []);

  const place = useCallback(() => {
    const el = opener.current, p = pop.current;
    if (!el || !p) return;
    const rects = el.getClientRects();
    const first = rects[0] ?? el.getBoundingClientRect();
    const last = rects[rects.length - 1] ?? first;
    const vw = document.documentElement.clientWidth;
    const width = Math.min(MAXW, vw - 2 * EDGE);
    p.style.width = `${width}px`;
    const h = p.offsetHeight;
    const above = first.top - GAP - h >= EDGE;
    const top = above ? first.top - GAP - h : last.bottom + GAP;
    const left = Math.min(Math.max(first.left + first.width / 2 - width / 2, EDGE), vw - EDGE - width);
    p.style.top = `${Math.round(top)}px`;
    p.style.left = `${Math.round(left)}px`;
    p.dataset.place = above ? "above" : "below";
  }, []);

  // Open, switch or toggle on any term; close on a click or tap anywhere else.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t || pop.current?.contains(t)) return;
      const term = t.closest<HTMLElement>("[data-term]");
      const tid = term?.dataset.term;
      if (term && tid && B.gloss[tid]) {
        e.preventDefault();
        if (opener.current === term) { hide(false); return; }
        opener.current?.setAttribute("aria-expanded", "false");
        opener.current = term;
        term.setAttribute("aria-expanded", "true");
        setId(tid);
        setN((x) => x + 1);
        return;
      }
      if (opener.current) hide(false);
    };
    // Outside taps close it on pointerdown too: iOS Safari does not send a click for a tap on plain text.
    // Terms are left to the click handler, so tapping the open term still toggles it shut.
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!opener.current || !t || pop.current?.contains(t) || t.closest("[data-term]")) return;
      hide(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && opener.current) { e.preventDefault(); hide(true); }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [hide]);

  // Place before paint, then move focus in; follow the term while open.
  useLayoutEffect(() => {
    if (!id) return;
    place();
    pop.current?.focus({ preventScroll: true });
    let raf = 0;
    const onMove = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
    window.addEventListener("scroll", onMove, { capture: true, passive: true });
    window.addEventListener("resize", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onMove, { capture: true });
      window.removeEventListener("resize", onMove);
    };
  }, [id, n, place]);

  // A route change (including the "More in Jargon Buster" link) closes it.
  useEffect(() => { hide(false); }, [pathname, hide]);

  if (!id) return null;
  const [term, , today, short] = B.gloss[id];
  const note = today ? fillWith(today, vars) : "";

  // Tab past the last control, or Shift+Tab before the first, closes it and returns focus to the term.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !pop.current) return;
    const f = pop.current.querySelectorAll<HTMLElement>("a[href], button");
    const a = document.activeElement;
    if ((!e.shiftKey && a === f[f.length - 1]) || (e.shiftKey && (a === f[0] || a === pop.current))) {
      e.preventDefault();
      hide(true);
    }
  };

  return (
    <div
      key={n}
      ref={pop}
      className="termpop"
      role="dialog"
      aria-labelledby="termpop-t"
      aria-describedby="termpop-d"
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <div className="termpop-h">
        <h3 id="termpop-t">{term}</h3>
        <button type="button" className="termpop-x" onClick={() => hide(true)} aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>
      <p id="termpop-d" className="termpop-d">{short}</p>
      {note && <p className="termpop-n">{note}</p>}
      <Link href={`/learn/#${id}`} className="termpop-more" onClick={() => hide(false)}>More in Jargon Buster</Link>
    </div>
  );
}
