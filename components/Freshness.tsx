"use client";
import { useEffect, useState } from "react";
import { B } from "@/data";

const OPEN = 9 * 60 + 15, CLOSE = 15 * 60 + 30;

/** How fresh the brief is, in IST. Before the open it is "the" brief; after it, "as of the 07:52 brief". */
export function Freshness() {
  const [s, setS] = useState<{ t: string; live: boolean }>({ t: `Brief ${B.prepared} IST`, live: true });
  useEffect(() => {
    const now = new Date(Date.now() + 330 * 60000);
    const today = now.toISOString().slice(0, 10), mins = now.getUTCHours() * 60 + now.getUTCMinutes();
    if (today < B.date || (today === B.date && mins < OPEN)) setS({ t: `Brief ${B.prepared} IST`, live: true });
    else if (today === B.date && mins < CLOSE) setS({ t: `As of the ${B.prepared} brief`, live: true });
    else setS({ t: `Brief ${B.prepared} IST`, live: false });
  }, []);
  return <span className={s.live ? "live" : undefined}>{s.live ? "● " : ""}{s.t}</span>;
}
