// FPI equity flows by sector from NSDL's "Fortnightly Sector-wise FPI Investment Data" (one HTML report a month,
// covering both fortnights). Per sector and fortnight: net equity investment and equity holdings (AUC), ₹ crore.
// Column blocks in each report: AUC at mid-month, net 1st–15th, net 16th–end, AUC at month-end; each block has an
// INR and a USD part of 12 columns (equity first). Only the INR equity columns are kept.
import { get, loadTable, saveTable, pool, log, num } from "./lib.mjs";

const BASE = "https://www.fpi.nsdl.co.in/web/";
const COLS = ["date", "sector", "equity_net", "equity_auc"];
const MON = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
const cells = (tr) => [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim());

export async function importSectors(fromDate) {
  const sel = (await get(BASE + "Reports/FPI_Fortnightly_Selection.aspx")).toString("utf8");
  // Month-end reports only (each carries both fortnights), from the option list.
  const files = [...sel.matchAll(/value="~\/(StaticReports\/Fortnightly_Sector_wise_FII_Investment_Data\/FIIInvestSector_([A-Za-z]{3})(\d{2})(\d{4})\.html?)"/g)]
    .map((m) => ({ path: m[1], ym: `${m[4]}-${MON[m[2].toLowerCase()]}`, day: Number(m[3]) }))
    .filter((f) => f.day >= 28 && `${f.ym}-31` >= fromDate);
  const rows = await loadTable("sector_flows.csv");
  const have = new Set(rows.map((r) => r.date.slice(0, 7)));
  const todo = files.filter((f) => !have.has(f.ym));
  log(`sectors: ${todo.length} monthly reports to fetch (${files.length} available since ${fromDate})`);
  await pool(todo, 2, async (f) => {
    const html = (await get(BASE + f.path)).toString("utf8");
    const mid = `${f.ym}-15`, end = `${f.ym}-${String(f.day).padStart(2, "0")}`;
    let n = 0;
    for (const c of html.split(/<tr/).map(cells)) {
      if (c.length < 98 || !/^\d+$/.test(c[0])) continue;
      const v = (i) => num(c[i]);
      rows.push({ date: mid, sector: c[1], equity_net: v(26), equity_auc: v(2) });
      rows.push({ date: end, sector: c[1], equity_net: v(50), equity_auc: v(74) });
      n++;
    }
    if (!n) log(`sectors: no sector rows in ${f.path}; the layout may differ`);
  });
  const n = await saveTable("sector_flows.csv", COLS, rows, (r) => r.date + "|" + r.sector);
  log(`sectors: ${n} sector-fortnights stored`);
}
