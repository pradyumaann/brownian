import type { Metadata } from "next";
import { PortfolioLens } from "@/components/portfolio/Lens";
import { S, ViewHead } from "@/components/Section";
import { portfolioFacts } from "@/lib/portfolioFacts";
import { portfolioSeries } from "@/lib/portfolioSeries";
import { vars } from "@/lib/mood";

export const metadata: Metadata = { title: "Portfolio Lens" };

export default function Portfolio() {
  return (
    <>
      <ViewHead title={<>What it means for <S>you</S></>} feature="Portfolio Lens"
        lede="How the session moved a mix like yours. Give each kind of holding a weight and read the day's blended move, what the mix is exposed to and how it is worked out. Facts only; the weights never leave this device." />

      <PortfolioLens facts={portfolioFacts()} series={portfolioSeries()} vars={vars} />
    </>
  );
}
