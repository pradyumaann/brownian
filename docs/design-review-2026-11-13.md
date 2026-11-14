# Design review, 13 Nov 2026

First Impeccable critique of the prototype (then named Antelux), followed by a polish pass and an interaction pass.

## Score

24/40 (Acceptable) before polish. Not re-scored yet.

| Heuristic | Score | Main issue found |
|---|---|---|
| Visibility of status | 3 | No freshness state after the market opened |
| Match with the real world | 3 | Red meant "bad for India" in some places, "negative" in others |
| User control | 2 | Watchlist reset had no undo; info sheet had no click-outside close |
| Consistency | 2 | Colour meaning flipped; only 4 of 10 views had a heading |
| Error prevention | 1 | Watchlist prefix-matched ("HDFC" → HDFC Life) and accepted anything |
| Recognition over recall | 3 | Source tags were plain text, needed a footer lookup |
| Flexibility | 2 | 10 flat tabs, no skip link |
| Minimalist design | 3 | A label above every heading flattened the hierarchy |
| Error recovery | 2 | No "did you mean", no undo |
| Help | 3 | Glossary terms not linked from most views |

## Fixed in the polish pass

- Source tags on headline numbers, takeaways, holding cards and indicators; tap to open the source.
- Advice-like copy rewritten as research and questions; "Interpretation, not a forecast" labels.
- Feature names: Brief, Portfolio Lens, Mood Index, Flow Map, India Markets, Global Cues, Macro Watch, Earnings Radar, Developing, Jargon Buster.
- Phone: charts redrawn to fit, tables stack, tab bar fades at the edge, shorter header.
- Watchlist: exact or alias matches only, suggestions, undo for remove and reset.
- Colour: sign-based change colours with impact in words; heatmap text by measured contrast; darker chips.
- Accessibility: skip link, focus-trapped info sheet with focus return, chart descriptions with values, per-view page titles.
- Day line (brief → open → close) and a freshness state on the Brief.

## Interaction pass (14 Nov)

- Night-indigo header with dawn accents; tabs grouped (personal · markets · calendar · glossary).
- Shared hover/tap/focus readout on every chart mark.
- One entrance moment per view (bars grow, needle sweeps, score counts up), off under reduced motion.
- Mood dial shows its six components as readable dots; hover focus dims other marks.

## Still open

- Navigation is still 10 tabs; grouping helps but a deeper IA change (Brief · Portfolio Lens · Markets · Macro & Earnings · Developing) is worth testing.
- Developing has no day-over-day comparison until daily history exists.
- The detector's 3 remaining low-contrast warnings are false positives from it mixing light and dark tokens in static analysis.
