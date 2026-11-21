import type { Tone } from "@/data/types";
import { arrow, toneOf } from "@/lib/format";

/** A printed change: sign, ▲/▼ and colour together. Empty values print nothing; unknown ones print n/a. */
export function Change({ v, tone, neutral }: { v: string; tone?: Tone; /** Keep the sign and ▲/▼ but no gain or loss colour (USD/INR, where up is a weaker rupee). */ neutral?: boolean }) {
  if (!v) return null;
  if (v === "n/a") return <span className="bw-na">n/a</span>;
  const t = tone ?? toneOf(v);
  return <span className={`bw-mono tone-${neutral ? "mixed" : t}`}>{arrow(t)}{v}</span>;
}
