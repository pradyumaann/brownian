# Brownian

AI market intelligence for Indian retail investors. Brownian turns the daily pre-market brief (20+ sources across Indian and global markets) into a clear, evidence-based picture before the 09:15 IST open: market sentiment, money flows, sector rotation, macro pressure, economic and earnings calendars, and what it all means for the user's own holdings.

> *Markets wander. You don't have to.*
>
> The name comes from Brownian motion, the physics behind the random-walk model of stock prices: random day to day, with an upward drift over time. Single-day moves are mostly noise; Brownian helps long-term investors see the evidence and stay rational.

**Information and education only. Not investment advice.** See the rules in [AGENTS.md](AGENTS.md).

## Status

A Next.js web app built from one real brief (Fri 13 Nov 2026), in the Brownian design language. The day's data is a typed record in `data/`; there is no backend or live feed yet. The original single-file prototype is kept in `prototype/` for reference.

| Path | What it is |
|---|---|
| `app/`, `components/`, `lib/`, `data/` | The web app: 10 views (one route each), shared components and charts, Mood Index scoring, and the day's brief as typed data. |
| `prototype/index.html` | The original single-file prototype (superseded; reference only). |
| `design/` | Design language: `DESIGN.md` (rules, imported by `CLAUDE.md`), tokens, `brownian.css`, chart helpers, and `reference/brownian-brief.html` (the Brief rebuilt in the new language from the 13 Nov brief). |
| `PRODUCT.md` | Product truth: users, purpose, positioning, constraints, feature names, principles. Read this before any product or design work. |
| `AGENTS.md` | Brief for coding agents and collaborators: rules, architecture, conventions, how to verify. `CLAUDE.md` imports it. |
| `docs/briefs/` | Source briefs. `2026-11-13-pre-market-brief.txt` is the one the prototype is built from. |
| `docs/design-review-2026-11-13.md` | Findings from the first design critique and what the polish pass fixed. |
| `.impeccable/` | Impeccable design-tool state (critique snapshots stay local). |

## Run the app

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to out/
npm run check      # after a build: every view at 1280px and 400px, night and paper; console errors and sideways scroll
```

`npm run check` drives an installed Edge through `playwright-core` (`node scripts/check.mjs <shots-dir> chrome` for Chrome).

### Market history

```bash
npm run history          # bring data/history up to date (first run downloads ~1 GB of NSE files; later runs fetch only new days)
npm run history:verify   # coverage, consistency, NSE vs Yahoo cross-check, implausible-value checks
```

| File | What | Source | From |
|---|---|---|---|
| `indices.csv` | 22 NSE indices incl. 15 sectors and India VIX, daily OHLC, P/E, P/B | NSE archives (D1) | Nov 2021 |
| `breadth.csv` | Advances, declines, 52-week highs and lows, illiquidity | NSE cash bhavcopy (D2) | Nov 2023 |
| `options.csv` | Nifty options put and call volume and open interest | NSE F&O bhavcopy (D3) | Nov 2024 |
| `fpi.csv` | FPI net investment: equity, debt, index futures | NSDL daily (D4) | Nov 2021 |
| `sector_flows.csv` | FPI net equity investment and holdings by sector, fortnightly | NSDL (D4) | Aug 2024 |
| `world.csv` | 15 overseas and cross-asset series | Yahoo Finance (D5) | Nov 2021 |

## Features

| Feature | Route | What it does |
|---|---|---|
| Brief | `/` | The day in under a minute: Mood Index, macro pressure, your holdings, six key numbers, takeaways, the next 7 days |
| Portfolio Lens | `/portfolio` | Impact of today's news on the user's holding types, plus a watchlist |
| Mood Index | `/mood` | 0–100 sentiment index from 6 components with visible formulas and research, kept separate from macro pressure |
| Flow Map | `/flows` | FII/DII flows and sector rotation |
| India Markets | `/india` | Indices, sectors, movers, MCX, rupee, after-hours |
| Global Cues | `/global` | World indices, cross-asset macro, US sectors, after-hours |
| Macro Watch | `/macro` | Economic indicators and the event calendar |
| Earnings Radar | `/earnings` | India and US results calendars and scorecard |
| Developing | `/developing` | Stories that carry over from day to day |
| Jargon Buster | `/learn` | Glossary tied to the day's numbers |

## Roadmap (open decisions)

1. **Web app.** Next.js, confirmed. All 10 views are built in the design language; next: PWA install, then native iOS/Android later.
2. **Daily ingestion.** Parse each morning's brief into structured data (one record per day), keep history, and render the views from it. This unlocks trends: FII flows by day, Mood Index over the week, story day-counts.
3. **Mood Index and research indexes.** Done: nine components scored against history; turbulence, fragility, global spillover, FPI flow persistence and liquidity stress. Parked: Baker–Wurgler composite (India inputs unconfirmed). Gap: DII history has no free daily source.
4. **Ask Brownian.** An AI analyst users can question, answering only from cited sources.
5. **Accounts.** Holdings and watchlist are device-only today.

Name checks so far: [docs/name-clearance.md](docs/name-clearance.md). `brownian.ai` is owned by someone else; IP India and social handles still need a manual check.
