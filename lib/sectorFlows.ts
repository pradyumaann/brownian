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
  if (m.total > 0) left.push({ id: "NEW", label: "Net inflow", value: m.total, cat: "cat-2" });
  else if (m.total < 0) right.push({ id: "OUT", label: "Net outflow", value: -m.total });
  const sideTotal = left.reduce((s, x) => s + x.value, 0);
  const unit = [100, 200, 250, 500, 1000, 2000, 2500, 5000].find((u) => sideTotal / u <= 160) ?? 10000;
  return { ...m, left, right, unit };
}

/** Calendar quarter of an ISO date: "2025-Q3". */
const quarterOf = (d: string) => `${d.slice(0, 4)}-Q${Math.floor((Number(d.slice(5, 7)) - 1) / 3) + 1}`;
const Q_MONTHS = ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"];

/** Terrain by quarter: the sectors with the largest gross flows (sorted largest first) × the last eight whole
 *  calendar quarters plus the current one to date. A cell is the sum of that quarter's NSDL fortnights; a quarter
 *  with no fortnight reported for a sector stays null (n/a), never zero. Quarters missing a fortnight in the data
 *  are flagged so the label can say so. */
export function terrainQuarters(maxSectors = 12, whole = 8) {
  const ends = fortnights(), gross = new Map<string, number>();
  const qs = [...new Set(ends.map(quarterOf))];
  // The latest quarter is "to date" unless its last month's second fortnight is in.
  const lastEnd = ends.at(-1)!, lastQ = quarterOf(lastEnd), lastM = Number(lastEnd.slice(5, 7));
  const partial = !(lastM % 3 === 0 && Number(lastEnd.slice(8)) > 15);
  const keep = qs.slice(-(whole + (partial ? 1 : 0)));
  const inKeep = new Set(keep);
  const rs = rows().filter((r) => inKeep.has(quarterOf(r.date)));
  for (const r of rs) gross.set(r.sector, (gross.get(r.sector) ?? 0) + Math.abs(r.net));
  const top = [...gross.entries()].sort((a, b) => b[1] - a[1]).slice(0, maxSectors).map(([s]) => s);
  const cell = new Map<string, number>();
  for (const r of rs) { const k = quarterOf(r.date) + "|" + r.sector; cell.set(k, (cell.get(k) ?? 0) + r.net); }
  const fnIn = (q: string) => ends.filter((d) => quarterOf(d) === q).length;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const quarters = keep.map((q) => {
    const [y, n] = [q.slice(0, 4), Number(q.slice(6))], toDate = q === lastQ && partial, f = fnIn(q);
    return {
      id: q,
      label: toDate
        ? `${Q_MONTHS[n - 1].slice(0, 3) === MONTHS[lastM - 1] ? MONTHS[lastM - 1] : `${Q_MONTHS[n - 1].slice(0, 3)}–${MONTHS[lastM - 1]}`} ${y}, to ${Number(lastEnd.slice(8))} ${MONTHS[lastM - 1]}`
        : `${Q_MONTHS[n - 1]} ${y}`,
      short: `Q${n} ${y.slice(2)}${toDate ? "*" : ""}`,
      toDate, fortnights: f, gap: !toDate && f < 6,
    };
  });
  const z = top.map((s) => keep.map((q) => cell.get(q + "|" + s) ?? null));
  return {
    sectors: top.map(short), quarters, z,
    lastEnd,
    totals: top.map((s, i) => ({ sector: short(s), net: z[i].reduce<number>((t, v) => t + (v ?? 0), 0), last: z[i].at(-1) ?? null })),
  };
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
