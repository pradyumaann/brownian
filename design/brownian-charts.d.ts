// Types for design/brownian-charts.js, used by the Next.js app.

export interface DivergeRow { label: string; value: number | null; to?: number; src?: string }
export interface DivergeOpts {
  rows: DivergeRow[]; width?: number; rowH?: number; labelWidth?: number; valueWidth?: number;
  domain?: number; format?: (v: number) => string;
}
export interface DialBand { from: number; to: number; name: string }
export interface DialOpts {
  score: number; bands: DialBand[]; components?: { name: string; score: number }[];
  width?: number; height?: number;
}

export interface StrandNode { id: string; label: string; cat?: string }
export interface StrandOpts {
  columns: StrandNode[][]; links: { source: string; target: string; value: number }[]; unit: number;
  width?: number; height?: number; labelWidth?: number; gap?: number; format?: (v: number) => string; colorBy?: "source" | "target"; seed?: number;
}

declare const Brownian: {
  css(name: string): string;
  ramp(name: "spec" | "tide", t: number): string;
  fmt: {
    inr(v: number, dp?: number): string;
    crore(v: number): string;
    usd(v: number, dp?: number): string;
    pct(v: number, dp?: number): string;
    signed(v: number, dp?: number): string;
  };
  diverge(svg: SVGSVGElement, o: DivergeOpts): void;
  dial(svg: SVGSVGElement, o: DialOpts): void;
  strands(svg: SVGSVGElement, o: StrandOpts): void;
  spark(svg: SVGSVGElement, o: { values: number[]; width?: number; height?: number; baseline?: number }): void;
  tip(node: Element, v: string, l: string): Element;
  readout(): void;
};
export default Brownian;
