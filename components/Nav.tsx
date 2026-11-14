"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const GROUPS: [string, string][][] = [
  [["/", "Brief"], ["/portfolio/", "Portfolio Lens"]],
  [["/mood/", "Mood Index"], ["/flows/", "Flow Map"], ["/india/", "India Markets"], ["/global/", "Global Cues"]],
  [["/macro/", "Macro Watch"], ["/earnings/", "Earnings Radar"], ["/developing/", "Developing"]],
  [["/learn/", "Jargon Buster"]],
];

const norm = (p: string) => (p.endsWith("/") ? p : p + "/");

export function Nav() {
  const path = norm(usePathname() || "/");
  return (
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
  );
}
