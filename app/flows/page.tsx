import type { Metadata } from "next";
import { B } from "@/data";
import { Chip } from "@/components/Chip";
import { Change } from "@/components/Change";
import { DataTable } from "@/components/DataTable";
import { S, Section, ViewHead } from "@/components/Section";
import { Src } from "@/components/Src";
import { Term } from "@/components/Term";
import { Diverge } from "@/components/charts/Diverge";
import { crore, pct } from "@/lib/format";

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
        <div className="pair" style={{ marginTop: "var(--space-8)" }}>
          <p className="note">Every share bought is sold by someone. When FIIs and DIIs together are net buyers, everyone else (retail, HNIs, promoters, prop desks) was a net seller by the same amount, counting exchange cash trades only.</p>
          <ul className="list">{read.map(([b, t]) => <li key={b}><b>{b}</b> {t}</li>)}</ul>
        </div>
      </Section>

      <Section title={<>From selling to record <S>buying</S></>} meta={<>Monthly net flows, ₹ crore<Src k={["S5"]} /></>} ix="02">
        <Diverge format="crore" valueWidth={132}
          rows={B.monthly.flatMap((m) => [
            { label: `FII · ${m.m}${m.approx ? " (≈)" : ""}`, value: m.fii },
            { label: `DII · ${m.m}`, value: m.dii },
          ])}
          label="FII net flows: September about −45,000 crore, October about −45,000 crore, November to date +73,566 crore. DII net November to date −46,835 crore; DII September and October not available." />
        <p className="bw-meta">Sep and Oct FII figures are “about ₹45,000 cr” of selling each, per Tapetide. DII monthly totals for Sep and Oct are not in the sources (n/a). A daily series will build up here as briefs accumulate.</p>
      </Section>

      <Section title={<>Into financials, out of <S>consumption</S></>} meta={<><Term id="rotation">Sector rotation</Term> · India, theme average of its NSE sectors, {B.session}<Src k={["S3"]} /></>} ix="03">
        <div className="two">
          <Diverge rows={themes.map((t) => ({ label: t.n, value: Math.round(t.avg * 100) / 100 }))} label={`Theme averages: ${themes.map((t) => `${t.n} ${pct(t.avg)}`).join(", ")}`} labelWidth={170} />
          <ul className="list">
            {themes.map((t) => <li key={t.n}><b>{t.n}</b> {t.s.map(([n, v]) => `${n} ${pct(v)}`).join(" · ")}</li>)}
          </ul>
        </div>
      </Section>

      <Section title={<>Where money came from, and <S>went</S></>} meta={<>Rotation map · {B.session}<Src k={["S3", "S11", "S12"]} /></>} ix="04">
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

      <Section title={<>Sector moves, India and the <S>US</S></>} meta="NSE sectoral indices and S&P 500 sectors, one-day change" ix="05">
        <div className="pair">
          <div>
            <p className="cap">India<Src k={["S1", "S2", "S3"]} /></p>
            <Diverge rows={B.secIndia.map(([label, value, to]) => ({ label, value, to }))} label={`NSE sector changes, ${B.session}`} />
          </div>
          <div>
            <p className="cap">United States<Src k={["S11"]} /></p>
            <Diverge rows={B.secUS.map(([label, value]) => ({ label, value }))} label={`S&P 500 sector changes, ${B.session}`} />
          </div>
        </div>
      </Section>

      <Section title={<>Trend, pause or <S>spike</S>?</>} meta="Trend context for the day's biggest sector moves" ix="06">
        <DataTable stack head={[["Sector"], ["Thu", "r"], ["Context"], ["Read"], ["What it means"]]}
          rows={B.trend.map((r) => [<b key="s">{r[0]}</b>, <Change key="c" v={r[1]} />, r[2], <Chip key="ch" tone={r[4]}>{r[3]}</Chip>, r[5]])} />
      </Section>
    </>
  );
}
