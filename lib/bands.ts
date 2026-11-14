// Client-safe Mood Index constants: bands, quadrant names, and copy templating. Scoring lives in lib/mood.ts (server).

export const BANDS = [
  { from: 0, to: 25, name: "Extreme fear" },
  { from: 25, to: 45, name: "Fear" },
  { from: 45, to: 55, name: "Neutral" },
  { from: 55, to: 75, name: "Greed" },
  { from: 75, to: 100.01, name: "Extreme greed" },
];
export const bandOf = (v: number) => BANDS.find((b) => v >= b.from && v < b.to) ?? BANDS[BANDS.length - 1];

export const QUADS = {
  supportive: { name: "Supportive", short: "Upbeat sentiment, benign macro.", long: "Upbeat sentiment with benign macro conditions. Trends have tended to persist in such phases, though extreme readings still carry risk." },
  fragile: { name: "Fragile optimism", short: "Investors are upbeat while fundamental headwinds build.", long: "Investors are behaving greedily while macro pressure is high. Prices are leaning on continued FII buying; a hot US PPI, another oil spike or an RBI hike would test that." },
  calm: { name: "Fear, low pressure", short: "Fear without a clear macro cause.", long: "Fear without a clear fundamental cause. Sentiment research treats this as a contrarian reading, not a signal to act." },
  stress: { name: "Stress", short: "Fear with real headwinds.", long: "Fear alongside real macro headwinds. Volatility tends to stay high in these phases." },
};

/** Today's reading, passed from the server to client components that template copy. */
export interface MoodVars { score: number; band: string; press: string }

/** Fill {band}, {press} and {score} placeholders in copy that depends on today's reading. */
export const fillWith = (t: string, v: MoodVars) =>
  t.replace("{band}", v.band).replace("{press}", v.press).replace("{score}", String(v.score));
