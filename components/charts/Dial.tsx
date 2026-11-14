"use client";
import Brownian from "@/design/brownian-charts";
import { BANDS } from "@/lib/bands";
import { usePlot } from "./usePlot";

/** The Mood Index dial: bands named, score as the dawn needle, components as dots. */
export function Dial({ score, comps, label }: { score: number; comps: { name: string; score: number }[]; label: string }) {
  const { box, svg } = usePlot((s, w) => {
    Brownian.dial(s, { score, bands: BANDS, components: comps, width: w, height: Math.round(Math.min(w * 0.6, 340)) });
    const n = s.querySelector<SVGLineElement>(".bw-needle");
    if (n) {
      n.style.transformOrigin = `${n.getAttribute("x1")}px ${n.getAttribute("y1")}px`;
      n.style.setProperty("--sweep", `${(-score * 1.8).toFixed(1)}deg`);
    }
  }, [score]);
  return (
    <div className="bw-plot" ref={box}>
      <svg ref={svg} role="img" aria-label={label} />
    </div>
  );
}
