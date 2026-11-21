// Verify every view after `npm run build`: no console errors, no sideways page scroll, at 1280px and 400px,
// in the night and paper themes. Screenshots go to the folder given as the first argument (default ./check-shots).
// Uses an installed Edge or Chrome through playwright-core:  node scripts/check.mjs [outDir] [msedge|chrome]
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright-core";

const ROOT = resolve("out");
const SHOTS = resolve(process.argv[2] || "check-shots");
const CHANNEL = process.argv[3] || "msedge";
const ROUTES = ["/", "/portfolio/", "/wander/", "/flows/", "/india/", "/global/", "/macro/", "/earnings/", "/developing/", "/learn/"];
// Populated-state passes: Portfolio Lens and the front page with a saved mix (ii:port3), and with only the older picks (ii:held2).
const SEEDS = {
  mix: { port3: { v: 1, w: { index: 30, fin: 15, mid: 10, it: 10, gold: 10, silver: 5, debt: 20 } } },
  migrate: { held2: ["index", "fin", "gold", "debt"] },
  // Phase 2: only types with no year-long series; weights over 100%; types no event is tagged to; a typed watchlist.
  left: { port3: { v: 1, w: { silver: 50, debt: 50 } } },
  over: { port3: { v: 1, w: { index: 60, fin: 60, it: 30 } } },
  noev: { port3: { v: 1, w: { gold: 50, mid: 30 } } },
  watch: { port3: { v: 1, w: { index: 40, it: 30, consumer: 30 } }, watch2: ["Eicher Motors", "Infosys", "NVDA (Nvidia)", "Alkem Labs", "Walmart"] },
  // "I own nothing yet" (no example, no figures), and a mix with the two Nifty 500 proxy types.
  none: { port3: { v: 1, w: {}, none: true } },
  flexi: { port3: { v: 1, w: { flexi: 40, elss: 30, index: 30 } } },
};
const SEEDED = [["/portfolio/", "mix"], ["/", "mix"], ["/portfolio/", "migrate"], ["/", "migrate"],
  ["/portfolio/", "left"], ["/portfolio/", "over"], ["/portfolio/", "noev"], ["/portfolio/", "watch"],
  ["/portfolio/", "none"], ["/", "none"], ["/portfolio/", "flexi"], ["/", "flexi"]];
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".txt": "text/plain" };

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  try {
    const body = await readFile(join(ROOT, p));
    res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(0);
const base = `http://localhost:${server.address().port}`;

await mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch({ channel: CHANNEL });
let failures = 0;
for (const theme of ["night", "paper"]) {
  for (const width of [1280, 400]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    await ctx.addInitScript((t) => localStorage.setItem("bw:theme", t), theme);
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(m.text()); });
    page.on("response", (res) => { if (res.status() >= 400) errors.push(`${res.status()} ${res.url().replace(base, "")}`); });
    page.on("pageerror", (e) => errors.push(e.message));
    for (const [r, seed] of [...ROUTES.map((x) => [x, null]), ...SEEDED]) {
      errors.length = 0;
      await page.goto(base + r, { waitUntil: "networkidle" });
      if (seed) {
        await page.evaluate((s) => { localStorage.removeItem("ii:port3"); localStorage.removeItem("ii:held2"); localStorage.removeItem("ii:watch2"); for (const [k, v] of Object.entries(s)) localStorage.setItem("ii:" + k, JSON.stringify(v)); }, SEEDS[seed]);
        await page.reload({ waitUntil: "networkidle" });
      }
      await page.waitForTimeout(150);
      const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: window.innerWidth }));
      const name = `${theme}-${width}-${r === "/" ? "brief" : r.replaceAll("/", "")}${seed ? "-" + seed : ""}`;
      await page.screenshot({ path: join(SHOTS, name + ".png"), fullPage: true });
      // Folds (components/Fold.tsx): folded by default; the body is hidden and out of the tab order; a click opens it.
      // `/`: Money movement, Coming up, Still developing; `/portfolio/`: How it is worked out, What the news means for each type. Section order is checked too.
      if ((r === "/" || r === "/portfolio/") && !seed) {
        const want = r === "/" ? ["money-movement", "coming-up", "still-developing"] : ["how-it-is-worked-out", "what-the-news-means", "events-for-what-you-own", "your-mix"];
        const st = await page.evaluate((ids) => ids.map((id) => {
          const f = document.getElementById(id), b = f?.querySelector(".fold-btn"), p = f?.querySelector(".fold-panel");
          return { id, found: !!f, open: b?.getAttribute("aria-expanded"), h: p ? Math.round(p.getBoundingClientRect().height) : -1, vis: p ? getComputedStyle(p).visibility : "", inert: !!f?.querySelector(".fold-inner")?.inert,
            ctl: b?.getAttribute("aria-controls") === p?.id, summary: (f?.querySelector(".bw-meta span")?.textContent ?? "").trim().length > 0 };
        }), want);
        for (const s of st) {
          if (!s.found) { errors.push(`fold #${s.id} missing`); continue; }
          if (s.open !== "false" || s.h !== 0 || s.vis !== "hidden" || !s.inert) errors.push(`fold #${s.id} is not folded by default (${JSON.stringify(s)})`);
          if (!s.ctl || !s.summary) errors.push(`fold #${s.id}: aria-controls or the one-line summary is missing`);
        }
        for (const id of want) {
          await page.locator(`#${id} .fold-btn`).click();
          await page.waitForTimeout(80);
          const o = await page.evaluate((i) => { const f = document.getElementById(i); return { exp: f.querySelector(".fold-btn").getAttribute("aria-expanded"), h: f.querySelector(".fold-panel").getBoundingClientRect().height, inert: f.querySelector(".fold-inner").inert, sw: document.documentElement.scrollWidth, vw: innerWidth }; }, id);
          if (o.exp !== "true" || o.h < 40 || o.inert) errors.push(`fold #${id} did not open on click (${JSON.stringify(o)})`);
          if (o.sw > o.vw) errors.push(`fold #${id} open causes sideways scroll ${o.sw}/${o.vw}`);
        }
        const order = await page.evaluate(() => [...document.querySelectorAll("main h2")].map((h) => h.textContent.trim()));
        const before = (a, b) => order.findIndex((t) => t.startsWith(a)) < order.findIndex((t) => t.startsWith(b)) && order.findIndex((t) => t.startsWith(a)) >= 0;
        if (r === "/" && !(before("What happened", "The market") && before("The market", "What drove"))) errors.push("order: What happened, then the market mood, then What drove the day");
        if (r === "/" && !(order.findIndex((t) => t.startsWith("What happened")) < order.findIndex((t) => t.startsWith("Money")))) errors.push("order: Money movement must come after What happened");
        if (r === "/portfolio/") {
          const at = (x) => order.findIndex((t) => t.startsWith(x));
          const seq = ["Your day", "Events for", "Your mix over", "Portfolio weights", "Is my stock", "How it is"].map(at);
          if (seq.some((v, i) => v < 0 || (i > 0 && v <= seq[i - 1]))) errors.push("order: Your day, Events, Your mix over the year, Portfolio weights, Is my stock, How it is worked out");
        }
        if (r === "/") {
          const hero = await page.evaluate(() => [...document.querySelectorAll(".hero > div .bw-label")].map((l) => l.textContent.trim()));
          if (hero.length !== 5 || !hero.includes("Wander Index") || !hero.includes("Macro pressure")) errors.push(`hero should hold 5 cells with Wander Index and Macro pressure apart: ${hero.join(" | ")}`);
        }
      }
      // Phase 2 text expectations on the seeded Portfolio Lens passes.
      const EXPECT = { left: ["None of the types in your mix has a year-long series"], noev: ["No dated events in the brief are tagged to the types in your mix."],
        watch: ["Results due Fri 13 Nov", "No result date found", "Reported", "Reports Tue 17 Nov"], mix: ["Interpretation, not a forecast.", "Correlation with Nifty 50", "Beta to Nifty 50"],
        none: ["Portfolio Lens reads the day's index and market moves"], flexi: ["proxy: Nifty 500, not the fund's own returns"] };
      // Text that must not appear: in "none" mode the example mix and its figures are hidden.
      const ABSENT = { none: ["the example mix", "Blended one-day move", "Tagged to", "Correlation with Nifty 50"] };
      if (seed && r === "/portfolio/") {
        // Folds are closed by default and their text is hidden: open them all before reading the page text.
        await page.evaluate(() => document.querySelectorAll('.fold-btn[aria-expanded="false"]').forEach((b) => b.click()));
        await page.waitForTimeout(700);
        const body = await page.evaluate(() => document.body.innerText);
        for (const t of EXPECT[seed] ?? []) if (!body.includes(t)) errors.push(`missing text: ${t}`);
        for (const t of ABSENT[seed] ?? []) if (body.includes(t)) errors.push(`unexpected text: ${t}`);
      }
      // The front page: the Blended session move card (components/portfolio/SessionMove.tsx, the same usePort()) on every
      // pass; "Your day" and "Events for what you own" are gone from `/`; one primary button.
      if (r === "/") {
        const CARD = ["Blended session move", "Single days are noise. Interpretation, not a forecast.", "See what it means for you"];
        const FRONT = { "": ["Blended one-day move of the example mix"], mix: ["Blended one-day move of your mix"], migrate: ["Blended one-day move of your mix"],
          none: ["Portfolio Lens reads the day's index and market moves"], flexi: ["Blended one-day move of your mix", "proxy: Nifty 500, not the fund's own returns"] };
        const FRONT_ABSENT = { none: ["the example mix", "Blended one-day move", "Tagged to"], mix: ["the example mix"], migrate: ["the example mix"], flexi: ["the example mix"] };
        const { body, dawn } = await page.evaluate(() => ({ body: document.body.innerText, dawn: document.querySelectorAll("main .bw-btn-dawn").length }));
        for (const t of [...CARD, ...(FRONT[seed ?? ""] ?? [])]) if (!body.includes(t)) errors.push(`missing text: ${t}`);
        for (const t of ["Your day", "Events for what you own", ...(FRONT_ABSENT[seed] ?? [])]) if (body.includes(t)) errors.push(`unexpected text: ${t}`);
        if (dawn !== 1) errors.push(`${dawn} primary buttons on /, expected 1`);
      }
      // Term pop-up at 400px on the front page: opens from the keyboard, sits inside the viewport with no sideways
      // page scroll, and Esc closes it with focus back on the term.
      if (width === 400 && r === "/" && !seed) {
        const term = page.locator("main [data-term]").first();
        await term.focus();
        await page.keyboard.press("Enter");
        await page.waitForTimeout(250);
        const pop = await page.evaluate(() => {
          const el = document.querySelector(".termpop");
          if (!el) return null;
          const b = el.getBoundingClientRect(), s = getComputedStyle(el);
          return { visible: s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) > 0.9 && b.width > 0 && b.height > 0,
            inside: b.left >= 0 && b.right <= document.documentElement.clientWidth && b.top >= 0 && b.bottom <= window.innerHeight,
            dialog: el.getAttribute("role") === "dialog", focusIn: el.contains(document.activeElement),
            expanded: document.querySelector('[data-term][aria-expanded="true"]') !== null,
            sw: document.documentElement.scrollWidth, vw: window.innerWidth };
        });
        if (!pop) errors.push("term pop-up did not open");
        else {
          if (!pop.visible) errors.push("term pop-up not visible");
          if (!pop.inside) errors.push("term pop-up outside the viewport");
          if (!pop.dialog || !pop.focusIn || !pop.expanded) errors.push("term pop-up: role, focus or aria-expanded wrong");
          if (pop.sw > pop.vw) errors.push(`term pop-up causes sideways scroll ${pop.sw}/${pop.vw}`);
        }
        await page.keyboard.press("Escape");
        await page.waitForTimeout(100);
        const back = await page.evaluate(() => ({ closed: !document.querySelector(".termpop"), onTerm: document.activeElement === document.querySelector("main [data-term]") }));
        if (!back.closed || !back.onTerm) errors.push("Esc did not close the term pop-up and return focus to the term");
      }
      const bad = sw > vw || errors.length;
      if (bad) failures++;
      console.log(`${bad ? "FAIL" : "ok  "} ${name.padEnd(28)} scroll ${sw}/${vw}${errors.length ? "  errors: " + errors.join(" | ") : ""}`);
    }
    await ctx.close();
  }
}
await browser.close();
server.close();
process.exit(failures ? 1 : 0);
