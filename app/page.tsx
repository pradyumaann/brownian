import Link from "next/link";
import { B } from "@/data";
import { Chip } from "@/components/Chip";
import { CountUp } from "@/components/CountUp";
import { SessionMove } from "@/components/portfolio/SessionMove";
import { More } from "@/components/More";
import { Rich } from "@/components/Rich";
import { S, Section } from "@/components/Section";
import { Src } from "@/components/Src";
import { Term } from "@/components/Term";
import { Change } from "@/components/Change";
import { Diverge } from "@/components/charts/Diverge";
import { Dial } from "@/components/charts/Dial";
import { SegMeter } from "@/components/charts/Mini";
import { portfolioFacts } from "@/lib/portfolioFacts";
import { sessionConditions } from "@/lib/sessionConditions";
import { band, comps, pressureHigh, pressureName, pressureScore, quad, score, scoreRaw, scored } from "@/lib/mood";
import type { Kpi } from "@/data/types";

function KpiCell({ k }: { k: Kpi }) {
  return (
    <div>
      <div className="bw-label">{k.term ? <Term id={k.term}>{k.label}</Term> : k.label}</div>
      <div className="v">{k.v}{k.unit && <small>{k.unit}</small>}<Src k={k.src} /></div>
      <div className="d"><Change v={k.d} /> <span className="w">{k.dNote}</span></div>
    </div>
  );
}

const US_TOP_BOTTOM = ["Energy", "Utilities", "Technology", "Industrials", "Comm. Services", "Materials"];

export default function MarketsOvernight() {
  const fiiSrc = B.flows.src;
  // The card gets only what it draws: each type's move, tags and proxy label, and two readings for the same session.
  const facts = portfolioFacts();
  const types = facts.types.map(({ id, n, d1, src, proxy }) => ({ id, n, d1, src, proxy }));
  return (
    <>
      <header className="vh is-brief">
        <h1>Markets, <S>Overnight</S>.</h1>
        <div>
          <p className="lede"><Rich r={B.lede} /></p>
          <p className="bw-source vh-f">Markets, Overnight · {B.dateShort}</p>
        </div>
      </header>

      <Section title={<>Blended session <S>move</S></>} meta={`${B.session} session · index and market moves by holding type, not your own holdings' prices`} ix="01 · Portfolio Lens">
        <SessionMove types={types} asOf={facts.asOf} cond={sessionConditions(facts.asOf)} />
      </Section>

      <div className="hero">
        <KpiCell k={B.kpis.gift} />
        <div>
          <div className="bw-label"><Link href="/wander/">Wander Index</Link> · <Link href="/wander/#macro-pressure">Macro pressure</Link></div>
          <div className="v">
            <CountUp to={score} />
            <small className="v-sub"> / </small>
            <span className="v-press">{pressureScore}</span>
          </div>
          <SegMeter score={scoreRaw} label={`Wander Index ${score} of 100, ${band}`} />
          <SegMeter score={pressureScore} label={`Macro pressure ${pressureScore} of 100, ${pressureName}`} />
          <div className="d"><span className="w">{band} · macro pressure {pressureName.toLowerCase()} · interpretation, not a forecast</span></div>
        </div>
        <KpiCell k={B.kpis.fii} />
        <KpiCell k={B.kpis.usdinr} />
      </div>

      <Section title={<>What happened, and why it <S>matters</S></>} meta={`${B.session} session and overnight, in plain English`} ix="02 · Markets, Overnight">
        <div className="takes">
          {B.takeaways.map((t) => (
            <article key={t.h} className="take">
              <Chip tone={t.chip[1]}>{t.chip[0]}</Chip>
              <h3>{t.h}</h3>
              <More label="The detail" className="take-more"><p><Rich r={t.p} /><Src k={t.src} /></p></More>
              <p className="why">{t.why}</p>
            </article>
          ))}
        </div>
        <h3 className="sub gap-top">What drove the day</h3>
        <ul className="list">{B.drove.slice(0, 2).map((d) => <li key={d}>{d}</li>)}</ul>
        {B.drove.length > 2 && <More label={`${B.drove.length - 2} more`}><ul className="list list-cont">{B.drove.slice(2).map((d) => <li key={d}>{d}</li>)}</ul></More>}
      </Section>

      <Section title={<>The market&apos;s <S>mood</S></>} meta={`${scored.length} of ${comps.length} components, each ranked against its own five years, ${B.session} session`} ix="03 · Wander Index">
        <div className="two">
          <div>
            <Dial score={scoreRaw} comps={scored.map((c) => ({ name: c.name, score: c.score }))} label={`Wander Index ${score}, ${band}`} />
            <p className="bw-disclaimer after-plot">Interpretation, not a forecast. Each dot is one component.</p>
          </div>
          <div>
            <div className="duo">
              <div><p className="bw-label">Wander Index</p><div className="score"><span className="n">{score}</span><span className="w">{band}</span></div></div>
              <div><p className="bw-label">Macro pressure</p><div className="score"><span className="n">{pressureScore}</span><span className="w">{pressureName}</span></div></div>
            </div>
            <More label={`All ${comps.length} components`}><table className="comp-tbl">
              <tbody>
                {comps.map((c) => (
                  <tr key={c.id}><td>{c.name} · {c.value}<Src k={c.src} /></td><td className="v">{c.available ? Math.round(c.score) : <span className="bw-na">n/a</span>}</td></tr>
                ))}
              </tbody>
            </table></More>
            <p className="note after-plot"><b>{quad.name}.</b> {quad.short} {pressureHigh} of {B.pressure.length} macro indicators read high. <Link href="/wander/#macro-pressure">See the indicators</Link> · <Link href="/wander/">How the Wander Index is measured</Link></p>
          </div>
        </div>
      </Section>

      <Section title={<>Where money <S>moved</S></>} meta={<>FII and DII provisional net flows, cash market<Src k={fiiSrc} /></>} ix="04 · Flow Map">
        <div className="pair">
          {[B.flows.day, B.flows.mtd].map((f) => (
            <div key={f.label}>
              <p className="cap">{f.label}</p>
              <Diverge format="crore" labelWidth={56} valueWidth={120} rowH={34}
                rows={[{ label: "FII", value: f.fii }, { label: "DII", value: f.dii }]}
                label={`${f.label}: FII net ${f.fii} crore, DII net ${f.dii} crore`} />
            </div>
          ))}
        </div>
        <p className="note after-plot">HDFC Sky puts November&apos;s FII buying at $6.43bn, the strongest since September 2024<Src k={["S1"]} />. <Link href="/flows/">Flow Map</Link></p>
      </Section>

      <Section title={<>Sector <S>strength</S></>} meta={<>NSE sectoral indices, {B.session} · one-day change<Src k={["S1", "S2", "S3"]} /></>} ix="05 · India Markets">
        <More label="Sectors and notes on the day" className="sec-fold">
        <div className="two">
          <Diverge phoneRows={8} rows={B.secIndia.map(([label, value, to]) => ({ label, value, to }))} label={`NSE sector changes, ${B.session}`} />
          <More label="Notes on the day" bodyClassName="note">
            <p><b>Financials led</b>; autos and FMCG lagged<Src k={["S5"]} />.</p>
            <p><b>Realty +4.50%</b> had no specific catalyst in the sources. HDFC Sky&apos;s close report gave +3.7%<Src k={["S1"]} />.</p>
            <p><b>Auto</b> ended an 8-session winning streak on profit-taking.</p>
            <p><b>Oil &amp; Gas</b>: sources differ, −0.50% to −0.76%, shown as a range. {B.secIndiaNa.join(" and ")}: n/a.</p>
            <p><Link href="/india/">India Markets</Link></p>
          </More>
        </div>
        </More>
      </Section>

      <Section title={<>Global <S>cues</S></>} meta={<>S&amp;P 500 sectors and cross-asset, {B.session} close<Src k={["S11"]} /></>} ix="06 · Global Cues">
        <More label="US sectors and cross-asset" className="sec-fold">
        <Diverge rows={B.secUS.filter(([n]) => US_TOP_BOTTOM.includes(n)).map(([label, value]) => ({ label, value }))}
          label={`S&P 500 top and bottom three sectors, ${B.session}`} labelWidth={150} />
        <p className="bw-source after-plot">Top three and bottom three sectors; all eleven are in <Link href="/global/">Global Cues</Link></p>
        <div className="macro">
          {B.macro.filter(([m]) => ["US 10Y yield", "Brent", "Dollar index", "Gold futures"].includes(m)).map(([m, v, d]) => (
            <div key={m}><div className="bw-label">{m}</div><div className="v">{v} <Change v={d} /><Src k={["S11"]} /></div></div>
          ))}
        </div>
        </More>
      </Section>

      <Section title={<>Coming <S>up</S></>} meta="Next 7 days · times in IST" ix="07 · Macro Watch">
        <ul className="tl">
          {B.next.map((e) => (
            <li key={e.w + e.t} className={e.today ? "today" : undefined}><span className="when">{e.w}</span><div className="t">{e.t}</div></li>
          ))}
        </ul>
      </Section>

      <Section title={<>Still <S>developing</S></>} meta="Stories carried across sessions" ix="08 · Developing">
        <More label={`The ${Math.min(5, B.stories.length)} stories`} className="sec-fold">
        <ol className="st">
          {B.stories.slice(0, 5).map((s) => (
            <li key={s.t}>
              <span className="chips"><span className={`bw-chip${s.st === "NEW" ? " chip-new" : " tone-plain"}`}>{s.st === "NEW" ? "New" : "Ongoing"}</span></span>
              <div><div className="t">{s.t}</div><div className="m">Watch: {s.w}</div></div>
              <span className="v"><Src k={s.src} /></span>
            </li>
          ))}
        </ol>
        </More>
        <div className="actions">
          <Link className="bw-btn" href="/developing/">All developing stories <span className="bw-btn-dot" aria-hidden="true">→</span></Link>
        </div>
      </Section>
    </>
  );
}
