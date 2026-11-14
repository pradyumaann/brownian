import { B } from "@/data";
import type { Tone } from "@/data/types";

// Mood Index methodology. The day's values come from the brief; how each one is scored lives here,
// next to the formula string the reader sees, so the two cannot drift apart.
interface Method {
  name: string; metric: string; ref: string; formula: string; res: string; term: string;
  f: (v: number) => number;
}

export const METHOD: Record<string, Method> = {
  vol: {
    name: "Volatility", metric: "India VIX", term: "vix",
    ref: "Long-run median ≈ 16 · above 20 = stress · below 12 = complacency",
    f: (v) => (v <= 16 ? 50 + ((16 - v) / 6) * 50 : 50 - ((v - 16) / 12) * 50),
    formula: "50 at 16; falls to 0 at 28; rises to 100 at 10",
    res: "Implied-volatility indices jump when markets fall, which is why Whaley (2000) called VIX the “investor fear gauge”. NSE's India VIX applies the same method to Nifty options.",
  },
  breadth: {
    name: "Market breadth", metric: "Advancing stocks, % of total", term: "breadth",
    ref: "50% = balanced · above 60% = broad buying · below 40% = broad selling",
    f: (v) => v, formula: "Score = % of stocks that rose",
    res: "Breadth checks whether an index move is broad or carried by a few heavyweights. Rallies with narrowing breadth have historically been less durable; this is the idea behind the advance–decline line and McClellan indicators.",
  },
  mom: {
    name: "Momentum", metric: "Nifty return in November", term: "momentum",
    ref: "A typical month is within ±3%; ±8% or more is unusual",
    f: (v) => 50 + 50 * Math.tanh(v / 8), formula: "50 + 50 × tanh(return ÷ 8%)",
    res: "Jegadeesh & Titman (1993) found 3–12 month winners tend to keep outperforming. Jegadeesh (1990) found very short-term (1-month) winners tend to partly give back gains. A sharp one-month rally raises the odds of consolidation.",
  },
  fii: {
    name: "Foreign flows", metric: "FII net buying, November to date", term: "fii",
    ref: "₹0 = neutral · ±₹75,000 cr in a month = exceptionally strong",
    f: (v) => 50 + 50 * Math.tanh(v / 75000), formula: "50 + 50 × tanh(flow ÷ ₹75,000 cr)",
    res: "Research on emerging-market capital flows (Calvo, Leiderman & Reinhart, 1993) shows global “push” factors such as US interest rates drive a large share of foreign money. That makes these flows sensitive to US yields, now above 5%.",
  },
  haven: {
    name: "Safe-haven demand", metric: "Nifty minus MCX gold, 1-day return", term: "haven",
    ref: "0 = no preference · positive = money favours stocks over gold",
    f: (v) => 50 + 50 * Math.tanh(v / 2), formula: "50 + 50 × tanh(spread ÷ 2 pts) · 1-day proxy; 20-day data n/a",
    res: "When investors are fearful they move into gold and government bonds. CNN's index compares 20-day stock and bond returns; Tickertape's MMI uses gold demand for India.",
  },
  gvol: {
    name: "Global risk appetite", metric: "US VIX (S&P 500 options)", term: "vix",
    ref: "Long-run median ≈ 18 · above 25 = stress · below 12 = complacency",
    f: (v) => (v <= 18 ? 50 + ((18 - v) / 7) * 50 : 50 - ((v - 18) / 17) * 50),
    formula: "50 at 18; falls to 0 at 35; rises to 100 at 11",
    res: "Indian equities tend to fall when global volatility spikes as foreign investors cut risk everywhere at once. That's why a global fear gauge sits alongside India VIX.",
  },
};

export const MISSING: [string, string][] = [
  ["Put/call ratio", "Nifty options PCR shows whether traders are buying protection (fear) or calls (greed)."],
  ["Price strength", "Stocks at 52-week highs vs 52-week lows on NSE."],
  ["Trend vs average", "Nifty vs its 125- or 200-day moving average."],
  ["Valuation", "Nifty P/E vs its own history. Not a sentiment input in CNN's index, but useful context."],
];

export const BANDS = [
  { from: 0, to: 25, name: "Extreme fear" },
  { from: 25, to: 45, name: "Fear" },
  { from: 45, to: 55, name: "Neutral" },
  { from: 55, to: 75, name: "Greed" },
  { from: 75, to: 100.01, name: "Extreme greed" },
];
export const bandOf = (v: number) => BANDS.find((b) => v >= b.from && v < b.to) ?? BANDS[BANDS.length - 1];

const clamp = (v: number) => Math.max(0, Math.min(100, v));

export const comps = B.sentiment.map((r) => {
  const m = METHOD[r.id];
  return { ...m, ...r, score: clamp(m.f(r.val)) };
});
export type Comp = (typeof comps)[number];

/** Unrounded score (for the needle); `score` is what the reader sees. */
export const scoreRaw = comps.reduce((a, c) => a + c.score, 0) / comps.length;
export const score = Math.round(scoreRaw);
export const band = bandOf(score).name;

// Macro pressure: a separate, fundamental reading. 0 = low, 1 = elevated, 2 = high per indicator.
export const pressure = B.pressure.reduce((a, p) => a + p.lv, 0) / (B.pressure.length * 2);
export const pressureName = pressure >= 0.66 ? "High" : pressure >= 0.4 ? "Elevated" : "Low";
export const pressureHigh = B.pressure.filter((p) => p.lv === 2).length;
export const pressureTone = (lv: number): [string, Tone] => (lv === 2 ? ["High", "loss"] : lv === 1 ? ["Elevated", "mixed"] : ["Low", "gain"]);

export const QUADS = {
  supportive: { name: "Supportive", short: "Upbeat sentiment, benign macro.", long: "Upbeat sentiment with benign macro conditions. Trends have tended to persist in such phases, though extreme readings still carry risk." },
  fragile: { name: "Fragile optimism", short: "Investors are upbeat while fundamental headwinds build.", long: "Investors are behaving greedily while macro pressure is high. Prices are leaning on continued FII buying; a hot US PPI, another oil spike or an RBI hike would test that." },
  calm: { name: "Fear, low pressure", short: "Fear without a clear macro cause.", long: "Fear without a clear fundamental cause. Sentiment research treats this as a contrarian reading, not a signal to act." },
  stress: { name: "Stress", short: "Fear with real headwinds.", long: "Fear alongside real macro headwinds. Volatility tends to stay high in these phases." },
};
export const quad = score >= 50 ? (pressure >= 0.5 ? QUADS.fragile : QUADS.supportive) : pressure >= 0.5 ? QUADS.stress : QUADS.calm;

/** Fill {band}, {press} and {score} placeholders in copy that depends on today's reading. */
export const fill = (t: string) =>
  t.replace("{band}", band).replace("{press}", pressureName.toLowerCase()).replace("{score}", String(score));
