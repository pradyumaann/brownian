// Nifty options put/call activity from the NSE F&O bhavcopy (one file per trading day, ~1.4 MB, not cached).
// Per day: total Nifty put and call contracts traded and open interest, across all expiries.
import { get, unzipFirst, parseCSV, loadTable, saveTable, pool, parts, num, log } from "./lib.mjs";

const COLS = ["date", "put_vol", "call_vol", "put_oi", "call_oi"];

const urls = (d) => {
  const p = parts(d);
  return [
    `https://nsearchives.nseindia.com/content/fo/BhavCopy_NSE_FO_0_0_0_${p.y}${p.m}${p.dd}_F_0000.csv.zip`,
    `https://nsearchives.nseindia.com/content/historical/DERIVATIVES/${p.y}/${p.mon}/fo${p.dd}${p.mon}${p.y}bhav.csv.zip`,
  ];
};

async function day(d) {
  for (const u of urls(d)) {
    const buf = await get(u);
    if (!buf) continue;
    const t = { put_vol: 0, call_vol: 0, put_oi: 0, call_oi: 0 };
    for (const r of parseCSV(unzipFirst(buf))) {
      // UDiFF: FinInstrmTp IDO = index option, volume in contracts. Older format: INSTRUMENT OPTIDX, CONTRACTS.
      const isNifty = r.TckrSymb !== undefined ? r.TckrSymb === "NIFTY" && r.FinInstrmTp === "IDO" : r.SYMBOL === "NIFTY" && r.INSTRUMENT === "OPTIDX";
      if (!isNifty) continue;
      const side = (r.OptnTp ?? r.OPTION_TYP) === "PE" ? "put" : "call";
      // UDiFF reports volume in shares; divide by lot size so both formats count contracts.
      const vol = r.TtlTradgVol !== undefined ? num(r.TtlTradgVol) / (num(r.NewBrdLotQty) || 1) : num(r.CONTRACTS);
      const oi = r.OpnIntrst !== undefined ? num(r.OpnIntrst) / (num(r.NewBrdLotQty) || 1) : num(r.OPEN_INT);
      t[side + "_vol"] += vol || 0;
      t[side + "_oi"] += oi || 0;
    }
    return t.call_vol ? { date: d, ...Object.fromEntries(Object.entries(t).map(([k, v]) => [k, Math.round(v)])) } : null;
  }
  return null;
}

export async function importOptions(from, to) {
  const rows = await loadTable("options.csv");
  const have = new Set(rows.map((r) => r.date));
  const cal = (await loadTable("calendar.csv")).filter((r) => r.open === "1" && r.date >= from && r.date <= to && !have.has(r.date)).map((r) => r.date);
  log(`options: ${cal.length} trading days to fetch`);
  const got = (await pool(cal, 3, day)).filter(Boolean);
  const n = await saveTable("options.csv", COLS, [...rows, ...got], (r) => r.date);
  log(`options: +${got.length} days, ${n} rows stored`);
}
