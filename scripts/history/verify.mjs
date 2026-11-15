// Gate 1 check for the history store: coverage, internal consistency, and agreement with an independent source.
//   node scripts/history/verify.mjs
// Nifty 50 closes from NSE's files are compared with Yahoo Finance's ^NSEI on every shared day, and 20 sampled
// days are printed side by side. Exits non-zero if more than 1% of shared days differ by over 0.05%.
import { loadTable, log } from "./lib.mjs";
import { INDICES } from "./indices.mjs";

let problems = 0;
const fail = (m) => { problems++; log("FAIL " + m); };

const cal = await loadTable("calendar.csv");
const open = cal.filter((r) => r.open === "1").map((r) => r.date);
log(`calendar: ${open.length} trading days, ${cal.length - open.length} weekday holidays, ${open[0]} to ${open.at(-1)}`);

// Coverage: every tracked index on every trading day it existed.
const idx = await loadTable("indices.csv");
const byIndex = {};
for (const r of idx) (byIndex[r.index] ??= new Map()).set(r.date, r);
for (const id of Object.values(INDICES)) {
  const m = byIndex[id];
  if (!m) { fail(`indices: ${id} has no rows`); continue; }
  const first = [...m.keys()].sort()[0];
  const gaps = open.filter((d) => d >= first && !m.has(d));
  const bad = [...m.values()].filter((r) => !(Number(r.close) > 0)).length;
  if (gaps.length || bad) fail(`indices: ${id} missing ${gaps.length} days (${gaps.slice(0, 3).join(", ")}), ${bad} rows without a close`);
}
log(`indices: ${Object.keys(byIndex).length} indices, ${idx.length} rows`);

// Independent source: Yahoo's ^NSEI against NSE's own Nifty 50 file.
const world = await loadTable("world.csv");
const yahoo = new Map(world.filter((r) => r.series === "nifty50_yahoo").map((r) => [r.date, Number(r.close)]));
const shared = [...byIndex.nifty50.values()].filter((r) => yahoo.has(r.date));
const diffs = shared.map((r) => ({ date: r.date, nse: Number(r.close), yahoo: yahoo.get(r.date), pct: Math.abs(yahoo.get(r.date) / Number(r.close) - 1) * 100 }));
const off = diffs.filter((d) => d.pct > 0.05);
log(`nifty50 vs Yahoo ^NSEI: ${shared.length} shared days, ${off.length} differ by more than 0.05%`);
off.sort((a, b) => b.pct - a.pct).slice(0, 5).forEach((d) => log(`   ${d.date}  NSE ${d.nse}  Yahoo ${d.yahoo}  (${d.pct.toFixed(3)}%)`));
if (off.length > shared.length * 0.01) fail("nifty50: too many days disagree with Yahoo");

// 20 sampled days, spread evenly across the history, side by side.
const step = Math.max(1, Math.floor(diffs.length / 20));
log("sample: date, NSE close, Yahoo close");
diffs.filter((_, i) => i % step === 0).slice(0, 20).forEach((d) => log(`   ${d.date}  ${d.nse.toFixed(2)}  ${d.yahoo.toFixed(2)}  ${d.pct < 0.05 ? "match" : "DIFFERS"}`));

// The 13 Nov 2026 brief quotes Nifty's 12 Nov close as 25,299.35 and India VIX as 16.61.
const n12 = byIndex.nifty50.get("2026-11-12"), v12 = byIndex.indiavix?.get("2026-11-12");
if (n12) log(`brief check: Nifty 50 on 12 Nov 2026 = ${n12.close} (brief: 25299.35)${Number(n12.close) === 25299.35 ? " match" : ""}`);
if (v12) log(`brief check: India VIX on 12 Nov 2026 = ${v12.close} (brief: 16.61)${Number(v12.close) === 16.61 ? " match" : ""}`);

// Breadth: counts must add up, and one row per trading day.
const br = await loadTable("breadth.csv");
if (br.length) {
  const sum = br.filter((r) => +r.advances + +r.declines + +r.unchanged !== +r.stocks).length;
  if (sum) fail(`breadth: ${sum} days where advances + declines + unchanged ≠ stocks`);
  const brDays = new Set(br.map((r) => r.date));
  const gaps = open.filter((d) => d >= br[0].date && !brDays.has(d));
  if (gaps.length) fail(`breadth: missing ${gaps.length} trading days (${gaps.slice(0, 3).join(", ")})`);
  log(`breadth: ${br.length} days, ${br.filter((r) => r.highs52 !== "").length} with 52-week counts, from ${br[0].date}`);
}
const op = await loadTable("options.csv");
if (op.length) log(`options: ${op.length} days from ${op[0].date}; put/call volume ratio on the last day ${(op.at(-1).put_vol / op.at(-1).call_vol).toFixed(2)}`);

// Participant OI: four participants a day, and every futures contract has a buyer and a seller, so index-futures
// longs and shorts must balance across Client, DII, FII and Pro (NSE's own file is off by one contract on three
// days in 2018, so a gap of up to 10 contracts passes). No trading day after the first may be missing.
const po = await loadTable("participant_oi.csv");
if (po.length) {
  const byDay = new Map();
  for (const r of po) (byDay.get(r.date) ?? byDay.set(r.date, []).get(r.date)).push(r);
  const short4 = [...byDay].filter(([, rs]) => rs.length !== 4).length;
  if (short4) fail(`participant OI: ${short4} days without exactly four participants`);
  const unbalanced = [...byDay].filter(([, rs]) => Math.abs(rs.reduce((s, r) => s + +r.fut_idx_long - +r.fut_idx_short, 0)) > 10).length;
  if (unbalanced) fail(`participant OI: ${unbalanced} days where index-futures longs and shorts differ by more than 10 contracts`);
  const first = [...byDay.keys()].sort()[0];
  const gaps = open.filter((d) => d >= first && !byDay.has(d));
  if (gaps.length) fail(`participant OI: missing ${gaps.length} trading days (${gaps.slice(0, 3).join(", ")})`);
  const last = byDay.get([...byDay.keys()].sort().at(-1)).find((r) => r.participant === "FII");
  log(`participant OI: ${byDay.size} days from ${first}; FII index-futures long share on the last day ${(last.fut_idx_long / (+last.fut_idx_long + +last.fut_idx_short) * 100).toFixed(1)}%`);
}

// FPI flows: NSDL reporting days. A single day beyond ±₹30,000 cr of equity has never happened; it means a parse error.
const fpi = await loadTable("fpi.csv");
if (fpi.length) {
  const wild = fpi.filter((r) => Math.abs(+r.equity_total) > 30000 || Math.abs(+r.index_fut_net || 0) > 20000);
  if (wild.length) fail(`fpi: ${wild.length} implausible days (${wild.slice(0, 3).map((r) => r.date).join(", ")})`);
  const perMonth = {};
  for (const r of fpi) perMonth[r.date.slice(0, 7)] = (perMonth[r.date.slice(0, 7)] ?? 0) + 1;
  const thin = Object.entries(perMonth).filter(([m, n]) => n < 15 && m < open.at(-1).slice(0, 7));
  if (thin.length) fail(`fpi: months with fewer than 15 reporting days: ${thin.map(([m, n]) => `${m} (${n})`).join(", ")}`);
  const nov = fpi.filter((r) => r.date.startsWith("2026-11") && r.date <= "2026-11-12").reduce((s, r) => s + +r.equity_total, 0);
  log(`fpi: ${fpi.length} days from ${fpi[0].date}; Nov 2026 equity to 12 Nov = ₹${Math.round(nov)} cr (brief, NSE provisional basis: ₹73,566 cr)`);
}

log(problems ? `${problems} problem(s) found` : "gate 1: all checks passed");
process.exitCode = problems ? 1 : 0;
