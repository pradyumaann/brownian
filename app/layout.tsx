import type { Metadata, Viewport } from "next";
import "./globals.css";
import { B } from "@/data";
import { Masthead } from "@/components/Masthead";
import { Nav } from "@/components/Nav";
import { Readout } from "@/components/Readout";
import { Sheet } from "@/components/Sheet";
import { TermPop } from "@/components/TermPop";
import { hours } from "@/lib/market";
import { moodSeries, vars } from "@/lib/mood";
import { DATA_SOURCES, PAPERS } from "@/lib/papers";

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
          <Masthead bars={moodSeries.slice(-5).map((p) => ({ date: p.date, score: p.score }))} dateLabel={B.dateLabel} open={hours.open} close={hours.close} />
          <Nav />
          <main id="main" tabIndex={-1}>{children}</main>
          <footer className="foot">
            <div className="foot-top">
              <p className="bw-disclaimer"><b>For information only; not investment advice.</b> “n/a” means the figure could not be verified from the sources checked. The Wander Index, macro-pressure reading and impact notes are a rules-based reading of the sources, not a forecast.</p>
              <p className="bw-source">Updated {B.dateLabel}, {B.prepared} IST</p>
            </div>
            <details className="srcs">
              <summary>Sources and methodology</summary>
              <h4>News and market sources</h4>
              <ol>
                {B.sources.map(([n, u], i) => (
                  <li key={u}><span className="bw-mono">S{i + 1}</span> <a href={u} target="_blank" rel="noopener noreferrer">{n}</a></li>
                ))}
              </ol>
              <h4>Calendar and economic data</h4>
              <ol>
                {B.web.map(([k, n, u]) => (
                  <li key={k}><span className="bw-mono">{k}</span> <a href={u} target="_blank" rel="noopener noreferrer">{n}</a></li>
                ))}
              </ol>
              <h4>Market data history</h4>
              <ol>
                {DATA_SOURCES.map(([k, n, u]) => (
                  <li key={k}><span className="bw-mono">{k}</span> <a href={u} target="_blank" rel="noopener noreferrer">{n}</a></li>
                ))}
              </ol>
              <h4>Research behind the indexes</h4>
              <ul>
                {Object.values(PAPERS).map((p) => (
                  <li key={p.url}>{p.cite}. <a href={p.url} target="_blank" rel="noopener noreferrer">{p.title}</a>. {p.venue}.</li>
                ))}
              </ul>
              <h4>Methodology notes</h4>
              <ul>{B.method.slice(0, 2).map((m) => <li key={m}>{m}</li>)}</ul>
            </details>
            <p className="tagline">Brownian · <span className="bw-serif">Markets wander. You don&apos;t have to.</span></p>
          </footer>
        </div>
        <Sheet />
        <TermPop vars={vars} />
        <Readout />
      </body>
    </html>
  );
}
