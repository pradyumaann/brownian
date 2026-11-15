import type { Metadata } from "next";
import { Watchlist } from "@/components/portfolio";
import { PortfolioLens } from "@/components/portfolio/Lens";
import { S, Section, ViewHead } from "@/components/Section";
import { portfolioFacts } from "@/lib/portfolioFacts";
import { vars } from "@/lib/mood";

export const metadata: Metadata = { title: "Portfolio Lens" };

export default function Portfolio() {
  return (
    <>
      <ViewHead title={<>What it means for <S>you</S></>} feature="Portfolio Lens"
        lede="How the session moved a mix like yours. Give each kind of holding a weight and read the day's blended move, what the mix is exposed to and how it is worked out. Facts only; the weights never leave this device." />

      <PortfolioLens facts={portfolioFacts()} vars={vars} />

      <Section title={<>Is my stock in the <S>news</S>?</>} meta="Watchlist · every company in the brief, plus this week's results calendars. Example rows are marked until you add your own." ix="06">
        <Watchlist />
      </Section>
    </>
  );
}
