"use client";
import Brownian, { type DivergeRow } from "@/design/brownian-charts";
import { crore, pct } from "@/lib/format";
import { usePlot } from "./usePlot";

const FORMATS = { pct: (v: number) => pct(v), crore: (v: number) => crore(v) };

/** Signed bars from a zero line, value printed, null → n/a. Wraps Brownian.diverge. */
export function Diverge({ rows, label, format = "pct", labelWidth, valueWidth, rowH, domain }: {
  rows: DivergeRow[]; label: string; format?: keyof typeof FORMATS;
  labelWidth?: number; valueWidth?: number; rowH?: number; domain?: number;
}) {
  const { box, svg } = usePlot((s, w) => {
    Brownian.diverge(s, {
      rows, width: w, rowH, domain, format: FORMATS[format],
      labelWidth: labelWidth ?? (w < 480 ? 104 : 132),
      valueWidth: valueWidth ?? (w < 480 ? 96 : 112),
    });
  }, [JSON.stringify(rows)]);
  return (
    <div className="bw-plot pad" ref={box}>
      <svg ref={svg} role="img" aria-label={label} />
    </div>
  );
}
