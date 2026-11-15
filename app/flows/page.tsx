import type { Metadata } from "next";
import { B } from "@/data";
import { Chip } from "@/components/Chip";
import { Change } from "@/components/Change";
import { DataTable } from "@/components/DataTable";
import { S, Section, ViewHead } from "@/components/Section";
import { Src } from "@/components/Src";
import { Term } from "@/components/Term";
import { Diverge } from "@/components/charts/Diverge";
import { FlowLines } from "@/components/charts/FlowLines";
import { MiniBars } from "@/components/charts/Mini";
import { Strands } from "@/components/charts/Strands";
import { Terrain } from "@/components/charts/Terrain";
import { More } from "@/components/More";
import { strandShape, terrainShape } from "@/lib/sectorFlows";
import { crore, pct } from "@/lib/format";
import { flowContext, fpiDaily } from "@/lib/flows";
import { asOf } from "@/lib/mood";
import { PAPERS } from "@/lib/papers";

export const metadata: Metadata = { title: "Flow Map" };

export default function Flows() {
  const { day, mtd, src } = B.flows;
  const perDay = (v: number) => "₹" + Math.round(Math.abs(v) / mtd.sessions).toLocaleString("en-IN") + " cr";
  const read: [string, string][] = [
    [`FIIs are averaging ${perDay(mtd.fii)} a day`, `in November vs ${perDay(mtd.dii)} of daily DII selling. Thursday's ${crore(day.fii, false)} was in line with that pace.`],
    ["A sharp reversal.", "FIIs sold about ₹45,000 cr in each of September and October. November's ₹73,566 cr ($6.43bn) is the strongest month since Sep 2024."],
    ["Why FIIs may be buying:", "sources point to rotation away from AI megacaps toward “old-economy” markets like India, plus re-entry after two months of selling."],
    ["Why DIIs are selling:", "9 straight sessions of selling into a ~10% rally looks like profit-taking by Indian funds. This is Brownian's reading; the sources don't give a reason."],
    ["The risk:", "research on emerging-market flows finds US rates are a major driver. With the US 10Y at 5.10% and a December hike priced, this buying could slow."],
  ];
  // NSDL history: monthly FPI equity sums, the last 12 months, and daily cumulative lines.
  const daily = fpiDaily(asOf), ctx = flowContext(asOf);
  const months = new Map<string, number>();
  for (const r of daily) months.set(r.date.slice(0, 7), (months.get(r.date.slice(0, 7)) ?? 0) + r.equity);
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const last12 = [...months.entries()].slice(-12).map(([ym, v], i, a) => ({ label: `${MON[Number(ym.slice(5)) - 1]} ${ym.slice(2, 4)}${i === a.length - 1 ? " (to date)" : ""}`, value: Math.round(v) }));
  // Three years of NSDL reporting days, each line cumulative from the start of the window.
  const span = daily.slice(-750);
  const cum = (f: (r: (typeof span)[number]) => number | null) => { let s = 0, seen = false; return span.map((r) => { const v = f(r); if (v == null) return seen ? s : null; seen = true; return (s += v); }); };
  const big = span.reduce((m, r, i) => (r.equity > span[m].equity ? i : m), 0), small = span.reduce((m, r, i) => (r.equity < span[m].equity ? i : m), 0);
  const st = strandShape(), tr = terrainShape();
  const themes = B.themesIn.map((t) => ({ ...t, avg: t.s.reduce((a, s) => a + s[1], 0) / t.s.length }));
  return (
    <>
      <ViewHead title={<>Where money <S>moved</S></>} feature="Flow Map"
        lede="Who is buying and selling Indian shares, and where money is rotating between sectors." />

      <Section title={<>Who&apos;s buying, who&apos;s <S>selling</S></>} meta={<><Term id="fii">FII vs DII</Term> · ₹ crore, cash market, provisional<Src k={src} /></>} ix="01">
        <div className="pair">
          {[day, mtd].map((f) => {
            const net = f.fii + f.dii;
            return (
              <div key={f.label}>
                <p className="cap">{f.label}</p>
                <Diverge format="crore" labelWidth={56} valueWidth={120} rowH={34}
                  rows={[{ label: "FII", value: f.fii }, { label: "DII", value: f.dii }]}
                  label={`${f.label}: FII net ${crore(f.fii)}, DII net ${crore(f.dii)}`} />
                <p className="bw-meta">Net institutional {crore(net)}; everyone else net sold ≈ {crore(net, false)}.</p>
              </div>
            );
          })}
        </div>
        <More label="What sits behind the numbers" bodyClassName="pair" className="gap-top">
          <p className="note">Every share bought is sold by someone. When FIIs and DIIs together are net buyers, everyone else (retail, HNIs, promoters, prop desks) was a net seller by the same amount, counting exchange cash trades only.</p>
          <ul className="list">{read.map(([b, t]) => <li key={b}><b>{b}</b> {t}</li>)}</ul>
        </More>
      </Section>

      <Section title={<>From selling to record <S>buying</S></>} meta={<>FPI net equity investment by month, ₹ crore, NSDL reporting days<Src k={["D4"]} /></>} ix="02">
        <Diverge format="crore" valueWidth={132} phoneRows={6} phoneKeep="last" rows={last12.map((m) => ({ label: m.label, value: m.value }))}
          label={`FPI net equity investment by month: ${last12.map((m) => `${m.label} ${crore(m.value)}`).join(", ")}`} />
        <p className="bw-meta">NSDL counts custodian-confirmed trades, so its November figure ({crore(last12.at(-1)!.value)} to date) differs from the brief&apos;s exchange provisional FII figure ({crore(mtd.fii)}<Src k={["S5"]} />). DII history has no free daily source yet: n/a.</p>
      </Section>

      <Section title={<>Three years of foreign <S>money</S></>} meta={<>Cumulative FPI net investment by NSDL reporting day, {span[0].date.slice(0, 4)} to {span.at(-1)!.date}<Src k={["D4"]} /></>} ix="03">
        <FlowLines dates={span.map((r) => r.date)}
          lines={[
            { name: "Equity", cat: 1, values: cum((r) => r.equity) },
            { name: "Debt and hybrid", cat: 2, values: cum((r) => r.debt) },
            { name: "Index futures", cat: 4, values: cum((r) => r.indexFut) },
          ]}
          notes={[
            { i: big, line: 0, text: `Largest buying day ${crore(span[big].equity)}` },
            { i: small, line: 0, text: `Largest selling day ${crore(span[small].equity)}` },
          ]}
          label="Cumulative FPI net investment in Indian equity, debt and index futures" />
        <div className="three after-plot">
          <div className="take">
            <h3>{ctx.streak} {ctx.streak === 1 ? "day" : "days"} of {ctx.streakSide}</h3>
            <MiniBars signed values={daily.slice(-20).map((r) => r.equity)} dates={daily.slice(-20).map((r) => r.date)} fmt={(v) => crore(v)} label={`FPI net equity flow, last 20 reporting days: ${daily.slice(-20).map((r) => crore(r.equity)).join(", ")}`} />
            <p>The current run of FPI net {ctx.streakSide} in equity. Over the last 20 reporting days FPIs net {(ctx.sum20 ?? 0) >= 0 ? "bought" : "sold"} {crore(Math.abs(ctx.sum20 ?? 0), false)}{ctx.sum20Pct != null ? `, more than in ${Math.round(ctx.sum20Pct)}% of 20-day spells in the previous three years` : ""}.</p>
          </div>
          <div className="take">
            <h3>Persistence {ctx.persistence == null ? "n/a" : ctx.persistence.toFixed(2)}</h3>
            <More label="What it measures"><p>Correlation of each day&apos;s FPI equity flow with the next day&apos;s, over the last 250 reporting days. Above 0 means buying tends to follow buying, as <a href={PAPERS.fos2001.url} target="_blank" rel="noopener noreferrer">Froot, O&apos;Connell &amp; Seasholes (2001)</a> found for international flows.</p></More>
          </div>
          <div className="take">
            <h3>Feedback {ctx.feedback == null ? "n/a" : ctx.feedback.toFixed(2)}</h3>
            <More label="What it measures"><p>Correlation of daily FPI equity flows with Nifty 50&apos;s return over the previous 20 sessions. Above 0 means foreign money has been chasing recent gains, the positive-feedback pattern in the same paper.</p></More>
          </div>
        </div>
        <p className="bw-disclaimer after-plot">Interpretation, not a forecast. NSDL reporting days lag the trade date by one session.</p>
      </Section>

      <Section title={<>Where foreign money <S>went</S></>} meta={<>FPI net equity investment by sector, {st.label}, NSDL fortnightly data<Src k={["D4"]} /></>} ix="04">
        <Strands sold={st.sold} bought={st.bought} net={st.total} month={st.label}
          label={`FPI equity flows by sector in ${st.label}. Net sold: ${st.sold.map((n) => `${n.label} ${crore(n.value, false)}`).join(", ")}. Net bought: ${st.bought.map((n) => `${n.label} ${crore(n.value, false)}`).join(", ")}. ${st.total < 0 ? `Net outflow ${crore(-st.total, false)}.` : `Net new money ${crore(st.total, false)}.`}`} />
        <p className="bw-meta after-plot">Net for the month: {crore(st.total)}. NSDL reports only each sector&apos;s net, so each sector&apos;s selling is shared out over the destinations in proportion to their size: an allocation, not traced trades from one sector to another.</p>
      </Section>

      <Section title={<>Two years of sector <S>flows</S></>} meta={<>Net FPI equity flow by sector and fortnight, {tr.labels[0]} to {tr.labels.at(-1)}, the {tr.sectors.length} sectors with the largest flows<Src k={["D4"]} /></>} ix="05">
        <Terrain sectors={tr.sectors} labels={tr.labels} z={tr.z}
          label={`Net FPI equity flows for ${tr.sectors.length} sectors over ${tr.labels.length} fortnights. Totals: ${tr.totals.map((t) => `${t.sector} ${crore(t.net)}`).join(", ")}.`} />
        <p className="bw-meta after-plot">Colour shows size either way, from violet for small flows to white for the largest.</p>
        <More label="Every sector's total" className="after-plot">
          <DataTable head={[["Sector"], ["Two years", "r"], ["Latest fortnight", "r"]]}
            rows={[...tr.totals].sort((x, y) => y.net - x.net).map((t) => [t.sector, <Change key="n" v={crore(t.net)} />, t.last == null ? <span key="l" className="bw-na">n/a</span> : <Change key="l" v={crore(t.last)} />])} />
        </More>
      </Section>

      <Section title={<>Into financials, out of <S>consumption</S></>} meta={<><Term id="rotation">Sector rotation</Term> · India, theme average of its NSE sectors, {B.session}<Src k={["S3"]} /></>} ix="06">
        <div className="two">
          <Diverge rows={themes.map((t) => ({ label: t.n, value: Math.round(t.avg * 100) / 100 }))} label={`Theme averages: ${themes.map((t) => `${t.n} ${pct(t.avg)}`).join(", ")}`} labelWidth={170} />
          <More label="Sectors in each theme">
            <ul className="list">
              {themes.map((t) => <li key={t.n}><b>{t.n}</b> {t.s.map(([n, v]) => `${n} ${pct(v)}`).join(" · ")}</li>)}
            </ul>
          </More>
        </div>
      </Section>

      <Section title={<>Where money came from, and <S>went</S></>} meta={<>Rotation map · {B.session}<Src k={["S3", "S11", "S12"]} /></>} ix="07">
        <div className="rot">
          {B.rotation.map((r) => (
            <div key={r.lane} className="rrow">
              <div className="lane"><b>{r.lane}</b><span>{r.note}</span></div>
              <ul>{r.out.map(([n, v]) => <li key={n}><span className="tone-loss">▼</span> {n} <span>· {v}</span></li>)}</ul>
              <span className="arr" aria-hidden="true">→</span>
              <ul>{r.into.map(([n, v]) => <li key={n}><span className="tone-gain">▲</span> {n} <span>· {v}</span></li>)}</ul>
            </div>
          ))}
        </div>
        <p className="bw-meta">Out of (▼) and into (▲) by relative performance on the day, not traced money.</p>
      </Section>

      <Section title={<>Sector moves, India and the <S>US</S></>} meta="NSE sectoral indices and S&P 500 sectors, one-day change" ix="08">
        <div className="pair">
          <div>
            <p className="cap">India<Src k={["S1", "S2", "S3"]} /></p>
            <Diverge phoneRows={8} rows={B.secIndia.map(([label, value, to]) => ({ label, value, to }))} label={`NSE sector changes, ${B.session}`} />
          </div>
          <div>
            <p className="cap">United States<Src k={["S11"]} /></p>
            <Diverge phoneRows={6} rows={B.secUS.map(([label, value]) => ({ label, value }))} label={`S&P 500 sector changes, ${B.session}`} />
          </div>
        </div>
      </Section>

      <Section title={<>Trend, pause or <S>spike</S>?</>} meta="Trend context for the day's biggest sector moves" ix="09">
        <DataTable stack head={[["Sector"], ["Thu", "r"], ["Context"], ["Read"], ["What it means"]]}
          rows={B.trend.map((r) => [<b key="s">{r[0]}</b>, <Change key="c" v={r[1]} />, r[2], <Chip key="ch" tone={r[4]}>{r[3]}</Chip>, r[5]])} />
      </Section>
    </>
  );
}
