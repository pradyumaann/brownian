// One-off: derive supabase/functions/_shared/template.ts (the fixed parts of a Brief) from a hand-built brief.
// The template is edited by hand afterwards (a new glossary term, a new holding type); this records where it came from.
//   node scripts/make-template.mjs [data/2026-11-13.ts]
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const src = resolve(process.argv[2] ?? "data/2026-11-13.ts");
const { brief: b } = await import(pathToFileURL(src).href);

// Glossary lines that do not change day to day keep their "today" text; the rest are filled in by the daily record.
const STATIC_TODAY = new Set(["pcr", "trend", "turbulence", "fragility", "sentiment"]);
const gloss = {};
for (const [id, [term, definition, today, short]] of Object.entries(b.gloss)) {
  gloss[id] = STATIC_TODAY.has(id) ? { term, definition, short, today } : { term, definition, short };
}
const template = {
  holdingTypes: b.holdings.map((h) => ({ id: h.id, n: h.n })),
  gloss,
  aliases: b.aliases,
  defaultHold: b.defaultHold,
  defaultWatch: b.defaultWatch,
  method: b.method,
};
const out = `// The fixed parts of a Brief: the same every day, so the morning routine does not send them and cannot change them.
// The intake endpoint merges them into each day's record (see merge.ts). Generated once by scripts/make-template.mjs from
// ${process.argv[2] ?? "data/2026-11-13.ts"}, then edited by hand. A glossary entry without \`today\` takes its "Today:" line from the daily
// record's \`glossToday\`.

export interface GlossEntry { term: string; definition: string; short: string; today?: string }
export interface Template {
  holdingTypes: { id: string; n: string }[];
  gloss: Record<string, GlossEntry>;
  aliases: Record<string, string>;
  defaultHold: string[];
  defaultWatch: string[];
  method: string[];
}

export const TEMPLATE: Template = ${JSON.stringify(template, null, 2)};
`;
writeFileSync("supabase/functions/_shared/template.ts", out);
console.log("wrote template.ts:", Object.keys(gloss).length, "glossary entries,", template.holdingTypes.length, "holding types,", Object.keys(b.aliases).length, "aliases");
