// Server-only: reads the daily history store (data/history/*.csv) at build time. Never import from a client component.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = join(process.cwd(), "data", "history");

function table(name: string): Record<string, string>[] {
  let text = "";
  try { text = readFileSync(join(DIR, name), "utf8"); } catch { return []; }
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const cols = head.split(",");
  return lines.map((l) => { const v = l.split(","); return Object.fromEntries(cols.map((c, i) => [c, v[i] ?? ""])); });
}
function tableQuoted(name: string): Record<string, string>[] {
  let text = "";
  try { text = readFileSync(join(DIR, name), "utf8"); } catch { return []; }
  const split = (l: string) => { const out: string[] = []; let cur = "", q = false; for (let i = 0; i < l.length; i++) { const c = l[i]; if (q) { if (c === '"') { if (l[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; } else if (c === '"') q = true; else if (c === ",") { out.push(cur); cur = ""; } else cur += c; } out.push(cur); return out; };
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const cols = split(head);
  return lines.map((l) => { const v = split(l); return Object.fromEntries(cols.map((c, i) => [c, v[i] ?? ""])); });
}
const num = (s: string) => (s === "" || s == null ? null : Number(s));

/** A dated series: dates ascending, values aligned (null = no figure that day). */
export interface Series { dates: string[]; values: (number | null)[] }

let cache: ReturnType<typeof load> | null = null;
function load() {
  const tradingDays = table("calendar.csv").filter((r) => r.open === "1").map((r) => r.date).sort();
  const index = new Map<string, Map<string, number>>();
  for (const r of table("indices.csv")) {
    if (!index.has(r.index)) index.set(r.index, new Map());
    index.get(r.index)!.set(r.date, Number(r.close));
  }
  const world = new Map<string, Map<string, number>>();
  for (const r of table("world.csv")) {
    if (!world.has(r.series)) world.set(r.series, new Map());
    world.get(r.series)!.set(r.date, Number(r.close));
  }
  const breadth = new Map(table("breadth.csv").map((r) => [r.date, {
    advances: Number(r.advances), declines: Number(r.declines), highs52: num(r.highs52), lows52: num(r.lows52), illiq: num(r.illiq),
  }]));
  const options = new Map(table("options.csv").map((r) => [r.date, { putVol: Number(r.put_vol), callVol: Number(r.call_vol), putOi: Number(r.put_oi), callOi: Number(r.call_oi) }]));
  const fpi = new Map(table("fpi.csv").map((r) => [r.date, { equity: Number(r.equity_total), total: Number(r.total), indexFut: num(r.index_fut_net) }]));
  // FPI equity by sector and fortnight (NSDL). Sector names can contain commas, so this file is parsed with quotes.
  const sectorFlows = tableQuoted("sector_flows.csv").map((r) => ({ date: r.date, sector: r.sector, net: Number(r.equity_net), auc: num(r.equity_auc) }));
  return { tradingDays, index, world, breadth, options, fpi, sectorFlows };
}
export const history = () => (cache ??= load());

/** An NSE index on NSE trading days. */
export function indexSeries(id: string): Series {
  const h = history(), m = h.index.get(id) ?? new Map();
  return { dates: h.tradingDays, values: h.tradingDays.map((d) => m.get(d) ?? null) };
}

/** An overseas series aligned to NSE trading days: each day takes that market's last close on or before it. */
export function worldOnNseDays(id: string): Series {
  const h = history(), m = h.world.get(id) ?? new Map<string, number>();
  const days = [...m.keys()].sort();
  let j = -1;
  const values = h.tradingDays.map((d) => {
    while (j + 1 < days.length && days[j + 1] <= d) j++;
    return j >= 0 ? m.get(days[j])! : null;
  });
  return { dates: h.tradingDays, values };
}
