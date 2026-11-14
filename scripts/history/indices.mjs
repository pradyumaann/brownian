// NSE index closes, one file per trading day: nsearchives.nseindia.com/content/indices/ind_close_all_DDMMYYYY.csv
// It also writes calendar.csv (open = 1 on NSE trading days), which the other importers follow.
// Keeps the broad indices, the NSE sectoral indices used for sector strength, turbulence and fragility, and India VIX.
import { get, parseCSV, loadTable, saveTable, weekdays, pool, parts, num, log, todayIST, addDays } from "./lib.mjs";

export const INDICES = {
  "Nifty 50": "nifty50", "Nifty Next 50": "next50", "Nifty 500": "nifty500", "NIFTY Midcap 100": "midcap100",
  "NIFTY Smallcap 100": "smallcap100", "India VIX": "indiavix", "Nifty 10 yr Benchmark G-Sec": "gsec10",
  "Nifty Auto": "auto", "Nifty Bank": "bank", "Nifty Energy": "energy", "Nifty Financial Services": "finserv",
  "Nifty FMCG": "fmcg", "Nifty IT": "it", "Nifty Media": "media", "Nifty Metal": "metal", "Nifty Pharma": "pharma",
  "Nifty PSU Bank": "psubank", "Nifty Realty": "realty", "Nifty Private Bank": "pvtbank", "Nifty Oil & Gas": "oilgas",
  "Nifty Healthcare Index": "healthcare", "Nifty Consumer Durables": "durables",
};
/** The sector set for turbulence and fragility: every NSE sectoral index with five years of history. */
export const SECTORS = ["auto", "bank", "energy", "finserv", "fmcg", "it", "media", "metal", "pharma", "psubank", "realty", "pvtbank", "oilgas", "healthcare", "durables"];

const COLS = ["date", "index", "open", "high", "low", "close", "pe", "pb", "dy"];
const url = (d) => { const p = parts(d); return `https://nsearchives.nseindia.com/content/indices/ind_close_all_${p.dd}${p.m}${p.y}.csv`; };

export async function importIndices(from, to) {
  const rows = await loadTable("indices.csv");
  const cal = await loadTable("calendar.csv");
  const known = new Set(cal.map((r) => r.date));
  const days = weekdays(from, to).filter((d) => !known.has(d));
  log(`indices: ${days.length} days to fetch`);
  let added = 0, holidays = 0;
  await pool(days, 4, async (d) => {
    const buf = await get(url(d));
    // No file: an exchange holiday. Recorded only once the day is safely past, so a late publish is not mistaken for one.
    if (!buf) { if (d < addDays(todayIST(), -3)) { cal.push({ date: d, open: 0 }); holidays++; } return; }
    cal.push({ date: d, open: 1 });
    for (const r of parseCSV(buf.toString("utf8"))) {
      const id = INDICES[r["Index Name"]];
      if (!id) continue;
      // Files are DD-MM-YYYY, but a few older ones are MM-DD-YYYY; either is accepted if it names the day requested.
      const [a, b, y] = r["Index Date"].split("-");
      if (`${y}-${b}-${a}` !== d && `${y}-${a}-${b}` !== d) throw new Error(`indices: ${url(d)} is dated ${r["Index Date"]}`);
      rows.push({ date: d, index: id, open: num(r["Open Index Value"]), high: num(r["High Index Value"]), low: num(r["Low Index Value"]),
        close: num(r["Closing Index Value"]), pe: num(r["P/E"]), pb: num(r["P/B"]), dy: num(r["Div Yield"]) });
      added++;
    }
  });
  const n = await saveTable("indices.csv", COLS, rows, (r) => r.date + "|" + r.index);
  await saveTable("calendar.csv", ["date", "open"], cal, (r) => r.date);
  log(`indices: +${added} rows, ${holidays} non-trading days, ${n} rows stored`);
}
