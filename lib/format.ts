import type { Tone } from "@/data/types";

const MINUS = "−";

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
