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
prototype/index.html   single-file app (HTML + CSS + JS, no build)
design/                design language: DESIGN.md (rules), tokens.json, brownian.css, brownian-charts.js, reference/
PRODUCT.md             product record (users, purpose, constraints, feature names)
docs/briefs/           source briefs, one per day
docs/design-review-*.md  design critique findings
.impeccable/           design-tool state
```

## Design language

All new UI follows `design/DESIGN.md` (imported by `CLAUDE.md`): tokens in `design/tokens.json`, styles in `design/brownian.css`, reference charts in `design/brownian-charts.js`, and the Brief rebuilt in `design/reference/brownian-brief.html`. The prototype below predates it and still uses its own tokens and fonts; when you touch a view, migrate it using the token map at the end of DESIGN.md rather than mixing the two systems in one view.

## How the prototype is built

Everything lives in `prototype/index.html`:

- **CSS tokens** at the top of `<style>`: `--bg --surface --surface-2 --ink --muted --line --accent --up --down --warn --neutral --night --dawn --shadow --on-night --on-night-2`. Light values on `:root`, dark values under `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and again under `:root[data-theme="dark"]`. Components use tokens only; never add a literal colour that works in one theme.
- **Fonts:** Bricolage Grotesque (display), Inter (body), IBM Plex Mono (numbers and data only).
- **Data:** one object `const D = {...}` in the script holds everything for the day (sentiment components, pressure, strip, takeaways, holdings, stocks, sectors, flows, indicators, events, earnings, stories, glossary, sources). Today it is hand-built from the brief; the ingestion pipeline should produce this shape.
- **Views:** sections `#v-<id>` toggled by hash routes in `route()`. Tab order and grouping come from `VIEWS` and `GROUPS`; view headings from `VHEAD`.
- **Mood Index:** `D.sentiment` components each have a value, a scoring function `f`, a visible formula string and a research note. Score = equal-weighted average, banded 0–25 extreme fear, 25–45 fear, 45–55 neutral, 55–75 greed, 75–100 extreme greed. Copy that mentions the score is templated from the computed value; never hardcode it.
- **Per-viewer state:** holdings and watchlist in `localStorage` (keys `ii:held2`, `ii:watch2`), always wrapped in try/catch.

## Chart and interaction conventions

- **Readout:** any mark with `data-tip-v` (value, shown bold) and `data-tip-l` (label) gets the shared tooltip on hover, tap and keyboard focus. Give interactive marks `tabindex="0"`. Values are set with `textContent`.
- **Motion:** one moment per view. When a view opens, `rise(view)` re-adds the `.rise` class; bars grow from their zero line, the needle sweeps, dots slide from zero, the score counts up. All of it sits inside `@media (prefers-reduced-motion: no-preference)`. Marks are visible at rest.
- **Colour meaning:** price changes are coloured by sign (`sc()` helper: green up, red down). Impact on India is written out in words ("Headwind for India"), not implied by colour.
- **Heatmap text** colour is chosen by measured contrast at render time; keep it that way.
- **Phone:** wide tables get class `st` and stack into cards under 620px; charts must fit 400px without sideways scroll.
- **Design rules from the review:** no small uppercase label (eyebrow/kicker) above a heading; put the context line under the heading as `.meta`. No nested cards. Body text ≥ 4.5:1 contrast in both themes.
- **Design language rules:** charts sit in a dark `.bw-plot` window in both themes; ▲/▼ plus a sign on every change; one `dawn` highlight and one primary button per view; every chart redraws to its container (`Brownian.fit`). See `design/DESIGN.md`.

## Verify every change

1. Open `prototype/index.html` (and `design/reference/brownian-brief.html` if you changed `design/`) at 1280px and 400px, light and dark. Check each view you touched.
2. No console errors, no horizontal page scroll (`document.documentElement.scrollWidth` equals the viewport width).
3. Tab through what you changed; the readout and the info sheet must work from the keyboard (Esc closes the sheet and returns focus).

A Playwright check is the quickest way to cover 1–2 in one run.

## Design tooling

The repo is set up for the Impeccable design skill: `PRODUCT.md` is its product context. Useful commands: `/impeccable critique prototype/index.html`, `/impeccable polish`, `/impeccable audit`. Critique snapshots stay local (`.impeccable/critique/` ignores them).

## Working on it

- Branch per change; keep commits focused. Do not commit secrets, API keys or personal data (the raw brief emails contain an email address; commit only the extracted text as in `docs/briefs/`).
- When a decision in "Open decisions" (PRODUCT.md / README roadmap) gets made, update PRODUCT.md in the same change.
