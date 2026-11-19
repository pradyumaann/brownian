// node --test supabase/functions/_shared/intake.test.ts   (npm run test:backend)
import { test } from "node:test";
import assert from "node:assert/strict";
import { brief } from "../../../data/2026-11-13.ts";
import { handleIntake, type Env } from "./intake.ts";

const KEY = "test-intake-key";
const URL_ = "https://example.supabase.co";
const HOOK = "https://api.vercel.com/v1/integrations/deploy/test-hook";

/** A tiny stand-in for Supabase's `briefs` table and the Vercel hook. */
function fakeWorld(opts: { failStore?: boolean; failHook?: boolean; failRead?: boolean } = {}) {
  const rows = new Map<string, { status: string; payload: any; validation_report: any }>();
  const calls: string[] = [];
  const fetchFn = (async (input: any, init: any = {}) => {
    const url = String(input);
    const method = init.method ?? "GET";
    if (url.startsWith(HOOK)) { calls.push("hook"); return new Response("{}", { status: opts.failHook ? 500 : 201 }); }
    assert.equal(init.headers.apikey, "service-key");
    if (method === "GET") {
      if (opts.failRead) return new Response("{}", { status: 500 });
      const date = new URL(url).searchParams.get("date")!.replace("eq.", "");
      const r = rows.get(date);
      return new Response(JSON.stringify(r ? [{ status: r.status }] : []), { status: 200 });
    }
    if (opts.failStore) return new Response("{}", { status: 500 });
    for (const row of JSON.parse(init.body)) rows.set(row.date, row);
    calls.push("store");
    return new Response(null, { status: 201 });
  }) as typeof fetch;
  return { rows, calls, fetchFn };
}
const env = (extra: Partial<Env> = {}): Env => ({ INTAKE_KEY: KEY, SUPABASE_URL: URL_, SERVICE_KEY: "service-key", ...extra });
const post = (body: unknown, o: { key?: string; query?: string; method?: string } = {}) =>
  new Request("https://fn.example/intake" + (o.query ?? ""), {
    method: o.method ?? "POST",
    headers: { authorization: `Bearer ${o.key ?? KEY}`, "content-type": "application/json" },
    body: o.method === "GET" ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
const good = () => structuredClone(brief) as unknown as Record<string, any>;

test("only POST is accepted", async () => {
  const w = fakeWorld();
  assert.equal((await handleIntake(post({}, { method: "GET" }), env(), w.fetchFn)).status, 405);
});

test("a missing or wrong key is refused and nothing is stored", async () => {
  const w = fakeWorld();
  assert.equal((await handleIntake(post(good(), { key: "nope" }), env(), w.fetchFn)).status, 401);
  assert.equal((await handleIntake(new Request("https://fn.example/", { method: "POST", body: "{}" }), env(), w.fetchFn)).status, 401);
  assert.equal(w.rows.size, 0);
});

test("an unconfigured endpoint refuses everything", async () => {
  const w = fakeWorld();
  assert.equal((await handleIntake(post(good()), env({ INTAKE_KEY: "" }), w.fetchFn)).status, 500);
});

test("bad JSON is a 400", async () => {
  const w = fakeWorld();
  assert.equal((await handleIntake(post("{not json"), env(), w.fetchFn)).status, 400);
});

test("a valid brief is stored as published and a rebuild is requested", async () => {
  const w = fakeWorld();
  const res = await handleIntake(post(good()), env({ VERCEL_DEPLOY_HOOK: HOOK }), w.fetchFn);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.status, "published");
  assert.equal(body.deploy, "requested");
  assert.equal(w.rows.get("2026-11-13")!.status, "published");
  assert.deepEqual(w.calls, ["store", "hook"]);
});

test("a failed rebuild request does not fail the intake", async () => {
  const w = fakeWorld({ failHook: true });
  const res = await handleIntake(post(good()), env({ VERCEL_DEPLOY_HOOK: HOOK }), w.fetchFn);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).deploy, "failed");
  assert.equal(w.rows.get("2026-11-13")!.status, "published");
});

test("without a hook the brief is published and no rebuild is attempted", async () => {
  const w = fakeWorld();
  const body = await (await handleIntake(post(good()), env(), w.fetchFn)).json();
  assert.equal(body.deploy, "not configured");
  assert.deepEqual(w.calls, ["store"]);
});

test("?mode=staging stores a dry run and never rebuilds", async () => {
  const w = fakeWorld();
  const res = await handleIntake(post(good(), { query: "?mode=staging" }), env({ VERCEL_DEPLOY_HOOK: HOOK }), w.fetchFn);
  assert.equal((await res.json()).status, "staging");
  assert.equal(w.rows.get("2026-11-13")!.status, "staging");
  assert.deepEqual(w.calls, ["store"]);
});

test("an invalid brief is held with its report, and does not rebuild", async () => {
  const w = fakeWorld();
  const b = good(); b.kpis.gift.src = ["S99"];
  const res = await handleIntake(post(b), env({ VERCEL_DEPLOY_HOOK: HOOK }), w.fetchFn);
  const body = await res.json();
  assert.equal(res.status, 422);
  assert.equal(body.status, "held");
  assert.ok(body.errors.some((e: any) => /S99/.test(e.message)));
  const row = w.rows.get("2026-11-13")!;
  assert.equal(row.status, "held");
  assert.ok(row.validation_report.errors.length > 0);
  assert.deepEqual(w.calls, ["store"]);
});

test("a record with no usable date is rejected and not stored", async () => {
  const w = fakeWorld();
  const b = good(); b.date = "tomorrow";
  const res = await handleIntake(post(b), env(), w.fetchFn);
  assert.equal(res.status, 422);
  assert.equal((await res.json()).status, "rejected");
  assert.equal(w.rows.size, 0);
});

test("a held or staging record never overwrites a published day", async () => {
  const w = fakeWorld();
  await handleIntake(post(good()), env(), w.fetchFn);
  const bad = good(); bad.kpis.gift.src = ["S99"];
  const r1 = await handleIntake(post(bad), env(), w.fetchFn);
  assert.equal(r1.status, 422);
  assert.equal((await r1.json()).status, "rejected");
  const r2 = await handleIntake(post(good(), { query: "?mode=staging" }), env(), w.fetchFn);
  assert.equal(r2.status, 422);
  assert.equal(w.rows.get("2026-11-13")!.status, "published");
  assert.equal(w.rows.get("2026-11-13")!.payload.kpis.gift.src[0], brief.kpis.gift.src[0]);
});

test("re-sending a valid brief replaces the published one", async () => {
  const w = fakeWorld();
  await handleIntake(post(good()), env(), w.fetchFn);
  const b = good(); b.dateLabel = "Fri 13 Nov 2026 (corrected)";
  assert.equal((await handleIntake(post(b), env(), w.fetchFn)).status, 200);
  assert.equal(w.rows.get("2026-11-13")!.payload.dateLabel, "Fri 13 Nov 2026 (corrected)");
});

test("database failures are reported, not hidden", async () => {
  assert.equal((await handleIntake(post(good()), env(), fakeWorld({ failStore: true }).fetchFn)).status, 502);
  assert.equal((await handleIntake(post(good()), env(), fakeWorld({ failRead: true }).fetchFn)).status, 502);
});

test("no response ever contains a key", async () => {
  const w = fakeWorld();
  const texts = [
    await (await handleIntake(post(good()), env({ VERCEL_DEPLOY_HOOK: HOOK }), w.fetchFn)).text(),
    await (await handleIntake(post(good(), { key: "bad" }), env(), w.fetchFn)).text(),
  ];
  for (const t of texts) assert.ok(!t.includes(KEY) && !t.includes("service-key") && !t.includes("test-hook"));
});
