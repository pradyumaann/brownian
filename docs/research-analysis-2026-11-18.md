# Brownian: analysis of the simulated user research, 18 Nov 2026

**Read this first.** The input, `docs/user-simulation-2026-11-18.md`, comes from 10 SIMULATED personas played by an AI. They are not real users. Nothing below treats its scores, counts or "willingness to pay" figures as user evidence, usage numbers or pricing (product rule 4, `AGENTS.md`). Every finding is a hypothesis to test with real people. Market-size figures in section C are external estimates from named sources, not Brownian data.

Scope: read-only review of the repo as it stood on 18 Nov 2026 (the code is a moving target). The only file written is this one. Nothing was built, run or edited. Sub-agents were not used. Not checked: real-device rendering, the live built pages beyond `out/` text, any legal source (the repo holds no legal analysis, and neither does this report).

---

## Executive summary

**Findings verified.** Of 24 claims checked (table in A.2), 13 are CONFIRMED, 8 PARTLY (one of them with the figure unverifiable), 1 NOT FOUND, 1 CANNOT VERIFY, and 1 (USD/INR) is not an inconsistency. The core claims hold in code: the front page is long (8,632 px at 400 px in the latest local screenshot, `check-shots/night-400-brief.png`), it opens on GIFT Nifty, FII, rupee and a Wander dial before any plain-language summary, "Your day" shows an example mix with no personal data, and the quoted advice-shaped phrases exist verbatim in `data/2026-11-13.ts`. The report miscounts in places (the front page has 9 sections, not 11; the nav has 10 items, not 11) and its "data inconsistencies" are explainable presentation problems rather than wrong numbers (see A.2). Two phrases it cites ("Not linked 0 of 4", "Medium link 2 of 4") do not exist in the current code or `out/`.

**Top 5 recommended changes**

| # | Change | Effort | Verdict |
|---|---|---|---|
| 1 | "Today at a glance" card at the top of `/`: three plain, generic, sourced lines (what moved, what is scheduled, one calming context line). No per-holding "nothing to do" statements. | S-M, 2-4 days | FEASIBLE NOW (generic version) |
| 2 | Neutral example styling and an "I own nothing yet" state: example numbers in ink, tagged "Example"; hide the red figure and bars until weights are set | S, 1-2 days | FEASIBLE NOW |
| 3 | Rewrite advice-shaped wording at the source (brief ingestion rules plus a copy lint over `data/` and `app/`); send the Tailwind/Headwind question to counsel with priority | M, 3-5 days plus counsel time | FEASIBLE WITH CONDITIONS |
| 4 | Cut the front page: fold sections 05-09 on phones, remove the duplicate "Events for what you own" from `/`, add first-use jargon links and a one-line Wander explanation | M, 4-6 days | FEASIBLE NOW |
| 5 | Data consistency and trust pass: stamp each tile with its own time, explain the 20 vs 21 session windows, add a changelog/method page | S-M, 2-4 days | FEASIBLE NOW |

**Audience unlocked.** Items 1, 2 and 4 mainly retain and widen the product's primary user (DIY direct-stock and fund investors who check the market daily) and make the page less hostile to SIP-only investors and young phone-first investors. They do not turn complete beginners or retirees into core users on their own; those segments need a different product shape (see C). Hindi, NRI timing and derivatives are outside what this release should chase.

**Feasibility verdict.** Everything in the top 5 is possible on the current static, device-only, once-a-day architecture. Not feasible yet: stock-level holdings or broker/CAS import (conflicts with the "no per-security views" guardrail, counsel questions 3, 21 and 23, and needs an account/privacy design), alerts (needs push/backend), Hindi at quality (needs a translation and legal-wording workflow), a Gulf-time edition (needs a different data cut-off).

**Biggest risks.** (1) Regulatory: per-holding-type directional labels and "Expect/Watch/If you hold" lines may be read as research or advice; counsel questions 1-5 are unanswered and gate any public launch. (2) A "Today in 3 lines" card that says what a SIP investor should or should not do is itself advice-shaped; keep it generic. (3) Data licensing (NSE, NSDL, Yahoo terms, PRODUCT.md) is unresolved. (4) Over-trusting a simulation: validate with real people before building anything large.

---

## A. Analysis of the report

### A.1 How far to trust it

| Area | Trust | Why |
|---|---|---|
| Page too long and dense | High | Verified: 8,632 px at 400 px width, 9 sections, 15 events. Layout was judged on downscaled images but length is a fact. |
| Example mix and red figure irrelevant to non-holders | High on irrelevance, medium on alarm | Code confirms the example mix is the default (A.2 row 6). Emotional reaction is simulated. |
| Plain top summary and personalisation as main levers | Medium-high | Strong convergence among personas who share the same text, and consistent with PRODUCT.md principle 1 and 4. Convergence from one model playing ten roles is weaker than ten real people. |
| Advice-like wording is a risk | Medium | One persona (the CA) rated it 7; nine rated it 3. The phrases are real and appear on `/`; the legal conclusion needs counsel. |
| Phone readability, large text | Low | Screenshots viewed at about 120 px wide; nobody checked type size or tap targets. Unverified here too. |
| Findings about India, Global, Earnings, Developing | Low | Opened by 1 to 3 personas. |
| Willingness to pay, recommend scores | Low | Simulated and conditional on features that do not exist. Ignored in this analysis. |

Weaknesses of the simulation to keep in mind: (a) all personas read identical text, so repeated phrases show salience, not independent noticing; (b) the data is a mock, frozen 13 Nov brief, so "Nvidia's CEO resigned" and similar are fixtures; (c) non-expert personas gave near-identical profiles; (d) the personas were primed by the product's own rules and sourcing, which inflates the trust score (mean 7.2); (e) the report's counts ("raised by 9 of 10") measure the same shared text, not prevalence in a population.

### A.2 Claim verification

| # | Claim in the report | Status | Evidence |
|---|---|---|---|
| 1 | Front page has "11 sections" | PARTLY (9) | `app/page.tsx`: sections numbered 01 to 09 (`ix` props, lines 60-153), plus header/KPI row. AGENTS.md lists 11 routes, which may be the source of the "11". |
| 2 | Phone page about 8,600 px | CONFIRMED | `check-shots/night-400-brief.png` is 400 x 8,632 (PNG header; file dated 17 Nov 23:55, may be stale after later edits). `/portfolio` is 7,979 px. |
| 3 | 15 events in "Coming up" / calendar | CONFIRMED | `data/2026-11-13.ts` `events` array lists 15 rows (lines 316-331). Note the front page "Coming up" section uses the shorter `B.next` list (8 rows, lines 46-55); the 15 are on Macro Watch / the rail. |
| 4 | About 40 source tags in footer | PARTLY | Brief cites 20 sources (PRODUCT.md) and `data` has a `web` list (about 19 entries by line count); roughly 39, close to 40. Exact count not computed. |
| 5 | Nav of "11 branded names", cut off at 400 px | PARTLY | `components/Nav.tsx` has 10 items in three groups (4+3+3). CSS does not hard-cut: `.nav` scrolls horizontally and a fade mask plus right padding appear under 620 px (`app/globals.css` lines 31-33, 306-308). So a scroll cue exists as a fade, but there is no explicit affordance. |
| 6 | "Your day" shows red -0.42% for an example 25/25/25/25 mix | PARTLY / CANNOT VERIFY figure | Example mix is `defaultHold: ["index","fin","gold","debt"]` equal-weighted (`data/2026-11-13.ts:69`, `components/portfolio/usePort.ts:23`) = 25% each, so Herfindahl 0.25 is arithmetic. The -0.42% depends on history files; not recomputed. Debt has no move, which explains "Covers 75% of your mix" (`Day.tsx`). The number is shown with `tone-${tone(b.move)}` colouring even in example mode (`Day.tsx` md-n), so a red example is plausible. |
| 7 | Portfolio Lens has 10 asset-type buckets in 5% steps, no stocks, no flexi-cap/ELSS, no "I own nothing yet" | CONFIRMED | `HOLDING_IDS` has 10 ids (`lib/portfolioMath.ts:8`); `STEP` 5; no fund-category ids beyond index/mid; no empty-start option (reset returns to the example, `usePort.ts:48`). |
| 8 | Quote "Expect MCX bullion to open lower" | CONFIRMED | `data/2026-11-13.ts:61` (gold holding note `w`). |
| 9 | "If you hold a Nasdaq or US tech fund, this is the biggest single-stock risk" | CONFIRMED | `data/2026-11-13.ts:36` (takeaway `why`). |
| 10 | "If you hold it as a long-term hedge, a dip changes the price, not the reason you hold it" | CONFIRMED | `data/2026-11-13.ts:61` (gold `t`). |
| 11 | "Sharp runs carry pullback risk"; "New FDs may pay more if the RBI keeps tightening"; "Treat as a one-day spike"; "Short-duration funds are less affected" | CONFIRMED | `data/2026-11-13.ts:58, 63, 170, 177`. |
| 12 | Tailwind/Headwind labels per holding type; "High impact"; "Watch:" on every Developing item | CONFIRMED | `components/Chip.tsx:8` (DIR map), `lib/impact.ts:3`, `app/earnings/page.tsx:35`, `app/page.tsx:158` and `app/developing/page.tsx:24`. Counsel question 5 already asks whether these need separate review. |
| 13 | "Medium link 2 of 4", "Not linked 0 of 4" | NOT FOUND | No match in `app/`, `components/`, `lib/`, `data/` or `out/*.html`. May come from an older build or be a persona misreading of "Tagged to" chips. |
| 14 | Headlines "Overnight news turned against India", "Indian inflation broke the RBI's limit" | CONFIRMED | `data/2026-11-13.ts:34, 37`. |
| 15 | "Higher odds of another RBI rate hike" | CONFIRMED | `data/2026-11-13.ts:37`. |
| 16 | Put/call ratio "removed 15 Nov" on a 13 Nov brief | CONFIRMED text, explainable | `lib/mood.ts:202` and `data/2026-11-13.ts:394` say "Removed on 15 Nov 2026". It is a methodology note about the index, not a data stamp, but it sits in the Jargon Buster beside a 13 Nov brief and reads oddly. The brief date is a snapshot; the methodology date is the build date. |
| 17 | GIFT Nifty 02:44 IST on a 07:52 brief | CONFIRMED, explainable | KPI label "GIFT Nifty, 02:44 IST" (`data/2026-11-13.ts:20`) and `prepared: "07:52"` (line 10). GIFT trades nearly 21 hours; 02:44 is the last print the source gave. It is accurate but unexplained; the page does not say the print is five hours old. |
| 18 | USD/INR 94.04 vs 93.70 | NOT an inconsistency | 94.04 is the provisional close (`data:22, 208`). 93.70 is the low of Sharekhan's expected range 93.70 to 94.20 (`data:67, 217`); the previous close is 93.71 (line 208). A reader can mistake a range limit for a quote. Presentation fix, not a data fix. |
| 19 | "+11.3% over 20 sessions" vs "+13.13% 21 sessions" for Nifty | PARTLY | The Wander momentum component uses "Nifty 50 return over 20 sessions" (`lib/mood.ts:63-65`); the portfolio facts use "21 sessions" (`components/portfolio/How.tsx:16`, `lib/portfolioFacts.ts`). Different windows, and likely different series (Nifty alone vs the "Nifty index funds" type driver), so both can be right. The two numbers were not recomputed. A real but small labelling issue. |
| 20 | ONGC "sources conflict" | CANNOT VERIFY | Not located in a targeted search; `data` handles conflicts in text (for example Oil & Gas range and Realty 4.50 vs 3.7, `app/page.tsx:122-124`). |
| 21 | Disclaimer small, footer only | PARTLY | Disclaimer is in the footer (`app/layout.tsx:35`) and in page metadata description. Per-block "Interpretation, not a forecast." lines exist in the Wander and portfolio sections (`app/page.tsx:84`, `Day.tsx`). Size and colour not verified. |
| 22 | No Hindi / large-text view | CONFIRMED | `app/layout.tsx:23` is `lang="en"`; no i18n code; only the theme switch exists. |
| 23 | Wander dial shows "Greed" beside "macro pressure high"; components say "Extreme fear" (volatility) | PARTLY | Bands in `lib/bands.ts` ("Greed" 55-75, "Extreme fear" 0-25) and the quadrant "Fragile optimism" exist; the front tile shows `{band} · macro pressure {name}` (`app/page.tsx:54`). A component reading "extreme fear" while the headline says greed is possible by construction (each is its own percentile) but the specific values were not recomputed. |
| 24 | Jargon Buster is hard to find | PARTLY | It is the last nav item (`Nav.tsx:8`), so on a phone it sits off-screen to the right. `Term` buttons already open glossary text in a sheet from KPI labels and `Rich` text (`components/Term.tsx`, `app/page.tsx:22`), so some inline help exists. Coverage of terms in prose (risk-off, fully priced, bp) was not audited. |

Summary: the report is largely accurate on what the code does and says; its misses are counts and two phantom UI strings. Its "data oddities" are three presentation problems (unexplained timestamp, a range limit read as a quote, 20 vs 21 windows) and one dating confusion, not wrong numbers.

---

## B. Solutions

Rules applying to every option: information and education only; no action words; interpretive text carries "Interpretation, not a forecast."; every figure carries `[S#]`/`[W#]`/`D#`; missing is `n/a`; no ₹ amounts or suitability inputs in portfolio features (`AGENTS.md`).

### B1. "Today at a glance" card (report recs 1, 8; friction 1, 3, 9)

Placement: first block under the `h1` in `app/page.tsx`, before `.hero`. Built at build time from `B` and `lib/mood.ts`, so it fits the static, once-a-day model.

| Option | Description | Pros | Cons |
|---|---|---|---|
| A (recommended) | Generic three lines, same for every reader, each sourced. Line 1: what happened in plain words. Line 2: what is scheduled today/tomorrow. Line 3: the context line already in the product. | No personalisation, so it stays outside counsel questions 1-4. Fast. | Does not speak to "my SIP". |
| B | Per-holding-type lines driven by the saved mix (`usePort`), facts only ("Nifty index funds: Nifty 50 +0.18% Thursday"). | Closer to the "for you" ask. | A personalised statement; belongs with counsel question 2. Needs the mix, so the card depends on client state and flickers on hydration. |
| C | A line per audience ("SIP: nothing changes today"). | What the simulation asked for. | Reads as a suitability statement and an instruction by implication; conflicts with rule 1. Reject. |

Copy for A (illustrative, not final, wording must come from the day's record):
- "Nifty ended Thursday 0.18% higher; GIFT Nifty points to a flat open. [S8]"
- "Foreign investors bought again; domestic funds sold for a ninth session. [S5]"
- "Scheduled today: US producer prices at 19:00 IST. A single day's move rarely changes a long-term picture. Interpretation, not a forecast."

Wording rules: no "you should", "nothing to do", "safe", "needs attention". Avoid saying whether a SIP or FD is affected. The card replaces, not adds to, the dense lede for first read; the existing `B.lede` stays below. Add the Wander explanation as one sentence under the hero tile: "Wander Index 68: sentiment readings lean toward greed. Macro pressure 79: most tracked pressures read high. They measure different things. Interpretation, not a forecast." (`app/page.tsx:46-55`; numbers templated, never hardcoded per AGENTS.md.)

Removes or demotes: the lede paragraph moves under the card; KPI row stays.
Also add a lint pass: `scripts/lint-copy.mjs` `PATHS` does not include `app/page.tsx` or `data/`, so the new card would be unchecked unless added.

### B2. Real holdings, "I own nothing yet", presets (rec 2; friction 4)

| Option | Description | Verdict |
|---|---|---|
| A (recommended, near term) | Add a fourth state to `usePort` mode: `none` ("I own nothing yet") that hides the example blend and the red figure and shows a calm empty state with the explanation of what Portfolio Lens does. Add fund-category rows (flexi-cap, ELSS, hybrid) only where an index driver series exists in the history store. | Feasible now for the empty state; presets need driver mapping. |
| B | Typed tickers for direct stocks in the existing watchlist (`ii:watch2`) feeding the "Events" and results dates only. | Already half-built (Phase 2 results dates). No blended move for stocks. |
| C | Stock-level weights/paste/CAS import with per-stock moves. | NOT FEASIBLE YET (below). |

Details for A: files `components/portfolio/usePort.ts` (Mode type, `reset`), `Mix.tsx` (a "Start empty" control; replace "Reset to the example" with two links), `Day.tsx`/`FrontDay.tsx` (empty copy), `lib/portfolioFacts.ts` and `lib/portfolioMath.ts` (new holding ids), `data/types.ts` and `data/2026-11-13.ts` (new `holdings` entries with notes and `affects` tags backed by `docs/portfolio-event-tags.md`). New presets such as flexi-cap need a defensible driver (for example Nifty 500, which may not be in the history store; not checked) or must show `n/a` and be named "not in the blended move", as silver and debt are today. Replace the "Herfindahl 0.25" label with its plain-words form on the front; keep the figure under "How it is worked out".

Conflict with the report (rec 2 "stock-level import"): `AGENTS.md` says no per-security views; counsel questions 3, 21, 23 ask about instruments, stored profiles and CAS/broker import. Resolution: the repo's rules win. Do category-level only until counsel answers. Typed company names on the watchlist are the existing, narrower precedent.

### B3. Neutral example styling (rec 3; friction 2, 9)

Change `Day.tsx`: when `example` is true, render `.md-n` with the plain tone (no gain/loss colour, keep sign and ▲/▼ per DESIGN.md "direction is never colour alone") and drop red bars (`diverge`) to ink, or collapse the example block on `/` to a one-line prompt. Keep "Single days are noise" beside any figure. Because the design system says price changes are coloured by sign everywhere else, add a documented exception to `design/DESIGN.md` ("example data is never coloured by sign"). Options: (A, recommended) neutral numbers + tag; (B) hide the numbers on `/` until weights are set, leaving the prompt only. B removes the most noise but removes the demo of what the feature does; A first, B if a 5-second test shows confusion.

### B4. Advice-shaped wording (rec 4; section 5 of the report)

| Item | Where | Proposed change |
|---|---|---|
| "Expect MCX bullion to open lower" | `data/2026-11-13.ts:61` | "GIFT-linked and COMEX moves point lower for MCX bullion at the open" is still a forecast; prefer a fact: "COMEX gold fell 2.88% to $3,885.30 overnight [S11]. MCX opens at 09:00." |
| "If you hold a Nasdaq or US tech fund, this is the biggest single-stock risk" | `data:36` | "Nvidia is the largest holding in many US tech funds [source needed]; it reports on 17 Nov after the US close." Only if sourced; otherwise omit the claim. |
| "If you hold it as a long-term hedge..." | `data:61` | Remove the behavioural nudge or move it to a general "Reading it rationally" note, not tied to a holding. |
| Tailwind / Headwind / Mixed chips per holding type | `components/Chip.tsx`, `lib/impact.ts`, `data` holdings `d` | Replace with neutral factual chips: "Move: ▼ −2.88%" or "Linked drivers: US yields, USD/INR". Keeps colour for sign only. Needs counsel (question 5). |
| "Watch:" on stories | `app/page.tsx:158`, `app/developing/page.tsx:24` | "Next date:" or "Open question:" with a source. |
| "High impact" | `app/earnings/page.tsx:35`, events chips in `data` | "Large index weight" or "Scheduled" where factual; drop "High impact" if it is the brief's judgement. |
| "Sentiment is a contrarian signal" / Baker-Wurgler line | Wander copy (`app/wander/page.tsx`) | Reword as "Research links high sentiment with lower later returns on average; the link is weak over short periods" with the paper tag, not as a behavioural cue. |

Mechanism: because the text enters through the daily brief (parsing is an open decision in PRODUCT.md), the durable fix is an ingestion style guide plus extending `scripts/lint-copy.mjs` to `data/*.ts`, `app/page.tsx` and other pages, with banned openers ("Expect", "If you hold", "Treat as", "should"). Move the disclaimer: add "Information only, not advice" to each personalised or interpretive section heading line, not only the footer (counsel question 11 asks exactly this).

### B5. Inline jargon help (rec 5; friction 3, 8)

`Term` already exists. Extend to first use of GIFT Nifty, FII/DII, risk-off, bp, fully priced, PPI/WPI/MPC in `B.lede`, takeaway text and `holdings` notes via the `Rich` segment type (a `{ term: "id" }` segment, already supported in `Rich.tsx` for some cases). Add missing glossary entries to `data` (glossary record near line 390). Push Mahalanobis, absorption ratio, eigenvector and the paper list behind `More` in `app/wander/page.tsx`; keep them for the skeptic segment, collapsed by default. Alternative: a hover tooltip; not recommended since taps on phones need a sheet anyway, and the existing sheet works.

### B6. Page length and structure (rec 6; friction 1, 7, 11)

1. Remove section 08 "Events for what you own" from `/` (duplicate of `/portfolio`, counted by P2, P3, P9); keep the link in the card.
2. Under 620 px fold sections 05 India, 06 Global and 09 Developing behind `More`, headings visible (`components/More.tsx` exists and is phone-only by design).
3. Collapse the source footer (already a `<details>`); stop printing `[S#]` tags inline on phones for the first screen? Rule 2 says every number shows its source; keep tags, fold the footer only.
4. Keep the calendar to today and tomorrow on `/`; full 15 rows on `/macro`.
Metric to watch: scroll depth and time to first interaction (only with real instrumentation, which does not exist yet).

### B7. Phone navigation (rec 7; friction 6)

Current: horizontally scrolling tabs with a fade (verified). Options: (A, recommended, S) reorder so the six most useful are visible first and put "Jargon Buster" and "Learn" in a persistent "More" link; shorten names ("Wander", "Flows"). (B, M) a bottom tab bar with four core items plus "More"; needs layout and `check.mjs` updates. (C) leave as is until a real-phone test says otherwise. Note the nav grouping is specified in `AGENTS.md`; update it with the change.

### B8. Wander dial explanation (rec 8; friction 5)

One plain sentence in `Dial` area (see B1 copy) and a short "What this is not" line: it is not a buy or sell signal. Reconcile "Greed" headline with "Extreme fear" in a component: state under the component table that each component is ranked on its own and can disagree, which is the point of showing them. No code change to the index.

### B9. Hindi / large text (rec 9; friction 12)

| Option | Effort | Notes |
|---|---|---|
| A (recommended first) | S-M | A text-size control (CSS root size step) plus a real-phone test. Honest and cheap; benefits retirees and everyone. |
| B | L | A Hindi "daily summary" of the three lines only, generated from the same template; needs reviewed translation and a Hindi banned-word list (counsel question 10). |
| C | L+ | Full bilingual site. Not feasible without a translation workflow and counsel review. |

Static export can hold `/hi/` routes, but nothing exists today (`lang="en"`). Fake-door first.

### B10. Data consistency and trust (rec 10; friction 10, 14, 15)

- Stamp each tile with its own time ("GIFT Nifty, last print 02:44 IST, five hours before the brief"). Change `data` KPI labels and the `Freshness` component.
- For ranges, label as "Sharekhan expected range 93.70 to 94.20" never bare "93.70" (already worded this way in `data:67`; the Macro view needs checking).
- Align the window names: "20 sessions" vs "21 sessions" explained in the table footnote, or use one definition in both places (`lib/mood.ts` vs `lib/portfolioFacts.ts`).
- Move the put/call removal note to a methodology changelog page with dates; keep the Jargon Buster entry but say "Not used since 15 Nov 2026 in this index (the 13 Nov brief was built before)".
- Add a "Methods and changes" page (the report asks for exportable data and a changelog; export is not built and licensing is open). Fill or remove the Nifty P/E block (`lib/mood.ts:201` lists Valuation as context; whether it renders was not checked).
- Replace the decorative 3D ridge chart on Macro Watch? DESIGN.md forbids extruding 2-D data into 3-D, though it allows the isometric `field` beside a table; low priority; test before acting.

### B11. Added by this analysis

- Add an "Example data" banner at page level for the frozen mock (the 13 Nov brief is mock/fixture data). Personas reacted to fixture news ("Nvidia's CEO resigned") as real. Before any public launch the live pipeline or a clear "sample" label is needed.
- Extend `lint-copy.mjs` to the whole app (cheap, protects every item above).
- Moderation of a "what changed since yesterday" strip: needs a second day's record (`data/` has one date today). Feasible once more days exist.

---

## C. Target audience

Source for market context (external estimates, not Brownian data): about 237.7 million demat accounts in Aug 2026 per a 360 ONE Capital Research report as relayed by [Business Today / Asianet, Aug 2026 data](https://newsable.asianetnews.com/business/demat-account-additions-surge-in-july-2026-reach-234-4-million-articleshow-hykhvbp) (the July figure was 234.4 million; the August figure came through the search summary and the original was not opened); total accounts overstate people, with active accounts a fraction (the same summary gives 19.3% active-to-total; unverified at the primary source). AMFI's October 2026 data (released 11 Nov 2026): SIP contributions of about ₹32,160 crore and nearly 10 crore SIP accounts contributing, as reported by [Equitybulls summary of AMFI data](https://www.equitybulls.com/news/379006/highlights-amfi-mutual-fund-industry-monthly-data-october-2026). SEBI-registered unique investors: about 13.6 crore per one source (unsourced to a primary document; left out of the analysis). These show a very large pool, but they do not size the number of people who want a daily market read; no such figure is claimed here. No revenue, conversion or usage prediction is made.

Fit ratings are qualitative judgements from product definition (PRODUCT.md), the simulation's hypotheses and the code. "Reach" is how many people in the segment plausibly exist; "fit" is how well the product serves them today and after the top changes.

| Segment | Reach | Fit now | Fit after top changes | Which solutions matter | Verdict |
|---|---|---|---|---|---|
| DIY direct-stock investors (primary) | Medium | Medium | High | B1, B2A/B, B4, B10 | Core. Needs holdings relevance (names, results dates) and a shorter page. Stock-level views stay gated by counsel. |
| SIP / mutual-fund-only investors | High | Low-Medium | Medium | B1, B2A (presets), B3, B5 | Worth retaining; they are the largest pool. They need a calm, short, generic read and category presets, not more data. Retention hypothesis, test with a 5-second test. |
| Complete beginners | High | Low | Low-Medium | B1, B5, B8 | Outside the primary audience per PRODUCT.md. Reduce harm (no alarm without context) but do not chase; a beginner path (how to start a SIP, goals) is a different product with an advice-adjacent perimeter. |
| Retirees and FD/debt savers | Medium | Low | Low-Medium | B3, B9A (text size), B1 | Medium-term option: a savers-only page of rates and facts would need FD/SCSS rate data not in the store (unsourced). Do not chase now. |
| Young phone-first investors | High | Medium-Low | Medium | B6, B7, B1, shareable card (later) | Opportunity for retention via a shorter phone page. Small-cap/IPO/crypto-adjacent asks are outside scope. |
| Finance-literate skeptics / analysts | Low-Medium | Medium | Medium-High | B4, B10, methodology page | Credibility amplifiers (they see the sourcing). Small direct reach; do not build exports until licensing is clear. |
| Busy HNI / business owners | Low-Medium | Medium-Low | Medium | B1, B2B | Wants a personal 30-second read on holdings they may not enter (PMS, business). Not servable without personalisation and privacy design. |
| NRIs | Low-Medium | Medium | Medium | Timing fix only | Their stated needs (Gulf-time edition, US holdings, NRE/NRO, tax) exceed the product. A small timestamp/IST-gloss fix helps; no further chase. |
| Hindi-first / regional investors | High | Low | Low (until validated) | B9 | Large in principle, but quality translation, legal-word list and trust are hard. Validate demand with a fake door before engineering. |
| Active F&O traders | Medium | Low | Low | none | Outside the audience. The simulation itself says do not chase; PRODUCT.md says active traders are not primary. |

**Outside the audience and not to be chased:** active F&O traders (no OI, PCR, levels), intraday/short-term traders, complete first-time investors seeking a tutorial, anyone wanting recommendations, price targets or alerts to act on. NRIs and Hindi-first investors are not excluded but need separate, validated investment.

Bundles:

| Bundle | Items | Mainly attracts or retains |
|---|---|---|
| Calm first screen | B1 + B3 + B8 + B6 | SIP-only, young phone-first, DIY (shorter read); reduces alarm for beginners and retirees |
| Make it mine (category level) | B2A + B5 | DIY and SIP investors; HNI partly |
| Trust and counsel | B4 + B10 + methods page | Skeptics, DIY, and the founder's own launch gate |
| Reach options (test first) | B9 + Gulf-time note | Hindi-first, retirees, NRIs |

---

## D. Feasibility

Effort ranges are rough engineering-day estimates by one developer familiar with the repo. Regulatory items rely on the founder's own counsel questions; this report gives no legal conclusion.

| # | Solution | Effort | Files / modules | Dependencies and blockers | Risk | Architecture fit | Verdict |
|---|---|---|---|---|---|---|---|
| B1 A | Generic "Today at a glance" | S-M, 2-4 d | `app/page.tsx`, new `components/Glance.tsx`, `data/types.ts` (optional `glance` lines), `scripts/lint-copy.mjs` | Copy must be generated or hand-written per day; brief-parsing is an open decision, so a stub per-day field is needed | Low-medium: wording must stay factual; add to lint | Static, daily: fits | FEASIBLE NOW |
| B1 B | Card driven by the saved mix | M, 4-6 d | plus `usePort`, `FrontDay`, `lib/portfolio*` | Counsel Q2 on personalised figures; hydration flicker | Medium-high | Fits device-only | FEASIBLE WITH CONDITIONS (counsel answer first) |
| B1 C | Per-audience "nothing to do" lines | n/a | n/a | Contradicts rule 1 | High | n/a | NOT FEASIBLE (policy) |
| B2 A | "Own nothing yet" state | S, 1-2 d | `usePort.ts`, `Mix.tsx`, `Day.tsx`, `FrontDay.tsx` | Update tests/`check.mjs` seeded-mix passes | Low | Fits | FEASIBLE NOW |
| B2 A+ | Fund-category presets | M, 3-5 d | `lib/portfolioMath.ts` ids, `portfolioFacts.ts` DEFS, `portfolioSeries.ts`, `data`, `docs/portfolio-exposure-map.md` | Needs history series per category (flexi-cap and ELSS have no index of their own; may need `n/a` or a stated proxy); doc update; counsel re new categories | Medium (data licensing, proxy claims) | Fits | FEASIBLE WITH CONDITIONS |
| B2 B | Typed names feeding events | S-M, 2-4 d | `components/portfolio.tsx`, `lib/resultDates.ts` | Already partly built | Medium: names are per-security; keep to dates only | Fits | FEASIBLE NOW (dates only) |
| B2 C | Stock-level weights/import | L, 15-30+ d | accounts, parsers | Counsel Q3, Q20-23; privacy notice (DPDP Act); possibly Account Aggregator rules; backend if synced; NSE terms | High | Needs backend/accounts for sync; paste could stay local | NOT FEASIBLE YET: needs counsel written view, an account/privacy model and a decision to relax "no per-security views" |
| B3 | Neutral example styling | S, 1-2 d | `Day.tsx`, `FrontDay.tsx`, `design/DESIGN.md`, `app/globals.css` | Contrast checks in both themes | Low | Fits | FEASIBLE NOW |
| B4 | Advice-wording rewrite and lint | M, 3-5 d code/content + counsel | `data/2026-11-13.ts`, `Chip.tsx`, `lib/impact.ts`, pages, `lint-copy.mjs` | Counsel Q5, Q11, Q12; future ingestion must follow style guide | Reduces regulatory risk; rewording can lose clarity | Fits | FEASIBLE WITH CONDITIONS (final wording needs counsel) |
| B5 | Inline jargon | M, 3-5 d | `Rich.tsx`, `data` glossary, `Term.tsx`, pages | Content writing; sheet works from keyboard already | Low; accessibility check | Fits | FEASIBLE NOW |
| B6 | Length cuts | M, 2-4 d | `app/page.tsx`, `More.tsx`, CSS | Re-run `npm run check` and `check:plots`; DESIGN.md "fold figure and source together" | Low | Fits | FEASIBLE NOW |
| B7 | Phone nav | S, 1-2 d (reorder) / M, 3-4 d (bottom bar) | `Nav.tsx`, `globals.css`, AGENTS.md | Real-phone test (not done by anyone) | Low | Fits | FEASIBLE NOW |
| B8 | Wander explanation | S, 0.5-1 d | `app/page.tsx`, `lib/bands.ts` copy | Counsel Q5 on Wander wording already open | Low-medium | Fits | FEASIBLE NOW |
| B9 A | Text-size control | S-M, 1-3 d | `layout.tsx`, `ThemeToggle`-like switch, CSS rem units | Audit of fixed px sizes (many `px` font sizes in CSS) | Low | Device-only: fits | FEASIBLE NOW |
| B9 B | Hindi summary | L, 10-20 d | `/hi/` route, template, translation | Translation review, Hindi banned-word list, counsel Q10; trust | Medium-high | Static export OK | NOT FEASIBLE YET (needs translation workflow and demand evidence) |
| B10 | Consistency and trust | S-M, 2-4 d | `data` labels, `Freshness`, `lib/mood.ts` copy, new method page | Data owner decisions | Low | Fits | FEASIBLE NOW |
| Alerts ("Early Signals") | L | needs push, accounts | Counsel Q8; no backend | Medium-high | Needs backend | NOT FEASIBLE YET |
| "What changed since yesterday" | M, 3-5 d | `data/`, `lib/` | Needs two consecutive daily records; today there is one | Low | Fits once data exists | FEASIBLE WITH CONDITIONS |
| Gulf-time edition | L | Pipeline schedule | Needs a second data cut | Low | Needs pipeline change | NOT FEASIBLE YET |

Constraints applying to all: no backend, device-only storage (`ii:port3`, `ii:watch2`), one daily record (`data/index.ts` selects one brief), static export, data licensing for NSE/NSDL/Yahoo unresolved (PRODUCT.md, counsel Q15-19), the counsel gate on portfolio features before public launch.

Could not check: real-device rendering; whether `npm run check` and `lint:copy` currently pass (not run, by instruction); the actual -0.42% figure; the `/macro` page text for 93.70; whether history series exist for flexi-cap/ELSS proxies; the live status of `data/index.ts` after other agents' edits.

---

## E. Synthesis

### E.1 Roadmap

| Horizon | Items | Metrics and segments moved | Effort | Risk | Gate |
|---|---|---|---|---|---|
| Now (this week) | B3 neutral example; B2A empty state; B1A glance card; B8 Wander sentence; B10 timestamp/label fixes; extend `lint-copy` to `data/`, `app/` | Clarity, emotion, overload; SIP, DIY, phone-first | About 6-10 d total | Low | Run `lint:copy`, `check`, `check:plots` |
| Next (2-4 weeks) | B4 wording rewrite (send counsel Q5/Q11/Q12 first); B5 jargon; B6 length; B7 nav; B9A text size; method/changelog page | Advice risk, jargon fit, scroll depth, findability; skeptics, retirees (text size) | About 12-20 d | Medium (counsel timing) | Counsel written view on labels; real-phone test |
| Later (after counsel and validation) | Fund-category presets; "what changed since yesterday" (needs more daily records); typed names with dates; Hindi summary; Gulf-time note | Relevance, return tomorrow; DIY, SIP, Hindi-first, NRI | Variable | Medium-high | Fake-door demand, counsel answers, licensing |

Dependencies: nearly everything that changes copy depends on the brief-parsing decision (PRODUCT.md "Open decisions"); do the style guide now so ingestion inherits it.

### E.2 Do not build (now)

| Item | Why |
|---|---|
| Derivatives desk (OI, PCR, max pain, FII futures, levels) | Outside the audience (PRODUCT.md); would pull toward trading calls. |
| Stock-level holdings import or broker connection | Conflicts with "no per-security views", counsel Q3/Q21/Q23; account and privacy burden; no evidence of demand beyond simulated personas. |
| Buy/sell, "what to do with your SIP" lines, price targets, "safe" labels | Rule 1; SEBI IA/RA boundaries. |
| Alerts and "Ask Brownian" before the counsel gate | Need accounts/backend; counsel Q8, Q9. |
| Beginner course ("how to start a SIP", goals planner) | A different product; advice-adjacent; beginners are not primary. |
| Pricing, paid tiers or willingness-to-pay claims | The simulated numbers are not evidence; rule 4. |
| Shareable dial/cards, crypto/IPO/small-cap content | Single-persona asks, outside scope; revisit only after core retention evidence. |
| Full Hindi/regional site | No translation workflow; validate demand first. |

### E.3 Five decisions for the founder

1. **Who is the daily user?** Stay with the DIY direct-stock investor, or widen to SIP-only readers? This decides whether the top card speaks generically or whether fund-category presets get priority.
2. **Personalisation boundary.** Is category-level weights the limit until counsel answers, or will you fund counsel review of per-name features? Includes whether to retain the red/green sign colouring on personalised numbers.
3. **Directional labels.** Keep, neutralise, or remove Tailwind/Headwind/High impact/Watch until counsel replies? Recommended: neutralise now.
4. **Mock data and launch honesty.** The app reads a frozen 13 Nov mock. When does a live daily brief pipeline replace it, and until then should a visible "sample data" banner be shown?
5. **Language and reach.** Spend effort on text size and a Hindi pilot, or defer both until real users ask? Recommended: text size now, Hindi only after a fake-door.

### E.4 Validating each top item with real people

| Item | Method | Pass signal (set before testing) | Notes |
|---|---|---|---|
| B1 glance card | 5-second test on a static image, 5 people per segment (SIP, DIY, saver, beginner) | They can state what happened and say they did not feel they must act; no one reads it as a recommendation | Show with and without the card; do not coach |
| B2 empty state / presets | Fake-door "Start with fund categories" button on `/portfolio`, plus 5 interviews with DIY and SIP investors | Click and completion rates against a pre-stated threshold | Any analytics must be aggregate and consent-aware (counsel Q13); today nothing is logged |
| B3 neutral example | Prototype A/B on two images; short interviews | Lower reported alarm without confusion | Include the "single days are noise" line in both |
| B4 wording | 5 interviews with lay readers plus a read by a SEBI-literate lawyer | Lay readers do not describe lines as instructions; counsel agrees | Do this first; it can change product rules |
| B5/B6/B7 | Moderated phone test on real devices at default and large font; task: find the Jargon Buster, say what GIFT Nifty is | Task completion without help | Fills the gap the simulation left (type size and tap targets) |
| B8 dial | Comprehension test: "what does 68 mean? what would you do?" | No one reads it as buy/sell | Check misreadings |
| B9 Hindi | Fake-door language toggle and 5 interviews with Hindi-first investors | Real stated need, not just clicks | Do not rely on simulated demand |
| Pricing | Interviews on what they pay today and for what | Pattern across people | Never quote simulated numbers |

---

## Unknowns and confidence

| Unknown | Effect on this analysis | Confidence in the conclusion |
|---|---|---|
| Real users: none exist; all evidence is simulated | Every user-facing recommendation is a hypothesis | Low-medium on audience fit; the code facts are high |
| Phone type size, tap targets, large-text behaviour | Not verified by the simulation or here | Low |
| Legal posture: no counsel opinion in the repo | Section B4 and portfolio-related verdicts are conditional | Medium that wording is a risk; no legal conclusion made |
| Data licensing (NSE, NSDL, Yahoo) | Could change what can be shown publicly or in an export | Unknown |
| -0.42% example figure, 11.3% vs 13.13% values, ONGC "sources conflict" | Not recomputed or located | Cannot verify |
| History series for new fund categories | Determines B2A+ scope | Unknown |
| Code is changing (files dated 18 Nov 00:00 and 00:35 on `app/page.tsx` and `out/`; screenshots 17 Nov) | Section counts and line numbers may shift | Medium-high for the date of review |
| Market-size figures | Taken from news and summary pages found by web search (links in C); primary AMFI/depository releases were not opened. Demat totals overstate unique people. | Treat as rough external context only |
| Sub-agents not used | The analysis is single-pass; no independent second review | Moderate |

No user, testimonial, usage, accuracy, performance or pricing claim in this document is Brownian's own. The simulated willingness-to-pay figures were deliberately not used.
