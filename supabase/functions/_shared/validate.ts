// Validator for one day's Brief record (the shape in data/types.ts). Pure and import-free so the same file runs under
// Deno (the intake Edge Function) and Node (tests: `npm run test:backend`).
//
// A record with any ERROR is held and never shown. WARNINGS are stored with the record and shown to the owner only.
// It enforces what code can enforce of AGENTS.md: structure, source tags that exist, tones, dates, number ranges,
// cross-references the app relies on, and no advice/tip language. It cannot tell a misread digit from a right one.

export interface Issue { path: string; message: string }
export interface Report {
  ok: boolean;
  errors: Issue[];
  warnings: Issue[];
  stats: { sources: number; web: number; tagsChecked: number; strings: number };
}

const TONES = ["gain", "loss", "mixed", "info", "plain"];
const HOLDING_IDS = ["index", "fin", "mid", "flexi", "elss", "it", "gold", "silver", "debt", "oil", "consumer", "realty"];
const DATASET_TAGS = ["D1", "D2", "D3", "D4", "D5"];
export const MAX_BYTES = 1_500_000;

const REQUIRED_STRINGS = ["date", "dateLabel", "dateShort", "prepared", "briefDate", "session", "sessionDate", "macroView", "erDeadline", "erTodayMore"];
const REQUIRED_ARRAYS = [
  "lede", "pressure", "takeaways", "drove", "next", "holdings", "defaultHold", "defaultWatch", "monthly", "india", "secIndia",
  "secIndiaNa", "secUS", "themesIn", "rotation", "trend", "secan", "movers", "mcx", "fx", "fxDrivers", "ahIn", "conflicts",
  "global", "macro", "usan", "usah", "nvidia", "ppi", "indicators", "releases", "events", "erToday", "erTom", "erUS", "erDone",
  "erLessons", "stories", "sources", "web", "method",
];
const REQUIRED_OBJECTS = ["kpis", "stocks", "aliases", "flows", "cpi", "gloss"];
const OPTIONAL_KEYS = ["hours"];

// Advice, tip and call language (AGENTS.md rule 1). Ordinary news words such as "sell-off" or "RBI target" are fine.
const BANNED: RegExp[] = [
  /\badvis(?:or|ors|ory)\b/i, /\btips?\b/i, /\bcalls\b/i, /\brecommend(?:s|ed|ing|ation|ations)?\b/i, /\bshould\b/i,
  /\bprice targets?\b/i, /\b(?:you|investors?|readers?) (?:must|need to|have to) (?:buy|sell|hold)\b/i,
  /\b(?:buy|sell) (?:now|today|immediately)\b/i, /\bguaranteed returns?\b/i,
];
// Phrases that may appear although they contain a banned word.
const ALLOW = ["not investment advice", "not a forecast and not advice"];

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isIso = (v: unknown): v is string => {
  if (!isStr(v) || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};
const dayDiff = (a: string, b: string) => Math.round((Date.parse(a + "T00:00:00Z") - Date.parse(b + "T00:00:00Z")) / 86400000);

export function validateBrief(input: unknown): Report {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const err = (path: string, message: string) => errors.push({ path, message });
  const warn = (path: string, message: string) => warnings.push({ path, message });
  const stats = { sources: 0, web: 0, tagsChecked: 0, strings: 0 };
  const uniq = (list: Issue[]) => { const seen = new Set<string>(); return list.filter((i) => { const k = i.path + "|" + i.message; if (seen.has(k)) return false; seen.add(k); return true; }); };
  const done = (): Report => { const e = uniq(errors); return { ok: e.length === 0, errors: e, warnings: uniq(warnings), stats }; };

  if (!isObj(input)) { err("", "The record must be a JSON object."); return done(); }
  const b = input;

  // ---- size and top-level shape -------------------------------------------------------------------------------------
  const bytes = new TextEncoder().encode(JSON.stringify(b)).length;
  if (bytes > MAX_BYTES) err("", `Record is ${bytes} bytes; the limit is ${MAX_BYTES}.`);
  for (const k of REQUIRED_STRINGS) if (!isStr(b[k]) || (b[k] as string).trim() === "") err(k, "Required text is missing or empty.");
  for (const k of REQUIRED_ARRAYS) if (!Array.isArray(b[k])) err(k, "Required list is missing.");
  for (const k of REQUIRED_OBJECTS) if (!isObj(b[k])) err(k, "Required object is missing.");
  for (const k of Object.keys(b)) {
    if (![...REQUIRED_STRINGS, ...REQUIRED_ARRAYS, ...REQUIRED_OBJECTS, ...OPTIONAL_KEYS].includes(k)) warn(k, "Unknown field; the app ignores it.");
  }
  if (errors.length) return done(); // later checks assume the shape above
  const arr = (k: string) => b[k] as unknown[];
  const obj = (k: string) => b[k] as Record<string, unknown>;

  // ---- dates --------------------------------------------------------------------------------------------------------
  for (const k of ["date", "briefDate", "sessionDate"]) if (!isIso(b[k])) err(k, "Must be a real ISO date (YYYY-MM-DD).");
  if (isIso(b.date) && isIso(b.briefDate) && b.date !== b.briefDate) err("date", "date must equal briefDate (the record is stored under this day).");
  if (isIso(b.briefDate) && isIso(b.sessionDate)) {
    const gap = dayDiff(b.briefDate, b.sessionDate);
    if (gap < 0) err("sessionDate", "The described session cannot be after the brief date.");
    else if (gap > 5) warn("sessionDate", `The session described is ${gap} days before the brief; check it is not stale.`);
  }
  if (b.hours !== undefined && !(isObj(b.hours) && isStr(b.hours.open) && isStr(b.hours.close))) err("hours", "hours must be { open, close } as text.");

  // ---- source tags --------------------------------------------------------------------------------------------------
  const valid = new Set<string>(DATASET_TAGS);
  const sources = arr("sources");
  stats.sources = sources.length;
  sources.forEach((s, i) => {
    if (!(Array.isArray(s) && isStr(s[0]) && isStr(s[1]) && /^https?:\/\//.test(s[1]))) err(`sources[${i}]`, "Must be [title, http(s) URL].");
    valid.add("S" + (i + 1));
  });
  const web = arr("web");
  stats.web = web.length;
  const webIds = new Set<string>();
  web.forEach((w, i) => {
    if (!(Array.isArray(w) && isStr(w[0]) && /^W\d+$/.test(w[0]) && isStr(w[1]) && isStr(w[2]) && /^https?:\/\//.test(w[2]))) {
      err(`web[${i}]`, "Must be [W#, title, http(s) URL].");
    } else if (webIds.has(w[0])) err(`web[${i}]`, `Duplicate source id ${w[0]}.`);
    else { webIds.add(w[0]); valid.add(w[0]); }
  });
  if (sources.length === 0) err("sources", "A brief needs its source list.");

  const checkTags = (tags: unknown, path: string, required: boolean) => {
    if (!Array.isArray(tags) || !tags.every(isStr)) { err(path, "Source tags must be a list of text."); return; }
    if (required && tags.length === 0) err(path, "This figure needs at least one source tag.");
    for (const t of tags as string[]) { stats.tagsChecked++; if (!valid.has(t)) err(path, `Unknown source tag "${t}".`); }
  };

  // Sources the data must carry (a figure with no source is not allowed).
  Object.entries(obj("kpis")).forEach(([k, v]) => { if (isObj(v)) checkTags(v.src, `kpis.${k}.src`, true); else err(`kpis.${k}`, "Must be an object."); });
  for (const k of ["gift", "fii", "usdinr"]) if (!isObj(obj("kpis")[k])) err(`kpis.${k}`, "Required headline figure is missing.");
  checkTags(obj("flows").src, "flows.src", true);
  arr("takeaways").forEach((t, i) => isObj(t) ? checkTags(t.src, `takeaways[${i}].src`, true) : err(`takeaways[${i}]`, "Must be an object."));
  arr("holdings").forEach((h, i) => isObj(h) ? checkTags(h.src, `holdings[${i}].src`, true) : err(`holdings[${i}]`, "Must be an object."));
  arr("releases").forEach((r, i) => isObj(r) ? checkTags(r.src, `releases[${i}].src`, true) : err(`releases[${i}]`, "Must be an object."));
  arr("stories").forEach((s, i) => isObj(s) ? checkTags(s.src, `stories[${i}].src`, true) : err(`stories[${i}]`, "Must be an object."));
  arr("indicators").forEach((r, i) => {
    const t = Array.isArray(r) ? r[8] : undefined;
    // An indicator the sources do not give is shown as n/a and carries no tag (n/a, never estimated).
    const isNa = Array.isArray(r) && isStr(r[2]) && r[2].trim().toLowerCase() === "n/a";
    if (isStr(t) && !t.trim() && isNa) return;
    if (!isStr(t) || !t.trim()) { err(`indicators[${i}][8]`, "Each indicator needs its source tag (or n/a as its latest value)."); return; }
    for (const x of t.split(/[\s,/;]+/).filter(Boolean)) { stats.tagsChecked++; if (!valid.has(x)) err(`indicators[${i}][8]`, `Unknown source tag "${x}".`); }
  });

  // ---- tones, rich text, cross-references (one walk over the record) -----------------------------------------------
  const gloss = obj("gloss");
  const strings: Array<[string, string]> = [];
  const walk = (v: unknown, path: string) => {
    if (isStr(v)) { strings.push([path, v]); return; }
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${path}[${i}]`)); return; }
    if (!isObj(v)) return;
    for (const [k, x] of Object.entries(v)) {
      if (k === "src" && Array.isArray(x)) { checkTags(x, `${path}.src`, false); continue; } // any src list, wherever it sits
      if (k === "term" && isStr(x) && !(x in gloss)) err(`${path}.term`, `Glossary term "${x}" is not in gloss.`);
      walk(x, path ? `${path}.${k}` : k);
    }
  };
  // The data's own source tables are not copy: scan everything else.
  for (const k of Object.keys(b)) if (k !== "sources" && k !== "web") walk(b[k], k);
  stats.strings = strings.length;

  const toneAt = (list: string, idx: number) => arr(list).forEach((r, i) => {
    if (!Array.isArray(r) || !TONES.includes(r[idx] as string)) err(`${list}[${i}][${idx}]`, `Tone must be one of ${TONES.join(", ")}.`);
  });
  toneAt("india", 3); toneAt("trend", 4); toneAt("movers", 2); toneAt("usah", 2); toneAt("erDone", 4); toneAt("indicators", 7);
  Object.entries(obj("stocks")).forEach(([k, r]) => { if (!Array.isArray(r) || !TONES.includes(r[1] as string)) err(`stocks.${k}[1]`, "Tone must be a valid tone."); });
  for (const list of ["next", "events"]) arr(list).forEach((c, i) => {
    if (!isObj(c)) { err(`${list}[${i}]`, "Must be an object."); return; }
    if (!isStr(c.w) || !isStr(c.t)) err(`${list}[${i}]`, "A calendar row needs w (when) and t (title).");
    for (const k of ["date", "end"]) if (c[k] !== undefined && !isIso(c[k])) err(`${list}[${i}].${k}`, "Must be an ISO date.");
    if (Array.isArray(c.chip) && !TONES.includes(c.chip[1] as string)) err(`${list}[${i}].chip`, "Invalid chip tone.");
    if (c.affects !== undefined) {
      if (!Array.isArray(c.affects) || !c.affects.every((h) => HOLDING_IDS.includes(h as string))) err(`${list}[${i}].affects`, `affects must be holding ids: ${HOLDING_IDS.join(", ")}.`);
    }
  });
  arr("takeaways").forEach((t, i) => { if (isObj(t) && !(Array.isArray(t.chip) && TONES.includes(t.chip[1] as string))) err(`takeaways[${i}].chip`, "Needs [label, tone]."); });

  // pressure: seven macro levels, each 0, 1 or 2
  const pressure = arr("pressure");
  if (pressure.length !== 7) warn("pressure", `Expected seven macro-pressure indicators, found ${pressure.length}.`);
  pressure.forEach((p, i) => {
    if (!(isObj(p) && isStr(p.k) && isStr(p.v) && isStr(p.why) && [0, 1, 2].includes(p.lv as number))) err(`pressure[${i}]`, "Needs k, v, why (text) and lv of 0, 1 or 2.");
  });

  // holdings and defaults the app reads by id
  const holdingIds = new Set(arr("holdings").map((h) => (isObj(h) ? h.id : undefined)));
  for (const id of HOLDING_IDS) if (!holdingIds.has(id)) err("holdings", `Holding type "${id}" is missing.`);
  arr("defaultHold").forEach((id, i) => { if (!holdingIds.has(id)) err(`defaultHold[${i}]`, `"${id}" is not a holding id.`); });
  const stocks = obj("stocks");
  arr("defaultWatch").forEach((n, i) => { if (!isStr(n) || !(n in stocks)) warn(`defaultWatch[${i}]`, `"${n}" has no entry in stocks.`); });
  // Aliases are fixed (template) while stocks vary by day, so a name with no entry today is a warning, not an error.
  Object.entries(obj("aliases")).forEach(([k, v]) => { if (!isStr(v)) err(`aliases.${k}`, "Alias must point to a stock name."); else if (!(v in stocks)) warn(`aliases.${k}`, `Alias points to "${v}", which has no entry in stocks today.`); });

  // glossary entries: [term, definition, today, short]
  Object.entries(gloss).forEach(([k, g]) => {
    if (!(Array.isArray(g) && g.length === 4 && g.every(isStr))) { err(`gloss.${k}`, "Must be [term, definition, today, short]."); return; }
    const words = (g[3] as string).trim().split(/\s+/).length;
    if (words > 40) warn(`gloss.${k}[3]`, `Short definition is ${words} words; keep it under about 35.`);
  });

  // ---- numbers ------------------------------------------------------------------------------------------------------
  const flows = obj("flows");
  for (const part of ["day", "mtd"]) {
    const f = flows[part];
    if (!isObj(f) || !isStr(f.label) || !isNum(f.fii) || !isNum(f.dii)) { err(`flows.${part}`, "Needs label, fii and dii as numbers (₹ crore)."); continue; }
    const cap = part === "day" ? 40000 : 250000;
    for (const k of ["fii", "dii"]) if (Math.abs(f[k] as number) > cap) warn(`flows.${part}.${k}`, `${f[k]} crore is unusually large; check units.`);
  }
  arr("monthly").forEach((m, i) => {
    if (!(isObj(m) && isStr(m.m) && isNum(m.fii) && (m.dii === null || isNum(m.dii)))) err(`monthly[${i}]`, "Needs m (text), fii (number) and dii (number or null).");
  });
  const cpi = obj("cpi");
  for (const k of ["sep", "oct", "food", "forecast"]) {
    if (!isNum(cpi[k])) err(`cpi.${k}`, "Must be a number (%).");
    else if (Math.abs(cpi[k] as number) > 30) warn(`cpi.${k}`, `${cpi[k]}% is unusually large for inflation; check units.`);
  }
  arr("releases").forEach((r, i) => {
    if (!isObj(r)) return;
    for (const k of ["latest", "forecast", "prior"]) if (r[k] !== null && !isNum(r[k])) err(`releases[${i}].${k}`, "Must be a number or null (n/a).");
    if (!isStr(r.n) || !isStr(r.region) || !isStr(r.priorLabel)) err(`releases[${i}]`, "Needs n, region and priorLabel.");
    if (!TONES.includes(r.tone as string)) err(`releases[${i}].tone`, "Invalid tone.");
  });
  for (const list of ["secIndia", "secUS"]) arr(list).forEach((s, i) => {
    if (!(Array.isArray(s) && isStr(s[0]) && (s[1] === null || isNum(s[1])) && (s[2] === undefined || isNum(s[2])))) err(`${list}[${i}]`, "Needs [label, number or null, optional second number].");
    else if (isNum(s[1]) && Math.abs(s[1]) > 25) warn(`${list}[${i}]`, `${s[1]}% in one day is unusually large; check units.`);
  });
  for (const k of ["india", "global", "mcx", "fx"]) if (arr(k).length === 0) warn(k, "Section is empty.");

  // ---- copy: no advice, tips or calls -------------------------------------------------------------------------------
  for (const [path, text] of strings) {
    let s = text;
    for (const a of ALLOW) s = s.split(a).join(" ".repeat(a.length));
    for (const re of BANNED) {
      const m = s.match(re);
      if (m) err(path, `Banned language "${m[0]}" (information and education only).`);
    }
  }

  return done();
}
