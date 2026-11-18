# Front-page audit: Markets, Overnight, 18 Nov 2026

Read-only report for Version 2.5. It audits `/` after the decided changes: the "Blended session move" card replaces 02, 08 is gone, 05, 06 and 09 fold under 620px, and Portfolio Lens is second in the nav. The user decides.

Evidence notes. The personas are AI simulations, so treat them as hypotheses. Friction 1 (length) was judged on an older build that still had 02 and 08. Sections 04, 05, 06 and 09 drew no complaint of their own beyond length, and India, Global and Developing were opened by 1 to 3 personas. So most verdicts are Keep or Fold, at medium confidence.

What this report does not propose, because the user rejected it on 18 Nov:
- turning the 01 takeaways into dropdowns;
- merging 07 into the Macro Watch calendar;
- removing sector strength;
- bars that link items to the mix.

## Block by block

### Title and lede
- Verdict: keep on front, with one small trim. Drop the `bw-source` line "Markets, Overnight · Fri 13 Nov" under the lede. The h1, the nav tab and the masthead day line already say this.
- Reason: the lede is the only plain-sentence summary of the open, which is the first-minute job. P3 and P6 got the open from lede plus tiles in about 30 seconds.
- Copy items: the jargon (friction 3; P1, P2, P5, P8, P9, P10; rec 5) is handled by the jargon pop-up being built.
- Lost if moved: the page would open on numbers alone.
- Confidence: high.

### Hero KPI row (GIFT Nifty, Wander and macro pressure, FII, USD/INR)
- Verdict: keep on front, with one addition. Replace the tile's line "Greed · macro pressure high · interpretation, not a forecast" with the single plain sentence from rec 8 (research B8), built from `{score}`, `{band}` and `{press}` placeholders.
- Reason: this row is the glance layer that DESIGN.md asks for. Friction 5 (seven personas) is about not understanding 68 beside 79, not about where the tile sits.
- Lost if moved: the four numbers that set the open.
- Confidence: high on keeping it; medium that the sentence fixes the confusion.

### 01 What happened, and why it matters
- Verdict: keep on front, unchanged in layout. At about 1,120px it is the largest block, but it carries "what moved and why", which is half of the product's success line.
- Copy items, not placement reasons: "If you hold a Nasdaq or US tech fund…" and similar "why" lines belong to rec 4 and the counsel track. "What drove the day" is the only place the actual Nifty and Sensex closes, breadth and VIX appear, so it stays.
- Lost if moved: the core narrative.
- Confidence: high.

### 03 The market's mood (Wander dial)
- Verdict: keep on front for now. Folding it on phone is put to the user as question 2 below, not made a verdict.
- Reason: the reading appears three times on one page: the masthead bars (68), the hero tile (68 / 79) and the dial with the score pair. The section costs about 660px on a phone. Against folding: DESIGN.md lists it first among brief sections, P8 liked the dial, and friction 5 is about meaning, not length.
- Watch: the new card's turbulence and global-spillover lines should not be repeated here. They already live in `/wander` section 04.
- Lost if folded: the dial's shape and the component dots on the first scroll. The score would still show in the hero.
- Confidence: medium.

### 04 Where money moved (Flow map)
- Verdict: keep on front.
- Reason: flows are named in the product purpose, and this is the only place on `/` that shows DII alongside FII, for both the day and month to date. No persona raised it.
- Lost if moved: DII context. "DIIs sold for a 9th session" would remain as a single sentence in the lede.
- Confidence: medium.

### 05 Sector strength
- Verdict: fold on phone (decided); keep open on desktop.
- Reason: sector rotation is in the purpose, and the user explicitly kept this section on 18 Nov. Folding is already the agreed compromise, and there is no new evidence for going further.
- Lost if moved: the section map of the user's holding types (banks, IT, autos).
- Confidence: high.

### 06 Global cues
- Verdict: fold on phone (decided); no further change.
- Reason: global moves are read for their effect on India; only P6 relied on it, so evidence is thin both ways.
- Lost if moved: gold futures, the only market figure behind the card's gold line, and the US sector context.
- Confidence: medium.

### 07 Coming up
- Verdict: keep, with two changes.
  - On phone, show the rows for today and the next session (four rows here) and put "N more this week" behind More.
  - Add source tags to every row.
- Reason: "what to watch" is part of the success line, so the section stays.
- Why the fold is not the rejected mockup:
  - It uses the existing "3 more" pattern from 01.
  - It does not merge 07 with any other calendar.
  - It rests on friction 1 (all 10 personas) and friction 11 (P2, P3, P9).
- Rule gap: the rows render only a date and a title (`app/page.tsx` 141–147), and the `B.next` records (`data/2026-11-13.ts` 46–55) carry no `src`. That breaks product rule 2. Fixing it needs data work, not only layout.
- Lost if folded: the later-week dates (Nvidia, Walmart) need one tap on phone.
- Confidence: high on the source gap; medium on the fold.

### 09 Still developing
- Verdict: fold on phone (decided). Move the dawn button "See what it means for you" out of this section.
- Reason: this section holds the page's only primary button. Folded, it would be hidden. The new card will likely link to Portfolio Lens anyway, and DESIGN.md allows one primary button per view. Put that link in the card, and keep only "All developing stories" here.
- Copy item: the "Watch:" prefix belongs to rec 4.
- Lost if folded: story titles need one tap on phone.
- Confidence: medium-high on the button; high on the fold.

### Source footer
- Verdict: keep on front, unchanged.
- Reason: it is already a closed `<details>` element, and its disclaimer is required on every page (rules 2 and 3). Frictions 7 and 15 concern wording and size, not placement.
- Lost if moved: the rules require it, so it cannot move.
- Confidence: high.

## Proposed order

1. Masthead and nav
2. Title and lede
3. Blended session move, or hero row first (see question 1)
4. Hero row
5. 01 What happened
6. 03 Mood
7. 04 Flows
8. 05 Sector strength (folds on phone)
9. 06 Global cues (folds on phone)
10. 07 Coming up (four rows on phone)
11. 09 Developing (folds on phone; no primary button)
12. Footer

The "Brief layout" list in DESIGN.md is already out of step with the page: it lists no 01, no Coming up and no portfolio card. Whatever order is chosen, update that list in the same change.

## Phone length

These figures were estimated by eye from one night-theme screenshot at 400px (`check-shots/night-400-brief.png`, 18 Nov 14:53). Each figure is roughly ±50px. The simulation's 8,600px and the research report's 8,632px came from older builds.

| State | Phone length | Screens (about 800px) |
|---|---|---|
| Today, example mix | about 7,800px | about 9.8 |
| Today, saved mix (08 grows) | about 8,200px | about 10.3 |
| After the decided changes | about 6,000px | about 7.5 |
| Plus this report's trims (07 fold, source line) | about 5,700px | about 7.1 |
| Plus folding 03 on phone (question 2) | about 5,250px | about 6.6 |

Current heights, roughly: masthead and nav 360, title and lede 280, hero 340, 01 1,120, 02 760, 03 660, 04 490, 05 550, 06 560, 07 610, 08 490, 09 820, footer 250. The "after" rows assume a 600px card, about 200px per folded section, and 09's buttons outside the fold.

Removing 08 also closes most of the 400px gap between the example and saved-mix pages. On desktop, More is always open above 620px, so only the 02 swap and the 08 removal change the length (today 6,615px at 1280px).

## Decisions for the user

1. Should the Blended session move card sit above or below the hero row? Masthead, nav, title and lede already take about 640px of an 800px first screen. If the card goes above the row, the four KPIs move to the second screen.
2. Should 03, the Wander dial, fold on phone, given that the hero tile already shows 68 / 79? It would save about 450px, at the cost of the dial on the first scroll.
3. Should "See what it means for you" move from 09 into the new card, so the page's one primary button stays visible when 09 is folded?
4. Should Coming up show only today and the next session on phone, with the rest behind "N more"?
5. Can source tags be added to the `B.next` calendar rows as a data task, so 07 meets rule 2?
