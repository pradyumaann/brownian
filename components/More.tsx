"use client";
import { useId, useState } from "react";

/** Progressive disclosure for phones: under 620px the content folds behind a button; wider screens always show it.
 *  The content is in the page either way (search, print and screen readers on wide screens see all of it). */
export function More({ children, label = "More detail", className, bodyClassName, style, as: Tag = "div" }: {
  children: React.ReactNode; label?: string; className?: string; bodyClassName?: string; style?: React.CSSProperties; as?: "div" | "li";
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <Tag className={`more${open ? " is-open" : ""}${className ? " " + className : ""}`} style={style}>
      <div id={id} className={`more-body${bodyClassName ? " " + bodyClassName : ""}`}>{children}</div>
      <button type="button" className="more-btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {open ? "Show less" : label}<span aria-hidden="true">{open ? " ↑" : " ↓"}</span>
      </button>
    </Tag>
  );
}
