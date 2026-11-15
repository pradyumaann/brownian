// Chart audit, after `npm run build`: for every chart panel (.bw-plot) on every view, in both themes and at 1280px and
// 400px, check (1) its background is the page's own colour and (2) no mark or label sticks out of the panel.
//   node scripts/audit-plots.mjs [msedge|chrome]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright-core";

const ROOT = resolve("out");
const ROUTES = ["/", "/portfolio/", "/wander/", "/flows/", "/india/", "/global/", "/macro/", "/earnings/", "/developing/", "/learn/"];
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
    for (const route of ROUTES) {
      await page.goto(base + route, { waitUntil: "networkidle" });
      await page.waitForTimeout(250);
      const found = await page.evaluate(() => {
        const ground = getComputedStyle(document.body).backgroundColor, out = [];
        document.querySelectorAll(".bw-plot").forEach((p, i) => {
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
      for (const f of found.out) { problems++; console.log(`FAIL ${theme} ${width} ${route} · ${f.name}\n     ${f.issues.join("\n     ")}`); }
    }
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(problems ? `${problems} problem(s) in ${plots} chart views` : `all ${plots} chart views match the page and stay inside their panels`);
process.exitCode = problems ? 1 : 0;
