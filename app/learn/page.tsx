import type { Metadata } from "next";
import { B } from "@/data";
import { S, ViewHead } from "@/components/Section";
import { fill } from "@/lib/mood";

export const metadata: Metadata = { title: "Jargon Buster" };

export default function Learn() {
  return (
    <>
      <ViewHead title={<>The day&apos;s <S>jargon</S></>} feature="Jargon Buster"
        lede="Terms used in today's brief, each with today's number so you can see it in use." />
      <dl className="gloss">
        {Object.entries(B.gloss).map(([id, [t, d, today]]) => (
          <div key={id} id={id}>
            <dt>{t}</dt>
            <dd>{d}</dd>
            <dd className="today">{fill(today)}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
