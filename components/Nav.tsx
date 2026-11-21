"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const GROUPS: [string, string][][] = [
  [["/", "Markets, Overnight"], ["/portfolio/", "Portfolio Lens"], ["/wander/", "Wander Index"]],
  [["/flows/", "Money Moves"], ["/macro/", "Macro Watch"], ["/india/", "India Markets"], ["/global/", "Global Cues"]],
  [["/earnings/", "Earnings Radar"], ["/developing/", "Developing"], ["/learn/", "Jargon Buster"]],
];

/** Phones (under 620px): three bottom tabs, each holding its views. The scrolling row shows the current tab's views. */
export const PHONE_TABS: { label: string; views: [string, string][] }[] = [
  { label: "Signal", views: [["/", "Markets, Overnight"], ["/portfolio/", "Portfolio Lens"], ["/wander/", "Wander Index"]] },
  { label: "Drift", views: [["/flows/", "Money Moves"], ["/macro/", "Macro Watch"], ["/india/", "India Markets"], ["/global/", "Global Cues"]] },
  { label: "Edge", views: [["/earnings/", "Earnings Radar"], ["/developing/", "Developing"], ["/learn/", "Jargon Buster"]] },
];

const norm = (p: string) => (p.endsWith("/") ? p : p + "/");
const LAST = "bw:tabs";

/** Scroll to the top, at once when the reader prefers reduced motion. */
function toTop() {
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
}

export function Nav() {
  const path = norm(usePathname() || "/");
  const current = PHONE_TABS.find((t) => t.views.some(([href]) => href === path)) ?? PHONE_TABS[0];
  // Each tab returns to the view last open in it, for this browser session.
  const [last, setLast] = useState<Record<string, string>>({});
  useEffect(() => {
    let saved: Record<string, string> = {};
    try { saved = JSON.parse(sessionStorage.getItem(LAST) ?? "{}") ?? {}; } catch {}
    const next = { ...saved, [current.label]: path };
    setLast(next);
    try { sessionStorage.setItem(LAST, JSON.stringify(next)); } catch {}
  }, [path, current.label]);
  return (
    <>
      <nav className="nav nav-wide" aria-label="Views">
        <div className="tabs">
          {GROUPS.map((g, i) => (
            <span key={i} className="tabgroup">
              {g.map(([href, label]) => (
                <Link key={href} href={href} className="tab" aria-current={path === href ? "page" : undefined}>
                  {label}
                </Link>
              ))}
            </span>
          ))}
        </div>
      </nav>
      <nav className="nav nav-phone" aria-label={`${current.label} views`}>
        <div className="tabs">
          {current.views.map(([href, label]) => (
            <Link key={href} href={href} className="tab" aria-current={path === href ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </div>
      </nav>
      <nav className="tabbar" aria-label="Sections">
        <ul>
          {PHONE_TABS.map((t) => (
            <li key={t.label}>
              <Link href={t === current ? path : t.views.some(([h]) => h === last[t.label]) ? last[t.label] : t.views[0][0]} className="btab" aria-current={t === current ? "true" : undefined}
                onClick={(e) => { if (t === current) { e.preventDefault(); toTop(); } }}>{t.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
