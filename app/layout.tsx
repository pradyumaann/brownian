import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { B } from "@/data";
import { Freshness } from "@/components/Freshness";
import { Nav } from "@/components/Nav";
import { Readout } from "@/components/Readout";
import { Sheet } from "@/components/Sheet";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: { default: "Brownian", template: "%s · Brownian" },
  description: "The daily pre-market picture for Indian investors: sentiment, flows, sectors, macro and your holdings. For information only; not investment advice.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

// Applied before paint so a stored night/paper choice never flashes the other theme.
const THEME = `try{var t=localStorage.getItem("bw:theme");if(t==="night"||t==="paper")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME }} />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <div className="page">
          <header className="bar">
            <Link href="/" className="mark">Brownian</Link>
            <div className="st">
              <span>{B.dateLabel}</span>
              <Freshness />
              <span>Open 09:15 · Close 15:30</span>
              <ThemeToggle />
            </div>
          </header>
          <Nav />
          <main id="main" tabIndex={-1}>{children}</main>
          <footer className="foot">
            <div className="foot-top">
              <p className="bw-disclaimer"><b>For information only; not investment advice.</b> “n/a” means the figure could not be verified from the sources retrieved this morning. The Mood Index, macro-pressure reading and impact notes are a rules-based reading of the sources, not a forecast.</p>
              <p className="bw-source">Built from the Pre-Market Brief of {B.dateLabel}, prepared {B.prepared} IST</p>
            </div>
            <details className="srcs">
              <summary>Sources and methodology</summary>
              <h4>Brief sources</h4>
              <ol>
                {B.sources.map(([n, u], i) => (
                  <li key={u}><span className="bw-mono">S{i + 1}</span> <a href={u} target="_blank" rel="noopener noreferrer">{n}</a></li>
                ))}
              </ol>
              <h4>Calendar and economic data (web, {B.dateShort})</h4>
              <ol>
                {B.web.map(([k, n, u]) => (
                  <li key={k}><span className="bw-mono">{k}</span> <a href={u} target="_blank" rel="noopener noreferrer">{n}</a></li>
                ))}
              </ol>
              <h4>Methodology references</h4>
              <ul>{B.method.map((m) => <li key={m}>{m}</li>)}</ul>
            </details>
            <p className="tagline">Brownian · <span className="bw-serif">Markets wander. You don&apos;t have to.</span></p>
          </footer>
        </div>
        <Sheet />
        <Readout />
      </body>
    </html>
  );
}
