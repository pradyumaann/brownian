"use client";
import { useEffect, useRef, useState } from "react";
import { B } from "@/data";
import { DATA_SOURCES } from "@/lib/papers";

const SRC: Record<string, readonly [string, string]> = Object.fromEntries([
  ...B.sources.map(([n, u], i) => ["S" + (i + 1), [n, u]] as const),
  ...B.web.map(([k, n, u]) => [k, [n, u]] as const),
  ...DATA_SOURCES.map(([k, n, u]) => [k, [n, u]] as const),
]);

interface Content { title: string; body: string; link?: string }

/** One sheet for source tags ([data-src]). Esc closes it and focus returns to the opener.
 *  Glossary terms ([data-term]) open the anchored pop-up in TermPop instead. */
export function Sheet() {
  const dlg = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [c, setC] = useState<Content | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const src = (e.target as HTMLElement).closest<HTMLElement>("[data-src]");
      if (!src) return;
      const s = SRC[src.dataset.src!];
      if (!s) return;
      opener.current = src;
      e.preventDefault();
      setC({ title: `Source ${src.dataset.src}`, body: s[0], link: s[1] });
      if (!dlg.current?.open) dlg.current?.showModal();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const close = () => dlg.current?.close();

  return (
    <dialog
      ref={dlg}
      className="sheet"
      aria-labelledby="sheet-t"
      onClose={() => opener.current?.focus()}
      onClick={(e) => { if (e.target === dlg.current) close(); }}
    >
      <div className="sheet-in">
        <div className="sheet-h">
          <h3 id="sheet-t">{c?.title}</h3>
          <button type="button" className="sheet-x" onClick={close} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <p className="sheet-b">{c?.body}</p>
        {c?.link && <p className="bw-meta"><a href={c.link} target="_blank" rel="noopener noreferrer">Open the source</a></p>}
      </div>
    </dialog>
  );
}
