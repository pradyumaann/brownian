import type { Metadata } from "next";
import { B } from "@/data";
import { Chip } from "@/components/Chip";
import { Change } from "@/components/Change";
import { DataTable } from "@/components/DataTable";
import { S, Section, ViewHead } from "@/components/Section";
import { Src } from "@/components/Src";
import { Term } from "@/components/Term";
import { Diverge } from "@/components/charts/Diverge";

export const metadata: Metadata = { title: "Global Cues" };

const macroName = (m: string) =>
  m.includes("10Y") || m.includes("2Y") ? <Term id="yield">{m}</Term>
  : m === "Dollar index" ? <Term id="dxy">{m}</Term>
  : m === "Brent" ? <Term id="brent">{m}</Term>
  : m === "US VIX" ? <Term id="vix">{m}</Term>
  : m.includes("Fed") ? <Term id="priced">{m}</Term>
  : m;

export default function Global() {
  return (
    <>
      <ViewHead title={<>Global <S>cues</S></>} feature="Global Cues"
        lede={`Overnight world markets, ${B.session} close, and what each one means for India.`} />

      <h3 className="sub">World markets and the India link<Src k={["S11", "S13", "S14", "S15"]} /></h3>
      <DataTable stack head={[["Index"], ["Close", "r"], ["Change", "r"], ["Driver"], ["India link"]]}
        rows={B.global.map((r) => [<b key="i">{r[0]}</b>, r[1], <Change key="c" v={r[2]} />, r[3], r[4]])} />

      <Section title={<>The macro <S>backdrop</S></>} meta={<>Cross-asset, US close<Src k={["S11"]} /></>} ix="01">
        <div className="pair">
          <div>
            <DataTable head={[["Measure"], ["Level", "r"], ["Change", "r"], ["For India"]]}
              rows={B.macro.map(([m, v, d, head]) => [macroName(m), v, <Change key="c" v={d} />, head ? <Chip key="h" tone="loss">Headwind</Chip> : <span key="h" className="faint">n/a</span>])} />
          </div>
          <p className="note"><b>View: modest risk-off.</b> {B.macroView}</p>
        </div>
      </Section>

      <Section title={<>US <S>sectors</S></>} meta={<>S&amp;P 500 sectors, % change<Src k={["S11"]} /></>} ix="02">
        <div className="two">
          <Diverge rows={B.secUS.map(([label, value]) => ({ label, value }))} label={`S&P 500 sector changes, ${B.session}`} />
          <ul className="list">
            {B.usan.filter((r) => r[2]).map((r) => <li key={r[0]}><b>{r[0]} <Change v={r[1]} /></b> {r[2]}{r[3] && <> <span className="faint">· {r[3]}</span></>}</li>)}
          </ul>
        </div>
      </Section>

      <Section title={<>Late <S>movers</S></>} meta="US after hours, and the story of the day" ix="03">
        <div className="pair">
          <div>
            <h3 className="sub">After hours<Src k={["S11", "S12"]} /></h3>
            <DataTable head={[["Ticker"], ["After hours", "r"], ["Reason"]]}
              rows={B.usah.map((r) => [<b key="t">{r[0]}</b>, <Change key="c" v={r[1]} tone={r[2]} />, r[3]])} />
            <p className="bw-meta">No mega-cap after-hours move above ±1.5% was reported.</p>
          </div>
          <div>
            <h3 className="sub">Nvidia leadership change<Src k={["S11", "S12"]} /></h3>
            <ul className="list">{B.nvidia.map((n) => <li key={n}>{n}</li>)}</ul>
            <p className="note after-plot"><b>India angle:</b> the rotation away from AI megacaps has so far helped “old-economy” markets like India.</p>
          </div>
        </div>
      </Section>
    </>
  );
}
