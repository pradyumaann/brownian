// Shared helpers for the history importers: polite fetching, zip reading, CSV in and out, trading days.
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

export const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const HISTORY = join(ROOT, "data", "history");
export const CACHE = join(ROOT, ".cache");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET a URL. Returns a Buffer, or null on 404 (a holiday or a file that was never published). Retries other failures (403/429 with a longer wait). */
export async function get(url, { tries = 4, cache } = {}) {
  if (cache) {
    try { return await readFile(cache); } catch {}
  }
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA, accept: "*/*" }, signal: AbortSignal.timeout(45000) });
      if (res.status === 404) return null;
      if (!res.ok) { const e = new Error(`HTTP ${res.status}`); e.blocked = res.status === 403 || res.status === 429; throw e; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (cache) { await mkdir(dirname(cache), { recursive: true }); await writeFile(cache, buf); }
      return buf;
    } catch (e) {
      if (i === tries) throw new Error(`${url}: ${e.message}`);
      // NSE sometimes refuses a runner for a while (403/429): wait much longer than for a plain failure.
      await sleep((e.blocked ? 15000 : 1500) * i);
    }
  }
}

/** The first file in a zip archive, as text. Reads the central directory, so streamed zips work too. */
export function unzipFirst(buf) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("not a zip file");
  const cd = buf.readUInt32LE(eocd + 16);
  const method = buf.readUInt16LE(cd + 10), size = buf.readUInt32LE(cd + 20), local = buf.readUInt32LE(cd + 42);
  const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
  const data = buf.subarray(start, start + size);
  return (method === 0 ? data : inflateRawSync(data)).toString("utf8");
}

/** Parse CSV text into objects keyed by the header row. Handles quoted fields. */
export function parseCSV(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const out = [];
    let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    rows.push(out.map((s) => s.trim()));
  }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

const esc = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

/** A history table on disk: one CSV, rows unique by `key(row)`, sorted by date. */
export async function loadTable(name) {
  try { return parseCSV(await readFile(join(HISTORY, name), "utf8")); } catch { return []; }
}
export async function saveTable(name, cols, rows, key) {
  const seen = new Map();
  for (const r of rows) seen.set(key(r), r);
  const out = [...seen.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : key(a) < key(b) ? -1 : 1));
  await mkdir(HISTORY, { recursive: true });
  await writeFile(join(HISTORY, name), [cols.join(","), ...out.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n") + "\n");
  return out.length;
}

/** Weekdays from `from` to `to` inclusive (YYYY-MM-DD). Exchange holidays drop out later as 404s. */
export function weekdays(from, to) {
  const out = [];
  for (let t = Date.parse(from + "T00:00:00Z"); t <= Date.parse(to + "T00:00:00Z"); t += 864e5) {
    const d = new Date(t), w = d.getUTCDay();
    if (w !== 0 && w !== 6) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** Today's date in IST. */
export const todayIST = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
export const addDays = (d, n) => new Date(Date.parse(d + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
export const addYears = (d, n) => `${Number(d.slice(0, 4)) + n}${d.slice(4)}`;

const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
export const parts = (d) => ({ y: d.slice(0, 4), m: d.slice(5, 7), dd: d.slice(8, 10), mon: MON[Number(d.slice(5, 7)) - 1] });

/** Run `fn` over items with limited concurrency and a small gap between requests. */
export async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); await sleep(120); }
  }));
  return out;
}

export async function exists(p) { try { await stat(p); return true; } catch { return false; } }
export const num = (s) => { const v = Number(String(s).replace(/,/g, "")); return s === "" || s == null || !Number.isFinite(v) ? null : v; };
export const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
