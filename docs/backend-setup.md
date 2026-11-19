# Backend setup (Supabase + Vercel)

How the site gets its daily brief. Plan: one record per day in Supabase, read at build time.

## Flow

1. The morning routine produces a `Brief` record (shape: `data/types.ts`) and sends it to the backend (not built yet; Phase 1).
2. The backend validates it and stores it in `public.briefs` (`status` is `published`, `held` or `staging`).
3. At build time `npm run build` runs `scripts/fetch-brief.mjs` (`prebuild`), which reads the newest `published` row and writes it to `data/latest.json`.
4. `data/index.ts` exports `B` as `data/latest.json` when it holds a brief, otherwise the hand-built `data/2026-11-13.ts`.

`data/latest.json` is `null` in the repo. Do not commit a fetched brief.

## Build environment variables (Vercel, Production only; set 19 Nov 2026)

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | the project's publishable (anon) key; safe to expose |

Without them the build uses the fallback. If they are set and Supabase cannot be reached, or the newest brief is malformed, the build fails and Vercel keeps serving the previous deployment.

## Database access

Row-level security is on for every table with no public policies, except one read rule so the build can fetch the published brief with the publishable key:

```sql
grant select on public.briefs to anon;
create policy "published briefs are readable" on public.briefs
  for select to anon using (status = 'published');
```

Held and staging rows stay private. Writes go through the backend with the service key (never in Vercel's build environment, never in the repo).

## Intake endpoint (Phase 1)

The morning routine sends each day's record to a Supabase Edge Function (`supabase/functions/intake`, logic in `supabase/functions/_shared/intake.ts`).

```
POST https://pdnzxjxqpnaaqqzqtizx.supabase.co/functions/v1/intake            publish
POST https://pdnzxjxqpnaaqqzqtizx.supabase.co/functions/v1/intake?mode=staging   dry run (never shown on the site)
Authorization: Bearer <INTAKE_KEY>
Body: the Brief record as JSON (shape: data/types.ts)
```

| Result | Meaning |
|---|---|
| 200 `published` | Valid. Stored as the day's published brief; a rebuild is requested if `VERCEL_DEPLOY_HOOK` is set. |
| 200 `staging` | Valid and `?mode=staging`. Stored, not shown. |
| 422 `held` | Has errors. Stored with its report for review, never shown. |
| 422 `rejected` | Not stored: no usable date, or it would replace a published day (only a valid, non-staging record can). |
| 401 / 400 / 413 / 405 | Wrong key, bad JSON, too large, not POST. |

`supabase/functions/_shared/validate.ts` holds the rules (structure, source tags that exist, tones, dates, number ranges, cross-references, no advice/tip language). `npm run test:backend` runs the tests; the 13 Nov brief is the known-good record.

Secrets (Supabase function secrets, never in the repo): `INTAKE_KEY` (the routine's key), `VERCEL_DEPLOY_HOOK` (optional). `SUPABASE_URL` and the service key are provided by Supabase to the function; the service key is never in Vercel or the repo.

Deploy (needs a Supabase login): `npx supabase login`, then `npx supabase functions deploy intake --project-ref pdnzxjxqpnaaqqzqtizx`, then `npx supabase secrets set INTAKE_KEY=<random value> --project-ref pdnzxjxqpnaaqqzqtizx`.
