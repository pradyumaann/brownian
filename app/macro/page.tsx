import type { Metadata } from "next";
import { B } from "@/data";
import { Chip } from "@/components/Chip";
import { DataTable } from "@/components/DataTable";
import { S, Section, ViewHead } from "@/components/Section";
import { Src } from "@/components/Src";
import { Term } from "@/components/Term";
import { CpiBand } from "@/components/charts/CpiBand";

export const metadata: Metadata = { title: "Macro Watch" };

const indName = (n: string) =>
  n.startsWith("CPI") ? <Term id="cpi">{n}</Term>
  : n.startsWith("WPI") ? <Term id="wpi">{n}</Term>
  : n.startsWith("RBI") ? <Term id="repo">{n}</Term>
  : n.startsWith("PPI") ? <Term id="ppi">{n}</Term>
  : n;

const na = (v: string) => (v === "n/a" ? <span className="bw-na">n/a</span> : v);

export default function Macro() {
  const { sep, oct, food, forecast } = B.cpi;
  return (
    <>
      <ViewHead title={<>The macro <S>backdrop</S></>} feature="Macro Watch"
        lede="Economic indicators, and the dates that can move your portfolio. Times in IST." />

      <div className="pair">
        <div>
          <h3 className="sub">CPI crossed the 6% upper limit<Src k={["W8", "W10"]} /></h3>
          <CpiBand sep={sep} oct={oct} food={food} />
          <p className="note after-plot">October CPI came in at <b>{oct}%</b>, up from {sep}% in September and above the {forecast}% forecast. It is the first breach of the RBI&apos;s 6% upper limit since October 2024. Food inflation hit {food}%.</p>
          <p className="note after-plot">Why it matters: with inflation above the band, the RBI is more likely to keep raising rates at its 2–4 Dec meeting. That pressures bond-fund NAVs and rate-sensitive stocks, and can lift new FD rates.</p>
        </div>
        <div>
          <h3 className="sub">US October PPI and four Fed speakers<Src k={["W13", "W14"]} /></h3>
          <DataTable stack head={[["IST"], ["Event"], ["Forecast", "r"], ["Previous", "r"]]}
            rows={B.ppi.map((r) => [<span key="t" className="bw-mono nw">{r[0]}</span>, r[1].includes("PPI") ? <Term key="e" id="ppi">{r[1]}</Term> : r[1], r[2], r[3]])} />
          <p className="note after-plot">A hotter-than-forecast PPI would firm up the December Fed hike, push US yields higher and add pressure on the rupee and FII flows.</p>
        </div>
      </div>

      <Section title={<>Indicators to <S>watch</S></>} meta="Latest reading, what's next, and how to read it" ix="01">
        <DataTable stack head={[["Indicator"], ["Latest", "r"], ["Previous"], ["Detail"], ["Next"], ["How to read it"], ["Region"]]}
          rows={B.indicators.map((r) => [
            <b key="n">{indName(r[1])}<Src k={r[8] ? [r[8]] : []} /></b>,
            na(r[2]), na(r[3]), na(r[4]), na(r[5]), r[6], <Chip key="r">{r[0]}</Chip>,
          ])} />
      </Section>

      <Section title={<>Dates that can move your <S>portfolio</S></>} meta="Calendar · IST · ● today" ix="02">
        <ul className="tl">
          {B.events.map((e) => (
            <li key={e.w + e.t} className={e.today ? "today" : undefined}>
              <span className="when">{e.w}</span>
              <div>
                <div className="t">{e.t}{e.chip && <Chip tone={e.chip[1]}>{e.chip[0]}</Chip>}</div>
                {e.d && <p className="d">{e.d}</p>}
              </div>
            </li>
          ))}
        </ul>
        <p className="bw-meta">Dates from the brief and web calendars<Src k={["W1", "W13", "W15", "W16", "W17", "W19"]} />.</p>
      </Section>
    </>
  );
}
