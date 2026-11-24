// Participant-wise open interest in equity derivatives (NSE clearing, one small CSV per trading day, published since 2012).
// Per day and participant (Client, DII, FII, Pro): index futures and index options positions in contracts.
// Raw files are cached in .cache/nse/participant_oi; days NSE does not publish (holidays) leave a .404 marker so they
// are not asked for again. A marker is only written for days older than RECENT_DAYS: a missing file for a recent day
// usually means NSE has not published it yet, and a marker would block every later run (the Actions cache keeps it).
import { join } from "node:path";
import { writeFile, mkdir } from "node:fs/promises";
import { get, parseCSV, loadTable, saveTable, pool, weekdays, num, log, exists, CACHE, todayIST, addDays } from "./lib.mjs";

const COLS = ["date", "participant", "fut_idx_long", "fut_idx_short", "opt_idx_call_long", "opt_idx_put_long", "opt_idx_call_short", "opt_idx_put_short"];
const DIR = join(CACHE, "nse", "participant_oi");
const url = (d) => `https://nsearchives.nseindia.com/content/nsccl/fao_participant_oi_${d.slice(8, 10)}${d.slice(5, 7)}${d.slice(0, 4)}.csv`;

const RECENT_DAYS = 4;

/** Rows for one day, or null when NSE has no file for it. */
async function day(d) {
  const cache = join(DIR, d.replaceAll("-", "") + ".csv"), miss = cache.replace(/\.csv$/, ".404");
  const recent = d > addDays(todayIST(), -RECENT_DAYS);
  // Markers on recent days are ignored (and so heal a stale cache); older ones are trusted.
  if (!recent && await exists(miss)) return null;
  const buf = await get(url(d), { cache });
  if (!buf) {
    if (!recent) { await mkdir(DIR, { recursive: true }); await writeFile(miss, ""); }
    return null;
  }
  // The first line is a title; the header row starts with "Client Type". Header names carry stray spaces in some years.
  const lines = buf.toString("utf8").split(/\r?\n/);
  const at = lines.findIndex((l) => l.startsWith("Client Type"));
  if (at < 0) return null;
  const rows = parseCSV(lines.slice(at).join("\n")).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), v])));
  const out = [];
  for (const r of rows) {
    const p = r["Client Type"];
    if (!["Client", "DII", "FII", "Pro"].includes(p)) continue;
    out.push({
      date: d, participant: p,
      fut_idx_long: num(r["Future Index Long"]), fut_idx_short: num(r["Future Index Short"]),
      opt_idx_call_long: num(r["Option Index Call Long"]), opt_idx_put_long: num(r["Option Index Put Long"]),
      opt_idx_call_short: num(r["Option Index Call Short"]), opt_idx_put_short: num(r["Option Index Put Short"]),
    });
  }
  return out.length === 4 && out.every((r) => r.fut_idx_long != null && r.fut_idx_short != null) ? out : null;
}

/** Fetch every weekday from `from` to `to` that is not stored yet. Two requests at a time, as the other NSE importers. */
export async function importParticipantOi(from, to) {
  const rows = await loadTable("participant_oi.csv");
  const have = new Set(rows.map((r) => r.date));
  // Known holidays have no file, so they are not requested again.
  const closed = new Set((await loadTable("calendar.csv")).filter((r) => r.open === "0").map((r) => r.date));
  const todo = weekdays(from, to).filter((d) => !have.has(d) && !closed.has(d));
  log(`participant OI: ${todo.length} weekdays to check (cached files and known holidays are reused)`);
  const got = (await pool(todo, 2, day)).filter(Boolean).flat();
  const n = await saveTable("participant_oi.csv", COLS, [...rows, ...got], (r) => `${r.date}|${r.participant}`);
  log(`participant OI: +${got.length / 4} days, ${n / 4} days stored`);
}
