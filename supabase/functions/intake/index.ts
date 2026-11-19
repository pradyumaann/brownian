// Supabase Edge Function: the intake endpoint for the morning routine. All logic is in ../_shared/intake.ts.
// Secrets (set with `supabase secrets set`, never in the repo): INTAKE_KEY, and optionally VERCEL_DEPLOY_HOOK.
// SUPABASE_URL and the service key are provided by Supabase; the service key is used only here, never in the site build.
import { handleIntake } from "../_shared/intake.ts";

declare const Deno: { env: { get(k: string): string | undefined }; serve(h: (r: Request) => Response | Promise<Response>): void };

Deno.serve((req) =>
  handleIntake(req, {
    INTAKE_KEY: Deno.env.get("INTAKE_KEY") ?? "",
    SUPABASE_URL: Deno.env.get("SUPABASE_URL") ?? "",
    SERVICE_KEY: Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    VERCEL_DEPLOY_HOOK: Deno.env.get("VERCEL_DEPLOY_HOOK") || undefined,
  })
);
