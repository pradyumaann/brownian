"use client";
import { B } from "@/data";
import type { HoldingId } from "@/data/types";
import { normalise, SHORT, type Weights } from "@/lib/portfolioMath";
import { Chip } from "../Chip";
import { EventRail } from "../EventRail";
import { Src } from "../Src";

/** Events for what you own: the dated events the brief's own text ties to a holding type that carries a weight in the mix.
 *  Rendered from the mix passed in by Lens, whose first render is the example mix on the server and the browser alike;
 *  the saved mix replaces it after mount, so there is no hydration mismatch. Relevance chips are neutral in tone and carry
 *  no weight, and a tag is never read as the size or direction of an effect. */
export function EventsForYou({ w, example }: { w: Weights; example: boolean }) {
  const shares = normalise(w).shares;
  const mine = (e: { affects?: HoldingId[] }) => (e.affects ?? []).filter((id) => shares[id] > 0);
  const tagged = B.events.filter((e) => e.date && mine(e).length);
  if (!Object.keys(shares).length) {
    return <p className="empty">No weight is set yet. Give a holding type a weight above and the dated events tagged to it appear here.</p>;
  }
  return (
    <>
      {example && <p className="bw-meta"><Chip>Example</Chip> These events are for the example mix.</p>}
      {tagged.length ? (
        <EventRail events={tagged} briefDate={B.briefDate}
          extra={(e) => (
            <p className="ev-for">
              <span>Tagged to</span>
              {mine(e).map((id) => <Chip key={id}>{SHORT[id]}</Chip>)}
            </p>
          )} />
      ) : (
        <p className="empty">No dated events in the brief are tagged to the types in your mix.</p>
      )}
      <p className="bw-meta">Dates from the brief and web calendars<Src k={["W1", "W13", "W15", "W16", "W17", "W19"]} />. Only events whose link to a holding type is stated in the brief&apos;s own text are tagged, so a missing tag is not a statement of no effect.</p>
      <p className="note after-plot"><b>Interpretation, not a forecast.</b> Tags are Brownian&apos;s reading of the brief&apos;s own text. They say which type the brief links an event to, not how large or in which direction the effect will be.</p>
    </>
  );
}
