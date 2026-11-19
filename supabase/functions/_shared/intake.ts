// The intake endpoint's logic: authenticate, validate, store, trigger a rebuild. Pure functions of (request, env, fetch),
// so it runs under Deno (the Edge Function) and Node (tests: `npm run test:backend`).
//
//   POST <function url>[?mode=staging]
//   Authorization: Bearer <INTAKE_KEY>
//   Body: the Brief record as JSON (shape: data/types.ts)
//
// Outcomes (HTTP status, `status` in the body):
//   200 published  valid; stored as the published brief for its date; a rebuild is requested (if a hook is configured).
//   200 staging    valid and ?mode=staging; stored for a dry run, never shown on the site.
//   422 held       the record has errors; stored as held for review, never shown.
//   422 rejected   not stored (no usable date, or it would overwrite a published day it must not).
// Only a valid, non-staging record can replace a published one; a held or staging record never does.

import { MAX_BYTES, validateBrief, type Report } from "./validate.ts";

export interface Env {
  INTAKE_KEY: string;
  SUPABASE_URL: string;
  SERVICE_KEY: string;
  VERCEL_DEPLOY_HOOK?: string;
}
type FetchFn = typeof fetch;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a), y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

// What the database said when a call failed (a status and PostgREST's code and message; never a key). Only a caller holding
// the intake key reaches this, so the detail helps the owner fix a setup problem.
async function upstream(res: Response) {
  let code: unknown, message: unknown;
  try { const j = await res.json(); code = j?.code; message = j?.message; } catch { /* not JSON */ }
  return { status: res.status, code, message };
}

const slim = (r: Report) => ({ errors: r.errors, warnings: r.warnings });

export async function handleIntake(req: Request, env: Env, fetchFn: FetchFn = fetch): Promise<Response> {
  if (req.method !== "POST") return json(405, { ok: false, error: "Use POST." });
  if (!env.INTAKE_KEY || !env.SUPABASE_URL || !env.SERVICE_KEY) return json(500, { ok: false, error: "The endpoint is not configured." });

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !safeEqual(token, env.INTAKE_KEY)) return json(401, { ok: false, error: "Unauthorised." });

  const text = await req.text();
  if (text.length > MAX_BYTES * 2) return json(413, { ok: false, error: "Record is too large." });
  let record: unknown;
  try { record = JSON.parse(text); } catch { return json(400, { ok: false, error: "Body is not valid JSON." }); }

  const mode = new URL(req.url).searchParams.get("mode") === "staging" ? "staging" : "publish";
  const report = validateBrief(record);
  const date = typeof (record as { date?: unknown } | null)?.date === "string" ? (record as { date: string }).date : "";
  const hasDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && !report.errors.some((e) => e.path === "date");

  if (!hasDate) return json(422, { ok: false, status: "rejected", reason: "No valid date, so the record cannot be filed.", ...slim(report) });

  const status = !report.ok ? "held" : mode === "staging" ? "staging" : "published";
  const base = env.SUPABASE_URL.replace(/\/+$/, "") + "/rest/v1/briefs";
  const headers = { apikey: env.SERVICE_KEY, Authorization: `Bearer ${env.SERVICE_KEY}` };

  try {
    const cur = await fetchFn(`${base}?select=status&date=eq.${date}`, { headers });
    if (!cur.ok) return json(502, { ok: false, error: "Could not read the database.", upstream: await upstream(cur) });
    const existing = (await cur.json()) as { status: string }[];
    if (existing[0]?.status === "published" && status !== "published") {
      return json(422, {
        ok: false, status: "rejected", date,
        reason: `A published brief for ${date} exists and is kept; this ${status} record was not stored.`, ...slim(report),
      });
    }
    const put = await fetchFn(`${base}?on_conflict=date`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify([{ date, payload: record, status, validation_report: slim(report) }]),
    });
    if (!put.ok) return json(502, { ok: false, error: "Could not store the record.", upstream: await upstream(put) });
  } catch {
    return json(502, { ok: false, error: "The database could not be reached." });
  }

  if (status === "held") return json(422, { ok: false, status, date, ...slim(report) });

  let deploy = "not configured";
  if (status === "published" && env.VERCEL_DEPLOY_HOOK) {
    try { deploy = (await fetchFn(env.VERCEL_DEPLOY_HOOK, { method: "POST" })).ok ? "requested" : "failed"; } catch { deploy = "failed"; }
  }
  return json(200, { ok: true, status, date, deploy, warnings: report.warnings });
}
