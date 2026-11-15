"use client";
import { useEffect, useState } from "react";
import { B } from "@/data";
import { hours, mins } from "@/lib/market";

const OPEN = mins(hours.open), CLOSE = mins(hours.close);

/** How fresh the brief is, in IST. Before the open it is "the" brief; after it, "as of the 07:52 brief". */
export function Freshness() {
  const [s, setS] = useState<{ t: string; live: boolean }>({ t: `Brief ${B.prepared} IST`, live: true });
  useEffect(() => {
    const now = new Date(Date.now() + 330 * 60000);
    const today = now.toISOString().slice(0, 10), m = now.getUTCHours() * 60 + now.getUTCMinutes();
    if (today < B.date || (today === B.date && m < OPEN)) setS({ t: `Brief ${B.prepared} IST`, live: true });
    else if (today === B.date && m < CLOSE) setS({ t: `As of the ${B.prepared} brief`, live: true });
    else setS({ t: `Brief ${B.prepared} IST`, live: false });
  }, []);
  return <span className={s.live ? "live" : undefined}>{s.live ? "● " : ""}{s.t}</span>;
}
