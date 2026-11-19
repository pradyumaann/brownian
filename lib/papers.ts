// Research behind each index, checked against publisher or index records (14 Nov 2026). Client-safe.
export interface Paper { cite: string; title: string; venue: string; url: string }

export const PAPERS = {
  whaley2000: { cite: "Whaley (2000)", title: "The Investor Fear Gauge", venue: "Journal of Portfolio Management 26(3), 12–17", url: "https://doi.org/10.3905/jpm.2000.319728" },
  jt1993: { cite: "Jegadeesh & Titman (1993)", title: "Returns to Buying Winners and Selling Losers: Implications for Stock Market Efficiency", venue: "Journal of Finance 48(1), 65–91", url: "https://doi.org/10.1111/j.1540-6261.1993.tb04702.x" },
  bll1992: { cite: "Brock, Lakonishok & LeBaron (1992)", title: "Simple Technical Trading Rules and the Stochastic Properties of Stock Returns", venue: "Journal of Finance 47(5), 1731–1764", url: "https://doi.org/10.1111/j.1540-6261.1992.tb04681.x" },
  mop2012: { cite: "Moskowitz, Ooi & Pedersen (2012)", title: "Time Series Momentum", venue: "Journal of Financial Economics 104(2), 228–250", url: "https://doi.org/10.1016/j.jfineco.2011.11.003" },
  kl2010: { cite: "Kritzman & Li (2010)", title: "Skulls, Financial Turbulence, and Risk Management", venue: "Financial Analysts Journal 66(5), 30–41", url: "https://doi.org/10.2469/faj.v66.n5.3" },
  klpr2011: { cite: "Kritzman, Li, Page & Rigobon (2011)", title: "Principal Components as a Measure of Systemic Risk", venue: "Journal of Portfolio Management 37(4), 112–126", url: "https://globalmarkets.statestreet.com/research/portal/insights/article/2a8e282a-343b-443c-b362-1634c71d2d26" },
  dy2012: { cite: "Diebold & Yilmaz (2012)", title: "Better to Give than to Receive: Predictive Directional Measurement of Volatility Spillovers", venue: "International Journal of Forecasting 28(1), 57–66", url: "https://doi.org/10.1016/j.ijforecast.2011.02.006" },
  fos2001: { cite: "Froot, O'Connell & Seasholes (2001)", title: "The Portfolio Flows of International Investors", venue: "Journal of Financial Economics 59(2), 151–193", url: "https://doi.org/10.1016/S0304-405X(00)00084-2" },
  amihud2002: { cite: "Amihud (2002)", title: "Illiquidity and Stock Returns: Cross-Section and Time-Series Effects", venue: "Journal of Financial Markets 5(1), 31–56", url: "https://doi.org/10.1016/S1386-4181(01)00024-6" },
  bw2006: { cite: "Baker & Wurgler (2006)", title: "Investor Sentiment and the Cross-Section of Stock Returns", venue: "Journal of Finance 61(4), 1645–1680", url: "https://doi.org/10.1111/j.1540-6261.2006.00885.x" },
} satisfies Record<string, Paper>;
export type PaperId = keyof typeof PAPERS;

/** Market-data sources for figures computed from the history store. Tags D1–D5 sit beside the brief's S# and W#. */
export const DATA_SOURCES: [string, string, string][] = [
  ["D1", "NSE daily index closes (all indices file), via NSE archives", "https://www.nseindia.com/reports-indices-historical-index-data"],
  ["D2", "NSE cash-market bhavcopy: every listed stock's daily prices", "https://www.nseindia.com/all-reports"],
  ["D4", "NSDL: Daily Trends in FPI Investments", "https://www.fpi.nsdl.co.in/web/Reports/Latest.aspx"],
  ["D5", "Yahoo Finance daily closes: overseas indices, US VIX, US 10-year, Brent, gold, USD/INR", "https://finance.yahoo.com/markets/"],
];
