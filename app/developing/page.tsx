import type { Metadata } from "next";
import { B } from "@/data";
import { ViewHead, S } from "@/components/Section";
import { More } from "@/components/More";
import { Src } from "@/components/Src";

export const metadata: Metadata = { title: "Developing" };

export default function Developing() {
  return (
    <>
      <ViewHead title={<>Still <S>developing</S></>} feature="Developing"
        lede="Stories that carry over from day to day, with what to watch next." />
      <ol className="st">
        {B.stories.map((s) => (
          <li key={s.t}>
            <span className="chips">
              <span className={`bw-chip ${s.st === "NEW" ? "chip-new" : "tone-plain"}`}>{s.st === "NEW" ? "New" : "Ongoing"}</span>
              {s.day && <span className="bw-chip tone-plain">{s.day}</span>}
            </span>
            <div>
              <div className="t">{s.t}</div>
              <p className="m st-why"><b>Why it matters:</b> {s.m}</p>
              <More label="Details" className="st-more">
                <p className="m st-p">{s.p}<Src k={s.src} /></p>
                <p className="m st-watch"><b>Watch:</b> {s.w}</p>
              </More>
            </div>
            <span className="v" />
          </li>
        ))}
      </ol>
    </>
  );
}
