// Client-safe formatting for the indicator field (components/charts/IndicatorField.tsx and the Macro Watch page).

const MINUS = "−";

/** A value in its own unit, Indian grouping: ₹ for the rupee, % for a yield, $ for Brent, signed ₹ crore for flows. */
export function fieldValue(kind: "inr" | "pct" | "usd" | "crore", v: number) {
  const two = (x: number) => x.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (kind === "inr") return "₹" + two(v);
  if (kind === "pct") return two(v) + "%";
  if (kind === "usd") return "$" + two(v);
  return (v > 0 ? "+" : v < 0 ? MINUS : "") + "₹" + Math.abs(Math.round(v)).toLocaleString("en-IN") + " cr";
}
