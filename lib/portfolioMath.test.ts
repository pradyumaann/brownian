// Run with: npm run test:portfolio  (node --test, Node 24 strips the types)
import { test } from "node:test";
import assert from "node:assert/strict";
import { blend, concentration, equalWeights, exposure, normalise, stepWeight, type MoveFact } from "./portfolioMath.ts";

const facts: MoveFact[] = [
  { id: "index", n: "Index", d1: 1 }, { id: "fin", n: "Fin", d1: 2 }, { id: "mid", n: "Mid", d1: -1 },
  { id: "gold", n: "Gold", d1: -2 }, { id: "silver", n: "Silver", d1: null }, { id: "debt", n: "Debt", d1: null },
];
const near = (a: number | null, b: number) => assert.ok(a != null && Math.abs(a - b) < 1e-9, `${a} vs ${b}`);

test("equal weights over four picks give 25% each and a blended move equal to the plain average", () => {
  const w = equalWeights(["index", "fin", "mid", "gold"]);
  assert.deepEqual(w, { index: 25, fin: 25, mid: 25, gold: 25 });
  const b = blend(w, facts);
  near(b.move, (1 + 2 - 1 - 2) / 4);
  near(b.covered, 100);
  assert.equal(b.unallocated, 0);
  near(b.rows.find((r) => r.id === "fin")!.contrib, 0.5);
});

test("equal weights round down to 5% steps and leave the remainder unallocated", () => {
  const w = equalWeights(["index", "fin", "mid"]);
  assert.deepEqual(w, { index: 30, fin: 30, mid: 30 });
  const b = blend(w, facts);
  near(b.unallocated, 10);
  near(b.move, 0.3 * (1 + 2 - 1));
});

test("partial weights: the move is share times move, and the unallocated part adds nothing", () => {
  const b = blend({ index: 40, fin: 20 }, facts);
  near(b.move, 0.4 * 1 + 0.2 * 2);
  near(b.unallocated, 40);
  near(b.covered, 60);
});

test("a type with n/a is excluded and named with its weight; the blend covers the rest", () => {
  const b = blend({ index: 50, silver: 30, debt: 20 }, facts);
  near(b.move, 0.5);
  near(b.covered, 50);
  assert.deepEqual(b.excluded.map((e) => e.id), ["silver", "debt"]);
  near(b.excluded[0].share, 30);
  assert.equal(b.rows.find((r) => r.id === "silver")!.contrib, null);
});

test("only n/a types: no blended move at all", () => {
  const b = blend({ silver: 50, debt: 50 }, facts);
  assert.equal(b.move, null);
  near(b.covered, 0);
});

test("over 100% is normalised for the calculation and flagged", () => {
  const n = normalise({ index: 80, fin: 80 });
  assert.equal(n.over, true);
  near(n.total, 160);
  near(n.shares.index, 50);
  const b = blend({ index: 80, fin: 80 }, facts);
  near(b.move, 0.5 * 1 + 0.5 * 2);
  assert.equal(b.unallocated, 0);
});

test("empty portfolio: no move, no exposure, no concentration; wallet and junk keys are ignored", () => {
  const b = blend({}, facts);
  assert.equal(b.move, null);
  assert.equal(b.rows.length, 0);
  assert.deepEqual(exposure({ wallet: 50, nope: 10 }), []);
  const c = concentration({});
  assert.equal(c.largest, null);
  assert.equal(c.hhi, null);
});

test("a type missing from the facts is treated as n/a, not zero", () => {
  const b = blend({ realty: 50, index: 50 }, facts);
  near(b.move, 0.5);
  assert.deepEqual(b.excluded.map((e) => e.id), ["realty"]);
});

test("exposure rolls types up by factor, largest first", () => {
  const e = exposure({ index: 30, fin: 20, mid: 10, gold: 10, silver: 10, it: 20 });
  assert.deepEqual(e.map((x) => x.id), ["large", "itus", "gold", "midsmall"]);
  near(e[0].share, 50);
  near(e.find((x) => x.id === "gold")!.share, 20);
});

test("concentration: one type, two equal types, and an uneven mix", () => {
  const one = concentration({ index: 100 });
  near(one.hhi!, 1);
  near(one.largest!.share, 100);
  near(one.topTwo!, 100);
  const two = concentration({ index: 50, fin: 50 });
  near(two.hhi!, 0.5);
  near(two.equivalent!, 2);
  near(two.topTwo!, 100);
  const m = concentration({ index: 50, fin: 30, mid: 20 });
  near(m.largest!.share, 50);
  near(m.topTwo!, 80);
  near(m.hhi!, 0.25 + 0.09 + 0.04);
  assert.match(m.words, /Herfindahl 0\.38/);
});

test("concentration is read over the allocated part, so 10% in one type alone is 100% of it", () => {
  const c = concentration({ gold: 10 });
  near(c.largest!.share, 100);
});

test("stepping moves 5% at a time and stays within 0 to 100", () => {
  assert.deepEqual(stepWeight({}, "gold", 1), { gold: 5 });
  assert.deepEqual(stepWeight({ gold: 5 }, "gold", -1), {});
  assert.deepEqual(stepWeight({}, "gold", -1), {});
  assert.deepEqual(stepWeight({ gold: 100 }, "gold", 1), { gold: 100 });
});
