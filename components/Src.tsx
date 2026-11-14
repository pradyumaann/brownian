import { B } from "@/data";

const NAMES: Record<string, string> = Object.fromEntries([
  ...B.sources.map(([n], i) => ["S" + (i + 1), n] as const),
  ...B.web.map(([k, n]) => [k, n] as const),
]);

/** Source tags. Every figure carries one; the Sheet opens the source on click. */
export function Src({ k }: { k?: string[] }) {
  if (!k?.length) return null;
  return (
    <>
      {k.map((s) => (
        <button key={s} type="button" className="bw-src" data-src={s} aria-label={`Source ${s}: ${NAMES[s] ?? "unknown"}`}>
          {s}
        </button>
      ))}
    </>
  );
}
