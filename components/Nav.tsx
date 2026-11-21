"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  // Between about 620 and 1150px the wide nav is wider than the screen: show the current view and fade the edge that hides more.
  const wide = useRef<HTMLElement>(null);
  useEffect(() => {
    const n = wide.current;
    if (!n) return;
    const hint = () => {
      n.style.setProperty("--nav-l", n.scrollLeft > 2 ? "32px" : "0px");
      n.style.setProperty("--nav-r", n.scrollLeft + n.clientWidth < n.scrollWidth - 2 ? "32px" : "0px");
    };
    // Run again once the web font has loaded: the tabs are wider then, and the first measurement is too small.
    const place = () => {
      const a = n.querySelector<HTMLElement>('[aria-current="page"]');
      if (a) {
        const r = a.getBoundingClientRect(), nr = n.getBoundingClientRect();
        if (r.right > nr.right - 32) n.scrollLeft += r.right - nr.right + 40;
        else if (r.left < nr.left + 32) n.scrollLeft -= nr.left - r.left + 40;
      }
      hint();
    };
    place();
    document.fonts?.ready.then(place);
    n.addEventListener("scroll", hint, { passive: true });
    window.addEventListener("resize", hint);
    return () => { n.removeEventListener("scroll", hint); window.removeEventListener("resize", hint); };
  }, [path]);
  useEffect(() => {
    let saved: Record<string, string> = {};
    try { saved = JSON.parse(sessionStorage.getItem(LAST) ?? "{}") ?? {}; } catch {}
    const next = { ...saved, [current.label]: path };
    setLast(next);
    try { sessionStorage.setItem(LAST, JSON.stringify(next)); } catch {}
  }, [path, current.label]);
  return (
    <>
      <nav ref={wide} className="nav nav-wide" aria-label="Views">
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
