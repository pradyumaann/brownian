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
- **One loud thing per view:** one hero number, one `dawn` highlight, one serif-italic word, one primary button.
- **Direction is never colour alone.** Always show a sign (`+1.20%`, `−0.74%` with a true minus U+2212) and ▲/▼. What a move means for India is written in words.
- **No labels above headings** (design review). Heading first, then a `.bw-meta` context line under it.
- **Buttons read or navigate. They never trade, and never urge.**

## Tokens

CSS custom properties from `design/brownian.css`. `data-theme="night"` is the brand default and `"paper"` is light. With no `data-theme`, the system colour scheme decides.

- **Grounds:** `--ground`, `--surface`, `--surface-raised`. Separate them with `--hairline` / `--hairline-strong`, never shadows. No nested cards.
- **Plot window:** charts always sit in `.bw-plot` (`--plot`), which stays dark in both themes.
- **Text:** `--ink`, `--ink-muted`, `--ink-faint` (sources, ticks, `n/a`). Inside plots, use `--plot-ink`, `--plot-muted` and `--plot-grid`.
- **Accent:** `--dawn` (needle, active band, now-dot, the one primary button fill). Use `--dawn-ink` for dawn as text and `--on-dawn` for text on a dawn fill. The focus ring is 2px solid `--focus` with a 2px offset.
- **Direction:** `--gain` (teal) and `--loss` (ember) for text; `--plot-gain` and `--plot-loss` in plots.
- **Ramps (plot only):** `--spec-0…6` (violet → ember → light gold) for elevation, density, yields and drawdown depth (the brightest mark is the highest value). `--tide-0…4` for liquidity.
- **Categorical:** `--cat-1…6` in order, at most six per view, labelled directly.
- **Type:** Onest (`--font-sans`, UI and display), Instrument Serif *italic* (`--font-serif`, one human word per display line), JetBrains Mono (`--font-mono`, every number, tag and tick; tabular).
  Classes: `.t-display-xl` 96 · `.t-display-l` 56 · `.t-headline` 28 · `.t-title` 18 · `.t-body` 15 (max 64ch) · `.t-meta` 13 · `.t-label` 12 · `.t-num-l` 24 · `.t-num` 13 · `.t-tick` 10 (minimum) · `.t-source` 10 uppercase · `.t-tag` 10.
- **Space (4px base):** `--space-1…24` = 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96. **Radius:** `--radius-none` for plots and data marks · `-xs` 2 for chips and tags · `-sm` 6 · `-md` 14 for panels · `-pill` for buttons. **Stroke:** `--stroke-hair` 0.6px · `-thin` 1px · `-mark` 1.5px.

## Chart grammar

| Question | Form | Helper |
|---|---|---|
| How did each sector, index or flow move? | Signed bars from a zero line, value printed, `null` → n/a | `diverge` |
| How is sentiment reading, and why? | 0–100 dial with bands named, the score as a dawn needle, components as dots | `dial` |
| Where did money go? (SIP look-through, sector flows) | Sankey of unit strands, 1 strand = a fixed ₹ amount stated on screen, nodes balance | `strands` |
| Is today unusual? (needs history) | Stacked ridges on ONE shared scale | `ridgeline` |
| How far from the peak? | Drawdown lines hanging from the running peak, linear % | `fringe` |
| What does the yield curve look like through time? | Isometric wireframe, always beside a 2-D table | `field` |
| What one number first? | HeroNumber: value, signed delta, context sentence, tag | n/a |
| What's still developing? | StoryList: New / Ongoing / Resolved word chips, tagged figures | n/a |

Bars start at zero. Log axes say "log". At most 3 annotations per figure, on leader lines. Every chart redraws to its container with `Brownian.fit`, and **phones (400px) never scroll sideways.**

## Brief layout (in order)

1. Top bar: wordmark, date, day line (brief time · open 09:15 · close 15:30 IST).
2. Dawn header: `.t-display-l` title with one italic word, plus a 2–3 sentence tagged lede.
3. Hero row: up to 4 KPIs divided by hairlines (2×2 on phones).
4. Mood Index (dial + component table + "Interpretation, not a forecast.").
5. Flow Map (FII/DII Diverge, the day beside month to date).
6. India Markets and Global Cues (Diverge, plus notes in words).
7. Developing (StoryList).
8. Footer: "For information only; not investment advice."

Each section opens with a heading, a `.bw-meta` line (context, tags, and "NN · Feature name" at the right) and a `.bw-rule`. Leave `--space-16` between sections.

## Motion and states

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
