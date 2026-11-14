import type { Tone } from "@/data/types";
import { arrow, toneOf } from "@/lib/format";

/** A printed change: sign, ▲/▼ and colour together. Empty values print nothing; unknown ones print n/a. */
export function Change({ v, tone }: { v: string; tone?: Tone }) {
  if (!v) return null;
  if (v === "n/a") return <span className="bw-na">n/a</span>;
  const t = tone ?? toneOf(v);
  return <span className={`bw-mono tone-${t}`}>{arrow(t)}{v}</span>;
}
