# Portfolio event tags

Reviewed 16 Nov 2026 against `data/2026-11-13.ts` (the day's record, built from `docs/briefs/2026-11-13-pre-market-brief.txt` plus the web calendars). The tags are the `affects` field on `CalendarItem` and drive "Events for what you own" in Portfolio Lens.

## The rule

A dated event is tagged to a holding type only when one sentence in the brief's own text states the link: a holding note (`holdings[].h` or `.w`), a takeaway (`takeaways[].why`, allowed 17 Nov 2026) or the event's own text. A tag with no such sentence is dropped. Two sentences chained together are an inference, not a statement, so they do not count. A missing tag means "the brief states no link", never "no effect". The page shows which type an event is tagged to, never the size or direction of an effect and never the reader's weight beside it. Tags are Brownian's reading of the brief's text and carry "Interpretation, not a forecast." Whether tagging is editorial judgement that counsel should review is question 7b in `docs/portfolio-counsel-questions.md`.

## Tags in use (13 Nov 2026 record)

| Event (row `w`, `t`) | Tagged to | Supporting sentence (quoted) | Where |
|---|---|---|---|
| Fri 13 · 19:00, US October PPI | IT stocks & US/Nasdaq funds | "US PPI today at 19:00 IST; Nvidia results early 18 Nov IST." | `holdings` id `it`, field `w` |
| Wed 18 · early, Nvidia results | IT stocks & US/Nasdaq funds | "US PPI today at 19:00 IST; Nvidia results early 18 Nov IST." | `holdings` id `it`, field `w` |
| 2–4 Dec, RBI Monetary Policy Committee | Nifty index funds & large-cap SIPs | "Whether FII buying continues with US 10Y above 5%; the RBI meeting on 2–4 Dec." | `holdings` id `index`, field `w` |
| 2–4 Dec, RBI Monetary Policy Committee | Debt funds & FDs | "India CPI at 6.09% breached the RBI band; the repo was raised in October and the next meeting is 2–4 Dec." | `holdings` id `debt`, field `h` |
| 2–4 Dec, RBI Monetary Policy Committee | Banks, NBFCs & insurers | "That matters for debt funds, home loans and rate-sensitive stocks like realty and banks." (the 2–4 Dec takeaway) | `takeaways[3]`, field `why` |
| 2–4 Dec, RBI Monetary Policy Committee | Real estate stocks & REITs | "Realty is rate-sensitive: a December RBI hike would weigh on it." | `holdings` id `realty`, field `w` |
| Fri 13, ~480 Q2 results | Auto & FMCG stocks | "Eicher Motors and Tata Motors PV report today; Ashok Leyland tomorrow." (the row names Eicher Motors and Tata Motors PV) | `holdings` id `consumer`, field `w` |
| Sat 14, Q2 results deadline | Auto & FMCG stocks | Same sentence ("Ashok Leyland tomorrow"; the row names Ashok Leyland and Patanjali Foods) | `holdings` id `consumer`, field `w` |

The sentence for the RBI meeting and real estate is the closest the text comes: it says a "December RBI hike", and the only RBI decision in December in the record is this meeting (`events` row 2–4 Dec). If counsel or the founder reads that as a chain, drop the realty tag.

## Candidates dropped (no supporting sentence in the allowed fields)

| Candidate | Why dropped |
|---|---|
| Any event to flexi-cap funds or ELSS (types added 18 Nov 2026) | No sentence in the brief names flexi-cap funds, ELSS or Nifty 500, and their holding notes (`holdings` ids `flexi`, `elss`) mention no dated event. No `affects` tag carries `flexi` or `elss`. |
| US October PPI to debt, gold | No holding note or event sentence mentions PPI for them. `gold.h` mentions "Fed hike bets", not the PPI date. |
| India October WPI (Mon 16) to debt, fin, realty | The event text says "Another rise would add to pressure on the RBI", which names no holding type. The debt note cites CPI, not WPI. |
| Nvidia results to anything beyond IT | No other note mentions it. |
| FOMC 8–9 Dec to debt, gold | No sentence ties the meeting to a type. `gold.h` says "Fed hike bets" and the event says "A hike is fully priced": two sentences, a chain. |
| India November CPI (14 Dec) to debt, fin, realty | The debt note cites October CPI, not the November print. |
| Q2 results rows to fin | The Fri 13 row names Edelweiss Financial and `erToday` lists it as "Financials / Sector leading", but `fin.h` and `fin.w` do not link results rows to the type, and naming a company would be a per-security view. |
| US retail sales, Home Depot, Target/TJX group, Walmart group | No holding note mentions them; the types are Indian and broad. Left untagged as planned. |
| Indian market opens (13 Nov 09:15) | Its text lists ONGC, gold ETFs and financials as "names in focus", which is a per-security list. Left untagged as planned. |
| MSCI India rebalance | No firm date, so it cannot be placed on the rail. |

## Related data fixes in this change

- Nvidia's results are written the same way everywhere: Tue 17 Nov after the US close, which is early Wed 18 Nov IST (`events`, `next`, `erUS`, `stocks`, `nvidia`).
- Home Depot is its own row (before the US open, Tue 17 Nov); the "US retail sales" row keeps the 19:00 IST time that belongs to the release alone.
