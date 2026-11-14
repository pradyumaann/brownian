import type { Rich as RichT } from "@/data/types";
import { Src } from "./Src";
import { Term } from "./Term";

export function Rich({ r }: { r: RichT }) {
  return (
    <>
      {r.map((s, i) =>
        typeof s === "string" ? s
        : "b" in s ? <b key={i}>{s.b}</b>
        : "src" in s ? <Src key={i} k={s.src} />
        : <Term key={i} id={s.term}>{s.label}</Term>,
      )}
    </>
  );
}
