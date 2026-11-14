import type { Metadata } from "next";
import { B } from "@/data";
import { Chip } from "@/components/Chip";
import { CountUp } from "@/components/CountUp";
import { S, Section, ViewHead } from "@/components/Section";
import { Src } from "@/components/Src";
import { Term } from "@/components/Term";
import { Dial } from "@/components/charts/Dial";
import { Quadrant } from "@/components/charts/Quadrant";
import { BANDS, MISSING, band, bandOf, comps, pressure, pressureHigh, pressureName, pressureTone, quad, score, scoreRaw } from "@/lib/mood";

export const metadata: Metadata = { title: "Mood Index" };

export default function Mood() {
  const ext = comps.filter((c) => c.score >= 75), neut = comps.filter((c) => c.score >= 45 && c.score < 55);
  const rational: [string, string][] = [
    ["Extremes matter more than the level.", `Baker & Wurgler (2006) found that after periods of high sentiment, speculative stocks (small, volatile, unprofitable) went on to deliver lower returns. Today reads ${score}, “${band}”.`],
    ["A few components carry the reading.", `${ext.length} of ${comps.length} are at extreme greed${ext.length ? ": " + ext.map((c) => `${c.name.toLowerCase()} (${Math.round(c.score)})`).join(", ") : ""}.${neut.length ? ` ${neut.map((c) => c.name).join(" and ")} ${neut.length === 1 ? "is" : "are"} neutral.` : ""}`],
    ["Sentiment and fundamentals disagree.", `${pressureHigh} of ${B.pressure.length} macro indicators show high pressure. When the two diverge, prices depend on flows continuing.`],
    ["Common biases after a rally like this.", "Recency bias makes further gains feel likely, herding makes following FIIs feel safe, and loss aversion makes gold's 13-month low feel like a reason to sell."],
    ["Questions investors use to stay rational.", "Has my allocation drifted from its target? Would I make this change if the market were flat? Am I reacting to a single day?"],
  ];
  return (
    <>
      <ViewHead title={<>The market&apos;s <S>mood</S></>} feature="Mood Index"
        lede="How investors are behaving, each signal measured against its normal range, and kept separate from macro pressure. 0 is extreme fear, 100 extreme greed." />

      <div className="two">
        <div>
          <Dial score={scoreRaw} comps={comps.map((c) => ({ name: c.name, score: c.score }))} label={`Mood Index ${score} of 100, ${band}. Components: ${comps.map((c) => `${c.name} ${Math.round(c.score)}`).join(", ")}`} />
          <p className="bw-disclaimer after-plot">Interpretation, not a forecast. Each dot on the dial is one component; hover, tap or tab to read it.</p>
        </div>
        <div className="stack">
          <div className="score"><span className="n"><CountUp to={score} /></span><span className="w">{band}</span></div>
          <p className="bw-meta">Equal-weighted average of {comps.length} components. Bands: {BANDS.map((b) => `${b.name.toLowerCase()} ${b.from}–${Math.min(100, Math.floor(b.to))}`).join(" · ")}.</p>
          <p className="note"><b>How it&apos;s built.</b> Same structure as the published fear-and-greed indices (CNN Business Fear &amp; Greed, Tickertape&apos;s Market Mood Index). Each component is scored 0–100 against a reference range, then averaged. The value is computed by Brownian from the brief&apos;s numbers and is not either provider&apos;s official reading. Three standard components are missing from today&apos;s data and are left out rather than guessed.</p>
        </div>
      </div>

      <Section title={<>Reading it <S>rationally</S></>} meta="Sentiment is a contrarian signal, not a timing tool" ix="01">
        <ul className="list">{rational.map(([b, t]) => <li key={b}><b>{b}</b> {t}</li>)}</ul>
      </Section>

      <Section title={<>What each one <S>measures</S></>} meta="Today's value, how it is scored, and the research behind it" ix="02">
        <div className="comps">
          {comps.map((c) => (
            <div key={c.id} className="comp">
              <div className="stack">
                <div className="comp-h">
                  <h3><Term id={c.term}>{c.name}</Term></h3>
                  <span className="bw-label">{bandOf(c.score).name}</span>
                  <span className="bw-mono">{Math.round(c.score)}/100</span>
                </div>
                <div>
                  <div className="track" role="img" aria-label={`${c.name} scores ${Math.round(c.score)} of 100, ${bandOf(c.score).name}`}>
                    {[25, 45, 55, 75].map((e) => <b key={e} style={{ left: `${e}%` }} />)}
                    <i style={{ left: `${c.score}%` }} />
                  </div>
                  <div className="scale"><span>0 · Extreme fear</span><span>50</span><span>Extreme greed · 100</span></div>
                </div>
                <p className="note">{c.read}</p>
              </div>
              <div className="stack">
                <dl className="kv">
                  <dt>Measures</dt><dd>{c.metric}</dd>
                  <dt>Today</dt><dd className="bw-mono">{c.show}<Src k={c.src} /></dd>
                  <dt>Reference</dt><dd>{c.ref}</dd>
                  <dt>Scoring</dt><dd className="bw-mono">{c.formula}</dd>
                </dl>
                <p className="note"><b>Research:</b> {c.res}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title={<>Not scored <S>today</S></>} meta="Standard components missing from the brief. Adding them to the morning brief would complete the index." ix="03">
        <div className="missing">{MISSING.map(([b, t]) => <div key={b}><b>{b}</b><span>{t}</span></div>)}</div>
      </Section>

      <Section title={<>Macro <S>pressure</S></>} meta={`Fundamental headwinds, kept separate from sentiment · ${pressureName}: ${pressureHigh} of ${B.pressure.length} high`} ix="04">
        <div className="pair">
          <div className="rows">
            {B.pressure.map((p) => {
              const [w, t] = pressureTone(p.lv);
              return (
                <div key={p.k} className="prow">
                  <span><b>{p.k}</b> <span className="bw-mono" style={{ fontSize: 13 }}>· {p.v}</span></span>
                  <span className="why">{p.why}</span>
                  <Chip tone={t}>{w}</Chip>
                </div>
              );
            })}
          </div>
          <div>
            <h3 className="sub">Today: {quad.name}</h3>
            <Quadrant score={score} pressure={pressure} current={quad.name} />
            <p className="note after-plot">{quad.long}</p>
            <p className="bw-disclaimer after-plot">Interpretation, not a forecast.</p>
          </div>
        </div>
      </Section>
    </>
  );
}
