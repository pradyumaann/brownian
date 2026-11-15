import type { Metadata } from "next";
import { B } from "@/data";
import { ViewHead, S } from "@/components/Section";
import { Src } from "@/components/Src";

export const metadata: Metadata = { title: "Developing" };

export default function Developing() {
  return (
    <>
      <ViewHead title={<>Still <S>developing</S></>} feature="Developing"
        lede="Stories that carry over from day to day, with what to watch next. Day counts build up as briefs accumulate." />
      <ol className="st">
        {B.stories.map((s) => (
          <li key={s.t}>
            <span className="chips">
              <span className={`bw-chip ${s.st === "NEW" ? "chip-new" : "tone-plain"}`}>{s.st === "NEW" ? "New" : "Ongoing"}</span>
              {s.day && <span className="bw-chip tone-plain">{s.day}</span>}
            </span>
            <div>
              <div className="t">{s.t}</div>
              <p className="m">{s.p}<Src k={s.src} /></p>
              <p className="m"><b>Why it matters:</b> {s.m}</p>
              <p className="m"><b>Watch:</b> {s.w}</p>
            </div>
            <span className="v" />
          </li>
        ))}
      </ol>
    </>
  );
}
