// Market breadth from the NSE cash-market bhavcopy (one file per trading day, every listed security).
// Per day: advances, declines, stocks at 52-week highs and lows, and a market illiquidity reading.
// Raw files are cached in .cache/nse/cm so derived series can be recomputed without downloading again.
import { join } from "node:path";
import { get, unzipFirst, parseCSV, loadTable, saveTable, pool, parts, num, log, CACHE } from "./lib.mjs";

const COLS = ["date", "stocks", "advances", "declines", "unchanged", "highs52", "lows52", "illiq"];
const WINDOW = 252; // trading days in a 52-week window

const urls = (d) => {
  const p = parts(d);
  return [
    `https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_${p.y}${p.m}${p.dd}_F_0000.csv.zip`,
    `https://nsearchives.nseindia.com/content/historical/EQUITIES/${p.y}/${p.mon}/cm${p.dd}${p.mon}${p.y}bhav.csv.zip`,
  ];
};

/** One day's equity rows in a common shape, from either bhavcopy format (UDiFF from July 2024, the older one before). */
async function day(d) {
  const cache = join(CACHE, "nse", "cm", d.replaceAll("-", "") + ".zip");
  for (const u of urls(d)) {
    const buf = await get(u, { cache });
    if (!buf) continue;
    return parseCSV(unzipFirst(buf)).map((r) => r.TckrSymb !== undefined
      ? { sym: r.TckrSymb, series: r.SctySrs, high: num(r.HghPric), low: num(r.LwPric), close: num(r.ClsPric), prev: num(r.PrvsClsgPric), value: num(r.TtlTrfVal) }
      : { sym: r.SYMBOL, series: r.SERIES, high: num(r.HIGH), low: num(r.LOW), close: num(r.CLOSE), prev: num(r.PREVCLOSE), value: num(r.TOTTRDVAL) })
      .filter((r) => r.series === "EQ" && r.close != null && r.prev != null);
  }
  return null;
}

export async function importBreadth(from, to) {
  const stored = await loadTable("breadth.csv");
  // Start where the stored rows start: a thinly traded stock's 52-week window can reach back further than 252 sessions.
  const start = stored.length ? stored.map((r) => r.date).sort()[0] : from;
  const cal = (await loadTable("calendar.csv")).filter((r) => r.open === "1" && r.date >= start && r.date <= to).map((r) => r.date);
  const have = new Set(stored.map((r) => r.date));
  const firstNew = cal.findIndex((d) => !have.has(d));
  if (firstNew < 0) { log("breadth: up to date"); return; }
  // Stored days are final, so only new days are written; earlier sessions are read to rebuild each stock's window.
  log(`breadth: ${cal.length - firstNew} days from ${cal[firstNew]}, reading ${cal.length} sessions (cached files are reused)`);
  const days = await pool(cal, 4, async (d) => ({ d, rows: await day(d) }));
  const missing = days.filter((x) => !x.rows).map((x) => x.d);
  if (missing.length) log(`breadth: no bhavcopy for ${missing.length} trading days: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}`);

  // Walk forward in time keeping each stock's last 252 highs and lows. NSE adjusts the previous close for splits and
  // bonuses on the ex-date, so a gap between yesterday's close and today's previous close rescales that stock's window.
  const hist = new Map();
  const out = [];
  let seen = 0;
  for (const { d, rows } of days) {
    if (!rows) continue;
    seen++;
    let adv = 0, dec = 0, unch = 0, hi = 0, lo = 0;
    const ill = [];
    for (const r of rows) {
      if (r.close > r.prev) adv++; else if (r.close < r.prev) dec++; else unch++;
      let h = hist.get(r.sym);
      if (h && h.last && r.prev && Math.abs(r.prev / h.last - 1) > 0.02) {
        const k = r.prev / h.last;
        h.highs = h.highs.map((v) => v * k); h.lows = h.lows.map((v) => v * k);
      }
      if (!h) { h = { highs: [], lows: [], last: null }; hist.set(r.sym, h); }
      if (h.highs.length >= WINDOW - 1 && r.high != null && r.low != null) {
        if (r.high >= Math.max(...h.highs)) hi++;
        if (r.low <= Math.min(...h.lows)) lo++;
      }
      if (r.high != null) { h.highs.push(r.high); h.lows.push(r.low); }
      if (h.highs.length > WINDOW - 1) { h.highs.shift(); h.lows.shift(); }
      h.last = r.close;
      // Amihud (2002): |return| per rupee traded. Here % move per ₹1 crore, over stocks trading at least ₹1 crore.
      if (r.value >= 1e7 && r.prev > 0) ill.push(Math.abs(r.close / r.prev - 1) * 100 / (r.value / 1e7));
    }
    ill.sort((a, b) => a - b);
    const warm = seen >= WINDOW;
    if (have.has(d)) continue;
    out.push({ date: d, stocks: rows.length, advances: adv, declines: dec, unchanged: unch,
      highs52: warm ? hi : "", lows52: warm ? lo : "", illiq: ill.length ? ill[ill.length >> 1].toPrecision(4) : "" });
  }
  const n = await saveTable("breadth.csv", COLS, [...stored, ...out], (r) => r.date);
  log(`breadth: ${out.length} days computed (52-week counts start after ${WINDOW} days), ${n} rows stored`);
}
