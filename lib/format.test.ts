// Run with: npm run test:portfolio
import { test } from "node:test";
import assert from "node:assert/strict";
import { bindUnits, plainValue } from "./format.ts";

test("plainValue drops a trailing note and nothing else", () => {
  assert.equal(plainValue("25,766 (implied)"), "25,766");
  assert.equal(plainValue("92,650 (est.)"), "92,650");
  assert.equal(plainValue("1,05,000 (Estimated) "), "1,05,000");
  assert.equal(plainValue("25,279"), "25,279");
  assert.equal(plainValue("Nifty (implied) opens"), "Nifty (implied) opens");
});

test("bindUnits keeps a figure with its unit and sign, and changes no words or digits", () => {
  const nb = " ", wj = "⁠";
  assert.equal(bindUnits("FIIs bought ₹4,860 cr today"), `FIIs bought ₹4,860${nb}cr today`);
  assert.equal(bindUnits("fell 20 pts and 12 bp"), `fell 20${nb}pts and 12${nb}bp`);
  assert.equal(bindUnits("up 3.5 %"), `up 3.5${nb}%`);
  assert.equal(bindUnits("DIIs - ₹4,859.80 cr"), `DIIs -${nb}₹4,859.80${nb}cr`);
  assert.equal(bindUnits("range 12–14%"), `range 12–${wj}14%`);
  assert.equal(bindUnits("OIIs −₹6,331.17 cr"), `OIIs −${wj}₹6,331.17${nb}cr`);
  assert.equal(bindUnits("+₹7,830.60 cr"), `+${wj}₹7,830.60${nb}cr`);
  // Not a unit, not a sign: left as written.
  assert.equal(bindUnits("Q2 results on 13 Nov"), "Q2 results on 13 Nov");
  assert.equal(bindUnits("5 crowded trades"), "5 crowded trades");
  assert.equal(bindUnits("Nifty 50 - the index"), "Nifty 50 - the index");
  for (const s of ["FIIs bought ₹4,860 cr today", "DIIs - ₹4,859.80 cr", "range 12–14%"]) {
    assert.equal(bindUnits(s).replace(/⁠/g, "").replace(/ /g, " "), s);
  }
});
