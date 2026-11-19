// Build-time step: fetch the newest published brief from Supabase and save it to data/latest.json,
// which data/index.ts prefers over the hand-built fallback.
//
// Needs two environment variables (set them in Vercel, never in the repo):
//   SUPABASE_URL              https://<project-ref>.supabase.co
//   SUPABASE_PUBLISHABLE_KEY  the project's publishable (anon) key. Safe to expose; RLS limits it
//                             to rows with status = 'published' (see docs/backend-setup.md).
//
// Behaviour:
//   - variables not set     -> do nothing; the committed fallback stays (local builds, previews).
//   - request fails         -> exit 1, so the build fails and the host keeps serving the previous deploy.
//   - no published row yet  -> warn and keep the fallback.
//   - row found but invalid -> exit 1 (a malformed record must never replace a good site).

import { writeFile } from "node:fs/promises";

const url = (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
const out = new URL("../data/latest.json", import.meta.url);

if (!url || !key) {
  console.log("[fetch-brief] SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY not set; using the committed fallback brief.");
  process.exit(0);
}

const endpoint = `${url}/rest/v1/briefs?select=date,payload&status=eq.published&order=date.desc&limit=1`;

let res;
try {
  res = await fetch(endpoint, { headers: { apikey: key } });
} catch (e) {
  console.error(`[fetch-brief] request failed: ${e.message}`);
  process.exit(1);
}
if (!res.ok) {
  console.error(`[fetch-brief] Supabase answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}

const rows = await res.json();
if (!Array.isArray(rows) || rows.length === 0) {
  console.warn("[fetch-brief] no published brief in the database yet; using the committed fallback brief.");
  process.exit(0);
}

const { date, payload } = rows[0];
const REQUIRED = ["date", "dateLabel", "briefDate", "sessionDate", "lede", "kpis", "pressure", "flows", "sources"];
const missing = REQUIRED.filter((k) => payload == null || payload[k] === undefined);
if (missing.length) {
  console.error(`[fetch-brief] brief ${date} is missing: ${missing.join(", ")}. Not using it.`);
  process.exit(1);
}

await writeFile(out, JSON.stringify(payload));
console.log(`[fetch-brief] using the published brief for ${date} (${payload.briefDate}).`);
