// node --test supabase/functions/_shared/merge.test.ts   (npm run test:backend)
import { test } from "node:test";
import assert from "node:assert/strict";
import { brief } from "../../../data/2026-11-13.ts";
import { mergeDaily } from "./merge.ts";
import { TEMPLATE } from "./template.ts";
import { validateBrief } from "./validate.ts";
import { handleIntake } from "./intake.ts";

const full = () => structuredClone(brief) as unknown as Record<string, any>;

/** What the morning routine would send: the full brief minus the fixed parts, plus glossToday. */
function daily() {
  const d = full();
  d.glossToday = Object.fromEntries(Object.entries(d.gloss).map(([k, g]: [string, any]) => [k, g[2]]));
  d.holdings = d.holdings.map(({ n: _n, ...rest }: any) => rest);
  for (const k of ["aliases", "defaultHold", "defaultWatch", "method", "gloss"]) delete d[k];
  return d;
}

test("round trip: the real brief, split into a daily record and merged, comes back identical", () => {
  const { record } = mergeDaily(daily());
  assert.deepEqual(record, JSON.parse(JSON.stringify(brief)));
});

test("a full record is accepted too: fixed parts are replaced by the template's, nothing else changes", () => {
  const { record, notes } = mergeDaily(full());
  assert.deepEqual(record, JSON.parse(JSON.stringify(brief)));
  assert.deepEqual(notes.map((n) => n.path).sort(), ["aliases", "defaultHold", "defaultWatch", "gloss", "method"]);
});

test("the daily record is much smaller than the full one", () => {
  const d = JSON.stringify(daily()).length, f = JSON.stringify(brief).length;
  assert.ok(d < f * 0.85, `daily ${d} vs full ${f}`);
});

test("the merged daily record passes the validator", () => {
  const { record, notes } = mergeDaily(daily());
  const r = validateBrief(record);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(notes, []);
});

test("fixed parts the routine sends anyway are ignored, with a warning", () => {
  const d = daily();
  d.method = ["Buy everything"];
  d.defaultHold = ["gold"];
  const { record, notes } = mergeDaily(d) as { record: any; notes: any[] };
  assert.deepEqual(record.method, TEMPLATE.method);
  assert.deepEqual(record.defaultHold, TEMPLATE.defaultHold);
  assert.ok(notes.some((n) => n.path === "method") && notes.some((n) => n.path === "defaultHold"));
});

test("the template decides holding names and order; the day supplies the reading", () => {
  const d = daily();
  d.holdings.reverse();
  d.holdings[0].n = "Renamed by the routine";
  const { record } = mergeDaily(d) as { record: any };
  assert.deepEqual(record.holdings.map((h: any) => h.id), TEMPLATE.holdingTypes.map((t) => t.id));
  assert.equal(record.holdings[0].n, TEMPLATE.holdingTypes[0].n);
  assert.equal(record.holdings[0].h, brief.holdings[0].h);
});

test("a missing or unknown holding type is not invented; the validator holds the day", () => {
  const d = daily();
  d.holdings = d.holdings.filter((h: any) => h.id !== "gold");
  d.holdings.push({ id: "crypto", d: "up", h: "x", w: "y", t: "z", src: ["S1"] });
  const { record, notes } = mergeDaily(d);
  assert.ok(notes.some((n) => /crypto/.test(n.message)));
  const r = validateBrief(record);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.path === "holdings" && /gold/.test(e.message)));
});

test("a missing 'Today' line is a warning for a daily entry, and silent for a fixed one", () => {
  const d = daily();
  delete d.glossToday.vix;
  delete d.glossToday.sentiment;
  const { record, notes } = mergeDaily(d) as { record: any; notes: any[] };
  assert.equal(record.gloss.vix[2], "");
  assert.equal(record.gloss.sentiment[2], TEMPLATE.gloss.sentiment.today);
  assert.ok(notes.some((n) => n.path === "glossToday.vix"));
  assert.ok(!notes.some((n) => n.path === "glossToday.sentiment"));
});

test("a 'Today' line for an unknown glossary id is ignored with a warning", () => {
  const d = daily();
  d.glossToday.nonesuch = "Today: x";
  const { record, notes } = mergeDaily(d) as { record: any; notes: any[] };
  assert.ok(!("nonesuch" in record.gloss));
  assert.ok(notes.some((n) => n.path === "glossToday.nonesuch"));
});

test("a glossary term used in the text but missing from the template is rejected", () => {
  const d = daily();
  d.lede.push({ term: "brandnewterm", label: "x" });
  const r = validateBrief(mergeDaily(d).record);
  assert.ok(r.errors.some((e) => /brandnewterm/.test(e.message)));
});

test("not an object passes through for the validator to reject", () => {
  assert.equal(mergeDaily(null).record, null);
  assert.equal(validateBrief(mergeDaily("x").record).ok, false);
});

test("through the endpoint: a daily record is stored merged and published", async () => {
  const rows = new Map<string, any>();
  const fetchFn = (async (input: any, init: any = {}) => {
    const url = String(input);
    if ((init.method ?? "GET") === "GET") return new Response(JSON.stringify([]), { status: 200 });
    for (const row of JSON.parse(init.body)) rows.set(row.date, row);
    return new Response(null, { status: 201 });
  }) as typeof fetch;
  const res = await handleIntake(
    new Request("https://fn.example/intake", { method: "POST", headers: { authorization: "Bearer k" }, body: JSON.stringify(daily()) }),
    { INTAKE_KEY: "k", SUPABASE_URL: "https://x.supabase.co", SERVICE_KEY: "s" }, fetchFn,
  );
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, "published");
  const stored = rows.get("2026-11-13");
  assert.deepEqual(stored.payload, JSON.parse(JSON.stringify(brief)));
  assert.equal(stored.status, "published");
});
