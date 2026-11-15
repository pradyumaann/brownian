import type { Metadata } from "next";
import { Holdings, Watchlist } from "@/components/portfolio";
import { S, Section, ViewHead } from "@/components/Section";
import { vars } from "@/lib/mood";

export const metadata: Metadata = { title: "Portfolio Lens" };

export default function Portfolio() {
  return (
    <>
      <ViewHead title={<>What it means for <S>you</S></>} feature="Portfolio Lens"
        lede="How today's news touches the kinds of things you own. Pick your holding types; nothing leaves this device." />

      <Section title={<>Your <S>holdings</S></>} meta="Impact of today's brief on each holding type" ix="01">
        <Holdings vars={vars} />
      </Section>

      <Section title={<>Is my stock in the <S>news</S>?</>} meta="Watchlist · every company in the brief, plus this week's results calendars. Example rows are marked until you add your own." ix="02">
        <Watchlist />
      </Section>
    </>
  );
}
