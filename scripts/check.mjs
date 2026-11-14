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
    for (const r of ROUTES) {
      errors.length = 0;
      await page.goto(base + r, { waitUntil: "networkidle" });
      await page.waitForTimeout(150);
      const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: window.innerWidth }));
      const name = `${theme}-${width}-${r === "/" ? "brief" : r.replaceAll("/", "")}`;
      await page.screenshot({ path: join(SHOTS, name + ".png"), fullPage: true });
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
