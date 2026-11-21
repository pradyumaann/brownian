import type { Rich as RichT } from "@/data/types";
import { Src } from "./Src";
import { Term } from "./Term";

/** Rich text. The last word before a source tag stays on the same line as the tag, so a tag is never alone on a line. */
export function Rich({ r }: { r: RichT }) {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < r.length; i++) {
    const s = r[i], next = r[i + 1];
    if (typeof s === "string") {
      const m = next && typeof next === "object" && "src" in next ? s.match(/^([\s\S]*?)(\S+)$/) : null;
      if (m && next && typeof next === "object" && "src" in next) {
        if (m[1]) out.push(m[1]);
        out.push(<span key={i} className="nw">{m[2]}<Src k={next.src} /></span>);
        i++;
      } else out.push(s);
    } else if ("b" in s) out.push(<b key={i}>{s.b}</b>);
    else if ("src" in s) out.push(<Src key={i} k={s.src} />);
    else out.push(<Term key={i} id={s.term}>{s.label}</Term>);
  }
  return <>{out}</>;
}
