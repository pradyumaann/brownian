"use client";
import { useEffect, useState } from "react";

const effective = () => {
  const t = document.documentElement.dataset.theme;
  if (t === "night" || t === "paper") return t;
  return matchMedia("(prefers-color-scheme: light)").matches ? "paper" : "night";
};

/** A light / dark switch. It starts on your system setting, and your choice is kept on this device only. */
export function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    setDark(effective() === "night");
    const mq = matchMedia("(prefers-color-scheme: light)"), on = () => setDark(effective() === "night");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const flip = () => {
    const next = effective() === "night" ? "paper" : "night";
    document.documentElement.dataset.theme = next;
    setDark(next === "night");
    try { localStorage.setItem("bw:theme", next); } catch {}
  };
  return (
    <button type="button" role="switch" aria-checked={dark} aria-label="Dark mode" title={dark ? "Switch to light mode" : "Switch to dark mode"} className="tsw" onClick={flip}>
      <span className="tsw-lbl" aria-hidden="true">Light</span>
      <span className="tsw-track" aria-hidden="true">
        <span className="tsw-thumb">
          <svg className="i-sun" width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="2.6" fill="currentColor" /><path d="M6 .8v1.6M6 9.6v1.6M.8 6h1.6M9.6 6h1.6M2.3 2.3l1.1 1.1M8.6 8.6l1.1 1.1M2.3 9.7l1.1-1.1M8.6 3.4l1.1-1.1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
          <svg className="i-moon" width="12" height="12" viewBox="0 0 12 12"><path d="M10 7.2A4.4 4.4 0 0 1 4.8 2 4.4 4.4 0 1 0 10 7.2z" fill="currentColor" /></svg>
        </span>
      </span>
      <span className="tsw-lbl" aria-hidden="true">Dark</span>
    </button>
  );
}
