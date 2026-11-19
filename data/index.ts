import { brief as fallback } from "./2026-11-13";
import latest from "./latest.json";
import type { Brief } from "./types";

// The brief the app renders: the newest published record fetched at build time (scripts/fetch-brief.mjs
// writes data/latest.json), or the hand-built 2026-11-13 brief when none has been fetched.
// data/latest.json is `null` in the repo; only a build with Supabase configured overwrites it.
export const B: Brief = (latest as unknown as Brief | null) ?? fallback;
export type { Brief, Tone, Rich } from "./types";
