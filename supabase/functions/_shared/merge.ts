// Turns what the morning routine sends (the DAILY record) into a full Brief by adding the fixed parts from the template.
//
// Daily record = a Brief without: aliases, defaultHold, defaultWatch, method, gloss (all fixed), with
//   holdings   [{ id, d, h, w, t, src }]  (the type's name `n` comes from the template, in the template's order)
//   glossToday { <glossary id>: "Today: …" }  (the day's line for each glossary entry that carries one)
// Anything the template owns that is sent anyway is ignored with a warning, so the routine cannot change fixed text.
// A FULL record (as the 13 Nov brief) is also accepted: its fixed parts are replaced by the template's, and the "today"
// lines are read from its own `gloss` tuples when `glossToday` is absent.

import { TEMPLATE, type Template } from "./template.ts";

export interface Note { path: string; message: string }

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const FIXED_KEYS = ["aliases", "defaultHold", "defaultWatch", "method", "gloss"] as const;

export function mergeDaily(input: unknown, template: Template = TEMPLATE): { record: unknown; notes: Note[] } {
  if (!isObj(input)) return { record: input, notes: [] };
  const notes: Note[] = [];
  const rec: Record<string, unknown> = { ...input };

  // The day's "Today:" lines: from glossToday, else from a full record's gloss tuples.
  const today: Record<string, string> = {};
  if (isObj(input.glossToday)) {
    for (const [k, v] of Object.entries(input.glossToday)) if (typeof v === "string") today[k] = v;
  } else if (isObj(input.gloss)) {
    for (const [k, g] of Object.entries(input.gloss)) if (Array.isArray(g) && typeof g[2] === "string") today[k] = g[2];
  }
  for (const k of Object.keys(today)) {
    if (!(k in template.gloss)) notes.push({ path: `glossToday.${k}`, message: "Not a glossary entry in the template; ignored." });
  }

  for (const k of FIXED_KEYS) {
    if (k in input) notes.push({ path: k, message: "Comes from the template; the value sent was ignored." });
  }
  rec.aliases = clone(template.aliases);
  rec.defaultHold = clone(template.defaultHold);
  rec.defaultWatch = clone(template.defaultWatch);
  rec.method = clone(template.method);

  // Glossary: template text + the day's line (or the template's own line for the few that never change).
  const gloss: Record<string, [string, string, string, string]> = {};
  for (const [id, e] of Object.entries(template.gloss)) {
    const line = today[id] ?? e.today ?? "";
    if (today[id] === undefined && e.today === undefined) {
      notes.push({ path: `glossToday.${id}`, message: "No \"Today\" line sent for this glossary entry; it is shown without one." });
    }
    gloss[id] = [e.term, e.definition, line, e.short];
  }
  rec.gloss = gloss;
  delete rec.glossToday;

  // Holdings: the template decides which types exist, their names and their order; the day supplies the reading.
  if (Array.isArray(input.holdings)) {
    const byId = new Map<string, Record<string, unknown>>();
    input.holdings.forEach((h, i) => {
      if (isObj(h) && typeof h.id === "string") {
        if (template.holdingTypes.some((t) => t.id === h.id)) byId.set(h.id, h);
        else notes.push({ path: `holdings[${i}]`, message: `"${h.id}" is not a holding type in the template; ignored.` });
      }
    });
    rec.holdings = template.holdingTypes.flatMap((t) => {
      const h = byId.get(t.id);
      return h ? [{ id: t.id, n: t.n, d: h.d, h: h.h, w: h.w, t: h.t, src: h.src }] : [];
    });
  }

  return { record: rec, notes };
}
