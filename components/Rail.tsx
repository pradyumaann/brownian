"use client";
import { useEffect, useRef } from "react";
import { riseOnView } from "./charts/rise";

/** The shared rail primitive: an ordered list whose nodes hang on a vertical line (CSS `.rail*`). It draws the line in
 *  once when first scrolled into view, only when motion is allowed; at rest every node and line is fully drawn.
 *  Being a real `ol`, it is also what a screen reader walks, in order. */
export function Rail({ children, className = "", label }: { children: React.ReactNode; className?: string; label: string }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => (ref.current ? riseOnView(ref.current) : undefined), []);
  return <ol ref={ref} className={`rail ${className}`} aria-label={label}>{children}</ol>;
}
