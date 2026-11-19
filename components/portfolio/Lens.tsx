"use client";
import type { MoodVars } from "@/lib/bands";
import type { PortfolioFacts, PortfolioSeries } from "@/lib/portfolioTypes";
import { ImpactNotes } from "../portfolio";
import { Section, S } from "../Section";
import { Day } from "./Day";
import { EventsForYou } from "./EventsForYou";
import { Exposure } from "./Exposure";
import { How } from "./How";
import { Mix } from "./Mix";
import { usePort } from "./usePort";
import { Year } from "./Year";

/** Portfolio Lens, sections 01 to 07: your mix, your day, what you are exposed to, your mix over the year, events for what
 *  you own, how it is worked out, the impact notes. One `usePort()` here feeds every section, so a changed weight updates all. */
export function PortfolioLens({ facts, series, vars }: { facts: PortfolioFacts; series: PortfolioSeries; vars: MoodVars }) {
  const port = usePort();
  const ids = Object.keys(port.w);
  const example = port.mode === "example";
  return (
    <>
      <Section title={<>Your <S>mix</S></>} meta="A weight for each holding type, in 5% steps · stays on this device" ix="01">
        <Mix port={port} facts={facts.types} />
      </Section>

      <Section title={<>Your <S>day</S></>} meta="What the session did to your weights · index and market moves, not your own holdings' prices" ix="02">
        <Day w={port.w} facts={facts.types} asOf={facts.asOf} example={example} />
      </Section>

      <Section title={<>What you&apos;re <S>exposed to</S></>} meta="Your weights grouped by what drives them" ix="03">
        <Exposure w={port.w} />
      </Section>

      <Section title={<>Your mix over the <S>year</S></>} meta="The last 250 sessions · index moves for the types in your mix, beside Nifty 50" ix="04">
        <Year w={port.w} series={series} example={example} />
      </Section>

      <Section title={<>Events for what you <S>own</S></>} meta="Dated events the brief ties to the types in your mix · IST" ix="05">
        <EventsForYou w={port.w} example={example} />
      </Section>

      <Section title={<>How it is <S>worked out</S></>} meta="Formula, drivers, source tags and what is n/a" ix="06">
        <How facts={facts.types} series={series} />
      </Section>

      <Section title={<>What the news means for <S>each type</S></>} meta="Impact of today's brief on the types in your mix" ix="07">
        <ImpactNotes ids={ids} vars={vars} example={example} />
      </Section>
    </>
  );
}
