"use client";
import { useEffect, useState } from "react";

type Mode = "system" | "night" | "paper";
const NEXT: Record<Mode, Mode> = { system: "night", night: "paper", paper: "system" };
const LABEL: Record<Mode, string> = { system: "Theme: system", night: "Theme: night", paper: "Theme: paper" };

/** Cycles system → night → paper. Stored on this device only. */
export function ThemeToggle() {
  const [m, setM] = useState<Mode>("system");
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    if (t === "night" || t === "paper") setM(t);
  }, []);
  const go = () => {
    const n = NEXT[m];
    setM(n);
    if (n === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = n;
    try { if (n === "system") localStorage.removeItem("bw:theme"); else localStorage.setItem("bw:theme", n); } catch {}
  };
  return <button type="button" className="bw-pill" onClick={go} aria-label={`${LABEL[m]}. Change theme`}>{LABEL[m].slice(7)}</button>;
}
