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

/** Portfolio Lens, sections 01 to 08: your mix, your day, moves with Nifty 50, is my stock in the news (the watchlist),
 *  your mix over the year, events for what you own, how it is worked out (a fold), the impact notes. One `usePort()` here feeds every section, so a changed weight updates all. */
export function PortfolioLens({ facts, series, vars }: { facts: PortfolioFacts; series: PortfolioSeries; vars: MoodVars }) {
  const port = usePort();
  const ids = Object.keys(port.w);
  const notes = B.holdings.filter((h) => h.id !== "wallet" && ids.includes(h.id)).length;
  return (
    <>
      <Section title={<>Your <S>mix</S></>} meta="A weight for each holding type, in 5% steps · stays on this device" ix="01">
        <Mix port={port} facts={facts.types} />
      </Section>

      <Section title={<>Your <S>day</S></>} meta="What the session did to your weights · index and market moves, not your own holdings' prices" ix="02">
        <Day w={port.w} facts={facts.types} asOf={facts.asOf} mode={port.mode} />
      </Section>

      <Section title={<>Moves with <S>Nifty 50</S></>} meta="How your mix's daily changes moved with the market · weights held constant" ix="03">
        <MixMetrics w={port.w} series={series} mode={port.mode} />
      </Section>

      <Section title={<>Is my stock in the <S>news</S>?</>} meta="Watchlist · every company in the brief, plus this week's results calendars. Example rows are marked until you add your own." ix="04">
        <Watchlist />
      </Section>

      <Section title={<>Your mix over the <S>year</S></>} meta="The last 250 sessions · index moves for the types in your mix, beside Nifty 50" ix="05">
        <Year w={port.w} series={series} mode={port.mode} />
      </Section>

      <Fold id="events-for-what-you-own" title={<>Events for what you <S>own</S></>} ix="06"
        summary={port.mode === "none" ? "No mix, so no events are tagged. Dated events the brief ties to a type are inside." : "Dated events the brief ties to the types in your mix · IST. The list is inside."}>
        <EventsForYou w={port.w} mode={port.mode} />
      </Fold>

      <Fold id="how-it-is-worked-out" title={<>How it is <S>worked out</S></>} ix="07"
        summary="The blended move is each type's share times its one-day move, from index and market series. Formula, drivers, source tags and what is n/a are inside.">
        <How facts={facts.types} series={series} />
      </Fold>

      <Fold id="what-the-news-means" title={<>What the news means for <S>each type</S></>} ix="08"
        summary={port.mode === "none"
          ? "No mix, so no type notes; the household-costs note is inside."
          : `${notes} ${notes === 1 ? "note" : "notes"} for the types in your mix, plus the household-costs note. Impact of today's brief.`}>
        <ImpactNotes ids={ids} vars={vars} mode={port.mode} />
      </Fold>
    </>
  );
}
