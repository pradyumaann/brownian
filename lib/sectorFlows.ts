// FPI equity flows by sector (NSDL fortnightly), shaped for the strand flow and the terrain. Server-side.
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

/** Strand-flow shape: sectors FPIs sold (left) → FPI equity → sectors they bought (right), plus the net new money
 *  (or net withdrawal) that balances the two sides. The largest six on each side are named; the rest are grouped. */
export function strandShape() {
  const m = lastMonth(), TOP = 6;
  const sold = m.list.filter((x) => x.net < 0).sort((a, b) => a.net - b.net), bought = m.list.filter((x) => x.net > 0);
  // Name a sector only if it is among the six largest on its side and carries at least 4% of the month's gross flow,
  // so labels never crowd; the rest are grouped.
  const gross = m.list.reduce((s, x) => s + Math.abs(x.net), 0);
  const group = (xs: typeof sold) => {
    const named = xs.filter((x, i) => i < TOP && Math.abs(x.net) >= gross * 0.04), rest = xs.slice(named.length);
    return rest.length ? [...named, { sector: rest.length === 1 ? rest[0].sector : `${rest.length} other sectors`, net: rest.reduce((s, x) => s + x.net, 0) }] : named;
  };
  const left = group(sold).map((x, i) => ({ id: "L" + i, label: x.sector, value: -x.net, cat: "cat-3" }));
  const right = group(bought).map((x, i) => ({ id: "R" + i, label: x.sector, value: x.net }));
  if (m.total > 0) left.push({ id: "NEW", label: "New money from abroad", value: m.total, cat: "cat-2" });
  else if (m.total < 0) right.push({ id: "OUT", label: "Taken out of India", value: -m.total });
  const sideTotal = left.reduce((s, x) => s + x.value, 0);
  const unit = [100, 200, 250, 500, 1000, 2000, 2500, 5000].find((u) => sideTotal / u <= 160) ?? 10000;
  return { ...m, left, right, unit };
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
