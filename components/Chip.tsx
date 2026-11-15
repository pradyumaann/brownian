import type { Tone } from "@/data/types";

/** Status chip: a word, never colour alone. */
export function Chip({ tone = "plain", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`bw-chip tone-${tone}`}>{children}</span>;
}

const DIR = { up: ["▲ Tailwind", "gain"], down: ["▼ Headwind", "loss"], mixed: ["◆ Mixed", "mixed"] } as const;
export function DirChip({ d }: { d: "up" | "down" | "mixed" }) {
  const [t, tone] = DIR[d];
  return <Chip tone={tone}>{t}</Chip>;
}
