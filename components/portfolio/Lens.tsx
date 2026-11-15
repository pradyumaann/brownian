"use client";
import type { MoodVars } from "@/lib/bands";
import type { PortfolioFacts } from "@/lib/portfolioTypes";
import { ImpactNotes } from "../portfolio";
import { Section, S } from "../Section";
import { Day } from "./Day";
import { Exposure } from "./Exposure";
import { How } from "./How";
import { Mix } from "./Mix";
import { usePort } from "./usePort";

/** Portfolio Lens, sections 01 to 05: your mix, your day, what you are exposed to, how it is worked out, the impact notes. */
export function PortfolioLens({ facts, vars }: { facts: PortfolioFacts; vars: MoodVars }) {
  const port = usePort();
  const ids = Object.keys(port.w);
  return (
    <>
      <Section title={<>Your <S>mix</S></>} meta="A weight for each holding type, in 5% steps · stays on this device" ix="01">
        <Mix port={port} facts={facts.types} />
      </Section>

      <Section title={<>Your <S>day</S></>} meta="What the session did to your weights · index and market moves, not your own holdings' prices" ix="02">
        <Day w={port.w} facts={facts.types} asOf={facts.asOf} example={port.mode === "example"} />
      </Section>

      <Section title={<>What you&apos;re <S>exposed to</S></>} meta="Your weights grouped by what drives them" ix="03">
        <Exposure w={port.w} />
      </Section>

      <Section title={<>How it is <S>worked out</S></>} meta="Formula, drivers, source tags and what is n/a" ix="04">
        <How facts={facts.types} />
      </Section>

      <Section title={<>What the news means for <S>each type</S></>} meta="Impact of today's brief on the types in your mix" ix="05">
        <ImpactNotes ids={ids} vars={vars} example={port.mode === "example"} />
      </Section>
    </>
  );
}
