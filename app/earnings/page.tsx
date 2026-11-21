import type { Metadata } from "next";
import { B } from "@/data";
import { Chip } from "@/components/Chip";
import { DataTable } from "@/components/DataTable";
import { S, Section, ViewHead } from "@/components/Section";
import { Src } from "@/components/Src";
import { Term } from "@/components/Term";

export const metadata: Metadata = { title: "Earnings Radar" };

export default function Earnings() {
  return (
    <>
      <ViewHead title={<>Results <S>season</S></>} feature="Earnings Radar"
        lede="Who reports when, what has already reported, and how to read a results day." />

      <p className="note"><b>Results deadline</b> {B.erDeadline}<Src k={["W3"]} /></p>

      <Section title={<>Reporting <S>now</S></>} meta="India · board-meeting dates" ix="01">
        <div className="pair">
          <div>
            <h3 className="sub">Today, {B.dateShort}<Src k={["W1", "W2"]} /></h3>
            {B.erToday.length > 0 && <DataTable head={[["Company"], ["Sector"], ["Context"]]} rows={B.erToday.map((r) => [<b key="c">{r[0]}</b>, r[1], r[2]])} />}
            <p className="bw-meta">{B.erTodayMore}</p>
          </div>
          <div>
            <h3 className="sub">Tomorrow<Src k={["W1", "W2"]} /></h3>
            {B.erTom.length > 0 ? <DataTable head={[["Company"], ["Sector"], ["Context"]]} rows={B.erTom.map((r) => [<b key="c">{r[0]}</b>, r[1], r[2]])} /> : <p className="bw-meta">No major Indian results found.</p>}
          </div>
        </div>
      </Section>

      <Section title={<>Global earnings <S>ahead</S></>} meta={<>United States · upcoming results · <Term id="bmo">BMO</Term> = before US open (evening IST), AMC = after US close (early next morning IST)<Src k={["W4", "W6", "W7"]} /></>} ix="02">
        <DataTable stack head={[["Date"], ["Company"], ["Timing"], ["Why it matters"], ["Impact"]]}
          rows={B.erUS.map((r) => [<span key="d" className="bw-mono nw">{r[0]}</span>, <b key="c">{r[1]}</b>, r[2], r[3], r[4] ? <Chip key="i" tone="loss">High impact</Chip> : ""])} />
      </Section>

      <Section title={<>Already <S>reported</S></>} meta="Results scorecard" ix="03">
        <DataTable stack head={[["Company"], ["Reaction", "r"], ["What they reported"], ["Market"]]}
          rows={B.erDone.map((r) => [<b key="c">{r[0]}</b>, <span key="re" className={`tone-${r[4]}`}>{r[3] || <span className="bw-na">n/a</span>}</span>, r[2], <Chip key="m">{r[1]}</Chip>])} />
      </Section>

      <Section title={<>Expectations beat <S>headlines</S></>} meta={<>How to read a results day · the stock reacts to expectations and <Term id="guidance">guidance</Term>, not just the headline number</>} ix="04">
        <div className="three">
          {B.erLessons.map(([h, t]) => (
            <div key={h} className="take"><h3>{h}</h3><p>{t}</p></div>
          ))}
        </div>
      </Section>
    </>
  );
}
