// Run with: npm run test:portfolio  (node --test, Node 24 strips the types)
import { test } from "node:test";
import assert from "node:assert/strict";
import { blend, blendSeries, changeOver, concentration, levelsOf, maxDrawdown, volatility, worstDay, equalWeights, exposure, fmtBp, fmtPct, normalise, stepWeight, weightedRank, type MoveFact } from "./portfolioMath.ts";

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

test("weighted rank averages the percentiles by share and skips types without one", () => {
  const r = weightedRank({ index: 50, fin: 25, silver: 25 }, [{ id: "index", pctl: 80 }, { id: "fin", pctl: 40 }, { id: "silver", pctl: null }]);
  near(r!.value, (50 * 80 + 25 * 40) / 75);
  near(r!.covered, 75);
  assert.equal(weightedRank({}, [{ id: "index", pctl: 80 }]), null);
});

test("signed formats use a true minus and en-IN grouping", () => {
  assert.equal(fmtPct(-0.74), "−0.74%");
  assert.equal(fmtPct(1.2), "+1.20%");
  assert.equal(fmtPct(0), "0.00%");
  assert.equal(fmtBp(-3.4), "−3 bp");
  assert.equal(fmtBp(12), "+12 bp");
});

test("stepping moves 5% at a time and stays within 0 to 100", () => {
  assert.deepEqual(stepWeight({}, "gold", 1), { gold: 5 });
  assert.deepEqual(stepWeight({ gold: 5 }, "gold", -1), {});
  assert.deepEqual(stepWeight({}, "gold", -1), {});
  assert.deepEqual(stepWeight({ gold: 100 }, "gold", 1), { gold: 100 });
});

// ---- blend history ----
const D = (n: number) => Array.from({ length: n }, (_, i) => `2026-01-${String(i + 1).padStart(2, "0")}`);
const ser = (...r: number[]) => [null, ...r];

test("blend history: equal weights give the plain average of the daily changes, compounded and rebased to 100", () => {
  const types = { index: ser(1, 2), fin: ser(3, -2) };
  const b = blendSeries({ index: 50, fin: 50 }, types)!;
  assert.deepEqual(b.used.map((u) => u.id), ["index", "fin"]);
  near(b.covered, 100);
  assert.equal(b.returns[0], null);
  near(b.returns[1], 2);
  near(b.returns[2], 0);
  near(b.levels[0], 100);
  near(b.levels[1], 102);
  near(b.levels[2], 102);
});

test("blend history: partial weights are re-weighted among the covered types and Unallocated adds nothing", () => {
  const types = { index: ser(1), fin: ser(3) };
  const b = blendSeries({ index: 20, fin: 20 }, types)!;     // 60% unallocated
  near(b.covered, 40);
  near(b.returns[1], 2);                                     // (20×1 + 20×3) ÷ 40
});

test("blend history: a type with no series is left out and named; the rest is re-weighted to 100%", () => {
  const b = blendSeries({ index: 30, silver: 40, debt: 30 }, { index: ser(2) })!;
  assert.deepEqual(b.left.map((l) => l.id), ["silver", "debt"]);
  near(b.left[0].share, 40);
  near(b.covered, 30);
  near(b.returns[1], 2);
});

test("blend history: nothing covered gives null (silver and debt only, or an empty mix)", () => {
  assert.equal(blendSeries({ silver: 50, debt: 50 }, { index: ser(1) }), null);
  assert.equal(blendSeries({}, { index: ser(1) }), null);
});

test("blend history: weights over 100% are scaled first, so 80 + 80 equals 50 + 50", () => {
  const types = { index: ser(1), fin: ser(3) };
  near(blendSeries({ index: 80, fin: 80 }, types)!.returns[1]!, blendSeries({ index: 50, fin: 50 }, types)!.returns[1]!);
});

test("blend history: a missing change gives no blended change that day and stops the line, with nothing filled in", () => {
  const b = blendSeries({ index: 50, fin: 50 }, { index: [null, 1, 1, 1], fin: [null, 1, null, 1] })!;
  near(b.returns[1], 1);
  assert.equal(b.returns[2], null);
  assert.deepEqual(b.levels.map((x) => x == null), [false, false, true, true]);
});

test("a flat series: zero change, zero volatility, no drawdown", () => {
  const flat = [null, ...Array(30).fill(0)];
  const lv = levelsOf(flat);
  near(changeOver(lv), 0);
  near(volatility(flat), 0);
  const dd = maxDrawdown(lv, D(31))!;
  near(dd.value, 0);
  assert.equal(dd.peak, null);
});

test("volatility is the sample standard deviation (n − 1) times √250 and needs at least 20 changes", () => {
  const r = [null, ...Array.from({ length: 24 }, (_, i) => (i % 2 ? 1 : -1))];     // 24 changes of ±1: mean 0
  near(volatility(r), Math.sqrt(24 / 23) * Math.sqrt(250));
  assert.equal(volatility([null, 1, 2, 3]), null);
});

test("drawdown on a known path: peak, trough and depth", () => {
  const lv = [100, 110, 121, 90.75, 99.825, 80.6, 130];
  const dd = maxDrawdown(lv, D(7))!;
  near(dd.value, (80.6 / 121 - 1) * 100);
  assert.equal(dd.peak, "2026-01-03");
  assert.equal(dd.trough, "2026-01-06");
  assert.equal(maxDrawdown([null, 100], D(2)), null);
});

test("worst day: the lowest daily change and its date; none when there are no changes", () => {
  const w = worstDay([null, 1, -3.2, 0.5, -1], D(5))!;
  near(w.value, -3.2);
  assert.equal(w.date, "2026-01-03");
  assert.equal(worstDay([null, null], D(2)), null);
});
