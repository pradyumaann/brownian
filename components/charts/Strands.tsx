"use client";
import Brownian from "@/design/brownian-charts";
import { crore } from "@/lib/format";
import { usePlot } from "./usePlot";

interface Node { id: string; label: string; value: number; cat?: string }

/** Unit-strand flow in the style of the Flow inspiration: sectors sold (left) → FPI equity (middle) → sectors bought
 *  (right). One hairline = `unit` ₹ crore. Each sold sector has its own warm colour (red → gold), each bought sector its
 *  own cool one (teal → mint), and strands blend like light where they cross. Colour names the sector, the side
 *  names the direction, and every node carries its label and value. */
export function Strands({ left, right, unit, label }: { left: Node[]; right: Node[]; unit: number; label: string }) {
  const { box, svg } = usePlot((s, w) => {
    const total = left.reduce((a, n) => a + n.value, 0);
    const warm = (i: number, n: number) => Brownian.ramp("spec", 0.42 + 0.56 * (n > 1 ? i / (n - 1) : 0));
    const cool = (i: number, n: number) => Brownian.ramp("tide", 0.55 + 0.45 * (n > 1 ? i / (n - 1) : 0));
    const lc = new Map(left.map((n, i) => [n.id, n.id === "NEW" ? Brownian.css("dawn") : warm(i, left.length)]));
    const rc = new Map(right.map((n, i) => [n.id, n.id === "OUT" ? Brownian.css("plot-muted") : cool(i, right.length)]));
    Brownian.strands(s, {
      columns: [left.map(({ id, label }) => ({ id, label })), [{ id: "FPI", label: "FPI equity" }], right.map(({ id, label }) => ({ id, label }))],
      links: [
        ...left.map((n) => ({ source: n.id, target: "FPI", value: n.value, color: lc.get(n.id) })),
        ...right.map((n) => ({ source: "FPI", target: n.id, value: n.value, color: rc.get(n.id) })),
      ],
      unit, width: w, height: Math.max(340, Math.min(560, Math.round(w * 0.66))), labelWidth: w < 480 ? 96 : 150, gap: w < 480 ? 10 : 16,
      format: (v) => crore(v, false), seed: Math.round(total) % 997,
    });
  }, [JSON.stringify(left), JSON.stringify(right), unit]);
  return (
    <div className="bw-plot pad" ref={box}>
      <svg ref={svg} role="img" aria-label={label} />
    </div>
  );
}
