import type { Metadata } from "next";
import { B } from "@/data";
import { Chip } from "@/components/Chip";
import { Change } from "@/components/Change";
import { DataTable } from "@/components/DataTable";
import { S, Section, ViewHead } from "@/components/Section";
import { Src } from "@/components/Src";
import { Term } from "@/components/Term";
import { Diverge } from "@/components/charts/Diverge";

export const metadata: Metadata = { title: "India Markets" };

const TERMS: Record<string, string> = { "India VIX": "vix", Breadth: "breadth" };
const indexName = (n: string) =>
  TERMS[n] ? <Term id={TERMS[n]}>{n}</Term> : n.startsWith("FII") || n.startsWith("DII") ? <Term id="fii">{n}</Term> : n;

export default function India() {
  return (
    <>
      <ViewHead title={<>India&apos;s <S>session</S></>} feature="India Markets"
        lede={`${B.session} in full: indices, sectors, movers, commodities and the rupee.`} />

      <div className="pair">
        <div>
          <h3 className="sub">Headline indices and flows<Src k={["S1", "S2", "S4", "S5"]} /></h3>
          <DataTable stack head={[["Index"], ["Close", "r"], ["Change", "r"], ["Note"]]}
            rows={B.india.map((r) => [indexName(r[0]), r[1] === "n/a" ? <span className="bw-na">n/a</span> : r[1], <Change key="c" v={r[2]} />, r[4]])} />
        </div>
        <div>
          <h3 className="sub">All sectors<Src k={["S1", "S2", "S3"]} /></h3>
          <Diverge phoneRows={8} rows={B.secIndia.map(([label, value, to]) => ({ label, value, to }))} label={`NSE sectoral indices, % change, ${B.session}`} />
          <p className="bw-meta">Faint extension: sources give a range. {B.secIndiaNa.join(" and ")}: n/a.</p>
        </div>
      </div>

      <Section title={<>Why each sector <S>moved</S></>} meta="Leaders and laggards, with the catalyst where the sources give one" ix="01">
        <DataTable stack head={[["Sector"], ["Thu", "r"], ["Why"], ["View"]]}
          rows={B.secan.map((r) => [<b key="s">{r[0]}</b>, <Change key="c" v={r[1]} />, r[2], r[3]])} />
      </Section>

      <Section title={<>Big movers: news or <S>noise</S>?</>} meta={<>Moves of more than ±2%. A move with a named catalyst tends to matter more than one without.<Src k={["S1", "S3"]} /></>} ix="02">
        <DataTable stack head={[["Stock"], ["Move", "r"], ["Why"], ["Catalyst"]]}
          rows={B.movers.map((m) => [<b key="n">{m[0]}</b>, <Change key="c" v={m[1]} tone={m[2]} />, m[3],
            m[4] ? <Chip key="t" tone="info">News</Chip> : m[2] === "mixed" ? <Chip key="t" tone="mixed">Unverified</Chip> : <Chip key="t">No clear catalyst</Chip>])} />
      </Section>

      <Section title={<>Commodities and the <S>rupee</S></>} meta="MCX intraday 18:35 IST unless noted · INR forex, provisional close" ix="03">
        <div className="pair">
          <div>
            <h3 className="sub">MCX<Src k={["S9", "S19"]} /></h3>
            <DataTable stack head={[["Contract"], ["Level", "r"], ["Change", "r"], ["Note"]]}
              rows={B.mcx.map((r) => [r[0], r[1], <Change key="c" v={r[2]} />, r[3]])} />
            <p className="bw-meta">Not available today: natural gas, copper, Nifty BeES, Bank BeES, gold and silver ETFs.</p>
            <p className="note after-plot">Bullion driver: the dollar hit a 19-month high and December Fed hike bets firmed after hot US CPI. COMEX gold then fell 2.88% overnight, so MCX bullion is likely to open lower<Src k={["S10", "S11"]} />.</p>
          </div>
          <div>
            <h3 className="sub">The rupee<Src k={["S6", "S11"]} /></h3>
            <DataTable stack head={[["Pair"], ["Level", "r"], ["Change", "r"], ["Note"]]}
              rows={B.fx.map((r) => [r[0], r[1], <Change key="c" v={r[2]} />, r[3]])} />
            <p className="bw-meta">USD/INR up means a weaker rupee. Not available today: EUR/INR, GBP/INR, JPY/INR, CNY/INR.</p>
            <ul className="list after-plot">{B.fxDrivers.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
        </div>
      </Section>

      <Section title={<>After <S>hours</S></>} meta="GIFT Nifty, corporate news, and where the sources disagree" ix="04">
        <div className="pair">
          <div>
            <h3 className="sub">GIFT Nifty and corporate news<Src k={["S1", "S2", "S8"]} /></h3>
            <ul className="list">{B.ahIn.map(([b, t]) => <li key={b}><b>{b}</b> {t}</li>)}</ul>
          </div>
          <div>
            <h3 className="sub">Data check</h3>
            <ul className="list">{B.conflicts.map(([b, t]) => <li key={b}><b>{b}</b> {t}</li>)}</ul>
          </div>
        </div>
      </Section>
    </>
  );
}
