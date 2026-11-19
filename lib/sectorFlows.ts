// FPI equity flows by sector (NSDL fortnightly), shaped for the Money Moves flow chart and the terrain. Server-side.
import { history } from "./history";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fortnightLabel = (d: string) => `${Number(d.slice(8)) <= 15 ? "1–15" : `16–${Number(d.slice(8))}`} ${MON[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
/** Shorter names for NSDL's sector labels, so they fit beside a chart on a phone. */
const SHORT: Record<string, string> = {
  "Automobile and Auto Components": "Autos", "Fast Moving Consumer Goods": "FMCG", "Information Technology": "IT",
  "Oil, Gas & Consumable Fuels": "Oil & gas", "Media, Entertainment & Publication": "Media", "Metals & Mining": "Metals",
  "Construction Materials": "Cement & materials", "Financial Services": "Financials", "Consumer Services": "Consumer services",
  "Consumer Durables": "Consumer durables", "Capital Goods": "Capital goods", "Telecommunication": "Telecom",
  "Forest Materials": "Forest materials",
};
export const short = (s: string) => SHORT[s] ?? s;

const rows = () => history().sectorFlows;
export const fortnights = () => [...new Set(rows().map((r) => r.date))].sort();

/** The latest whole month: net equity flow per sector (both fortnights summed). */
export function lastMonth() {
  const ends = fortnights(), last = ends.at(-1)!, ym = last.slice(0, 7);
  const by = new Map<string, number>();
  for (const r of rows()) if (r.date.startsWith(ym)) by.set(r.sector, (by.get(r.sector) ?? 0) + r.net);
  const list = [...by.entries()].map(([sector, net]) => ({ sector: short(sector), net })).sort((a, b) => b.net - a.net);
  return { label: `${MON[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`, list, total: list.reduce((s, x) => s + x.net, 0) };
}

/** Money Moves flow shape: every sector FPIs net sold (largest first) and every sector they net bought, each as a positive
 *  amount, plus the month's net. The chart groups the smaller sectors itself, to suit the width it is drawn at. */
export function strandShape() {
  const m = lastMonth();
  const sold = m.list.filter((x) => x.net < 0).map((x) => ({ label: x.sector, value: -x.net })).sort((a, b) => b.value - a.value);
  const bought = m.list.filter((x) => x.net > 0).map((x) => ({ label: x.sector, value: x.net })).sort((a, b) => b.value - a.value);
  return { ...m, sold, bought };
}

/** Terrain shape: the sectors with the largest gross flows, by fortnight. */
export function terrainShape(maxSectors = 12) {
  const ends = fortnights(), gross = new Map<string, number>();
  for (const r of rows()) gross.set(r.sector, (gross.get(r.sector) ?? 0) + Math.abs(r.net));
  const top = [...gross.entries()].sort((a, b) => b[1] - a[1]).slice(0, maxSectors).map(([s]) => s);
  const cell = new Map(rows().map((r) => [r.date + "|" + r.sector, r.net]));
  return {
    dates: ends, labels: ends.map(fortnightLabel), sectors: top.map(short),
    z: top.map((s) => ends.map((d) => cell.get(d + "|" + s) ?? null)),
    totals: top.map((s) => ({ sector: short(s), net: ends.reduce((t, d) => t + (cell.get(d + "|" + s) ?? 0), 0), last: cell.get(ends.at(-1) + "|" + s) ?? null })),
  };
}
