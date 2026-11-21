import { brief as fallback } from "./2026-11-13";
import latest from "./latest.json";
import type { Brief } from "./types";

// The brief the app renders: the newest published record fetched at build time (scripts/fetch-brief.mjs
// writes data/latest.json), or the hand-built 2026-11-13 brief when none has been fetched.
// data/latest.json is `null` in the repo; only a build with Supabase configured overwrites it.
const base: Brief = (latest as unknown as Brief | null) ?? fallback;
// Fixed definitions for Portfolio Statistics. They live here so they also reach briefs already stored by the intake endpoint.
const EXTRA_GLOSS: Brief["gloss"] = {
  correlation: ["Correlation", "How closely two series moved together, from −1 (always opposite) through 0 (no link) to 1 (always together). Brownian uses the Pearson correlation of daily % changes. It describes the window shown and says nothing about the next one.", "", "How closely two things moved together, from −1 (opposite) through 0 (no link) to 1 (together). It describes past days only."],
  beta: ["Beta", "How much a series tended to move for each 1% move in Nifty 50 over the window shown. A beta of 0.7 means about 0.7% for each 1%. It describes the past and says nothing about the next move.", "", "How much something tended to move when Nifty 50 moved 1%. A beta of 0.7 means about 0.7%, on past days."],
};
export const B: Brief = { ...base, gloss: { ...EXTRA_GLOSS, ...base.gloss } };
export type { Brief, Tone, Rich } from "./types";
