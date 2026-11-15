# Portfolio exposure map: data review

Reviewed 15 Nov 2026 against the files in `data/history/` (not from memory). The mapping lives in `lib/portfolioFacts.ts`; this page records what each holding type is built from and what is n/a. Session read: Thu 12 Nov 2026 (`B.sessionDate`), the last NSE session on or before the brief. Source tags: D1 NSE archive index closes (`indices.csv`), D5 Yahoo Finance daily closes (`world.csv`); see `DATA_SOURCES` in `lib/papers.ts`.

## Series that exist

`indices.csv` ids (22, each 1,234 sessions from 15 Nov 2021 to 13 Nov 2026): auto, bank, durables, energy, finserv, fmcg, gsec10, healthcare, indiavix, it, media, metal, midcap100, next50, nifty50, nifty500, oilgas, pharma, psubank, pvtbank, realty, smallcap100.

`world.csv` series (15): brent, dax, dxy, ftse100, gold, hangseng, nasdaq, nifty50_yahoo, nikkei225, russell2000, sp500, stoxx600, us10y, usdinr, usvix. Yahoo symbols: `gold` is `GC=F` (COMEX gold futures, USD per ounce), `brent` is `BZ=F`, `us10y` is `^TNX` (yield in %), `usdinr` is `INR=X`, `nasdaq` is `^IXIC` (Composite).

Not in the store: silver, MCX anything, any rupee gold price, any fund NAV, any FD rate, any REIT price, any insurer-only index.

Two details that matter:

- `gsec10` is the **Nifty 10-yr Benchmark G-Sec index level** (about 2,637), a price-type index, not a yield. Its change is a percent change of that index. It cannot be turned into basis points of yield without a model, so it is shown as a percent change and the US 10-year (a real yield level) is the one shown in basis points.
- World series are aligned to NSE days with `worldOnNseDays` (each NSE day takes the last close on or before it). The US close of a calendar day therefore counts on that same NSE date.

## Table

Windows: "1 day" is the change on the session; "21 sessions" is the change over 21 NSE sessions; "rank" is the share of the series' own previous sessions (up to 1,250, at least 250, no look-ahead) whose one-day change was at or below the day's. The type's move is the equal-weighted average of its drivers' changes unless noted. A type with any driver missing has no move.

| Type | Drivers (id, tag) | Type move | n/a or partial |
|---|---|---|---|
| index: Nifty index funds & large-cap SIPs | nifty50 (D1) | Nifty 50 change | None. Index-fund NAVs, tracking error and expense are not in the store. |
| fin: Bank, NBFC & insurance stocks | bank, finserv, pvtbank, psubank (D1) | Average of four | Partial: no insurance-only or NBFC-only index; insurers and NBFCs are covered only as far as they sit inside Financial Services. The four are overlapping indices, so private and PSU banks are counted in both Bank and their own series. |
| mid: Mid & small-cap funds | midcap100, smallcap100 (D1) | Average of two | None for the index move. Fund NAVs not in the store. |
| it: IT stocks & US/Nasdaq funds | it (D1); nasdaq, usdinr (D5) | Average of three | Partial in meaning: USD/INR is averaged in as a rupee effect (a weaker rupee counts as a rise), which is an approximation of the rupee value of a US holding, not a compounded return. |
| gold: Gold ETFs, SGBs & jewellery | gold (D5), usdinr (D5) | Derived: (1 + COMEX gold change) × (1 + USD/INR change) − 1, labelled "derived; excludes duties and premiums" | Derived, not observed. No MCX or rupee gold price, no import duty, GST or local premium, and COMEX futures trade on US hours. SGB interest and jewellery making charges are outside it. |
| silver: Silver ETFs | none | n/a | Entirely n/a: no silver series. It is not read from gold. |
| debt: Debt funds & FDs | gsec10 (D1) as % change of the index; us10y (D5) as change in bp | **None** ("not in the blended move") | The two drivers are shown as facts only. Fund NAV change depends on duration and credit quality, which are unknown, so no price move is estimated. FD rates are fixed and have no series. |
| oil: Oil & gas stocks | oilgas, energy (D1); brent (D5) | Average of three | Partial in meaning: Brent is a commodity price, not an equity, and can pull the average the other way from the two indices (as it did on 12 Nov: indices fell, Brent rose 3.30%). Shown in the driver list so the reader sees it. |
| consumer: Auto & FMCG stocks | auto, fmcg (D1) | Average of two | None for the index move. |
| realty: Real estate stocks & REITs | realty (D1) | Nifty Realty change | REITs are not in the index; Nifty Realty covers listed developers. |
| wallet (not a holding) | none | none | Excluded from weights. Stays a separate household-costs note from the brief. |

## What the build produced for 12 Nov 2026 (check against the brief)

One-day: index +0.18%, fin +1.25% (Bank +1.19%, Financial Services +1.42%, Private Bank +0.87%, PSU Bank +1.51%), mid +0.98% (Midcap +0.85%, Smallcap +1.12%), it −0.35% (Nifty IT −0.41%, Nasdaq −0.39%, USD/INR −0.24%), gold −3.11% (COMEX −2.88%, USD/INR −0.24%), oil +0.78% (Oil & Gas −0.54%, Energy −0.42%, Brent +3.30%), consumer −0.88% (Auto −1.02%, FMCG −0.74%), realty +4.51%. Silver and debt: no move; US 10-year +10.5 bp, Nifty 10-yr G-Sec index −0.15%. These match the figures quoted in the brief's holding notes (for example Bank Nifty +1.20%, PSU Bank +1.51%, Realty +4.50%) to within rounding of the underlying closes.

## What is derived and how

- Type move: the plain average of the drivers' one-day changes (percent of each series), shown with its formula on the page. No weights between drivers, no beta.
- Gold: the one compounded figure, above. Its percentile is taken against the same derived series over the previous sessions.
- Percentile: `percentile()` from `lib/stats.ts` over the previous up to 1,250 daily moves of the type's own composite series (at least 250), as for the Wander Index components.
- Blended move: computed in the browser from the reader's weights (`lib/portfolioMath.ts`); it is not in this table because it depends on the reader.
