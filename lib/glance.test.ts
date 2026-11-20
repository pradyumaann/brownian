// Run with: npm run test:portfolio
import { test } from "node:test";
import assert from "node:assert/strict";
import { glanceLines, glanceProblems, num, weekday, type GlanceSource } from "./glance.ts";

const base: GlanceSource = {
  session: "Thu 12 Nov",
  india: [["Nifty 50", "25,299.35", "+0.18%", "gain", ""]],
  gift: { v: "25,279", src: ["S8"] },
  next: [{ w: "Fri 13 · 19:00", t: "US October PPI" }],
  glance: {
    india: { why: "with financial stocks leading and foreign investors buying", src: ["S1", "S5"] },
    world: { why: "US stocks fell and oil jumped after attacks in Saudi Arabia", src: ["S11"] },
    next: { src: ["W15"] },
  },
};

test("num and weekday", () => {
  assert.equal(num("25,299.35"), 25299.35);
  assert.equal(num("−0.74%"), -0.74);
  assert.equal(num("+0.18%"), 0.18);
  assert.equal(num("n/a"), null);
  assert.equal(weekday("Thu 12 Nov"), "Thursday");
});

test("three lines from the record", () => {
  const [a, b, c] = glanceLines(base);
  assert.equal(a.text, "Indian stocks rose 0.18% on Thursday, with financial stocks leading and foreign investors buying.");
  assert.deepEqual(a.src, ["S1", "S5"]);
  assert.equal(b.text, "Overnight, US stocks fell and oil jumped after attacks in Saudi Arabia. Nifty's overnight price in GIFT City is about 0.08% below Thursday's close.");
  assert.deepEqual(b.src, ["S8", "S11"]);
  assert.equal(c.text, "Coming up: US October PPI (Fri 13 · 19:00). A single day's move rarely changes a long-term picture.");
  assert.deepEqual(glanceProblems([a.text, b.text, c.text]), []);
});

test("missing data prints n/a and drops reasons", () => {
  const [a, b, c] = glanceLines({ ...base, glance: undefined, india: [], next: [] });
  assert.equal(a.text, "Indian stocks moved n/a on Thursday.");
  assert.equal(b.text, "Nifty's overnight price in GIFT City is n/a against Thursday's close.");
  assert.equal(c.text, "Coming up: n/a. A single day's move rarely changes a long-term picture.");
  assert.deepEqual(c.src, []);
});

test("a fall and a gap above", () => {
  const [a, b] = glanceLines({ ...base, india: [["Nifty 50", "25,000", "−1.10%", "loss", ""]], gift: { v: "25,175", src: ["S8"] } });
  assert.match(a.text, /^Indian stocks fell 1\.10% on Thursday/);
  assert.match(b.text, /about 0\.70% above Thursday's close/);
});

test("problems: limits and banned words", () => {
  const long = Array(26).fill("word").join(" ");
  assert.ok(glanceProblems([long]).some((p) => p.includes("26 words")));
  assert.ok(glanceProblems(["Your SIPs are not affected."]).length > 0);
  assert.ok(glanceProblems(["You should wait."]).length > 0);
  assert.ok(glanceProblems(["Markets expect a hike."]).length > 0);
  assert.ok(glanceProblems([Array(24).fill("a").join(" "), Array(24).fill("a").join(" "), Array(24).fill("a").join(" ")]).some((p) => p.includes("card has 72")));
});
