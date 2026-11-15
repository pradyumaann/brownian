"use client";
import { useEffect, useRef } from "react";
import { riseOnView } from "./rise";

/** A plain container that plays its chart's entrance (`.rise`) once, when it first scrolls into view.
 *  For charts drawn in HTML that fit their width without measuring it. */
export function RiseBox({ children, className, role, "aria-label": aria }: {
  children: React.ReactNode; className?: string; role?: string; "aria-label"?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? riseOnView(ref.current) : undefined), []);
  return <div ref={ref} className={className} role={role} aria-label={aria}>{children}</div>;
}
