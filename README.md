# Brownian

AI market intelligence for Indian retail investors. Brownian turns the daily pre-market brief (20+ sources across Indian and global markets) into a clear, evidence-based picture before the 09:15 IST open: market sentiment, money flows, sector rotation, macro pressure, economic and earnings calendars, and what it all means for the user's own holdings.

> *Markets wander. You don't have to.*
>
> The name comes from Brownian motion, the physics behind the random-walk model of stock prices: random day to day, with an upward drift over time. Single-day moves are mostly noise; Brownian helps long-term investors see the evidence and stay rational.

**Information and education only. Not investment advice.** See the rules in [AGENTS.md](AGENTS.md).

## Status

A working single-file prototype built from one real brief (Fri 13 Nov 2026). The data is embedded in the page; there is no backend or live feed yet.

| Path | What it is |
|---|---|
| `prototype/index.html` | The full app: 10 views, charts, watchlist. Open it in a browser; no build step. |
| `PRODUCT.md` | Product truth: users, purpose, positioning, constraints, feature names, principles. Read this before any product or design work. |
| `AGENTS.md` | Brief for coding agents and collaborators: rules, architecture, conventions, how to verify. `CLAUDE.md` imports it. |
| `docs/briefs/` | Source briefs. `2026-11-13-pre-market-brief.txt` is the one the prototype is built from. |
| `docs/design-review-2026-11-13.md` | Findings from the first design critique and what the polish pass fixed. |
| `.impeccable/` | Impeccable design-tool state (critique snapshots stay local). |

## Run the prototype

```bash
open prototype/index.html
```

Or serve it locally (any static server works):

```bash
python3 -m http.server 8000 --directory prototype
```

Then go to `http://localhost:8000`. Views are hash routes: `#today`, `#money`, `#mood`, `#flows`, `#india`, `#global`, `#economy`, `#earnings`, `#stories`, `#learn`.

## Features

| Feature | View | What it does |
|---|---|---|
| Brief | `#today` | The day in under a minute: Mood Index, macro pressure, your holdings, six key numbers, takeaways, the next 7 days |
| Portfolio Lens | `#money` | Impact of today's news on the user's holding types, plus a watchlist |
| Mood Index | `#mood` | 0–100 sentiment index from 6 components with visible formulas and research, kept separate from macro pressure |
| Flow Map | `#flows` | FII/DII flows and sector rotation |
| India Markets | `#india` | Indices, sectors, movers, MCX, rupee, after-hours |
| Global Cues | `#global` | World indices, cross-asset macro, US sectors, after-hours |
| Macro Watch | `#economy` | Economic indicators and the event calendar |
| Earnings Radar | `#earnings` | India and US results calendars and scorecard |
| Developing | `#stories` | Stories that carry over from day to day |
| Jargon Buster | `#learn` | Glossary tied to the day's numbers |

## Roadmap (open decisions)

1. **Web app.** Responsive web app first (installable as a PWA), native iOS/Android later. Framework: Next.js is the working assumption, not final.
2. **Daily ingestion.** Parse each morning's brief into structured data (one record per day), keep history, and render the views from it. This unlocks trends: FII flows by day, Mood Index over the week, story day-counts.
3. **Complete the Mood Index.** Add the three missing standard components: Nifty put/call ratio, 52-week highs vs lows, Nifty vs its 125/200-day average.
4. **Ask Brownian.** An AI analyst users can question, answering only from cited sources.
5. **Accounts.** Holdings and watchlist are device-only today.

Name, domain (`brownian.ai`) and trademark clearance are not done yet.
