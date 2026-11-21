"use client";
import { B } from "@/data";
import type { MoodVars } from "@/lib/bands";
import type { PortfolioFacts, PortfolioSeries } from "@/lib/portfolioTypes";
import { ImpactNotes, Watchlist } from "../portfolio";
import { Fold } from "../Fold";
import { Section, S } from "../Section";
import { Day } from "./Day";
import { EventsForYou } from "./EventsForYou";
import { How } from "./How";
import { Mix } from "./Mix";
import { MixMetrics } from "./MixMetrics";
import { usePort } from "./usePort";
import { Year } from "./Year";

/** Portfolio Lens, sections 01 to 07: your day with portfolio statistics, events for what you own, your mix over the year,
 *  portfolio weights, is my stock in the news, how it is worked out, the impact notes (all but 01 and 03 are folds). One `usePort()` here feeds every section, so a changed weight updates all. */
export function PortfolioLens({ facts, series, vars }: { facts: PortfolioFacts; series: PortfolioSeries; vars: MoodVars }) {
  const port = usePort();
  const ids = Object.keys(port.w);
  const notes = B.holdings.filter((h) => h.id !== "wallet" && ids.includes(h.id)).length;
  return (
    <div className="lens">
      <Section title={<>Your <S>day</S></>} meta="What the session did to your weights · index and market moves, not your own holdings' prices" ix="01">
        <Day w={port.w} facts={facts.types} asOf={facts.asOf} mode={port.mode} />
        <div className="lens-sub">
          <h3 className="sub">Portfolio Statistics</h3>
          <p className="bw-meta">How your mix&apos;s daily changes moved with the market · weights held constant</p>
          <MixMetrics w={port.w} series={series} mode={port.mode} />
        </div>
      </Section>

      <Fold id="events-for-what-you-own" title={<>Events for what you <S>own</S></>} ix="02"
        summary={port.mode === "none" ? "No mix, so no events are tagged." : "Dated events tied to the types in your mix · IST."}>
        <EventsForYou w={port.w} mode={port.mode} />
      </Fold>

      <Section title={<>Your mix over the <S>year</S></>} meta="The last 250 sessions · index moves for the types in your mix, beside Nifty 50" ix="03">
        <Year w={port.w} series={series} mode={port.mode} />
      </Section>

      <Fold id="your-mix" title={<>Portfolio <S>weights</S></>} ix="04"
        summary="A weight for each holding type, in 5% steps · stays on this device.">
        <Mix port={port} facts={facts.types} />
      </Fold>

      <Fold id="is-my-stock-in-the-news" title={<>Is my stock in the <S>news</S>?</>} ix="05"
        summary="Watchlist · every company in today's news, plus this week's results calendars.">
        <Watchlist />
      </Fold>

      <Fold id="how-it-is-worked-out" title={<>How it is <S>worked out</S></>} ix="06"
        summary="The blended move is each type's share times its one-day move, from index and market series. Formula, drivers and source tags are listed in full.">
        <How facts={facts.types} series={series} />
      </Fold>

      <Fold id="what-the-news-means" title={<>What the news means for <S>each type</S></>} ix="07"
        summary={port.mode === "none"
          ? "No mix, so no type notes; only the household-costs note is shown."
          : `${notes} ${notes === 1 ? "note" : "notes"} for the types in your mix, plus the household-costs note. Impact of today's news.`}>
        <ImpactNotes ids={ids} vars={vars} mode={port.mode} />
      </Fold>
    </div>
  );
}
