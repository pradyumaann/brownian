// Overseas markets and cross-asset closes from Yahoo Finance's public chart endpoint (daily, 5 years).
// Dates are each market's own trading date. Used for global spillover, safe-haven demand and global risk appetite.
// Yahoo's data is for personal use; a licensed feed replaces this before Brownian is public.
import { get, loadTable, saveTable, log } from "./lib.mjs";

export const WORLD = {
  sp500: "^GSPC", nasdaq: "^IXIC", russell2000: "^RUT", stoxx600: "^STOXX", ftse100: "^FTSE", dax: "^GDAXI",
  nikkei225: "^N225", hangseng: "^HSI", usvix: "^VIX", us10y: "^TNX", dxy: "DX-Y.NYB", brent: "BZ=F",
  gold: "GC=F", usdinr: "INR=X", nifty50_yahoo: "^NSEI",
};
const COLS = ["date", "series", "close"];

export async function importWorld(range = "5y") {
  const rows = await loadTable("world.csv");
  let added = 0;
  for (const [id, sym] of Object.entries(WORLD)) {
    const buf = await get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=1d`);
    const res = JSON.parse(buf.toString("utf8")).chart?.result?.[0];
    if (!res?.timestamp) { log(`world: no data for ${sym}`); continue; }
    const off = res.meta.gmtoffset || 0, close = res.indicators.quote[0].close;
    res.timestamp.forEach((t, i) => {
      if (close[i] == null) return; // a missing close stays missing
      rows.push({ date: new Date((t + off) * 1000).toISOString().slice(0, 10), series: id, close: +close[i].toFixed(4) });
      added++;
    });
  }
  const n = await saveTable("world.csv", COLS, rows, (r) => r.date + "|" + r.series);
  log(`world: ${added} closes fetched, ${n} rows stored`);
}
