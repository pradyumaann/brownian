"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

export const GROUPS: [string, string][][] = [
  [["/", "Markets, Overnight"], ["/portfolio/", "Portfolio Lens"], ["/wander/", "Wander Index"], ["/flows/", "Money Moves"], ["/macro/", "Macro Watch"]],
  [["/india/", "India Markets"], ["/global/", "Global Cues"]],
  [["/earnings/", "Earnings Radar"], ["/developing/", "Developing"], ["/learn/", "Jargon Buster"]],
];

/** Phones (under 620px): a bottom tab bar with short labels. Each tab lists the routes it stays lit on. */
export const TABS: { label: string; href: string; routes: string[] }[] = [
  { label: "Today", href: "/", routes: ["/"] },
  { label: "My mix", href: "/portfolio/", routes: ["/portfolio/"] },
  { label: "Mood", href: "/wander/", routes: ["/wander/"] },
  { label: "Calendar", href: "/macro/", routes: ["/macro/", "/earnings/"] },
];
/** The views behind "More", in the desktop nav's order. */
export const MORE: [string, string][] = [["/flows/", "Money Moves"], ["/india/", "India Markets"], ["/global/", "Global Cues"], ["/developing/", "Developing"], ["/learn/", "Jargon Buster"]];

const norm = (p: string) => (p.endsWith("/") ? p : p + "/");

export function Nav() {
  const path = norm(usePathname() || "/");
  return (
    <>
      <nav className="nav" aria-label="Views">
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
      <TabBar path={path} />
    </>
  );
}

/** The phone tab bar and its More sheet (a native <dialog>, like the source Sheet: Esc, a tap outside or the close
 *  button shuts it and focus returns to More). Hidden with display: none at 620px and up, so only one nav is exposed. */
function TabBar({ path }: { path: string }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const inMore = MORE.find(([h]) => h === path);
  const close = () => dlg.current?.close();
  return (
    <nav className="tabbar" aria-label="Views">
      <ul>
        {TABS.map((t) => {
          const here = t.routes.includes(path);
          return (
            <li key={t.href}>
              <Link href={t.href} className="tb" aria-current={path === t.href ? "page" : here ? "true" : undefined}>{t.label}</Link>
            </li>
          );
        })}
        <li>
          <button ref={btn} type="button" className="tb" aria-haspopup="dialog" aria-current={inMore ? "true" : undefined}
            onClick={() => dlg.current?.showModal()}>More</button>
        </li>
      </ul>
      <dialog ref={dlg} className="sheet more-sheet" aria-labelledby="more-sheet-t" onClose={() => btn.current?.focus()}
        onClick={(e) => { if (e.target === dlg.current) close(); }}>
        <div className="sheet-in">
          <div className="sheet-h">
            <h3 id="more-sheet-t">More views</h3>
            <button type="button" className="sheet-x" onClick={close} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>
          <ul className="more-list">
            {MORE.map(([href, label]) => (
              <li key={href}><Link href={href} onClick={close} aria-current={path === href ? "page" : undefined}>{label}</Link></li>
            ))}
          </ul>
        </div>
      </dialog>
    </nav>
  );
}
