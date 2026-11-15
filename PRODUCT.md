# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Web app: Next.js (App Router, TypeScript), confirmed 14 Nov 2026, built as a static export from the day's brief. Deployment target: a responsive web app first (installable as a PWA), native iOS/Android later. The original single-file prototype (`prototype/index.html`) is kept as a reference only.

## Users

Primary: long-term DIY investors in India. They hold SIPs, mutual funds and some direct stocks, check the market daily, and do not trade intraday. Their job each morning: understand what happened overnight and what it means for what they own, then stay rational rather than react.

Beginners and active traders are not the primary audience. Explanations (jargon help) exist for depth, but the product does not assume a first-time investor.

## Product Purpose

Brownian turns the daily pre-market brief (20+ sources across Indian and global markets) into a clear, evidence-based picture for retail investors before the 09:15 IST open: market sentiment, money flows, sector rotation, macro pressure, economic and earnings calendars, and the impact on the user's own holdings.

Success: the user finishes the morning read knowing what moved, why, what it means for their money, and what to watch, without being pushed toward a trade.

It is planned to grow into an AI product (an AI analyst the user can question, alerts) with further products and features.

## Positioning

Research-based and transparent, not a tips app. Every number shows its source; where sources disagree the product says so; unverifiable figures are shown as "n/a" rather than guessed. The sentiment reading is built on published methodology (fear-and-greed component structure, academic research) with its formulas visible, and is kept separate from fundamental macro pressure.

## Operating Context

- Read daily, mostly in the morning before the Indian market opens (brief prepared around 07:50 IST). Phone and desktop.
- Content follows the Indian trading day: GIFT Nifty overnight, NSE/BSE cash session, FII/DII provisional flows in the evening, MCX commodities, USD/INR.
- Global session (US, Europe, Japan) is read for its India link.
- Units and conventions: ₹ crore, Indian digit grouping (1,00,000), times in IST, NSE sectoral indices, S&P 500 sectors.
- The source today is a daily email brief ("Pre-Market Brief") with numbered source tags [S#].

## Capabilities and Constraints

Confirmed features and names:
- Markets, Overnight: the daily overview (the front page; renamed from “Brief”, 14 Nov 2026)
- Wander Index: Brownian's own name (14 Nov 2026; was “Mood Index”) for its sentiment index, 0–100, seven equal-weighted components each ranked against its own five-year history (15 Nov 2026: put/call ratio dropped, both VIX readings taken against their 50-day average), with visible methods and papers; shown beside Macro pressure (0–100, from the brief's seven indicators); plus risk readings (turbulence, fragility, global spillover, liquidity stress). Name not yet cleared: check docs/name-clearance.md before relying on it.
- Flow Map: FII/DII flows and sector rotation
- Portfolio Lens: impact on the user's holding types, plus a watchlist
- India Markets: indices, sectors, movers, commodities, rupee, after-hours
- Global Cues: world indices, cross-asset macro, US sectors and after-hours
- Macro Watch: economic indicators and the event calendar
- Earnings Radar: results calendars (India and US) and scorecard
- Developing: story tracker across days
- Jargon Buster: glossary tied to the day's numbers

Proposed, not yet confirmed: "Ask Brownian" (AI analyst), "Early Signals" (alerts).

Constraints:
- Information and education only. No buy/sell recommendations, price targets or personalised advice. Do not use "advisor"/"advisory" in names or copy (SEBI investment-adviser terms).
- Every page carries "For information only; not investment advice."
- Rules-based readings (sentiment, impact notes) must be labelled as interpretation, not forecast.
- Per-viewer preferences (holdings, watchlist) are stored on the device only in the prototype.
- Data currently arrives once a day; there is no live market feed yet.

Data (14 Nov 2026): history comes from free public sources (NSE archive files, NSDL, Yahoo Finance) into a daily store in the repo. NSE's and Yahoo's terms on automated download and redistribution must be checked before Brownian is public; a licensed feed is the fallback.

Open decisions: parsing the morning brief into the daily record; account model; AI analyst scope.

## Brand Commitments

- Name: Brownian (domain intent: brownian.ai). From Brownian motion, the physics behind the random-walk model of prices: random day to day, with an upward drift over time. The name is a self-aware nod that single-day moves are noise, which is the product's own message. Tagline: "Markets wander. You don't have to."
- Previous working name: Antelux (retired).
- Design language (14 Nov 2026): data as landscape on a dark canvas: ridgelines, unit-strand flows, a segmented-ring Wander Index, hairline structure, Onest / JetBrains Mono (no italic accent words), a night theme by default with a paper (light) theme, and dawn as the single accent. Rules in design/DESIGN.md; derived from the founder's web-design reference board.
- Voice: calm, plain, evidence-first. Explains rather than hypes. Says when data is missing or conflicting.
- Brand name appears on flagship features only (Markets, Overnight; Ask Brownian); other features use plain market language Indian investors already use.
- Clearance (14 Nov 2026): see docs/name-clearance.md. brownian.ai and brownian.com are owned by others; no USPTO conflict in classes 36/42; IP India and handles still to confirm manually.

## Evidence on Hand

- Daily brief email for Fri 13 Nov 2026 (the prototype's data), with 20 cited sources.
- Web-sourced calendar data for that date (India CPI, WPI, RBI/FOMC dates, US PPI consensus, India and US earnings calendars), cited in the app.

Absent, and must not be fabricated: users, testimonials, usage numbers, performance or accuracy claims, press, partnerships, pricing.

## Product Principles

1. Clarity before the open: the user should grasp the day in under a minute, with depth one tap away.
2. Show the evidence: sources, formulas and disagreements are visible, never hidden.
3. Rational over reactive: frame moves in context (trend vs one-day, sentiment vs fundamentals) and name behavioural biases.
4. Make it personal: translate market news into what it means for the user's holdings and wallet.
5. Inform, never advise: no calls, no targets, no urgency tactics.
