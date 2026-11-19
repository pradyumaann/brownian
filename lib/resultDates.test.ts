// Run with: npm run test:portfolio
import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, buildResultIndex, dayLabel, NONE, parseUsDate, resolveName, resultFor, type ResultSource } from "./resultDates.ts";

const names = ["Eicher Motors", "NVDA (Nvidia)", "Alkem Laboratories", "RVNL", "Bajaj Finance", "Walmart", "Home Depot", "ONGC"];
const aliases = { eicher: "Eicher Motors", nvidia: "NVDA (Nvidia)", nvda: "NVDA (Nvidia)", "alkem labs": "Alkem Laboratories", "rail vikas nigam": "RVNL", hd: "Home Depot" };
const src: ResultSource = {
  briefDate: "2026-11-13", names, aliases,
  erToday: [["Eicher Motors", "Auto", ""], ["Rail Vikas Nigam", "Rail PSU", ""]],
  erTom: [["Ashok Leyland", "Auto", ""]],
  erUS: [
    ["Tue 17 Nov", "Home Depot", "BMO (evening IST)", "US housing", false],
    ["Tue 17 Nov", "Nvidia", "AMC (after the US close, early Wed 18 Nov IST)", "EPS est.", true],
    ["Wed 18 Nov", "Target · TJX · Lowe's · PDD", "BMO (expected)", "US retail health; Target date unconfirmed", false],
    ["Thu 19 Nov", "Walmart · Williams-Sonoma", "BMO", "Clearest read on the US consumer", false],
    ["Mon 17 Nov", "Wrong Day Inc", "BMO", "weekday does not match the date", false],
    ["Mon 9 Nov", "Early Co", "BMO", "before the brief", false],
  ],
  erDone: [["Alkem Labs", "India", "Net profit", "", "loss"], ["Cisco", "US", "Record", "", "gain"]],
};
const ix = buildResultIndex(src);
const get = (n: string) => resultFor(ix, n, names, aliases);

test("today's list gives the brief date, through an alias or the company's own listed spelling", () => {
  assert.equal(get("Eicher Motors").text, "Results due Fri 13 Nov");
  assert.equal(get("Eicher Motors").date, "2026-11-13");
  assert.equal(get("RVNL").text, "Results due Fri 13 Nov");      // listed as "Rail Vikas Nigam"
});

test("tomorrow's list gives the next day, even for a name the watchlist does not know", () => {
  assert.equal(get("Ashok Leyland").text, "Results due Sat 14 Nov");
});

test("a US company shows its date and the calendar's own timing text, unchanged", () => {
  assert.equal(get("NVDA (Nvidia)").text, "Reports Tue 17 Nov, AMC (after the US close, early Wed 18 Nov IST)");
  assert.equal(get("nvidia").text, get("NVDA (Nvidia)").text);                       // a stored alias spelling
  assert.equal(get("Home Depot").text, "Reports Tue 17 Nov, BMO (evening IST)");
});

test("a group row is split on ' · ', and only the company named as unconfirmed carries that caveat", () => {
  assert.match(get("Target").text, /^Reports Wed 18 Nov, BMO \(expected\); the brief says this date is not confirmed$/);
  assert.equal(get("TJX").text, "Reports Wed 18 Nov, BMO (expected)");
  assert.equal(get("Walmart").text, "Reports Thu 19 Nov, BMO");
});

test("the reported list shows 'Reported', including a spelling that needs an alias", () => {
  assert.equal(get("Alkem Laboratories").text, "Reported");
  assert.equal(get("Alkem Labs").text, "Reported");
  assert.equal(get("Cisco").text, "Reported");
});

test("a name the brief does not list shows no date, and so do typed names and stray case or spaces", () => {
  assert.deepEqual(get("Infosys"), NONE);
  assert.deepEqual(get("Bajaj Finance"), NONE);
  assert.deepEqual(get("  ongc "), NONE);
  assert.equal(get(" eicher ").kind, "due");
});

test("a US date whose weekday disagrees, or that falls before the brief date, is dropped rather than guessed", () => {
  assert.deepEqual(get("Wrong Day Inc"), NONE);
  assert.deepEqual(get("Early Co"), NONE);
  assert.equal(parseUsDate("Tue 17 Nov", "2026-11-13"), "2026-11-17");
  assert.equal(parseUsDate("Mon 17 Nov", "2026-11-13"), null);
  assert.equal(parseUsDate("Tue 31 Nov", "2026-11-13"), null);
  assert.equal(parseUsDate("Thu 6 Jan", "2027-12-30"), "2028-01-06");                // wraps into the next year
  assert.equal(parseUsDate("Soon", "2026-11-13"), null);
});

test("date helpers use UTC and need no clock", () => {
  assert.equal(dayLabel("2026-11-13"), "Fri 13 Nov");
  assert.equal(addDays("2026-11-30", 1), "2026-12-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("resolving typed text: alias, exact name, suggestions, and no fuzzy matching", () => {
  assert.deepEqual(resolveName("NVDA", names, aliases), { hit: "NVDA (Nvidia)" });
  assert.deepEqual(resolveName("walmart", names, aliases), { hit: "Walmart" });
  assert.deepEqual(resolveName("", names, aliases), {});
  assert.deepEqual(resolveName("eich", names, aliases).sug, ["Eicher Motors"]);
  assert.deepEqual(resolveName("Eichr", names, aliases), { raw: "Eichr", sug: [] });
});
