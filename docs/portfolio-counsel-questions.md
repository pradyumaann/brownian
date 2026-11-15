# Portfolio mix: questions for securities counsel

Status: draft for the founder to send, 15 Nov 2026. Nothing here is a legal conclusion; the repo holds no legal analysis. Each item marked [LAWYER] needs counsel's written view before any public launch.

## What is being asked about

Portfolio Lens (Phase 1) lets a reader set a percentage weight against ten broad holding types (for example "Nifty index funds & large-cap SIPs", "Gold ETFs, SGBs & jewellery"). The page then states facts computed from public index and market series:

- the day's blended move: the weights times each type's move, where a type's move is the plain average of its listed index or market drivers;
- the share of the mix in each factor (India large-cap equity, mid and small cap, IT and US, gold, rates, oil and commodities, real estate);
- concentration facts: largest share, top-two share, and a Herfindahl figure in plain words;
- where today's move sits against the same measure's own previous five years.

Design limits already built in: no instruments, no rupee amounts, no age, goals or risk-profile questions, no "good" or "bad" scoring, no suggestions, nothing leaves the device (browser local storage), no account. Interpretive lines are labelled "Interpretation, not a forecast." and the footer reads "For information only; not investment advice."

## 1. Regulatory perimeter

1. [LAWYER] Does a weight-based "your mix" page that shows computed day moves, factor exposure and concentration facts, with no instrument-level view and no suggestion, fall outside the SEBI (Research Analysts) Regulations, 2014 and the SEBI (Investment Advisers) Regulations, 2013? If the answer depends on particular features, which ones?
2. [LAWYER] Is a personalised figure (the blended move for the reader's own weights) treated differently from a generic market statistic, even where the reader supplies the inputs and the formula is shown on the page?
3. [LAWYER] Does it matter that the reader enters percentages for broad categories only, never named securities or amounts? Where is the line between a category and an input that could support a recommendation?
4. [LAWYER] Is the concentration section (largest share, top-two share, a Herfindahl figure with a plain-words description) acceptable as a fact, or does describing a mix as "concentrated" read as an assessment of suitability? What wording is acceptable?
5. [LAWYER] Are the existing Wander Index (a published-method sentiment reading, labelled interpretation) and the per-type impact notes ("Tailwind", "Headwind", "Mixed") already within the same analysis, or do they need separate review?
6. [LAWYER] Does any registration, exemption or educational carve-out apply to a free, ad-free product? Does the answer change if the product is later paid or sponsored?

## 2. If watch items are added later

7. [LAWYER] Phase 2 would show dated events and results dates that touch the types or names the reader chose ("events for what you own"), and a Phase 4 idea is threshold alerts stated as facts. Does joining a reader's own inputs to upcoming events change the answer to questions 1 to 4?
8. [LAWYER] Does a fixed-rule alert (for example "your mix moved more than a set amount in a day") differ from a generic notification? Who sets the amount, and does that choice matter?
9. [LAWYER] A planned "Ask Brownian" assistant restricted to the reader's portfolio facts: what controls (retrieval limits, refusal rules, logging, review) would counsel need to see before this is considered?

## 3. Wording, disclaimers and logging

10. [LAWYER] Review the banned-word list enforced by `npm run lint:copy` (buy, sell, hold as a verb, should, recommend, target, rebalance, reduce, increase, advice, advisor, advisory, tips, calls). Is it complete, too wide, or missing terms in Hindi or other languages if the product is localised?
11. [LAWYER] Is the standing disclaimer "For information only; not investment advice." sufficient, or are specific disclosures needed (data source, past versus future, no registration, grievance contact)? Where must they sit: footer, each personalised block, or both?
12. [LAWYER] Does "Interpretation, not a forecast." on each interpretive block meet counsel's expectation, or should it be longer?
13. [LAWYER] Must the product keep records? Today nothing is collected, so there is nothing to log. If analytics or error reporting are added, what may be logged without becoming personal data that needs consent or localisation under the Digital Personal Data Protection Act, 2023?
14. [LAWYER] Is the name "Portfolio Lens", or the word "portfolio" itself, a problem in the product name or marketing?

## 4. Data and licensing

15. [LAWYER] The history store is built from NSE archive files (index closes, bhavcopies), NSDL FPI reports and Yahoo Finance daily closes. May any of these be shown on a public, free site? On a paid one? Is derived output (percentiles, blended moves) treated differently from the raw series?
16. [LAWYER] Do NSE's terms permit automated download of its archive files, and display of index values, changes and percentile ranks? Is a licence needed for index names such as Nifty 50 and the sectoral indices?
17. [LAWYER] Yahoo Finance data (US indices, US 10-year yield, Brent, COMEX gold, USD/INR): are the terms of use compatible with redistribution inside a commercial app? If not, which licensed feed would counsel expect?
18. [LAWYER] The gold figure is a derived approximation (COMEX gold in USD combined with USD/INR), labelled "derived; excludes duties and premiums". Is that labelling enough, or should a derived figure not be shown without a licensed rupee price?
19. [LAWYER] What attribution must accompany third-party data (the `D1` to `D5` source tags today open the source's name and link)?

## 5. If accounts or syncing are added

20. [LAWYER] If weights are stored on a server so they sync across devices, does the product become a handler of financial information that carries extra duties (data protection, retention, breach notice, localisation)?
21. [LAWYER] Does a stored, personalised profile over time change the answers to questions 1 to 4, for example because it becomes a record of the reader's holdings?
22. [LAWYER] What consent, privacy notice and deletion flow are required? Are there extra rules for minors or for sharing a mix with another person?
23. [LAWYER] If statement import (CAS or a broker file) is added in a later phase, what additional permissions, licences or account-aggregator rules apply?

## 6. Before launch

24. [LAWYER] Please list the conditions under which counsel would sign off Phase 1 as it stands, and any change that would make that view void.
25. [LAWYER] Should the terms of use and privacy notice be drafted before or after your review of the screens? Which screens would you want to see?

Reference for counsel: the build is on branch `feature-portfolio-v1`; rules are in `AGENTS.md` ("Portfolio mix") and `PRODUCT.md`; the exposure mapping is in `docs/portfolio-exposure-map.md`.
