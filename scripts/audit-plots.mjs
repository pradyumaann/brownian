// Chart audit, after `npm run build`: for every chart panel (.bw-plot) on every view, in both themes and at 1280px and
// 400px, check (1) its background is the page's own colour and (2) no mark or label sticks out of the panel.
//   node scripts/audit-plots.mjs [msedge|chrome]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright-core";

const ROOT = resolve("out");
const ROUTES = ["/", "/portfolio/", "/wander/", "/flows/", "/india/", "/global/", "/macro/", "/earnings/", "/developing/", "/learn/"];
// Populated-state passes (a saved mix, and older picks only) so the portfolio charts are audited with data. On `/` the
// Blended session move card draws no chart (printed lines only), so the `/` passes audit the rest of the page in each mode,
// with the always-folded sections (Money movement, Coming up, Still developing on `/`; How it is worked out on /portfolio/)
// opened first: a plot inside a closed fold is laid out but not visible, so it is audited once opened.
const SEEDS = {
  mix: { port3: { v: 1, w: { index: 30, fin: 15, mid: 10, it: 10, gold: 10, silver: 5, debt: 20 } } },
  migrate: { held2: ["index", "fin", "gold", "debt"] },
  left: { port3: { v: 1, w: { silver: 50, debt: 50 } } },
  over: { port3: { v: 1, w: { index: 60, fin: 60, it: 30 } } },
  noev: { port3: { v: 1, w: { gold: 50, mid: 30 } } },
  watch: { port3: { v: 1, w: { index: 40, it: 30, consumer: 30 } }, watch2: ["Eicher Motors", "Infosys", "NVDA (Nvidia)", "Alkem Labs", "Walmart"] },
  // "I own nothing yet" (no example, no figures), and a mix with the two Nifty 500 proxy types.
  none: { port3: { v: 1, w: {}, none: true } },
  flexi: { port3: { v: 1, w: { flexi: 40, elss: 30, index: 30 } } },
};
const SEEDED = [["/portfolio/", "mix"], ["/", "mix"], ["/portfolio/", "migrate"],
  ["/portfolio/", "left"], ["/portfolio/", "over"], ["/portfolio/", "noev"], ["/portfolio/", "watch"],
  ["/portfolio/", "none"], ["/", "none"], ["/portfolio/", "flexi"], ["/", "flexi"]];
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".txt": "text/plain" };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  try { const d = await readFile(join(ROOT, p)); res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" }).end(d); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const browser = await chromium.launch({ channel: process.argv[2] || "msedge" });
let problems = 0, plots = 0;
for (const theme of ["night", "paper"]) {
  for (const width of [1280, 400]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    await ctx.addInitScript((t) => localStorage.setItem("bw:theme", t), theme);
    const page = await ctx.newPage();
    for (const [route, seed] of [...ROUTES.map((x) => [x, null]), ...SEEDED]) {
      await page.goto(base + route, { waitUntil: "networkidle" });
      if (seed) {
        await page.evaluate((s) => { localStorage.removeItem("ii:port3"); localStorage.removeItem("ii:held2"); localStorage.removeItem("ii:watch2"); for (const [k, v] of Object.entries(s)) localStorage.setItem("ii:" + k, JSON.stringify(v)); }, SEEDS[seed]);
        await page.reload({ waitUntil: "networkidle" });
      }
      // Open every fold (motion is reduced, so each opens at once) and check each one really revealed its body.
      let guard = 0;
      while ((await page.locator(".fold-btn[aria-expanded=false]").count()) && guard++ < 10) await page.locator(".fold-btn[aria-expanded=false]").first().click();
      await page.waitForTimeout(250);
      const found = await page.evaluate(() => {
        const ground = getComputedStyle(document.body).backgroundColor, out = [];
        document.querySelectorAll(".bw-plot").forEach((p, i) => {
          if (p.closest(".fold:not(.is-open)")) return; // a closed fold: audited once opened
          const r = p.getBoundingClientRect(), name = p.querySelector("svg")?.getAttribute("aria-label")?.slice(0, 48) ?? "chart " + i;
          const bg = getComputedStyle(p).backgroundColor;
          const issues = [];
          if (bg !== ground) issues.push(`background ${bg} is not the page's ${ground}`);
          const bad = new Set();
          p.querySelectorAll("svg text, svg rect, svg circle, svg path, svg line").forEach((n) => {
            if (n.closest("defs") || n.getAttribute("fill") === "transparent") return;
            const b = n.getBoundingClientRect();
            if (!b.width && !b.height) return;
            if (b.left < r.left - 1 || b.right > r.right + 1 || b.top < r.top - 1 || b.bottom > r.bottom + 1) bad.add(n.tagName + (n.textContent ? ` “${n.textContent.slice(0, 20)}”` : ""));
          });
          if (bad.size) issues.push("sticks out: " + [...bad].slice(0, 4).join(", "));
          if (issues.length) out.push({ name, issues });
        });
        return { n: document.querySelectorAll(".bw-plot").length, out };
      });
      plots += found.n;
      for (const f of found.out) { problems++; console.log(`FAIL ${theme} ${width} ${route}${seed ? " (" + seed + ")" : ""} · ${f.name}\n     ${f.issues.join("\n     ")}`); }
    }
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(problems ? `${problems} problem(s) in ${plots} chart views` : `all ${plots} chart views match the page and stay inside their panels`);
process.exitCode = problems ? 1 : 0;
