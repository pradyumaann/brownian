import type { Metadata } from "next";
import { B } from "@/data";
import { Chip } from "@/components/Chip";
import { CountUp } from "@/components/CountUp";
import { More } from "@/components/More";
import { S, Section, ViewHead } from "@/components/Section";
import { Src } from "@/components/Src";
import { Term } from "@/components/Term";
import { Dial } from "@/components/charts/Dial";
import { SegMeter } from "@/components/charts/Mini";
import { Quadrant } from "@/components/charts/Quadrant";
import { TimeLine } from "@/components/charts/TimeLine";
import { BANDS, METHOD, asOf, band, bandOf, comps, moodSeries, niftyOn, pressure, pressureHigh, pressureName, pressureScore, pressureTone, quad, score, scoreRaw, scored, wanderVsNifty } from "@/lib/mood";
import { PAPERS } from "@/lib/papers";
import { ord, TURB_BANDS, turbBand } from "@/lib/bands";
import { riskOn, riskSeries } from "@/lib/risk";
import { SPILL, spillSeries } from "@/lib/spillover";
import { liquidity } from "@/lib/flows";

export const metadata: Metadata = { title: "Wander Index" };

const longDate = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function Papers({ ids, basis }: { ids: (keyof typeof PAPERS)[]; basis?: string }) {
  if (!ids.length) return <>{basis}</>;
  return <>{ids.map((id, i) => <span key={id}>{i ? "; " : ""}<a href={PAPERS[id].url} target="_blank" rel="noopener noreferrer">{PAPERS[id].cite}</a>, <i>{PAPERS[id].title}</i></span>)}</>;
}

export default function Wander() {
  const ext = scored.filter((c) => c.score >= 75), fear = scored.filter((c) => c.score < 45), off = comps.filter((c) => !c.available);
  const lastIn = comps.filter((c) => c.since).reduce((a, c) => (c.since! > a.since! ? c : a));
  const risk = riskOn(asOf), rs = riskSeries(asOf).slice(-500);
  const series = moodSeries.slice(-500), vsN = wanderVsNifty(series);
  const r2 = (r: number) => (r < 0 ? "−" : "") + Math.abs(r).toFixed(2);
  const sgn = (x: number) => { const v = Math.abs(x * 100).toFixed(1); return `${v === "0.0" ? "" : x > 0 ? "+" : "−"}${v}%`; };
  // An average over a handful of days says nothing, so a band needs ten readings before it gets one.
  const after = (g: { n: number; avg: number | null }) => (g.n >= 10 && g.avg != null ? `${sgn(g.avg)} (${g.n} days)` : `too few days to average (${g.n})`);
  const spill = spillSeries().filter((p) => p.date <= asOf).slice(-500), spillNow = spill.at(-1)?.date === asOf ? spill.at(-1)! : null;
  const spillAvg = spill.reduce((a, p) => a + p.toIndia, 0) / Math.max(1, spill.length);
  const liq = liquidity(asOf);
  const rational: [string, string][] = [
    ["Extremes matter more than the level.", `Baker & Wurgler (2006) found that after periods of high sentiment, speculative stocks (small, volatile, unprofitable) went on to deliver lower returns. Today reads ${score}, “${band}”.`],
    ["A few components carry the reading.", `${ext.length} of ${scored.length} scored components read extreme greed${ext.length ? ": " + ext.map((c) => `${c.name.toLowerCase()} (${Math.round(c.score)})`).join(", ") : ""}. ${fear.length ? `${fear.map((c) => c.name).join(" and ")} ${fear.length === 1 ? "reads" : "read"} fear.` : "None reads fear."}`],
    ["Sentiment and fundamentals can disagree.", `${pressureHigh} of ${B.pressure.length} macro indicators show high pressure. When the two diverge, prices depend on flows continuing.`],
    ["Common biases after a strong run.", "Recency bias makes further gains feel likely, herding makes following FIIs feel safe, and loss aversion makes a falling asset feel like a reason to sell."],
    ["Questions investors use to stay rational.", "Has my allocation drifted from its target? Would I make this change if the market were flat? Am I reacting to a single day?"],
  ];
  return (
    <>
      <ViewHead title={<>How far markets have <S>wandered</S></>} feature="Wander Index"
        lede={`How far investor behaviour has strayed from its own normal, each signal ranked against its own last five years, shown beside the macro pressure that sits underneath it. As of the ${longDate(asOf)} session.`} />

      <div className="two">
        <div>
          <Dial score={scoreRaw} comps={scored.map((c) => ({ name: c.name, score: c.score }))} label={`Wander Index ${score} of 100, ${band}. Components: ${scored.map((c) => `${c.name} ${Math.round(c.score)}`).join(", ")}`} />
          <p className="bw-disclaimer after-plot">Interpretation, not a forecast. Each dot on the dial is one component.</p>
        </div>
        <div className="stack">
          <div>
            <p className="bw-label">Wander Index · 0 extreme fear, 100 extreme greed</p>
            <div className="score"><span className="n"><CountUp to={score} /></span><span className="w">{band}</span></div>
            <SegMeter score={scoreRaw} label={`Wander Index ${score} of 100, ${band}`} />
          </div>
          <div className="pressure-read">
            <p className="bw-label">Macro pressure · 0 low, 100 high<Src k={["S11", "W8", "W11"]} /></p>
            <div className="score"><span className="n">{pressureScore}</span><span className="w">{pressureName}</span></div>
            <SegMeter score={pressureScore} label={`Macro pressure ${pressureScore} of 100, ${pressureName}`} />
            <p className="bw-meta">{pressureHigh} of {B.pressure.length} indicators read high. Today: <b>{quad.name}</b>. <a href="#macro-pressure">See the indicators</a></p>
          </div>
          <p className="bw-meta">Wander Index: average of {scored.length} of {comps.length} components{off.length ? `; ${off.map((c) => c.name.toLowerCase()).join(" and ")} not scored` : ""}. Bands: {BANDS.map((x) => `${x.name.toLowerCase()} ${x.from}–${Math.min(100, Math.floor(x.to))}`).join(" · ")}.</p>
        </div>
      </div>

      <Section id="macro-pressure" title={<>Macro <S>pressure</S></>} meta={`Fundamental headwinds, kept separate from sentiment · ${pressureName}, ${pressureHigh} of ${B.pressure.length} indicators high`} ix="01">
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

      <Section title={<>The Wander Index over <S>time</S></>} meta={<>Daily reading, last {series.length} sessions with at least {METHOD.minComps} scored components, with the Nifty 50 close<Src k={["D1"]} /></>} ix="02">
        <TimeLine points={series.map((p) => ({ date: p.date, value: p.score }))} bands={BANDS} label="Wander Index by session"
          overlay={{ name: "Nifty 50", values: niftyOn(series.map((p) => p.date)) }} />
        <p className="note after-plot"><b>Beside the market.</b> {vsN.rBack != null ? <>Over these sessions the reading moved with the Nifty 50&apos;s previous {vsN.horizon} sessions (correlation {r2(vsN.rBack)}). Part of that is built in: momentum, trend and safe-haven demand are measured on the Nifty itself. </> : null}{vsN.rFwd != null ? <>Against the Nifty&apos;s following {vsN.horizon} sessions the correlation was {r2(vsN.rFwd)} ({vsN.nFwd} readings). </> : null}{vsN.greed.n || vsN.fear.n ? <>Average Nifty 50 move over the following {vsN.horizon} sessions: after extreme fear, {after(vsN.fear)}; after extreme greed, {after(vsN.greed)}; on all days, {after(vsN.all)}.</> : null}</p>
        <p className="bw-disclaimer after-plot">Interpretation, not a forecast. Neighbouring days share most of their {vsN.horizon}-session windows, so these readings overlap and are far fewer independent observations than the count suggests; one period is not evidence of a lasting pattern.</p>
        <More label="How it&apos;s built">
        <p className="note after-plot"><b>How it&apos;s built.</b> Each component is today&apos;s reading ranked against its own previous {METHOD.lookbackYears} years: a score of 70 means the reading was more greedy than on 70% of those days. It needs at least {METHOD.minDays} trading days of history and uses nothing after the day it scores. The structure follows published fear-and-greed indices (CNN Business, Tickertape&apos;s Market Mood Index); the scoring is Brownian&apos;s own.</p>
        <p className="bw-meta">Single days are noise; the bands show where the reading spends its time. Scores before {longDate(lastIn.since!)} use fewer components, because {lastIn.name.toLowerCase()} history starts later (see each component below).</p>
        </More>
      </Section>

      <Section title={<>What each one <S>measures</S></>} meta="Today's reading, how it is scored, and the research behind it" ix="03">
        <div className="comps">
          {comps.map((c) => (
            <div key={c.id} className="comp">
              <div className="stack">
                <div className="comp-h">
                  <h3><Term id={c.term}>{c.name}</Term></h3>
                  {c.available ? <><span className="bw-label">{bandOf(c.score).name}</span><span className="bw-mono">{Math.round(c.score)}/100</span></> : <span className="bw-na">n/a</span>}
                </div>
                {c.available && (
                  <div>
                    <SegMeter score={c.score} label={`${c.name} scores ${Math.round(c.score)} of 100, ${bandOf(c.score).name}`} />
                    <div className="scale"><span>0 · Extreme fear</span><span>50</span><span>Extreme greed · 100</span></div>
                  </div>
                )}
                <p className="note">{c.available ? c.read : c.reason}</p>
              </div>
              <More label="How it is scored" bodyClassName="stack">
                <dl className="kv">
                  <dt>Measures</dt><dd>{c.metric}</dd>
                  <dt>Today</dt><dd className="bw-mono">{c.value}<Src k={c.src} /></dd>
                  <dt>Scoring</dt><dd>{c.how}{c.dir === -1 ? " (a higher reading means more fear)" : ""}</dd>
                  <dt>History</dt><dd>{c.history ? `${c.history.toLocaleString("en-IN")} prior sessions` : "none"}{c.since ? `; scored since ${longDate(c.since)}` : ""}</dd>
                  <dt>Basis</dt><dd><Papers ids={c.papers} basis={c.basis} /></dd>
                </dl>
              </More>
            </div>
          ))}
        </div>
      </Section>

      <Section title={<>Is today <S>unusual</S>?</>} meta={<>Four readings of market structure: turbulence and fragility across {risk.sectors} NSE sectoral indices, overseas spillover, and liquidity<Src k={["D1"]} /></>} ix="04">
        <div className="pair">
          <div>
            <h3 className="sub">Turbulence</h3>
            <div className="score"><span className="n">{risk.turbAvgPct == null ? "n/a" : turbBand(risk.turbAvgPct)}</span><span className="w plain">{risk.turbAvgPct == null ? "" : `${ord(risk.turbAvgPct)} percentile, 20-session average`}</span></div>
            <p className="note">{risk.turbPct == null ? "Today alone: n/a" : `Today alone: ${ord(risk.turbPct)} percentile`}</p>
            <TimeLine points={rs.slice(Math.max(0, rs.findIndex((p) => p.turbAvgPct != null))).map((p) => ({ date: p.date, value: p.turbAvgPct }))} bands={TURB_BANDS} label={`Turbulence, 20-session average percentile by session${risk.turbAvgPct == null ? "" : `; latest ${turbBand(risk.turbAvgPct)}, ${ord(risk.turbAvgPct)} percentile`}`} />
            <p className="note after-plot">A single day jumps about, so the line shows the 20-session average. It is ranked against the previous {risk.windows.turbulence} such averages, so a high reading means {longDate(asOf)}&apos;s run of sector moves was unusual for the last three years. Turbulence tends to persist, and returns to risk have been lower in turbulent periods.</p>
            <p className="bw-meta"><Papers ids={["kl2010"]} />. Squared Mahalanobis distance of daily sector returns; mean and covariance from the previous {risk.windows.turbulence} sessions.</p>
          </div>
          <div>
            <h3 className="sub">Fragility</h3>
            <div className="score"><span className="n">{risk.absorption == null ? "n/a" : (risk.absorption * 100).toFixed(0) + "%"}</span><span className="w plain">absorbed by {risk.windows.factors} factors</span></div>
            <TimeLine points={rs.map((p) => ({ date: p.date, value: p.arPct }))} label="Absorption ratio percentile by session" />
            <p className="note after-plot">{risk.arPct == null ? "" : `${ord(risk.arPct)} percentile of the previous three years. `}{risk.arShift == null ? "" : `The 15-session average sits ${Math.abs(risk.arShift).toFixed(1)} standard deviations ${risk.arShift >= 0 ? "above" : "below"} its one-year average. `}When a few common forces drive most sector moves, a shock spreads faster; the paper found most large US drawdowns were preceded by spikes in this ratio.</p>
            <p className="bw-meta"><Papers ids={["klpr2011"]} />. Share of variance in the top {risk.windows.factors} of {risk.sectors} eigenvectors; {risk.windows.absorption}-session window, {risk.windows.halfLife}-session half-life.</p>
          </div>
        </div>
        <div className="pair" style={{ marginTop: "var(--space-12)" }}>
          <div>
            <h3 className="sub">Global spillover<Src k={["D1", "D5"]} /></h3>
            <div className="score"><span className="n">{spillNow ? spillNow.toIndia.toFixed(0) + "%" : "n/a"}</span><span className="w plain">from overseas</span></div>
            <TimeLine points={spill.map((p) => ({ date: p.date, value: p.toIndia }))} label="Share of Nifty 50 forecast variance from overseas markets" unit="%" />
            <p className="note after-plot">{spillNow ? `${spillNow.toIndia.toFixed(0)}% of the uncertainty in Nifty's next ${SPILL.horizon} sessions traces to shocks in the S&P 500, STOXX 600 and Nikkei 225, against ${spillAvg.toFixed(0)}% on average over the chart. ` : ""}A high share means overnight cues matter more than usual for the Indian open.</p>
            <p className="bw-meta"><Papers ids={["dy2012"]} />. Generalized variance decomposition of a VAR({SPILL.lags}) on daily returns, {SPILL.window}-session window; US and European closes from the previous day.</p>
          </div>
          <div>
            <h3 className="sub">Liquidity stress<Src k={["D2"]} /></h3>
            <div className="score"><span className="n">{liq.pct == null ? "n/a" : ord(liq.pct)}</span><span className="w plain">percentile</span></div>
            <TimeLine points={liq.series.slice(-500)} label="Liquidity stress percentile by session" />
            <p className="note after-plot">How far prices move per rupee traded, averaged over 20 sessions and ranked against the previous three years. Higher means thinner trading: the same order moves prices more.</p>
            <p className="bw-meta"><Papers ids={["amihud2002"]} />. Median of |return| ÷ turnover across NSE stocks trading at least ₹1 crore a day.</p>
          </div>
        </div>
        <p className="bw-disclaimer after-plot">Interpretation, not a forecast. Turbulence shows the percentile of its 20-session average; fragility and liquidity show the percentile against each measure&apos;s own previous three years. Bands: Calm below 50, Elevated 50–80, Unusual 80–95, Extreme 95 and above.</p>
      </Section>

      <Section title={<>Reading it <S>rationally</S></>} meta="Sentiment is a contrarian signal, not a timing tool" ix="05">
        <ul className="list">{rational.map(([b, t]) => <li key={b}><b>{b}</b> {t}</li>)}</ul>
      </Section>

    </>
  );
}
