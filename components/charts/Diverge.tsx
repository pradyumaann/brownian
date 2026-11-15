"use client";
import { useState } from "react";
import Brownian, { type DivergeRow } from "@/design/brownian-charts";
import { crore, pct } from "@/lib/format";
import { usePhone, usePlot } from "./usePlot";

const FORMATS = { pct: (v: number) => pct(v), crore: (v: number) => crore(v) };

/** Signed bars from a zero line, value printed, null → n/a. Wraps Brownian.diverge.
 *  `phoneRows` caps the rows drawn on a phone: "ends" keeps the strongest at each end of a sorted list (leaders and
 *  laggards), "last" keeps the most recent of a time series. A button shows the rest; the aria label keeps them all. */
export function Diverge({ rows, label, format = "pct", labelWidth, valueWidth, rowH, domain, phoneRows, phoneKeep = "ends" }: {
  rows: DivergeRow[]; label: string; format?: keyof typeof FORMATS;
  labelWidth?: number; valueWidth?: number; rowH?: number; domain?: number;
  phoneRows?: number; phoneKeep?: "ends" | "last";
}) {
  const phone = usePhone();
  const [all, setAll] = useState(false);
  const cut = phone && !all && phoneRows != null && rows.length > phoneRows;
  const shown = !cut ? rows : phoneKeep === "last" ? rows.slice(-phoneRows!) : (() => {
    const live = rows.filter((r) => r.value != null), half = Math.ceil(phoneRows! / 2);
    return live.length > phoneRows! ? [...live.slice(0, half), ...live.slice(-(phoneRows! - half))] : live;
  })();
  // The scale stays that of the full list, so bars keep their length when the rest is shown.
  const dom = domain ?? (Math.max(...rows.map((r) => (r.value == null ? 0 : Math.max(Math.abs(r.value), r.to == null ? 0 : Math.abs(r.to))))) || 1);
  const { box, svg } = usePlot((s, w) => {
    Brownian.diverge(s, {
      rows: shown, width: w, rowH: rowH ?? (w < 480 ? 28 : undefined), domain: dom, format: FORMATS[format],
      labelWidth: labelWidth ?? (w < 480 ? 104 : 132),
      valueWidth: valueWidth ?? (w < 480 ? 96 : 112),
    });
  }, [JSON.stringify(shown)]);
  const hidden = rows.length - shown.length;
  return (
    <>
      <div className="bw-plot pad" ref={box}>
        <svg ref={svg} role="img" aria-label={label} />
      </div>
      {phone && phoneRows != null && rows.length > phoneRows && (
        <button type="button" className="more-btn is-shown" aria-expanded={all} onClick={() => setAll((a) => !a)}>
          {all ? "Show fewer" : `Show all ${rows.length} (${hidden} more${phoneKeep === "last" ? ", earlier" : ""})`}<span aria-hidden="true">{all ? " ↑" : " ↓"}</span>
        </button>
      )}
    </>
  );
}
