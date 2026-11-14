"use client";
import Brownian from "@/design/brownian-charts";
import { crore } from "@/lib/format";
import { usePlot } from "./usePlot";

interface Node { id: string; label: string; value: number; cat?: string }

/** Unit-strand flow: sectors sold (left) → FPI equity (middle) → sectors bought (right). One hairline = `unit` ₹ crore. */
export function Strands({ left, right, unit, label }: { left: Node[]; right: Node[]; unit: number; label: string }) {
  const { box, svg } = usePlot((s, w) => {
    const total = left.reduce((a, n) => a + n.value, 0);
    Brownian.strands(s, {
      columns: [left.map(({ id, label, cat }) => ({ id, label, cat })), [{ id: "FPI", label: "FPI equity", cat: "cat-1" }], right.map(({ id, label }) => ({ id, label }))],
      links: [...left.map((n) => ({ source: n.id, target: "FPI", value: n.value })), ...right.map((n) => ({ source: "FPI", target: n.id, value: n.value }))],
      unit, width: w, height: Math.max(320, Math.min(520, Math.round(w * 0.62))), labelWidth: w < 480 ? 96 : 150, gap: w < 480 ? 10 : 14,
      format: (v) => crore(v, false), colorBy: "source", seed: Math.round(total) % 997,
    });
  }, [JSON.stringify(left), JSON.stringify(right), unit]);
  return (
    <div className="bw-plot pad" ref={box}>
      <svg ref={svg} role="img" aria-label={label} />
    </div>
  );
}
