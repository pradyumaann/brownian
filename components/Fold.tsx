"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";

/** A section that is folded on every screen size, with its heading, a one-line summary and the open control always visible.
 *  The body stays in the page when folded (collapsed to zero height, hidden from sight, tab order and screen readers),
 *  so charts keep their width, anchors still resolve and search still finds it. It opens by animating its height
 *  (grid rows 0fr to 1fr); with motion switched off it changes at once. A link to `#id` of the fold, or of anything inside it,
 *  opens it. `part` makes it a sub-section of a bigger fold rather than a page section. */
export function Fold({ id, title, summary, ix, children, defaultOpen = false }: {
  id: string; title: React.ReactNode; summary?: React.ReactNode; ix?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [settled, setSettled] = useState(defaultOpen);
  const panel = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const pid = useId();

  const toggle = () => { setSettled(false); setOpen((o) => !o); };

  const fromHash = useCallback((scroll: boolean) => {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return;
    const el = document.getElementById(h);
    if (!el || !root.current?.contains(el)) return;
    setSettled(false);
    setOpen(true);
    if (scroll) requestAnimationFrame(() => requestAnimationFrame(() => el.scrollIntoView({ block: "start" })));
  }, []);
  useEffect(() => {
    fromHash(true);
    const on = () => fromHash(true);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, [fromHash]);

  return (
    <section ref={root} id={id} className={`sec fold${open ? " is-open" : ""}${settled ? " is-settled" : ""}`}>
      <div className="sh">
        <h2>
          <button type="button" id={`${pid}-b`} className="fold-btn" aria-expanded={open} aria-controls={pid} onClick={toggle}>
            <span className="fold-t">{title}</span>
            <span className="fold-pill" aria-hidden="true"><span className="fold-w">{open ? "Close" : "Open"}</span><span className="fold-i" /></span>
          </button>
        </h2>
        <p className="bw-meta"><span>{summary}</span>{ix && <span className="ix">{ix}</span>}</p>
        <hr className="bw-rule" />
      </div>
      <div id={pid} ref={panel} className="fold-panel" role="region" aria-labelledby={`${pid}-b`}
        onTransitionEnd={(e) => { if (e.propertyName === "grid-template-rows" && open) setSettled(true); }}>
        <div className="fold-inner" inert={!open}>
          <div className="fold-body">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** One named part inside a bigger fold: its own sub-heading, a context line with its tags, then its content. */
export function FoldPart({ id, title, meta, ix, children }: { id?: string; title: React.ReactNode; meta?: React.ReactNode; ix?: string; children: React.ReactNode }) {
  return (
    <div className="fold-part" id={id}>
      <div className="fold-part-h">
        <h3>{title}</h3>
        {ix && <span className="ix">{ix}</span>}
      </div>
      {meta && <p className="bw-meta fold-part-m">{meta}</p>}
      {children}
    </div>
  );
}
