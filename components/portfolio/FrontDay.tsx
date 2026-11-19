"use client";
import Link from "next/link";
import type { PortfolioFacts } from "@/lib/portfolioTypes";
import { Chip } from "../Chip";
import { Day } from "./Day";
import { EventsForYou } from "./EventsForYou";
import { usePort } from "./usePort";

/** Markets, Overnight: "Your day" from Portfolio Lens. Same `usePort()` mix and same `Day` as /portfolio, so the numbers match.
 *  Until the viewer saves weights it shows the example mix, labelled; weights are set on /portfolio and stay on this device. */
export function FrontDay({ facts }: { facts: PortfolioFacts }) {
  const port = usePort();
  const example = port.mode === "example";
  return (
    <>
      {example && (
        <p className="bw-meta"><Chip>Example</Chip> This is an example mix. <Link href="/portfolio/">Set your own weights in Portfolio Lens</Link>; they stay on this device.</p>
      )}
      <Day w={port.w} facts={facts.types} asOf={facts.asOf} example={example} />
      <p className="bw-meta gap-top"><Link href="/portfolio/">Your mix, exposure, the year and how it is worked out</Link></p>
    </>
  );
}

/** Markets, Overnight: "Events for what you own", the same filter as /portfolio. */
export function FrontEvents() {
  const port = usePort();
  const example = port.mode === "example";
  return (
    <>
      <EventsForYou w={port.w} example={example} />
      {example && <p className="bw-meta"><Link href="/portfolio/">Set your own weights in Portfolio Lens</Link> to see the events tagged to your mix.</p>}
    </>
  );
}
