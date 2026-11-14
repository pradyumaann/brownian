// Bring the history store up to date. Safe to run any time: each importer fetches only what is missing.
//   node scripts/history/update.mjs            all series
//   node scripts/history/update.mjs indices    one series (indices | breadth | options | world | fpi | sectors)
import { importIndices } from "./indices.mjs";
import { importBreadth } from "./breadth.mjs";
import { importOptions } from "./options.mjs";
import { importWorld } from "./world.mjs";
import { importFpi, importFpiArchive } from "./fpi.mjs";
import { importSectors } from "./sectors.mjs";
import { todayIST, addYears, log } from "./lib.mjs";

const today = todayIST();
// How far back each series goes. Breadth keeps one extra year so 52-week highs and lows are known from the start.
const SPAN = { indices: 5, breadth: 3, options: 2, fpi: 5 };
const JOBS = {
  indices: () => importIndices(addYears(today, -SPAN.indices), today),
  breadth: () => importBreadth(addYears(today, -SPAN.breadth), today),
  options: () => importOptions(addYears(today, -SPAN.options), today),
  world: () => importWorld("5y"),
  sectors: () => importSectors(addYears(today, -SPAN.fpi)),
  fpi: async () => { await importFpiArchive(addYears(today, -SPAN.fpi).slice(0, 7)); await importFpi(); },
};

const pick = process.argv.slice(2);
let failed = 0;
for (const [name, job] of Object.entries(JOBS)) {
  if (pick.length && !pick.includes(name)) continue;
  try { await job(); }
  catch (e) { failed++; log(`${name} FAILED: ${e.message}`); }
}
process.exitCode = failed ? 1 : 0;
