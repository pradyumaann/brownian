// Foreign portfolio investor (FPI) flows from NSDL's "Daily Trends in FPI Investments".
// NSDL compiles custodian-confirmed trades, so a reporting date covers trades up to the previous trading day.
// Latest.aspx gives the newest day (plus FPI derivatives); Archive.aspx returns every day of a chosen month.
import { get, loadTable, saveTable, log, sleep, todayIST } from "./lib.mjs";

const BASE = "https://www.fpi.nsdl.co.in/web/Reports/";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const COLS = ["date", "equity_exchange", "equity_total", "debt_total", "total", "usd_inr", "index_fut_net", "index_opt_net"];
const MON = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
const MONS = Object.keys(MON);
const amount = (s) => { const t = String(s).replace(/[,\s]/g, ""); const m = t.match(/^\((.*)\)$/); return m ? -Number(m[1]) : Number(t); };
const cells = (tr) => [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim());
const iso = (s) => { const m = s.match(/^(\d{2})-(\w{3})-(\d{4})$/); return m && MON[m[2]] ? `${m[3]}-${MON[m[2]]}-${m[1]}` : null; };

/** Every reporting day in an NSDL report page (one on Latest, a month on Archive). */
function parse(html) {
  const out = [];
  let row = null, cat = "", derivDate = null;
  const blank = (date) => ({ date, equity_exchange: null, equity_total: null, debt_total: 0, total: null, usd_inr: null, index_fut_net: null, index_opt_net: null });
  for (const c of html.split(/<tr/).map(cells).filter((x) => x.length)) {
    // A reporting day starts on the row that carries its date and the Equity category.
    const d = iso(c[0] ?? "");
    if (d && c[1] === "Equity") { row = blank(d); out.push(row); }
    const rate = c.find((x) => /^Rs\.\s*\d/.test(x));
    if (rate && row) row.usd_inr = Number(rate.match(/\d+(\.\d+)?$/)[0]);
    const catCell = c.find((x) => /^(Equity|Debt.*|Hybrid|Mutual Funds|AIFs)$/.test(x));
    if (catCell) cat = catCell;
    const label = c.findIndex((x) => ["Stock Exchange", "Primary market & others", "Sub-total"].includes(x));
    // "Total" closes the day; rows after it (monthly summaries, other tables) never touch that day.
    if (row && c[0] === "Total") { row.total = amount(c[3]); row = null; }
    else if (row && label >= 0) {
      const net = amount(c[label + 3]);
      if (cat === "Equity" && c[label] === "Stock Exchange") row.equity_exchange = net;
      if (cat === "Equity" && c[label] === "Sub-total") row.equity_total = net;
      if (cat.startsWith("Debt") && c[label] === "Sub-total") row.debt_total = +(row.debt_total + net).toFixed(2);
    }
    // Derivatives table (Latest only): buy and sell amounts in ₹ crore; net = buy − sell.
    const k = c.findIndex((x) => x === "Index Futures" || x === "Index Options");
    if (k >= 0 && c.length >= k + 5) {
      if (iso(c[0] ?? "")) derivDate = iso(c[0]);
      const target = out.find((r) => r.date === derivDate);
      const key = c[k] === "Index Futures" ? "index_fut_net" : "index_opt_net";
      // First figure wins: month summaries later in the page repeat these product names.
      if (target && target[key] == null) target[key] = +(amount(c[k + 2]) - amount(c[k + 4])).toFixed(2);
    }
  }
  return out.filter((r) => r.equity_total != null && r.total != null);
}

async function save(rows) {
  const all = await loadTable("fpi.csv");
  // A newer fetch of the same day replaces the older one, but derivative figures from Latest are kept.
  const prev = new Map(all.map((r) => [r.date, r]));
  for (const r of rows) {
    const p = prev.get(r.date);
    if (p && r.index_fut_net == null) { r.index_fut_net = p.index_fut_net; r.index_opt_net = p.index_opt_net; }
  }
  return saveTable("fpi.csv", COLS, [...all, ...rows], (r) => r.date);
}

export async function importFpi() {
  const rows = parse((await get(BASE + "Latest.aspx")).toString("utf8"));
  if (!rows.length) throw new Error("fpi: no reporting day found on Latest; NSDL may have changed the page");
  const n = await save(rows);
  log(`fpi: latest ${rows[0].date} equity ₹${rows[0].equity_total} cr; ${n} days stored`);
}

/** Backfill whole months from NSDL's archive form (an ASP.NET postback: the page's state fields go back with the date). */
export async function importFpiArchive(fromMonth) {
  const stored = await loadTable("fpi.csv");
  const have = new Set(stored.filter((r) => Number(r.date.slice(8)) >= 25).map((r) => r.date.slice(0, 7)));
  const months = [];
  for (let [y, m] = fromMonth.split("-").map(Number); `${y}-${String(m).padStart(2, "0")}` <= todayIST().slice(0, 7); m === 12 ? (y++, m = 1) : m++) {
    const ym = `${y}-${String(m).padStart(2, "0")}`;
    // A month counts as stored once it has its last trading days; the current month is always refreshed.
    if (!have.has(ym) || ym >= todayIST().slice(0, 7)) months.push(ym);
  }
  log(`fpi archive: ${months.length} months to fetch`);
  const page = await fetch(BASE + "Archive.aspx", { headers: { "user-agent": UA } });
  const cookie = page.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  const html = await page.text();
  const field = (n) => html.match(new RegExp(`name="${n}" id="${n}" value="([^"]*)"`))?.[1] ?? "";
  let added = 0;
  for (const ym of months) {
    // The archive returns the month's days up to the date asked for, so ask for the month's last day.
    const last = new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5)), 0)).getUTCDate();
    const day = ym === todayIST().slice(0, 7) ? Number(todayIST().slice(8)) : last;
    const date = `${String(day).padStart(2, "0")}-${MONS[Number(ym.slice(5)) - 1]}-${ym.slice(0, 4)}`;
    const body = new URLSearchParams({ __EVENTTARGET: "btnSubmit1", __EVENTARGUMENT: "", __VIEWSTATE: field("__VIEWSTATE"),
      __VIEWSTATEGENERATOR: field("__VIEWSTATEGENERATOR"), __EVENTVALIDATION: field("__EVENTVALIDATION"), txtDate: date, hdnDate: date, hdnFlag: "", HdnValexceldata: "" });
    const res = await fetch(BASE + "Archive.aspx", { method: "POST", body, headers: { "user-agent": UA, cookie, referer: BASE + "Archive.aspx", "content-type": "application/x-www-form-urlencoded" }, signal: AbortSignal.timeout(60000) });
    const rows = parse(await res.text()).filter((r) => r.date.startsWith(ym));
    if (!rows.length) log(`fpi archive: no days returned for ${ym}`);
    added += rows.length;
    await save(rows);
    await sleep(800);
  }
  log(`fpi archive: +${added} days`);
}
