# AGENTS.md

Brief for any agent or collaborator working on Brownian. Read `PRODUCT.md` first; it is the source of product truth. This file covers the rules, the code, and how to verify changes.

## Non-negotiable product rules

1. **Information and education only.** No buy/sell recommendations, price targets, allocation instructions, or personalised advice. Do not use "advisor", "advisory", "tips" or "calls" in names or copy (SEBI investment-adviser and research-analyst terms). Frame behaviour as research and questions ("Research links…", "Questions investors use…"), never as instructions.
2. **Every number shows its source.** Figures carry `[S#]` (brief sources) or `[W#]` (web sources) tags that open the source. Where sources disagree, say so (see "Data check"). Unverifiable figures are shown as `n/a`, never estimated or invented.
3. **Interpretation is labelled.** The Mood Index, macro-pressure reading, quadrant and holding impact notes are rules-based readings; they carry "Interpretation, not a forecast" and the page footer disclaimer: "For information only; not investment advice."
4. **Never fabricate** users, testimonials, usage numbers, accuracy or performance claims, press, partnerships or pricing.
5. **Indian conventions.** ₹ crore, Indian digit grouping (`toLocaleString("en-IN")`), times in IST, NSE sectoral indices. US event times are converted to IST.

## Repository layout

```
app/                   Next.js App Router: layout (top bar, nav, footer, sheet) and one route per view
components/            shared pieces (Src, Term, Chip, Change, Section, DataTable, portfolio) and charts/
lib/mood.ts            Mood Index methodology (scoring functions next to their visible formulas), macro pressure
lib/format.ts          ₹ crore, %, sign and tone helpers (Indian grouping, true minus)
data/                  one typed record per brief (types.ts is the shape ingestion must produce)
design/                design language: DESIGN.md (rules), tokens.json, brownian.css, brownian-charts.js (+ .d.ts), reference/
scripts/               check.mjs (Playwright view check), fix-export-segments.mjs (Windows export fix)
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
- **Routes:** `/` Brief, `/portfolio`, `/mood`, `/flows`, `/india`, `/global`, `/macro`, `/earnings`, `/developing`, `/learn`. Nav order and grouping: `GROUPS` in `components/Nav.tsx`.
- **Data:** `data/<date>.ts` holds the day (`Brief` in `data/types.ts`); `data/index.ts` picks the one to render. Text with inline tags uses the `Rich` segment type. Tones are `gain | loss | mixed | info | plain`.
- **Mood Index:** the day's readings are data; scoring functions, formula strings, reference ranges and research notes live in `lib/mood.ts`. Score = equal-weighted average, banded 0–25 extreme fear, 25–45 fear, 45–55 neutral, 55–75 greed, 75–100 extreme greed. Copy that mentions the score uses `fill()` placeholders (`{score}`, `{band}`, `{press}`); never hardcode it.
- **Sources and terms:** `<Src k={["S1"]} />` renders `.bw-src` tags and `<Term id="vix">` renders glossary buttons; one `Sheet` dialog (native `<dialog>`) opens either. Tags must match the `[S#]` tags in the brief text or the web source titles.
- **Theme:** night by default, paper as light, system when unset. `ThemeToggle` stores `bw:theme`; an inline script applies it before paint.
- **Per-viewer state:** holdings and watchlist in `localStorage` (keys `ii:held2`, `ii:watch2`, unchanged from the prototype), always wrapped in try/catch.

## Chart and interaction conventions

- **Readout:** any mark with `data-tip-v` (value, shown bold) and `data-tip-l` (label) gets the shared tooltip (`Brownian.readout()`, installed once by `components/Readout.tsx`) on hover, tap and keyboard focus. Give interactive marks `tabindex="0"`.
- **Charts:** helper charts go through `usePlot` (redraws on container resize); React-drawn SVG charts use `useWidth`. Both sit in `.bw-plot`.
- **Motion:** one moment per view. A chart's first draw gets `.rise`: bars grow from their zero line, the needle sweeps; `CountUp` counts the score. All of it sits inside `@media (prefers-reduced-motion: no-preference)`. Marks are visible at rest.
- **Colour meaning:** price changes are coloured by sign (`<Change>` / `toneOf()`: teal up, ember down, with ▲/▼). Impact on India is written out in words ("Headwind for India"), not implied by colour.
- **Phone:** wide tables use `<DataTable stack>` and stack into cards under 620px; charts must fit 400px without sideways scroll.
- **Design rules from the review:** no small uppercase label (eyebrow/kicker) above a heading; put the context line under the heading as `.meta`. No nested cards. Body text ≥ 4.5:1 contrast in both themes.
- **Design language rules:** charts sit in a dark `.bw-plot` window in both themes; ▲/▼ plus a sign on every change; one `dawn` highlight and one primary button per view; every chart redraws to its container (`Brownian.fit`). See `design/DESIGN.md`.

## Verify every change

1. `npm run typecheck` and `npm run build`.
2. `npm run check`: every view at 1280px and 400px in night and paper; it fails on console errors, failed requests or horizontal page scroll, and saves full-page screenshots to look at. Check the views you touched in the screenshots.
3. Tab through what you changed; the readout and the sheet must work from the keyboard (Esc closes the sheet and returns focus).
4. If you changed `design/`, also open `design/reference/brownian-brief.html`.

## Design tooling

The repo is set up for the Impeccable design skill: `PRODUCT.md` is its product context. Useful commands: `/impeccable critique` on a built page (`out/index.html`), `/impeccable polish`, `/impeccable audit`. Critique snapshots stay local (`.impeccable/critique/` ignores them).

## Working on it

- Branch per change; keep commits focused. Do not commit secrets, API keys or personal data (the raw brief emails contain an email address; commit only the extracted text as in `docs/briefs/`).
- When a decision in "Open decisions" (PRODUCT.md / README roadmap) gets made, update PRODUCT.md in the same change.
