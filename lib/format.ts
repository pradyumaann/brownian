import type { Tone } from "@/data/types";

const MINUS = "−";

/** A headline figure without a trailing note such as "(implied)" or "(est.)": the note belongs in the label or the lede. */
export const plainValue = (v: string) => v.replace(/\s*\((?:implied|est\.?|estimated)\)\s*$/i, "");

const NBSP = "\u00a0", WJ = "\u2060";
/** Keeps a figure with its unit or sign when a line breaks ("4,860 cr", "- ₹4,859.80") and stops a range such as 12–14% splitting
 *  at its dash. Display only: it changes spaces, never words or numbers. */
export const bindUnits = (s: string) => s
  .replace(/(\d) (cr|pts?|bps?|bp|%)(?![A-Za-z0-9])/g, `$1${NBSP}$2`)
  .replace(/(^|[\s(])([−–-]) (?=[₹$]?\d)/g, `$1$2${NBSP}`)
  .replace(/(\d)(–)(?=[₹$]?\d)/g, `$1$2${WJ}`)
  .replace(/([+−–-])(?=[₹$]\d)/g, `$1${WJ}`);

/** ₹ crore with Indian grouping and a true minus: +₹7,831 cr / −₹6,331 cr. */
export const crore = (v: number, signed = true) =>
  (v < 0 ? MINUS : signed && v > 0 ? "+" : "") + "₹" + Math.abs(Math.round(v)).toLocaleString("en-IN") + " cr";

export const pct = (v: number, dp = 2) => (v > 0 ? "+" : v < 0 ? MINUS : "") + Math.abs(v).toFixed(dp) + "%";

/** Tone from a printed change: a leading + is a gain, a minus is a loss, anything else is plain. */
export const toneOf = (s: string): Tone => {
  const m = s.match(/[+−-]/);
  return !m ? "plain" : m[0] === "+" ? "gain" : "loss";
};

export const arrow = (t: Tone) => (t === "gain" ? "▲ " : t === "loss" ? "▼ " : "");
