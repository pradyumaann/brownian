import type { Metadata } from "next";
import { B } from "@/data";
import { Chip } from "@/components/Chip";
import { Fold } from "@/components/Fold";
import { EventRail } from "@/components/EventRail";
import { DataTable } from "@/components/DataTable";
import { S, Section, ViewHead } from "@/components/Section";
import { Src } from "@/components/Src";
import { Term } from "@/components/Term";
import { CpiBand } from "@/components/charts/CpiBand";
import { IndicatorField } from "@/components/charts/IndicatorField";
import { fieldValue } from "@/lib/fieldValue";
import { ReleaseMetrics } from "@/components/charts/ReleaseMetrics";
import { IMPACT } from "@/lib/impact";
import { More } from "@/components/More";
import { indicatorField } from "@/lib/indicatorField";
import type { Tone } from "@/data/types";

export const metadata: Metadata = { title: "Macro Watch" };

const field = indicatorField(B.sessionDate);
// The brief's own reading of each field indicator (its tone in the indicators table), written out in words.
const FIELD_ROW: Record<string, string> = { usdinr: "USD/INR", fpi: "FII net flows", us10y: "10Y Treasury", brent: "Brent" };
const fieldTone = (id: string): Tone | undefined => B.indicators.find((r) => r[1].startsWith(FIELD_ROW[id]))?.[7];
const fxBrief = B.indicators.find((r) => r[1] === "USD/INR");
const dxyBrief = B.macro.find((r) => r[0] === "Dollar index");
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dmy = (d: string) => `${Number(d.slice(8))} ${MON[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;

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

      <div className="solo">
        <h3 className="sub">India CPI inflation<Src k={["W8", "W10"]} /></h3>
        <CpiBand sep={sep} oct={oct} food={food} />
        <p className="note after-plot">Latest CPI inflation is <b>{oct}%</b>, against {sep}% in the previous reading and a {forecast}% forecast. Food inflation is {food}%. The RBI&apos;s tolerance band is 2–6%.</p>
      </div>

      <Section title={<>Indicators to <S>watch</S></>} meta="Where each reading sits in its own five years, the releases against forecast, and what's next" ix="01">
        <h3 className="sub">Indicators against their own five years<Src k={["D5", "D4"]} /></h3>
        <IndicatorField rows={field.rows} from={field.from} to={field.to} />
        <ul className="ifield-key">
          {field.rows.map((r) => {
            const t = fieldTone(r.id);
            return (
              <li key={r.id}>
                <b>{r.name}</b>
                <span className="bw-mono">{fieldValue(r.kind, r.last.v)}<Src k={r.src} /></span>
                <span className="m">{r.kind === "crore" ? `${r.last.label} to ${dmy(r.last.date)}` : `close ${dmy(r.last.date)}`} · above {Math.round(r.last.rank)}% of five years</span>
                {t && IMPACT[t] && <Chip tone={t}>{IMPACT[t]}</Chip>}
              </li>
            );
          })}
        </ul>
        <p className="bw-meta">The dollar index and gold are also on Global Cues<Src k={["S11"]} />. This ranking is context only: it does not change the Macro pressure score. Interpretation, not a forecast.</p>
        <p className="bw-meta after-plot">Yahoo Finance and NSDL closes, {dmy(field.from)} to {dmy(field.to)}; levels are ranked among the window&apos;s daily closes, flows among its weeks or months, and a week or month still open is marked to date. They can differ from the provisional figures in the table below (USD/INR {fxBrief?.[2]}<Src k={fxBrief?.[8] ? [fxBrief[8]] : []} />; Dollar index {dxyBrief?.[1]}<Src k={["S11"]} />).</p>
      </Section>

      <Fold id="releases" title={<>Releases: latest against forecast and the <S>previous print</S></>} ix="02"
        summary={`${B.releases.length} releases, each against its forecast and the previous print, with our reading`}>
        <p className="bw-meta">Sources<Src k={["W8", "W11", "W13", "W15", "S11"]} /></p>
          <ReleaseMetrics rows={B.releases} />
          <p className="bw-meta after-plot">The notes for India are our reading. Interpretation, not a forecast.</p>

          <More label={`All ${B.indicators.length} indicators, with what's next`} className="ind-more">
            <DataTable stack head={[["Indicator"], ["Latest", "r"], ["Previous"], ["Detail"], ["Next"], ["How to read it"], ["Region"]]}
              rows={B.indicators.map((r) => [
                <b key="n">{indName(r[1])}<Src k={r[8] ? [r[8]] : []} /></b>,
                na(r[2]), na(r[3]), na(r[4]), na(r[5]), r[6], <Chip key="r">{r[0]}</Chip>,
              ])} />
          </More>
      </Fold>

      <Fold id="dates" title={<>Dates that can move your <S>portfolio</S></>} ix="03"
        summary={`${B.events.length} dated events · IST`}>
        <EventRail events={B.events} briefDate={B.briefDate} />
        <p className="bw-meta">Dates from published calendars<Src k={["W1", "W13", "W15", "W16", "W17", "W19"]} />.</p>
      </Fold>
    </>
  );
}
