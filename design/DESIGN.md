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
- **Plot window:** charts sit in `.bw-plot` (`--plot`), which is the page's own colour in both themes: a chart sits on the page, set off by a hairline, never in a box of a different shade. Every data colour (`--plot-gain`, `--plot-loss`, `--spec-*`, `--tide-*`, `--cat-*`, `--plot-dawn`) has a Night and a Paper value, so it keeps its contrast on either page. Every label stays inside its panel. The masthead is the one dark exception.
- **Text:** `--ink`, `--ink-muted`, `--ink-faint` (sources, ticks, `n/a`). Inside plots, use `--plot-ink`, `--plot-muted` and `--plot-grid`.
- **Accent:** `--dawn` (needle, active band, now-dot, the one primary button fill). Use `--dawn-ink` for dawn as text and `--on-dawn` for text on a dawn fill. The focus ring is 2px solid `--focus` with a 2px offset.
- **Direction:** `--gain` (teal) and `--loss` (ember) for text; `--plot-gain` and `--plot-loss` in plots.
- **Ramps (plot only):** `--spec-0…6` (violet → ember → light gold) for elevation, density, yields and drawdown depth (the brightest mark is the highest value). `--tide-0…4` for liquidity.
- **Categorical:** `--cat-1…6` in order, at most six per view, labelled directly.
- **Flow threads (plot only):** `--flow-s1…6` (warm, sectors sold), `--flow-b1…6` (cool, sectors bought), `--flow-s0` / `--flow-b0` for the grouped rest. **Diverging heat:** `--div-loss`, `--div-mid`, `--div-gain`, mixed by magnitude (the terrain).
- **Type:** Onest (`--font-sans`, UI and display), Instrument Serif (`--font-serif`, now unused in the app; `.bw-serif` renders upright sans), JetBrains Mono (`--font-mono`, every number, tag and tick; tabular).
  Classes: `.t-display-xl` 96 · `.t-display-l` 56 · `.t-headline` 28 · `.t-title` 18 · `.t-body` 15 (max 64ch) · `.t-meta` 13 · `.t-label` 12 · `.t-num-l` 24 · `.t-num` 13 · `.t-tick` 10 (minimum) · `.t-source` 10 uppercase · `.t-tag` 10.
- **Space (4px base):** `--space-1…24` = 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96. **Radius:** `--radius-none` for plots and data marks · `-xs` 2 for chips and tags · `-sm` 6 · `-md` 14 for panels · `-pill` for buttons. **Stroke:** `--stroke-hair` 0.6px · `-thin` 1px · `-mark` 1.5px.

## Chart grammar

| Question | Form | Helper |
|---|---|---|
| How did each sector, index or flow move? | Signed bars from a zero line, value printed, `null` → n/a | `diverge` |
| How is sentiment reading, and why? | 0–100 dial with bands named, the score as a dawn needle, components as dots | `dial` |
| Where did money go? (SIP look-through, sector flows) | Sankey of unit strands, 1 strand = a fixed ₹ amount stated on screen, nodes balance. Left to right on wide screens; on phones (< 560px) a vertical trunk, sold sectors entering from the top left and bought sectors leaving at the bottom right, so labels stay horizontal and each sector has its own row. Sector threads use the bright `--flow-*` colours | `strands` / `Strands.tsx` |
| How did flows move across sectors and time? | Terrain: sector × quarter columns in a hand-rolled 3D projection (SVG), height and diverging `--div-*` colour both from net buying (+) or selling (−). Drag to turn, pinch or buttons to zoom, keyboard cursor with a live readout, the full table one tap away | `Terrain.tsx` |
| Is today unusual? (needs history) | Stacked ridges on ONE shared scale | `ridgeline` |
| How far from the peak? | Drawdown lines hanging from the running peak, linear % | `fringe` |
| What does the yield curve look like through time? | Isometric wireframe, always beside a 2-D table | `field` |
| How does a macro indicator sit in its own history? | Indicator field: one row per indicator, one column per week (month on phones), height AND colour (spec ramp, violet to gold) both the column's rank 0–100 among that indicator's own five years, so rows share one zero-based scale and the brightest peaks are each indicator's highs. Only series the history store holds; a week with no reading draws no column; an open week or month is hollowed and marked to date. Glow on Night only. Beside it the latest value, ▲/▼ change and an impact chip in words | `IndicatorField.tsx` (data: `lib/indicatorField.ts`) |
| Did a release beat the forecast? | Release bars: previous, forecast (hollow) and latest from one zero line per release, each on its own scale, the gap in pp printed with ▲/▼; a release not out shows its due time, a missing figure is n/a | `ReleaseBars.tsx` |
| What one number first? | HeroNumber: value, signed delta, context sentence, tag | n/a |
| What's still developing? | StoryList: New / Ongoing / Resolved word chips, tagged figures | n/a |

Bars start at zero. Log axes say "log". At most 3 annotations per figure, on leader lines. Every chart redraws to its container with `Brownian.fit`, and **phones (400px) never scroll sideways.**

**Phones show fewer marks at once** (15 Nov 2026): long signed-bar lists draw their strongest ends (`phoneRows`) with a "Show all" button; time axes keep ticks at least 56px apart (years, then half-years); the metro lines keep half-yearly stations; the terrain draws the eight largest sectors. Secondary text (method notes, scoring tables, per-sector lists) folds behind a `More` button under 620px and is always open on wider screens. The figure and its source tag fold together, never apart.

## Brief layout (in order)

1. Brownian header (the device showcase hero, 15 Nov 2026), a dark window in both themes: the day line in mono (date · brief time · open · close IST, all from the day's record), the wordmark (Onest 600, −0.045em), the mono tagline, a hairline and the descriptor "Market intelligence for long-term Indian investors, read before the 09:15 IST open.", with the Wander Index's last five sessions as five bars beside it on wider screens. Phones keep the words only. Every other view has a compact bar: wordmark, day line and the theme switch, in the page's colours.
2. A `.t-display-l` title with a 2–3 sentence tagged lede.
3. Hero row: up to 4 KPIs divided by hairlines (2×2 on phones).
4. Wander Index (dial + component table + "Interpretation, not a forecast.").
5. Flow Map (FII/DII Diverge, the day beside month to date).
6. India Markets and Global Cues (Diverge, plus notes in words).
7. Developing (StoryList).
8. Footer: "For information only; not investment advice."

Each section opens with a heading, a `.bw-meta` line (context, tags, and "NN · Feature name" at the right) and a `.bw-rule`. Leave `--space-16` between sections.

## Motion and states

Each chart plays one entrance when it first scrolls into view (`riseOnView` adds `.rise`): lines draw along their length, strands draw link by link, the dial ring lights segment by segment and then the needle sweeps, terrain rows rise back to front, bars grow from zero. Two quiet loops run: the masthead's plus marks and the "now" dot. All of it sits in `prefers-reduced-motion: no-preference`, and every mark is fully drawn without it.

The glow ("Hyper Charts" look) is allowed only on marks that encode a value. The sector-flow threads ("Where foreign money went") are the one place for bright, saturated strokes (15 Nov 2026, overriding the earlier "no neon glow" for this chart): a restrained 2.5px glow on Night, none on Paper, where the `--flow-*` values are darker and crisp.

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
