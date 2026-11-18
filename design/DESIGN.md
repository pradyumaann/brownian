# Design language

Brownian treats the market as a landscape: ridges, surfaces and rivers of strands on a dark canvas, framed by exact, sourced numbers. A reader at 07:50 IST should grasp the day's shape in one glance and the precise figures in the next. *Markets wander. You don't have to.* Single days are noise, so every figure is shown calmly and in context.

The product rules in AGENTS.md (information only, every number sourced, interpretation labelled, Indian conventions) override anything here.

| File | What it is |
|---|---|
| `design/tokens.json` | Source of truth for colours (night + paper), type scale, spacing, radius, stroke |
| `design/brownian.css` | Generated tokens as CSS custom properties, `.t-*` type classes, and component styles (`bw-*`) |
| `design/brownian-charts.js` | Reference chart helpers on `window.Brownian`: `diverge`, `dial`, `strands`, `ridgeline`, `fringe`, `field`, `spark`, `fit`, `readout`, `fmt` |
| `design/reference/brownian-brief.html` | The Brief rebuilt in this language from the 13 Nov brief. Open it to see everything together |
| Design system (live previews of every component) | https://claude.ai/artifact/6CPW18gXDE3gjegGMakFQf |

## Non-negotiables

- **Accuracy beats beauty.** Every mark is encoded from real data. A gradient always encodes a value. Never extrude 2-D data into 3-D. Missing data shows as `n/a`, never estimated or interpolated.
- **Source tags everywhere.** A `.bw-src` button (`S#` or `W#`) follows every figure. Where sources disagree, the copy says so and tags both. Sample data appears only in design previews, labelled `SAMPLE DATA`.
- **Shape plus number.** Every chart has an exact-value path: the shared readout (`data-tip-v` / `data-tip-l` / `tabindex="0"`, via `Brownian.readout()`), a table, or printed values. Every chart has an `aria-label` stating its values.
- **One loud thing per view:** one hero number, one `dawn` highlight, one primary button. (The serif-italic accent word was removed on 14 Nov 2026: headings are plain.)
- **Direction is never colour alone.** Always show a sign (`+1.20%`, `−0.74%` with a true minus U+2212) and ▲/▼. What a move means for India is written in words.
- **No labels above headings** (design review). Heading first, then a `.bw-meta` context line under it.
- **Buttons read or navigate. They never trade, and never urge.**

## Tokens

CSS custom properties from `design/brownian.css`. `data-theme="night"` is the brand default and `"paper"` is light. With no `data-theme`, the system colour scheme decides.

- **Grounds:** `--ground`, `--surface`, `--surface-raised`. Separate them with `--hairline` / `--hairline-strong`, never shadows. No nested cards.
- **Plot window:** charts sit in `.bw-plot` (`--plot`), which is the page's own colour in both themes: a chart sits on the page with no border, flush with the text column, never in a box of a different shade. Every data colour (`--plot-gain`, `--plot-loss`, `--spec-*`, `--tide-*`, `--cat-*`, `--plot-dawn`) has a Night and a Paper value, so it keeps its contrast on either page. Every label stays inside its panel. The masthead follows the theme too.
- **Text:** `--ink`, `--ink-muted`, `--ink-faint` (sources, ticks, `n/a`). Inside plots, use `--plot-ink`, `--plot-muted` and `--plot-grid`.
- **Accent:** `--dawn` (needle, active band, now-dot, the one primary button fill). Use `--dawn-ink` for dawn as text and `--on-dawn` for text on a dawn fill. The focus ring is 2px solid `--focus` with a 2px offset.
- **Direction:** `--gain` (teal) and `--loss` (ember) for text; `--plot-gain` and `--plot-loss` in plots.
- **Ramps (plot only):** `--spec-0…6` (violet → ember → light gold) for elevation, density, yields and drawdown depth (the brightest mark is the highest value). `--tide-0…4` for liquidity.
- **Categorical:** `--cat-1…6` in order, at most six per view, labelled directly.
- **Flow threads (plot only):** `--flow-s1…6` (red, coral, orange, amber, pale yellow, white: the sectors sold, left to right; the last is the grouped rest). **Terrain ramp:** `--neon-0…6` (violet → magenta → orange → yellow → white on Night; the same hues, darker, on Paper), by size of flow.
- **Type:** Onest (`--font-sans`, UI and display), Instrument Serif (`--font-serif`, now unused in the app; `.bw-serif` renders upright sans), JetBrains Mono (`--font-mono`, every number, tag and tick; tabular).
  Classes: `.t-display-xl` 96 · `.t-display-l` 56 · `.t-headline` 28 · `.t-title` 18 · `.t-body` 15 (max 64ch) · `.t-meta` 13 · `.t-label` 12 · `.t-num-l` 24 · `.t-num` 13 · `.t-tick` 10 (minimum) · `.t-source` 10 uppercase · `.t-tag` 10.
- **Space (4px base):** `--space-1…24` = 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96. **Radius:** `--radius-none` for plots and data marks · `-xs` 2 for chips and tags · `-sm` 6 · `-md` 14 for panels · `-pill` for buttons. **Stroke:** `--stroke-hair` 0.6px · `-thin` 1px · `-mark` 1.5px.

## Chart grammar

| Question | Form | Helper |
|---|---|---|
| How did each sector, index or flow move? | Signed bars from a zero line, value printed, `null` → n/a | `diverge` |
| How is sentiment reading, and why? | 0–100 dial with bands named, the score as a dawn needle, components as dots | `dial` |
| Where did money go? (sector flows) | Woven flow map, vertical at every width: the sectors FPIs net sold across the top as bars whose width is the amount (largest first, "N other sectors" last, labels rotated), hairlines falling from them in long curves onto the sectors net bought and the net-outflow node, scattered at fixed, deterministic positions below, each with a row of squares (one per source, area is the amount). 1 hairline = a fixed ₹ amount stated on screen. A sector's selling is shared over the destinations in proportion to their size, so it is an allocation, not traced trades (said on screen). Sources run warm to cool (`--flow-s1…6`). Hover, tap or tab on a source, destination or thread dims the rest. Phones group more sectors and draw fewer hairlines | `Strands.tsx` |
| How did flows move across sectors and time? | Terrain: sector × fortnight bars in an oblique 3D projection (SVG). Bars rise above the floor for net buying and hang below it for net selling, so direction is never colour alone; colour runs the neon ramp (`--neon-0…6`, violet → magenta → orange → yellow → white) by size. Hover or tap a bar for its value, tab to a sector row for its two-year total; phones draw the eight largest sectors | `Terrain.tsx` |
| Is today unusual? (needs history) | Stacked ridges on ONE shared scale | `ridgeline` |
| Is market structure unusual now? (turbulence) | Line of the 20-session average's percentile with named bands (Calm 0–50, Elevated 50–80, Unusual 80–95, Extreme 95–100), today as the dawn dot; the day's own percentile printed beside | `TimeLine.tsx` |
| How has a mix of holding types moved over a year, beside the market? | Two lines on one shared linear scale, both rebased to 100 on the first session: the viewer's mix in `--cat-1` and Nifty 50 as the quiet ink line, a dashed baseline at 100 with round ticks (`niceTicks`), a "now" dot at `asOf`. Every session is a readout (value, date and the other line's value); one keyboard cursor steps by arrows, PageUp/PageDown and Home/End. The facts (change, volatility, largest fall with dates, worst day) sit in a stacking table, folded behind `More` on phones | `BlendLine.tsx` |
| How far from the peak? | Drawdown lines hanging from the running peak, linear % | `fringe` |
| What does the yield curve look like through time? | Isometric wireframe, always beside a 2-D table | `field` |
| How does a macro indicator sit in its own history? | Indicator field: one row per indicator, one column per week (month on phones), height AND colour (spec ramp, violet to gold) both the column's rank 0–100 among that indicator's own five years, so rows share one zero-based scale and the brightest peaks are each indicator's highs. Only series the history store holds; a week with no reading draws no column; an open week or month is hollowed and marked to date. Glow on Night only. Beside it the latest value, ▲/▼ change and an impact chip in words | `IndicatorField.tsx` (data: `lib/indicatorField.ts`) |
| Did a release beat the forecast? | Plain metrics, no bars: release, latest, forecast, previous (with its label), the gap in pp printed with ▲/▼, due time or note, and the brief's impact words ("Interpretation, not a forecast."). A release not out shows its due time; a missing figure is n/a. Stacks into cards under 620px | `ReleaseMetrics.tsx` |
| What happens when in a day? Which dates are coming? | Rail: a vertical line of nodes, `--hairline-strong`, "now" in `--dawn`. The day rail runs from the brief time through the NSE open and close to each event at its IST clock time (spacing capped, floored so same-minute rows stack). The calendar rail places firm dates by days from the brief date (labels Today, Tomorrow, in 3 days, in 3 weeks): linear for 7 days, compressed after with a visible break mark. Dates with no firm day sit in a "No exact date" group, never placed. The line draws in once when motion is allowed; phones keep the line left, text right | `DayRail.tsx`, `EventRail.tsx` |
| What one number first? | HeroNumber: value, signed delta, context sentence, tag | n/a |
| What's still developing? | StoryList: New / Ongoing / Resolved word chips, tagged figures | n/a |

Bars start at zero. Log axes say "log". At most 3 annotations per figure, on leader lines. Every chart redraws to its container with `Brownian.fit`, and **phones (400px) never scroll sideways.**

**Phones show fewer marks at once** (15 Nov 2026): long signed-bar lists draw their strongest ends (`phoneRows`) with a "Show all" button; time axes keep ticks at least 56px apart (years, then half-years); the metro lines keep half-yearly stations; the terrain draws the eight largest sectors. Secondary text (method notes, scoring tables, per-sector lists) folds behind a `More` button under 620px and is always open on wider screens. The figure and its source tag fold together, never apart.

## Brief layout (in order)

1. Brownian header (the device showcase hero, 15 Nov 2026), a window in the page’s own colour on Night and on Paper: the day line in mono (date · brief time · open · close IST, all from the day's record) with the theme switch, the wordmark (Onest 600, −0.045em) and the mono tagline, with the Wander Index's last five sessions as five bars beside it on wider screens (on phones a full-width strip of the same five bars under the tagline, drawn at 480×150 with larger text), coloured by `--mast-1…5` (teal, violet, rose, orange, gold on Night; electric azure, violet, hot pink, neon orange, neon green on Paper), which roll slowly through the bars when motion is allowed, with the text colour (`--mast-ink-1…5`) switching alongside. A grid of plus marks covers the whole header, each shrinking and growing out of step with its neighbours (the bars sit on top of it). There is no descriptor sentence. On phones the wordmark and tagline come first, then the compact bars strip (about 130px) across the full width; the plus-mark field stays behind both. Every other view has a compact bar: wordmark, day line and the theme switch, in the page's colours.
2. A `.t-display-l` title with a 2–3 sentence tagged lede.
3. Hero row: up to 4 KPIs divided by hairlines (2×2 on phones).
4. Wander Index (dial + component table + "Interpretation, not a forecast.").
5. Flow Map (FII/DII Diverge, the day beside month to date).
6. India Markets and Global Cues (Diverge, plus notes in words).
7. Developing (StoryList).
8. Footer: "For information only; not investment advice."

Each section opens with a heading, a `.bw-meta` line (context, tags, and "NN · Feature name" at the right) and a `.bw-rule`. Leave `--space-16` between sections.

## Motion and states

Each chart plays one entrance when it first scrolls into view (`riseOnView` adds `.rise`): lines draw along their length, strands draw link by link, the dial ring lights segment by segment and then the needle sweeps, terrain bars rise back to front, bars grow from zero. Two quiet loops run: the masthead's plus marks and the "now" dot. All of it sits in `prefers-reduced-motion: no-preference`, and every mark is fully drawn without it.

The glow ("Hyper Charts" look) is allowed only on marks that encode a value. Two charts on the Flow Map use bright neon (15 Nov 2026): the sector-flow map ("Where foreign money went": hairlines that screen into each other on Night, dark multiplied threads on Paper) and the terrain ("Two years of sector flows": a restrained glow on the bars on Night, none and darker values on Paper).

Each section opens with `--space-16` above it and keeps `--space-6`–`--space-8` inside, so the gap between sections is always the largest on the page; a section's heading rule is never doubled by its first block's own top rule.

One entrance moment per view (bars grow from zero, the needle sweeps, the score counts up, strands draw in; 600ms ease-out), only inside `prefers-reduced-motion: no-preference`. **Marks are visible at rest.** Hover dims the rest to `--opacity-dim` (200ms). Freshness shows the brief time; after the open, label it "as of the 07:52 brief" in `--dawn-ink`.

## Voice

Calm, plain, evidence-first. Address the reader as "you". Frame behaviour as research and questions ("Watch whether 5% US yields slow it"), never instructions. Sentence case throughout. No emoji, no exclamation marks, no stock imagery: the data is the only picture. Use ₹ crore with Indian grouping (`Brownian.fmt.inr` / `.crore`) and IST times.

## Migrating the prototype

`prototype/index.html` predates this language. Migrate it view by view, mapping its old tokens like this:

| Prototype | Design language |
|---|---|
| `--bg` | `--ground` |
| `--surface` / `--surface-2` | `--surface` / `--surface-raised` |
| `--ink` / `--muted` | `--ink` / `--ink-muted` |
| `--line` | `--hairline` (`--hairline-strong` for section rules) |
| `--up` / `--down` | `--gain` / `--loss` (teal/ember: colour-blind safer than green/red) |
| `--neutral` | `--ink-faint` |
| `--accent` | none: use `--dawn` for the one highlight, `--ink` otherwise |
| `--dawn` | `--dawn` (fills, plot marks) / `--dawn-ink` (text) |
| `--night` / `--on-night` | `--ground` / `--ink` in the night theme |
| `--shadow` | none: hairlines instead |
| `--f-display` / `--f-body` | `--font-sans` (600 for display) |
| `--f-data` | `--font-mono` |
| charts on `--surface` | charts in `.bw-plot` |

## Portfolio mix pattern (15 Nov 2026)

Portfolio Lens sets a weight per holding type with a stepper: a minus button, the value (a `spinbutton`: arrow keys step 5%, Home clears) and a plus button, 40px targets on phones, buttons that reach their limit use `aria-disabled` so keyboard focus stays put. Under the rows: Total and Unallocated, "Equal weight my picks" (the one primary button), then plain link buttons "Use the example" and "I own nothing yet" (18 Nov 2026, replacing Reset), each with Undo; they stay in place and use `aria-disabled` when they would change nothing. In "I own nothing yet" mode every section shows a quiet `.empty` note about what it does for a mix, never the example or a figure. A type read through an index carries its proxy label under its name (`.mix-px`). The day is one large signed number (`.md-n`, sign and triangle, source tags) over signed bars from zero (`diverge`, `phoneRows`), each bar a type's share times its move; types with no move print n/a. Exposure is plain horizontal share bars (`.xbars`, value printed) beside a concentration fact list (`.cfacts`). Every interpretive block says "Interpretation, not a forecast."; no colour carries judgement beyond sign.

Phase 2 (16 Nov 2026): "Your mix over the year" (blend line above), "Events for what you own" (the calendar rail filtered to events tagged to types with weight; each event carries neutral outlined "Tagged to" chips in the plain tone, never gain or loss colours, and no weight is printed beside it; the brief's own "High impact" chip is shown here in the plain tone too, 18 Nov 2026, since red beside a holding reads as a call on direction) and a results-date line under each watchlist row (a date in words with its source tags, or "No result date in today's brief" in faint ink). The sections run 01 mix, 02 day, 03 exposure, 04 year, 05 events, 06 how it is worked out, 07 impact notes, 08 watchlist.
