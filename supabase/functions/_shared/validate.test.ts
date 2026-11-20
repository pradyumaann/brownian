// node --test supabase/functions/_shared/validate.test.ts   (npm run test:backend)
import { test } from "node:test";
import assert from "node:assert/strict";
import { brief } from "../../../data/2026-11-13.ts";
import { validateBrief } from "./validate.ts";

const good = () => structuredClone(brief) as unknown as Record<string, any>;
const paths = (r: ReturnType<typeof validateBrief>) => r.errors.map((e) => e.path);

test("the hand-built 13 Nov brief is accepted", () => {
  const r = validateBrief(brief);
  assert.deepEqual(r.errors, []);
  assert.equal(r.ok, true);
  assert.ok(r.stats.tagsChecked > 100, "it should have checked the source tags");
});

test("not an object is rejected", () => {
  for (const v of [null, 5, "x", []]) assert.equal(validateBrief(v).ok, false);
});

test("a missing required section is rejected", () => {
  const b = good(); delete b.flows;
  const r = validateBrief(b);
  assert.equal(r.ok, false);
  assert.ok(paths(r).includes("flows"));
});

test("a source tag that does not exist is rejected", () => {
  const b = good(); b.kpis.fii.src = ["S1", "S99"];
  const r = validateBrief(b);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.path === "kpis.fii.src" && /S99/.test(e.message)));
});

test("an unknown tag inside rich text is rejected", () => {
  const b = good(); b.lede.push({ src: ["W404"] });
  assert.ok(validateBrief(b).errors.some((e) => /W404/.test(e.message)));
});

test("a headline figure with no source is rejected", () => {
  const b = good(); b.kpis.gift.src = [];
  assert.ok(paths(validateBrief(b)).includes("kpis.gift.src"));
});

test("dataset tags D1 to D5 are valid", () => {
  const b = good(); b.kpis.gift.src = ["D1", "D5"];
  assert.equal(validateBrief(b).ok, true);
});

test("advice and tip language is rejected, ordinary news wording is not", () => {
  const b = good(); b.takeaways[0].h = "Investors should buy gold now";
  const r = validateBrief(b);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /should/.test(e.message)));
  const c = good(); c.drove[0] = "Regional chip sell-off; RBI target 4%";
  assert.equal(validateBrief(c).ok, true);
  const d = good(); d.drove[0] = "Free stock tips inside";
  assert.equal(validateBrief(d).ok, false);
});

test("descriptions of how funds behave are not advice; telling the reader to act is", () => {
  const a = good(); a.drove[0] = "Passive funds tracking MSCI must buy additions and sell deletions.";
  assert.equal(validateBrief(a).ok, true);
  const b = good(); b.drove[0] = "Investors must sell before the open.";
  assert.equal(validateBrief(b).ok, false);
});

test("an n/a indicator needs no source tag, a real one does", () => {
  const a = good(); a.indicators[5][8] = "";
  assert.equal(validateBrief(a).ok, true);          // the fixture's row 5 is n/a
  const b = good(); b.indicators[0][8] = "";
  assert.ok(paths(validateBrief(b)).includes("indicators[0][8]"));
});

test("the disclaimer phrase is allowed", () => {
  const b = good(); b.drove[0] = "For information only; not investment advice.";
  assert.equal(validateBrief(b).ok, true);
});

test("a bad pressure level or tone is rejected", () => {
  const b = good(); b.pressure[0].lv = 3;
  assert.ok(paths(validateBrief(b)).includes("pressure[0]"));
  const c = good(); c.india[0][3] = "bullish";
  assert.ok(paths(validateBrief(c)).includes("india[0][3]"));
});

test("dates must be real ISO dates and agree", () => {
  const a = good(); a.briefDate = "2026-13-45";
  assert.ok(paths(validateBrief(a)).includes("briefDate"));
  const b = good(); b.date = "2026-11-14";
  assert.ok(paths(validateBrief(b)).includes("date"));
  const c = good(); c.sessionDate = "2026-11-20";
  assert.ok(paths(validateBrief(c)).includes("sessionDate"));
});

test("a glossary term that is not defined is rejected", () => {
  const b = good(); b.lede.push({ term: "nonesuch", label: "x" });
  assert.ok(validateBrief(b).errors.some((e) => /nonesuch/.test(e.message)));
});

test("an event tagged to an unknown holding type is rejected", () => {
  const b = good(); b.events[0].affects = ["crypto"];
  assert.ok(paths(validateBrief(b)).includes("events[0].affects"));
});

test("non-numeric money and releases are rejected; n/a (null) is allowed", () => {
  const a = good(); a.flows.day.fii = "5,000";
  assert.ok(paths(validateBrief(a)).includes("flows.day"));
  const b = good(); b.releases[0].latest = null;
  assert.equal(validateBrief(b).ok, true);
  const c = good(); c.releases[0].latest = "n/a";
  assert.ok(paths(validateBrief(c)).includes("releases[0].latest"));
});

test("an implausibly large daily flow is a warning, not an error", () => {
  const b = good(); b.flows.day.fii = 900000;
  const r = validateBrief(b);
  assert.equal(r.ok, true);
  assert.ok(r.warnings.some((w) => w.path === "flows.day.fii"));
});

test("an oversized record is rejected", () => {
  const b = good(); b.method.push("x".repeat(1_600_000));
  assert.ok(paths(validateBrief(b)).includes(""));
});

test("pipeline wording such as 'the brief' is a warning, not an error", () => {
  const b = good(); b.holdings[0].h = "The brief gives no figure for Nifty 500.";
  const r = validateBrief(b);
  assert.equal(r.ok, true);
  assert.ok(r.warnings.some((w) => w.path === "holdings[0].h" && /pipeline wording/.test(w.message)));
  const c = good(); c.drove[0] = "A brief rally faded by the close.";
  assert.ok(!validateBrief(c).warnings.some((w) => w.path === "drove[0]"), "an ordinary 'brief rally' is not pipeline wording");
});

test("Today in 3 lines: reasons only, plain words, within the word limits; missing is a warning", () => {
  let b = good(); delete b.glance;
  let r = validateBrief(b);
  assert.equal(r.ok, true);
  assert.ok(r.warnings.some((w) => w.path === "glance"));
  for (const why of ["FIIs bought", "rose 1.1%", "nothing to do today", "your SIPs are not affected", "markets expect a rate cut"]) {
    b = good(); b.glance.india.why = why;
    assert.ok(paths(validateBrief(b)).includes("glance.india.why"), why);
  }
  b = good(); b.glance.world.why = "one two three four five six seven eight nine ten eleven twelve";
  assert.ok(paths(validateBrief(b)).includes("glance.world.why"));
  b = good(); b.glance.india.src = ["S99"];
  assert.ok(paths(validateBrief(b)).includes("glance.india.src"));
});
