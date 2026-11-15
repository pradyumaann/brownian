# AGENTS.md

Brief for any agent or collaborator working on Brownian. Read `PRODUCT.md` first; it is the source of product truth. This file covers the rules, the code, and how to verify changes.

## Non-negotiable product rules

1. **Information and education only.** No buy/sell recommendations, price targets, allocation instructions, or personalised advice. Do not use "advisor", "advisory", "tips" or "calls" in names or copy (SEBI investment-adviser and research-analyst terms). Frame behaviour as research and questions ("Research links…", "Questions investors use…"), never as instructions.
2. **Every number shows its source.** Figures carry `[S#]` (brief sources) or `[W#]` (web sources) tags that open the source. Where sources disagree, say so (see "Data check"). Unverifiable figures are shown as `n/a`, never estimated or invented.
3. **Interpretation is labelled.** The Wander Index, macro-pressure reading, quadrant and holding impact notes are rules-based readings; they carry "Interpretation, not a forecast" and the page footer disclaimer: "For information only; not investment advice."
4. **Never fabricate** users, testimonials, usage numbers, accuracy or performance claims, press, partnerships or pricing.
5. **Indian conventions.** ₹ crore, Indian digit grouping (`toLocaleString("en-IN")`), times in IST, NSE sectoral indices. US event times are converted to IST.

## Repository layout

```
app/                   Next.js App Router: layout (top bar, nav, footer, sheet) and one route per view
components/            shared pieces (Src, Term, Chip, Change, Section, DataTable, portfolio) and charts/
lib/mood.ts            Wander Index methodology (scoring functions next to their visible formulas), macro pressure
lib/format.ts          ₹ crore, %, sign and tone helpers (Indian grouping, true minus)
data/                  one typed record per brief (types.ts is the shape ingestion must produce)
data/history/          daily history store: one CSV per series, filled by scripts/history (see below)
design/                design language: DESIGN.md (rules), tokens.json, brownian.css, brownian-charts.js (+ .d.ts), reference/
scripts/               check.mjs (Playwright view check), fix-export-segments.mjs (Windows export fix)
scripts/history/       importers for the history store, update.mjs (run all), verify.mjs (gate check)
prototype/index.html   original single-file prototype, superseded; reference only
PRODUCT.md             product record (users, purpose, constraints, feature names)
docs/briefs/           source briefs, one per day
docs/design-review-*.md  design critique findings
.impeccable/           design-tool state
```

## Design language

All UI follows `design/DESIGN.md` (imported by `CLAUDE.md`). The app imports `design/brownian.css` from `app/globals.css` and the chart helpers from `design/brownian-charts.js` (it doubles as a CommonJS module), so the design folder stays the single source of tokens and chart code. `app/globals.css` adds layout only and never hard-codes a colour.

## How the app is built

- **Stack:** Next.js 16 (App Router, TypeScript), `output: "export"`: every route is prerendered to static HTML in `out/`. Pages are server components; only interactive pieces (charts, sheet, nav, theme, Portfolio Lens) are client components.
- **Routes:** `/` Markets, Overnight, `/portfolio`, `/wander`, `/flows`, `/india`, `/global`, `/macro`, `/earnings`, `/developing`, `/learn`. Nav order and grouping: `GROUPS` in `components/Nav.tsx` (core four first: Markets, Overnight; Wander Index; Flow Map; Macro Watch).
- **Data:** `data/<date>.ts` holds the day (`Brief` in `data/types.ts`); `data/index.ts` picks the one to render. Text with inline tags uses the `Rich` segment type. Tones are `gain | loss | mixed | info | plain`.
- **History store:** `data/history/*.csv`, refreshed with `npm run history` (fetches only what is missing) and checked with `npm run history:verify`. Sources: NSE archive files for index closes (D1), cash-market bhavcopy (D2), F&O bhavcopy (D3) and participant-wise open interest (stored in `participant_oi.csv`, not yet used by any view, so no tag); NSDL for daily and fortnightly sector FPI flows (D4); Yahoo Finance for overseas markets (D5). A missing day stays missing; nothing is interpolated. `lib/history.ts` reads the store at build time and must never be imported by a client component. Raw bhavcopies are cached in `.cache/` (git-ignored).
- **Wander Index:** seven components in `lib/mood.ts` (India VIX and US VIX taken against their own 50-day average), each scored as the percentile of the day's reading among its own previous five years (at least 250 sessions, no look-ahead), then averaged; a component without enough history is left out and named. Banded 0–25 extreme fear, 25–45 fear, 45–55 neutral, 55–75 greed, 75–100 extreme greed. It is read as of `B.sessionDate`. Client-safe pieces (bands, quadrant names, `fillWith`) are in `lib/bands.ts`; copy that mentions the score uses `{score}`, `{band}`, `{press}` placeholders, never a hardcoded number.
- **Other indexes:** `lib/risk.ts` (turbulence, Kritzman & Li 2010; fragility/absorption ratio, Kritzman et al. 2011), `lib/spillover.ts` (Diebold & Yilmaz 2012), `lib/flows.ts` (FPI flow persistence and feedback, Froot et al. 2001; liquidity stress, Amihud 2002), `lib/sectorFlows.ts` (strand flow and terrain). Every paper is in `lib/papers.ts`, checked against publisher records; cite from there, and label a measure with no paper as a practitioner measure.
- **Sources and terms:** `<Src k={["S1"]} />` renders `.bw-src` tags and `<Term id="vix">` renders glossary buttons; one `Sheet` dialog (native `<dialog>`) opens either. Tags must match the `[S#]` tags in the brief text, the web source titles, or the history datasets (`D1`–`D5`, `DATA_SOURCES` in `lib/papers.ts`).
- **Theme:** night by default, paper as light, system when unset. `ThemeToggle` stores `bw:theme`; an inline script applies it before paint.
- **Per-viewer state:** holdings and watchlist in `localStorage` (keys `ii:held2`, `ii:watch2`, unchanged from the prototype), always wrapped in try/catch.

## Chart and interaction conventions

- **Readout:** any mark with `data-tip-v` (value, shown bold) and `data-tip-l` (label) gets the shared tooltip (`Brownian.readout()`, installed once by `components/Readout.tsx`) on hover, tap and keyboard focus. Give interactive marks `tabindex="0"`.
- **Charts:** helper charts go through `usePlot` (redraws on container resize); React-drawn SVG charts use `useWidth`. Both sit in `.bw-plot`.
- **Motion:** one entrance per chart, played when it first scrolls into view (`components/charts/rise.ts` adds `.rise`; `usePlot` and `useWidth` call it): lines draw, strands draw link by link, the ring lights segment by segment, terrain rows rise. Quiet loops: the masthead plus marks and the `.bw-now` dot. Everything sits inside `@media (prefers-reduced-motion: no-preference)`; marks are fully drawn at rest. Give any new line `pathLength={1}` and a `--d` delay to have it draw.
- **Theme switch:** `components/ThemeToggle.tsx` is a light/dark `role="switch"`; it starts on the system setting and stores `bw:theme` (`night` | `paper`) on the device.
- **Names:** the sentiment index is the **Wander Index** (route `/wander`); the front page is **Markets, Overnight**. Third-party products keep their real names (CNN's Fear & Greed, Tickertape's Market Mood Index).
- **Colour meaning:** price changes are coloured by sign (`<Change>` / `toneOf()`: teal up, ember down, with ▲/▼). Impact on India is written out in words ("Headwind for India"), not implied by colour.
- **Phone:** wide tables use `<DataTable stack>` and stack into cards under 620px; charts must fit 400px without sideways scroll.
- **Design rules from the review:** no small uppercase label (eyebrow/kicker) above a heading; put the context line under the heading as `.meta`. No nested cards. Body text ≥ 4.5:1 contrast in both themes.
- **Design language rules:** charts sit in a `.bw-plot` window that is the page's own colour in both themes, with its own Night and Paper data colours); ▲/▼ plus a sign on every change; one `dawn` highlight and one primary button per view; every chart redraws to its container (`Brownian.fit`). See `design/DESIGN.md`.

## Verify every change

1. `npm run history:verify` if you touched the history store or its importers, then `npm run typecheck` and `npm run build`.
2. `npm run check:plots`: every chart panel is the page's colour and no mark or label sticks out of it, in both themes at 1280px and 400px. Then `npm run check`: every view at 1280px and 400px in night and paper; it fails on console errors, failed requests or horizontal page scroll, and saves full-page screenshots to look at. Check the views you touched in the screenshots.
3. Tab through what you changed; the readout and the sheet must work from the keyboard (Esc closes the sheet and returns focus).
4. If you changed `design/`, also open `design/reference/brownian-brief.html`.

## Design tooling

The repo is set up for the Impeccable design skill: `PRODUCT.md` is its product context. Useful commands: `/impeccable critique` on a built page (`out/index.html`), `/impeccable polish`, `/impeccable audit`. Critique snapshots stay local (`.impeccable/critique/` ignores them).

## Working on it

- Branch per change; keep commits focused. Do not commit secrets, API keys or personal data (the raw brief emails contain an email address; commit only the extracted text as in `docs/briefs/`).
- When a decision in "Open decisions" (PRODUCT.md / README roadmap) gets made, update PRODUCT.md in the same change.
